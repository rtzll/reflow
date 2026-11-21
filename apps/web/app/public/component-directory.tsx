import { Pagination } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

interface DirectoryProps {
  entries: readonly (readonly [slug: string, name: string])[]
  /** Pass the current request's URL.search so links also work before hydration. */
  query?: string
}

export function ComponentDirectory(handle: Handle<DirectoryProps>) {
  return () => {
    const { entries, query } = handle.props
    const params = new URLSearchParams(query)
    const count = Math.ceil(entries.length / 5)
    const requested = Number(params.get('page'))
    const page = Math.max(1, Math.min(count, Number.isInteger(requested) ? requested : 1))
    const start = (page - 1) * 5
    function href(next: number) {
      const target = new URLSearchParams(params)
      target.set('page', String(next))
      return '?' + target.toString()
    }
    return (
      <div class="example-directory">
        <ul aria-label="Component directory">
          {entries.slice(start, start + 5).map(([slug, name]) => (
            <li key={slug}>
              <a href={'/docs/' + slug}>{name}</a>
            </li>
          ))}
        </ul>
        <Pagination
          label="Component pages"
          page={page}
          pageCount={count}
          href={href}
          resetScroll="manual"
        />
      </div>
    )
  }
}
