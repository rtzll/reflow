import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { parseAnsiLine, stripAnsi } from '../../../packages/reflow/src/behaviors/ansi.ts'
import {
  escapeRegExp,
  parseFacetQuery,
} from '../../../packages/reflow/src/behaviors/facet-query.ts'
import {
  computePipelineColumns,
  relatedPipelineJobIds,
  type PipelineDagJob,
} from '../../../packages/reflow/src/behaviors/pipeline-dag.ts'
import {
  applyMarkdownFormat,
  type MarkdownFormatAction,
} from '../../../packages/reflow/src/behaviors/markdown-format.ts'
import {
  inspectObjectTree,
  safeJsonStringify,
  type ObjectTreeNode,
} from '../../../packages/reflow/src/behaviors/object-tree.ts'
import { createRangeSelection } from '../../../packages/reflow/src/behaviors/range-selection.ts'
import {
  computeVirtualRange,
  scrollOffsetForIndex,
} from '../../../packages/reflow/src/behaviors/virtualizer.ts'
import { createKeymap } from '../../../packages/reflow/src/behaviors/keymap.ts'
import { computeDiffStatBlocks } from '../../../packages/reflow/src/diff-stat.tsx'
import { computeSizeDelta, formatBytes } from '../../../packages/reflow/src/size-delta.tsx'
import { computeHeatmapLevel } from '../../../packages/reflow/src/activity-heatmap.tsx'
import { computeSparklineGeometry } from '../../../packages/reflow/src/sparkline.tsx'

// Deterministic PRNG so property runs are fast, thorough, and 100% reproducible.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomInt(rng: () => number, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1))
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!
}

it('property: ANSI parser preserves visible text, never throws, and stripAnsi is idempotent', () => {
  const rng = mulberry32(0x5eed1)
  const alphabet = [
    'a',
    'Z',
    '0',
    ' ',
    ':',
    '/',
    '✓',
    '✗',
    '→',
    '🔥',
    '\x1b[0m',
    '\x1b[31m',
    '\x1b[1;32m',
    '\x1b[2;36;4m',
    '\x1b[22;23;24;39m',
    '\x1b[90m',
    '\x1b[2K',
    '\x1b]8;;https://example.com\x07link\x1b]8;;\x07',
    '\x1b[',
    '\x1b',
  ]

  for (let trial = 0; trial < 250; trial++) {
    const len = randomInt(rng, 0, 40)
    let input = ''
    for (let i = 0; i < len; i++) input += pick(rng, alphabet)

    const spans = parseAnsiLine(input)
    const stripped = stripAnsi(input)
    assert.ok(spans.length >= 1, 'parseAnsiLine must always return at least one span')
    assert.equal(
      spans.map((span) => span.text).join(''),
      stripped,
      `parsed span text must equal stripAnsi for trial ${trial}`,
    )
    assert.equal(stripAnsi(stripped), stripped, 'stripAnsi must be idempotent')
  }
})

it('property: facet query parser never throws and literal free-text always matches itself', () => {
  const rng = mulberry32(0x5eed2)
  const pieces = [
    'level:error',
    'source:chromium',
    'exit_code:1',
    'foo.bar:baz',
    'invalid:',
    ':leading',
    'http://localhost:44100',
    '[unclosed',
    '(broken*',
    'a+b?c$',
    '\\d+\\s*',
    'error',
    'WARN',
    '   ',
    '\t',
  ]

  for (let trial = 0; trial < 250; trial++) {
    const count = randomInt(rng, 0, 8)
    const raw = Array.from({ length: count }, () => pick(rng, pieces)).join(' ')
    const regexMode = trial % 2 === 0
    const caseSensitive = trial % 3 === 0

    const parsed = parseFacetQuery(raw, regexMode, caseSensitive)
    for (const facet of parsed.facets) {
      assert.match(facet.key, /^[a-z0-9_.-]+$/)
      assert.ok(facet.value.length > 0)
    }

    if (!regexMode) {
      assert.equal(parsed.regexError, false, `literal mode must never error for ${raw}`)
      if (parsed.freeText && parsed.regex) {
        parsed.regex.lastIndex = 0
        assert.ok(
          parsed.regex.test(parsed.freeText),
          `literal regex must match its own freeText: ${parsed.freeText}`,
        )
      }
    }

    // escapeRegExp always creates a valid RegExp matching the original literal string.
    const escaped = new RegExp(escapeRegExp(raw))
    assert.ok(escaped.test(raw))
  }
})

