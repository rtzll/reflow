import { on, type Handle, type RemixNode } from 'remix/component'
import type { ControlSize } from './systems/styling.ts'
import { Icon } from './icon.tsx'

export type PaginationProps = {
  page: number
  pageCount: number
  label?: string
  size?: ControlSize
  /** Keep the current scroll position during Remix navigation. */
  resetScroll?: 'manual' | 'after-transition'
} & (
  | { href: (page: number) => string; onPageChange?: never }
  | { href?: never; onPageChange: (page: number) => void }
)

function pageNumbers(page: number, count: number) {
  if (count <= 5) return Array.from({ length: count }, (_, index) => index + 1)
  const firstNeighbor = Math.max(2, Math.min(count - 3, page - 1))
  const lastNeighbor = firstNeighbor + 2
  return [
    1,
    ...(firstNeighbor > 2 ? [null] : []),
    firstNeighbor,
    firstNeighbor + 1,
    lastNeighbor,
    ...(lastNeighbor < count - 1 ? [null] : []),
    count,
  ]
}

export function Pagination(handle: Handle<PaginationProps>) {
  return () => {
    const { page, pageCount, href, label = 'Pagination', size, resetScroll } = handle.props
    const count = Number.isFinite(pageCount) ? Math.max(0, Math.floor(pageCount)) : 0
    if (count < 2) return null
    const current = Number.isFinite(page) ? Math.min(count, Math.max(1, Math.floor(page))) : 1

    function control(next: number, name: string, content: RemixNode, arrow = false) {
      const attributes = {
        'aria-label': name,
        'aria-current': !arrow && next === current ? ('page' as const) : undefined,
        class: arrow ? 'rf-pagination-arrow' : undefined,
      }
      if (next < 1 || next > count)
        return (
          <span class="rf-pagination-arrow" aria-hidden="true">
            {content}
          </span>
        )
      return href ? (
        <a {...attributes} href={href(next)} data-rmx-reset-scroll={resetScroll}>
          {content}
        </a>
      ) : (
        <button
          {...attributes}
          type="button"
          mix={on('click', () => handle.props.onPageChange?.(next))}
        >
          {content}
        </button>
      )
    }

    return (
      <nav class="rf-pagination" aria-label={label} data-size={size}>
        <ul>
          <li>{control(current - 1, 'Previous page', <Icon name="chevron-left" />, true)}</li>
          {pageNumbers(current, count).map((number, index) => (
            <li key={number ?? `gap-${index}`}>
              {number === null ? (
                <span aria-hidden="true">…</span>
              ) : (
                control(number, `Page ${number}`, number)
              )}
            </li>
          ))}
          <li>{control(current + 1, 'Next page', <Icon name="chevron-right" />, true)}</li>
        </ul>
      </nav>
    )
  }
}
