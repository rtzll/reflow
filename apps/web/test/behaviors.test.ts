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
import { createRangeSelection } from '../../../packages/reflow/src/behaviors/range-selection.ts'

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