it('property: pipeline DAG columns satisfy topological order and handle cycles safely', () => {
  const rng = mulberry32(0x5eed3)

  // 1. Random acyclic graphs: every dependency lands in a strictly earlier column.
  for (let trial = 0; trial < 150; trial++) {
    const count = randomInt(rng, 1, 20)
    const jobs: PipelineDagJob[] = []
    for (let i = 0; i < count; i++) {
      const needs: string[] = []
      for (let dep = 0; dep < i; dep++) {
        if (rng() < 0.3) needs.push(`job-${dep}`)
      }
      jobs.push({ id: `job-${i}`, needs })
    }

    const columns = computePipelineColumns(jobs)
    const colOf = new Map<string, number>()
    columns.forEach((col, colIndex) => {
      for (const job of col.jobs) {
        assert.ok(!colOf.has(job.id), `duplicate job ${job.id}`)
        colOf.set(job.id, colIndex)
      }
    })
    assert.equal(colOf.size, jobs.length, 'every job must appear in exactly one column')

    for (const job of jobs) {
      const targetCol = colOf.get(job.id)!
      for (const dep of job.needs ?? []) {
        assert.ok(
          colOf.get(dep)! < targetCol,
          `dependency ${dep} must precede ${job.id} (${colOf.get(dep)} < ${targetCol})`,
        )
      }
    }

    // Relatedness closure: anchor is always included and transitive upstream/downstream are closed.
    const anchor = jobs[randomInt(rng, 0, count - 1)]!.id
    const related = relatedPipelineJobIds(jobs, anchor)
    assert.ok(related.has(anchor))
    for (const job of jobs) {
      if (related.has(job.id)) {
        for (const dep of job.needs ?? []) {
          if (dep === anchor) assert.ok(related.has(dep))
        }
      }
    }
  }

  // 2. Random cyclic graphs: must always terminate and preserve all jobs without duplicates.
  for (let trial = 0; trial < 100; trial++) {
    const count = randomInt(rng, 2, 12)
    const jobs: PipelineDagJob[] = Array.from({ length: count }, (_, i) => ({
      id: `c-${i}`,
      needs: Array.from(
        { length: randomInt(rng, 1, 3) },
        () => `c-${randomInt(rng, 0, count - 1)}`,
      ),
    }))
    const columns = computePipelineColumns(jobs)
    const placed = columns.flatMap((col) => col.jobs.map((job) => job.id))
    assert.equal(placed.length, jobs.length)
    assert.equal(new Set(placed).size, jobs.length)
  }
})

it('property: range selection preserves independent selections and contracts cleanly', () => {
  const rng = mulberry32(0x5eed4)

  for (let trial = 0; trial < 150; trial++) {
    const size = randomInt(rng, 2, 20)
    const order = Array.from({ length: size }, (_, i) => `item-${i}`)
    const initial = new Set(order.filter(() => rng() < 0.25))
    const anchorIdx = randomInt(rng, 0, size - 1)
    const firstEnd = randomInt(rng, 0, size - 1)
    const secondEnd = randomInt(rng, 0, size - 1)

    const range = createRangeSelection<string>()
    const afterFirst = range.extend(order, initial, order[anchorIdx]!, order[firstEnd]!)
    for (const key of initial) {
      assert.ok(afterFirst.has(key), 'initial independent selection must be preserved')
    }
    const lo1 = Math.min(anchorIdx, firstEnd)
    const hi1 = Math.max(anchorIdx, firstEnd)
    for (let i = lo1; i <= hi1; i++) {
      assert.ok(afterFirst.has(order[i]!), 'every key inside range must be selected')
    }

    // Continuing the gesture from firstEnd to secondEnd re-anchors at anchorIdx.
    const afterSecond = range.extend(order, afterFirst, order[firstEnd]!, order[secondEnd]!)
    const lo2 = Math.min(anchorIdx, secondEnd)
    const hi2 = Math.max(anchorIdx, secondEnd)
    for (let i = 0; i < size; i++) {
      const key = order[i]!
      const expected = initial.has(key) || (i >= lo2 && i <= hi2)
      assert.equal(afterSecond.has(key), expected)
    }
  }
})

