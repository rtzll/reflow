import { ref } from 'remix/component'

/**
 * The checked fill of a vertical CheckboxGroup, as in the reference: one block
 * per run of adjacent checked rows. A run keeps its block while it grows or
 * shrinks, so the block springs to its new size. When one row bridges two
 * runs, their inner edges glide to the middle of that row with the facing
 * corners straightening, then the halves become one block. Unchecking a
 * middle row plays the inverse: two abutting halves that glide apart.
 *
 * Blocks are drawn into a `[data-rf-selection-runs]` child of the list; rows
 * are the list's `.rf-choice-group-row` children.
 */

interface Run {
  start: number
  end: number
  id: number
}
interface Box {
  top: number
  left: number
  width: number
  height: number
}
type Radii = [number, number, number, number]

// The reference's merged-background timing: the inner corners trail the edges
// by 70ms, and a merge commits once the halves have met.
const cornerDelay = 70
const springMs = 200
const convergeMs = springMs + cornerDelay + 80

/** Groups sorted row indices into runs, keeping each run's id while any of its rows had one. */
function assignRuns(sorted: number[], previous: Map<number, number>, last: { id: number }) {
  const spans: { start: number; end: number }[] = []
  for (const index of sorted) {
    const span = spans[spans.length - 1]
    if (span && index === span.end + 1) span.end = index
    else spans.push({ start: index, end: index })
  }
  const used = new Set<number>()
  const byRow = new Map<number, number>()
  const runs = spans.map((span) => {
    let id: number | undefined
    for (let i = span.start; i <= span.end && id === undefined; i++) {
      const prior = previous.get(i)
      if (prior !== undefined && !used.has(prior)) id = prior
    }
    id ??= ++last.id
    used.add(id)
    for (let i = span.start; i <= span.end; i++) byRow.set(i, id)
    return { ...span, id }
  })
  return { runs, byRow }
}

/** Two runs inside `outer`, separated by exactly one row: the shape one click merges or splits. */
function bridge(outer: Run, runs: Run[]) {
  const inside = runs
    .filter((run) => run.start >= outer.start && run.end <= outer.end)
    .sort((a, b) => a.start - b.start)
  if (inside.length !== 2) return null
  const [up, low] = inside as [Run, Run]
  return low.start === up.end + 2 ? { up, low, gap: up.end + 1 } : null
}

