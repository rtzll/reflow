import type { Handle } from 'remix/component'
import type { ControlSize } from './basic.tsx'
import { Icon } from './icon.tsx'

export interface PaginationProps {
  page: number
  pageCount: number
  href: (page: number) => string
  label?: string
  size?: ControlSize
  /** Keep the current scroll position during Remix navigation. */
  resetScroll?: 'manual' | 'after-transition'
}

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

    return (
      <nav class="rf-pagination" aria-label={label} data-size={size}>
        <ul>
          <li>
            {current > 1 ? (
              <a
                class="rf-pagination-arrow"
                href={href(current - 1)}
                data-rmx-reset-scroll={resetScroll}
                aria-label="Previous page"
              >
                <Icon name="chevron-left" />
              </a>
            ) : (
              <span class="rf-pagination-arrow" aria-hidden="true">
                <Icon name="chevron-left" />
              </span>
            )}
          </li>
          {pageNumbers(current, count).map((number, index) => (
            <li key={number ?? `gap-${index}`}>
              {number === null ? (
                <span aria-hidden="true">…</span>
              ) : (
                <a
                  href={href(number)}
                  data-rmx-reset-scroll={resetScroll}
                  aria-label={`Page ${number}`}
                  aria-current={current === number ? 'page' : undefined}
                >
                  {number}
                </a>
              )}
            </li>
          ))}
          <li>
            {current < count ? (
              <a
                class="rf-pagination-arrow"
                href={href(current + 1)}
                data-rmx-reset-scroll={resetScroll}
                aria-label="Next page"
              >
                <Icon name="chevron-right" />
              </a>
            ) : (
              <span class="rf-pagination-arrow" aria-hidden="true">
                <Icon name="chevron-right" />
              </span>
            )}
          </li>
        </ul>
      </nav>
    )
  }
}