it('property: applyMarkdownFormat always returns in-bounds selection and preserves prefix/suffix', () => {
  const rng = mulberry32(0x5eed5)
  const actions: readonly MarkdownFormatAction[] = [
    'bold',
    'italic',
    'code',
    'codeblock',
    'mermaid',
    'suggestion',
    'link',
    'list',
  ]
  const samples = ['', 'hello world', 'line 1\nline 2', '  padded  ', 'const x = 1;']

  for (let trial = 0; trial < 200; trial++) {
    const text = pick(rng, samples)
    const rawStart = randomInt(rng, -3, text.length + 3)
    const rawEnd = randomInt(rng, -3, text.length + 3)
    const action = pick(rng, actions)
    const res = applyMarkdownFormat(text, rawStart, rawEnd, action)

    assert.ok(res.selectionStart >= 0 && res.selectionStart <= res.value.length)
    assert.ok(res.selectionEnd >= res.selectionStart && res.selectionEnd <= res.value.length)
    const s = Math.max(0, Math.min(text.length, Math.min(rawStart, rawEnd)))
    const e = Math.max(0, Math.min(text.length, Math.max(rawStart, rawEnd)))
    assert.ok(res.value.startsWith(text.slice(0, s)))
    assert.ok(res.value.endsWith(text.slice(e)))
  }
})

it('property: object-tree handles arbitrary cyclic graphs, preserves shared siblings, and serializes valid JSON', () => {
  const rng = mulberry32(0x5eed6)

  // Explicit DAG check: shared non-cyclic sibling references must NOT be flagged circular.
  const shared = { tag: 'edge', retries: 3n }
  const dag = { z: shared, a: shared }
  const dagTree = inspectObjectTree(dag, {
    sortKeys: true,
    isExpanded: () => true,
  })
  assert.equal(dagTree.kind, 'branch')
  if (dagTree.kind === 'branch') {
    assert.deepEqual(
      dagTree.children.map((c) => c.key),
      ['a', 'z'],
      'sortKeys orders keys alphabetically',
    )
    assert.ok(
      dagTree.children.every((c) => c.kind === 'branch'),
      'shared non-cyclic siblings must expand normally without circular markers',
    )
  }
  const dagJson = JSON.parse(safeJsonStringify(dag)) as {
    a: { tag: string; retries: string }
    z: { tag: string; retries: string }
  }
  assert.equal(dagJson.a.tag, 'edge')
  assert.equal(dagJson.z.tag, 'edge')
  assert.equal(dagJson.a.retries, '3n')

  // Explicit 3-level cycle (a -> b -> c -> a) must terminate cleanly with circular marker.
  const a: Record<string, unknown> = { id: 'a' }
  const b: Record<string, unknown> = { id: 'b' }
  const c: Record<string, unknown> = { id: 'c', back: a }
  a.next = b
  b.next = c
  const cycleJson = JSON.parse(safeJsonStringify(a)) as {
    next: { next: { back: string } }
  }
  assert.equal(cycleJson.next.next.back, '[Circular]')

  function countCircular(node: ObjectTreeNode): number {
    if (node.kind === 'circular') return 1
    if (node.kind !== 'branch') return 0
    return node.children.reduce((sum, child) => sum + countCircular(child), 0)
  }

  // 200 randomized graphs with arbitrary back-edges, shared refs, arrays, bigints, and throwing getters.
  for (let trial = 0; trial < 200; trial++) {
    const nodeCount = randomInt(rng, 2, 7)
    const nodes: Record<string, unknown>[] = Array.from({ length: nodeCount }, (_, idx) => ({
      id: idx,
      flag: idx % 2 === 0,
      big: BigInt(idx * 10),
    }))
    for (let i = 0; i < nodeCount; i++) {
      const edges = randomInt(rng, 0, 3)
      for (let e = 0; e < edges; e++) {
        const target = nodes[randomInt(rng, 0, nodeCount - 1)]!
        nodes[i]![`ref_${e}`] = rng() < 0.25 ? [target, null, 'leaf'] : target
      }
    }
    if (trial % 10 === 0) {
      Object.defineProperty(nodes[0]!, 'boom', {
        enumerable: true,
        get() {
          throw new Error('getter boom')
        },
      })
    }

    const tree = inspectObjectTree(nodes[0]!, {
      sortKeys: trial % 2 === 0,
      isExpanded: (_path, depth) => depth < 6,
    })
    assert.equal(tree.kind, 'branch')
    assert.ok(countCircular(tree) >= 0)

    const serialized = safeJsonStringify(nodes[0]!)
    assert.doesNotThrow(() => JSON.parse(serialized), `valid JSON required on trial ${trial}`)
  }
})