export function selectionRuns() {
  let host: HTMLElement | null = null
  let layer: HTMLElement | null = null
  let runs: Run[] = []
  let byRow = new Map<number, number>()
  const last = { id: 0 }
  const blocks = new Map<number, HTMLElement>()
  // Halves absorbed by a merge, dropped when the merge commits.
  const ghosts = new Set<HTMLElement>()
  let commit: ReturnType<typeof setTimeout> | undefined
  let frame = 0

  function rowBoxes(rows: HTMLElement[]) {
    const parent = host!.getBoundingClientRect()
    // Translate back into local CSS pixels when a preview scales its contents.
    const scaleX = parent.width / host!.offsetWidth || 1
    const scaleY = parent.height / host!.offsetHeight || 1
    return rows.map((row) => {
      const rect = row.getBoundingClientRect()
      return {
        top: (rect.top - parent.top) / scaleY - host!.clientTop,
        left: (rect.left - parent.left) / scaleX - host!.clientLeft,
        width: rect.width / scaleX,
        height: rect.height / scaleY,
      }
    })
  }

  function paint(
    block: HTMLElement,
    box: Box,
    radii: Radii,
    { instant = false, delayCorners = false } = {},
  ) {
    block.toggleAttribute('data-instant', instant)
    block.style.setProperty('--rf-corner-delay', delayCorners ? `${cornerDelay}ms` : '0ms')
    block.style.top = `${box.top}px`
    block.style.left = `${box.left}px`
    block.style.width = `${box.width}px`
    block.style.height = `${box.height}px`
    block.style.borderRadius = radii.map((r) => `${r}px`).join(' ')
    if (instant) void block.offsetWidth
  }

  function create() {
    const block = host!.ownerDocument.createElement('span')
    block.className = 'rf-choice-run'
    block.setAttribute('data-instant', '')
    layer!.append(block)
    return block
  }

  function drop(block: HTMLElement, instant: boolean) {
    ghosts.delete(block)
    if (instant) {
      block.remove()
      return
    }
    block.setAttribute('data-leaving', '')
    setTimeout(() => block.remove(), 200)
  }

  function sync() {
    frame = 0
    if (!host || !layer) return
    const rows = Array.from(host.querySelectorAll<HTMLElement>(':scope > .rf-choice-group-row'))
    const checked = rows.flatMap((row, index) =>
      row.querySelector('input:checked') ? [index] : [],
    )
    const previous = runs
    const next = assignRuns(checked, byRow, last)
    runs = next.runs
    byRow = next.byRow
    const boxes = rowBoxes(rows)
    const radius = parseFloat(getComputedStyle(rows[0] ?? host).borderTopLeftRadius) || 0
    const full: Radii = [radius, radius, radius, radius]
    const span = (run: Run): Box => {
      const start = boxes[run.start]!
      const end = boxes[run.end]!
      return {
        top: start.top,
        left: Math.min(start.left, end.left),
        width: Math.max(start.width, end.width),
        height: end.top + end.height - start.top,
      }
    }

    // A merge in flight that this change undid leaves its ghost behind.
    clearTimeout(commit)
    for (const ghost of ghosts) drop(ghost, true)

    // Runs that are gone fade out, unless a merge absorbs them below.
    const live = new Set(runs.map((run) => run.id))
    const merges = runs.flatMap((run) => {
      const pair = bridge(run, previous)
      return pair && (pair.up.id === run.id || pair.low.id === run.id) ? [{ run, ...pair }] : []
    })
    const splits = previous.flatMap((run) => {
      const pair = bridge(run, runs)
      return pair ? [{ run, ...pair }] : []
    })
    const absorbed = new Set(merges.map(({ run, up, low }) => (run.id === up.id ? low.id : up.id)))
    // Blocks of runs a merge absorbed, kept to glide in as the lower half.
    const retired = new Map<number, HTMLElement>()
    for (const [id, block] of blocks) {
      if (live.has(id)) continue
      blocks.delete(id)
      if (absorbed.has(id)) retired.set(id, block)
      else drop(block, false)
    }

    for (const run of runs) {
      const fresh = !blocks.has(run.id)
      const block = blocks.get(run.id) ?? create()
      blocks.set(run.id, block)
      if (fresh) paint(block, span(run), full, { instant: true })
      else paint(block, span(run), full)
    }

    for (const { run, up, low, gap } of merges) {
      const otherId = run.id === up.id ? low.id : up.id
      const ghost = retired.get(otherId)
      const survivor = blocks.get(run.id)!
      const box = span(run)
      const middle = boxes[gap]!.top + boxes[gap]!.height / 2
      // The halves glide to the middle of the bridge row, inner corners straightening.
      paint(survivor, { ...box, height: middle - box.top }, [radius, radius, 0, 0], {
        delayCorners: true,
      })
      if (ghost) {
        ghosts.add(ghost)
        paint(
          ghost,
          { ...box, top: middle, height: box.top + box.height - middle },
          [0, 0, radius, radius],
          { delayCorners: true },
        )
      }
      commit = setTimeout(() => {
        // One block over the whole run, swapped in without visible motion.
        paint(survivor, span(run), full, { instant: true })
        for (const ghost of ghosts) drop(ghost, true)
      }, convergeMs)
    }

    for (const { run, up, low, gap } of splits) {
      const upper = blocks.get(up.id)
      const lower = blocks.get(low.id)
      if (!upper || !lower) continue
      const box = span(run)
      const middle = boxes[gap]!.top + boxes[gap]!.height / 2
      // Snap into two abutting halves at the seam, then glide apart.
      paint(upper, { ...box, height: middle - box.top }, [radius, radius, 0, 0], {
        instant: true,
      })
      paint(
        lower,
        { ...box, top: middle, height: box.top + box.height - middle },
        [0, 0, radius, radius],
        { instant: true },
      )
      paint(upper, span(up), full)
      paint(lower, span(low), full)
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(sync)
  }

  const mix = ref((element, signal) => {
    if (!(element instanceof HTMLElement)) return
    host = element
    layer = element.querySelector<HTMLElement>(':scope > [data-rf-selection-runs]')
    if (!layer) return
    host.setAttribute('data-rf-selection-blocks', '')
    const size = new ResizeObserver(schedule)
    size.observe(element)
    element.addEventListener('change', () => sync(), { signal })
    element.closest('form')?.addEventListener('reset', () => setTimeout(sync), { signal })
    sync()
    signal.addEventListener('abort', () => {
      size.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(commit)
      if (host === element) {
        host.removeAttribute('data-rf-selection-blocks')
        host = null
        layer = null
      }
    })
  })

  return { mix, sync: schedule }
}
