import { on, ref, type Handle, type RemixNode } from 'remix/component'
import {
  computeVirtualRange,
  scrollOffsetForIndex,
  type VirtualRange,
} from './behaviors/virtualizer.ts'
import { classList } from './systems/styling.ts'

export interface VirtualListProps<T = unknown> {
  /** Full array of items to virtualize. */
  items: readonly T[]
  /** Fixed row height in pixels. */
  itemHeight: number
  /** Viewport height (number of pixels or CSS length such as `'320px'` or `'100%'`). */
  height: number | string
  /** Extra rows rendered above and below the visible viewport. Default `5`. */
  overscan?: number
  /** Renders a single visible row. */
  renderItem: (item: T, index: number) => RemixNode
  /** Optional stable key extractor; defaults to row index. */
  getKey?: (item: T, index: number) => string | number
  /** Programmatically scrolls the list to bring this zero-based index into view. */
  scrollToIndex?: number
  /** Content rendered when `items` is empty. */
  empty?: RemixNode
  /** Accessible name for the scrollable list region. */
  label?: string
  /** Semantic ARIA role for the virtualized container. Default `'list'`. */
  role?: 'list' | 'listbox' | 'feed'
  /** Called whenever the rendered `[start, end)` index window changes. */
  onRangeChange?: (range: Pick<VirtualRange, 'start' | 'end'>) => void
  class?: string
}

function parseNumericHeight(height: number | string): number {
  if (typeof height === 'number' && Number.isFinite(height) && height > 0) return height
  if (typeof height === 'string') {
    const match = height.trim().match(/^(\d+(?:\.\d+)?)px$/)
    if (match) return Number(match[1])
  }
  return 320
}

/**
 * High-performance fixed-height virtualized list that renders only the visible
 * viewport slice plus overscan, preserving native scrolling and deterministic SSR.
 */
export function VirtualList<T = unknown>(handle: Handle<VirtualListProps<T>>) {
  let scrollTop = 0
  let measuredHeight: number | null = null
  let scrollEl: HTMLDivElement | null = null
  let lastRangeKey = ''
  let lastScrollTarget: number | undefined

  const mountViewport = ref<HTMLDivElement>((node, signal) => {
    scrollEl = node
    if (node.clientHeight > 0 && measuredHeight !== node.clientHeight) {
      measuredHeight = node.clientHeight
      void handle.update()
    }
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(([entry]) => {
        const next = Math.round(entry.contentRect.height)
        if (next > 0 && next !== measuredHeight) {
          measuredHeight = next
          void handle.update()
        }
      })
      ro.observe(node)
      signal.addEventListener('abort', () => ro.disconnect(), { once: true })
    }
  })

  return () => {
    const props = handle.props
    const viewportHeight = measuredHeight ?? parseNumericHeight(props.height)
    const itemHeight = Math.max(1, props.itemHeight)

    if (props.scrollToIndex !== undefined && props.scrollToIndex !== lastScrollTarget && scrollEl) {
      lastScrollTarget = props.scrollToIndex
      const targetTop = scrollOffsetForIndex(
        props.scrollToIndex,
        props.items.length,
        itemHeight,
        scrollTop,
        viewportHeight,
      )
      scrollTop = targetTop
      scrollEl.scrollTop = targetTop
    }

    const range = computeVirtualRange({
      count: props.items.length,
      itemHeight,
      scrollTop,
      viewportHeight,
      overscan: props.overscan ?? 5,
    })

    const rangeKey = `${range.start}:${range.end}`
    if (rangeKey !== lastRangeKey) {
      lastRangeKey = rangeKey
      props.onRangeChange?.({ start: range.start, end: range.end })
    }

    const heightStyle = typeof props.height === 'number' ? `${props.height}px` : props.height
    const role = props.role ?? 'list'
    const itemRole = role === 'listbox' ? 'option' : role === 'feed' ? 'article' : 'listitem'

    if (props.items.length === 0) {
      return (
        <div
          class={classList('rf-virtual-list', 'rf-virtual-list-empty', props.class)}
          style={{ height: heightStyle }}
          role={role}
          aria-label={props.label}
        >
          {props.empty ?? null}
        </div>
      )
    }

    const slice = props.items.slice(range.start, range.end)

    return (
      <div
        class={classList('rf-virtual-list', props.class)}
        style={{ height: heightStyle, overflowY: 'auto' }}
        role={role}
        aria-label={props.label}
        tabIndex={0}
        mix={[
          mountViewport,
          on<HTMLDivElement, 'scroll'>('scroll', (event) => {
            const next = event.currentTarget.scrollTop
            if (Math.abs(next - scrollTop) >= 1) {
              scrollTop = next
              void handle.update()
            }
          }),
        ]}
      >
        <div class="rf-virtual-list-spacer" style={{ height: `${range.totalHeight}px` }}>
          <div
            class="rf-virtual-list-window"
            style={{ transform: `translateY(${range.offsetTop}px)` }}
          >
            {slice.map((item, offset) => {
              const index = range.start + offset
              const key = props.getKey ? props.getKey(item, index) : index
              return (
                <div
                  key={key}
                  class="rf-virtual-list-row"
                  role={itemRole}
                  data-index={index}
                  style={{ height: `${itemHeight}px` }}
                >
                  {props.renderItem(item, index)}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}