it('property: computeSparklineGeometry always emits finite in-bounds coordinates for adversarial series', () => {
  const rng = mulberry32(0x5eed7)
  const weirdValues = [
    0,
    1,
    -50,
    1000,
    0.001,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ]

  for (let trial = 0; trial < 200; trial++) {
    const len = randomInt(rng, 0, 24)
    const values = Array.from({ length: len }, () =>
      rng() < 0.2 ? pick(rng, weirdValues) : (rng() - 0.3) * 200,
    )
    const width = randomInt(rng, 24, 240)
    const height = randomInt(rng, 12, 80)
    const { line, area, points } = computeSparklineGeometry(values, width, height)

    assert.equal(points.length, values.length)
    for (const [x, y] of points) {
      assert.ok(Number.isFinite(x) && x >= 0 && x <= width, `x=${x} out of [0, ${width}]`)
      assert.ok(Number.isFinite(y) && y >= 0 && y <= height, `y=${y} out of [0, ${height}]`)
    }
    if (values.length === 0) {
      assert.equal(line, '')
      assert.equal(area, '')
    } else {
      assert.ok(!line.includes('NaN') && !line.includes('Infinity'))
      assert.ok(!area.includes('NaN') && !area.includes('Infinity'))
    }
  }
})

it('property: virtualizer ranges stay in bounds and scrollOffsetForIndex brings target into view', () => {
  const rng = mulberry32(0x5eed8)
  const aligns = ['auto', 'start', 'center', 'end'] as const

  for (let trial = 0; trial < 200; trial++) {
    const count = rng() < 0.08 ? 0 : randomInt(rng, 1, 5000)
    const itemHeight = randomInt(rng, 16, 72)
    const viewportHeight = randomInt(rng, 80, 900)
    const overscan = randomInt(rng, 0, 12)
    const scrollTop = randomInt(rng, -50, count * itemHeight + 200)

    const range = computeVirtualRange({ count, itemHeight, scrollTop, viewportHeight, overscan })
    assert.ok(range.start >= 0 && range.start <= count)
    assert.ok(range.end >= range.start && range.end <= count)
    assert.equal(range.totalHeight, count * itemHeight)
    assert.equal(range.offsetTop, range.start * itemHeight)

    if (count > 0) {
      const targetIdx = randomInt(rng, 0, count - 1)
      const align = pick(rng, aligns)
      const nextScroll = scrollOffsetForIndex(
        targetIdx,
        count,
        itemHeight,
        scrollTop,
        viewportHeight,
        align,
      )
      const maxScroll = Math.max(0, count * itemHeight - viewportHeight)
      assert.ok(nextScroll >= 0 && nextScroll <= maxScroll)
      const afterRange = computeVirtualRange({
        count,
        itemHeight,
        scrollTop: nextScroll,
        viewportHeight,
        overscan: 0,
      })
      assert.ok(
        targetIdx >= afterRange.start && targetIdx < afterRange.end,
        `target ${targetIdx} must be rendered after scroll (${afterRange.start}..${afterRange.end})`,
      )
    }
  }
})

