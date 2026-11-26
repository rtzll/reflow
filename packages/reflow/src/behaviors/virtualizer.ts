// Pure fixed-height viewport windowing math for VirtualList and large forge feeds.
// Remix UI has no virtualizer primitive.

export interface VirtualRangeOptions {
  count: number
  itemHeight: number
  scrollTop: number
  viewportHeight: number
  overscan?: number
}

export interface VirtualRange {
  /** Inclusive start index of the rendered slice. */
  start: number
  /** Exclusive end index of the rendered slice. */
  end: number
  /** Total scrollable content height in pixels. */
  totalHeight: number
  /** Vertical pixel offset to position the rendered slice. */
  offsetTop: number
}

export function computeVirtualRange(options: VirtualRangeOptions): VirtualRange {
  const count = Number.isFinite(options.count) ? Math.max(0, Math.floor(options.count)) : 0
  const itemHeight =
    Number.isFinite(options.itemHeight) && options.itemHeight > 0 ? options.itemHeight : 1
  if (count === 0) {
    return { start: 0, end: 0, totalHeight: 0, offsetTop: 0 }
  }

  const totalHeight = count * itemHeight
  const viewportHeight =
    Number.isFinite(options.viewportHeight) && options.viewportHeight > 0
      ? options.viewportHeight
      : itemHeight * 10
  const maxScroll = Math.max(0, totalHeight - viewportHeight)
  const rawScroll = Number.isFinite(options.scrollTop) ? options.scrollTop : 0
  const scrollTop = Math.max(0, Math.min(maxScroll, rawScroll))
  const overscan =
    Number.isFinite(options.overscan) && (options.overscan ?? 0) >= 0
      ? Math.floor(options.overscan!)
      : 5

  const firstVisible = Math.floor(scrollTop / itemHeight)
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + 1
  const start = Math.max(0, firstVisible - overscan)
  const end = Math.min(count, firstVisible + visibleCount + overscan)

  return {
    start,
    end,
    totalHeight,
    offsetTop: start * itemHeight,
  }
}

export type VirtualScrollAlign = 'auto' | 'start' | 'center' | 'end'

export function scrollOffsetForIndex(
  index: number,
  count: number,
  itemHeight: number,
  scrollTop: number,
  viewportHeight: number,
  align: VirtualScrollAlign = 'auto',
): number {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
  const safeHeight = Number.isFinite(itemHeight) && itemHeight > 0 ? itemHeight : 1
  if (safeCount === 0) return 0

  const safeViewport =
    Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : safeHeight * 10
  const clampedIdx = Math.max(
    0,
    Math.min(safeCount - 1, Number.isFinite(index) ? Math.floor(index) : 0),
  )
  const maxScroll = Math.max(0, safeCount * safeHeight - safeViewport)
  const itemTop = clampedIdx * safeHeight
  const itemBottom = itemTop + safeHeight
  const curScroll = Number.isFinite(scrollTop) ? Math.max(0, Math.min(maxScroll, scrollTop)) : 0

  let next = curScroll
  if (align === 'start') {
    next = itemTop
  } else if (align === 'end') {
    next = itemBottom - safeViewport
  } else if (align === 'center') {
    next = itemTop - (safeViewport - safeHeight) / 2
  } else {
    if (itemTop < curScroll) next = itemTop
    else if (itemBottom > curScroll + safeViewport) next = itemBottom - safeViewport
  }

  return Math.max(0, Math.min(maxScroll, next))
}