it('property: keymap matches single keys and multi-key chords, respects timeout, and suppresses inside inputs', () => {
  const calls: string[] = []
  const keymap = createKeymap(
    [
      { keys: 'j', label: 'Next', handler: () => calls.push('j') },
      { keys: ['g', 'p'], label: 'Go PRs', handler: () => calls.push('gp') },
      { keys: ['g', 'c'], label: 'Go CI', handler: () => calls.push('gc') },
      { keys: 'mod+k', label: 'Command', handler: () => calls.push('mod+k') },
    ],
    { chordTimeoutMs: 500 },
  )

  const ev = (key: string, extra: Partial<Parameters<typeof keymap.handleKeyDown>[0]> = {}) => ({
    key,
    code: key.length === 1 && /[a-z]/i.test(key) ? `Key${key.toUpperCase()}` : key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...extra,
  })

  // Chord g -> p fires within timeout.
  assert.equal(keymap.handleKeyDown(ev('g'), 1000), false)
  assert.equal(keymap.handleKeyDown(ev('p'), 1200), true)
  assert.deepEqual(calls, ['gp'])

  // Stale prefix expires after chordTimeoutMs.
  assert.equal(keymap.handleKeyDown(ev('g'), 2000), false)
  assert.equal(keymap.handleKeyDown(ev('c'), 2700), false)
  assert.deepEqual(calls, ['gp'])

  // Failed chord prefix falls through cleanly to a valid single-key binding.
  assert.equal(keymap.handleKeyDown(ev('g'), 3000), false)
  assert.equal(keymap.handleKeyDown(ev('j'), 3100), true)
  assert.deepEqual(calls, ['gp', 'j'])

  // Single keys are suppressed inside editable inputs, while mod+k still fires.
  const inputTarget = { tagName: 'INPUT' } as unknown as EventTarget
  assert.equal(keymap.handleKeyDown(ev('j', { target: inputTarget }), 4000), false)
  assert.equal(keymap.handleKeyDown(ev('k', { metaKey: true, target: inputTarget }), 4050), true)
  assert.deepEqual(calls, ['gp', 'j', 'mod+k'])
})

it('property: computeDiffStatBlocks, computeSizeDelta, and computeHeatmapLevel uphold invariants on adversarial inputs', () => {
  const rng = mulberry32(0x5eed8)
  for (let trial = 0; trial < 200; trial++) {
    const added = randomInt(rng, 0, 500)
    const removed = randomInt(rng, 0, 500)
    const blockCount = randomInt(rng, 0, 10)
    const blocks = computeDiffStatBlocks(added, removed, blockCount)
    assert.equal(blocks.length, blockCount)
    if (blockCount > 0 && added === 0 && removed === 0) {
      assert.ok(blocks.every((b) => b === 'neutral'))
    }
    if (blockCount >= 2 && added > 0 && removed > 0) {
      assert.ok(blocks.includes('added') && blocks.includes('removed'))
    }

    const before = randomInt(rng, 0, 2_000_000)
    const after = randomInt(rng, 0, 2_000_000)
    const budget = randomInt(rng, 1000, 1_500_000)
    const delta = computeSizeDelta(before, after, { budgetBytes: budget })
    assert.equal(delta.diffBytes, after - before)
    assert.equal(delta.overBudget, after > budget)
    if (after > budget) assert.equal(delta.tone, 'danger')
    assert.ok(formatBytes(after).length > 0)

    const maxCount = randomInt(rng, 0, 100)
    const count = randomInt(rng, -5, maxCount + 20)
    const level = computeHeatmapLevel(count, maxCount)
    assert.ok(level >= 0 && level <= 4)
    if (count <= 0 || maxCount <= 0) assert.equal(level, 0)
  }
})
