import { DataTable, type DataTableProps, type DataTableState } from '@rtzll/reflow'
import { ref, updateUrl, type Handle } from 'remix/component'

export interface TableRoute {
  path: string
  search: string
  prefix: string
  anchor: string
}

/** The request supplies the initial rows. Sort and page links work before hydration. */
export function RoutedDataTable<Row>(
  handle: Handle<
    Omit<DataTableProps<Row>, 'state' | 'href' | 'onStateChange'> & { route: TableRoute }
  >,
) {
  let requestSearch = handle.props.route.search
  let search = requestSearch
  const history = ref((_node, signal) => {
    window.addEventListener(
      'popstate',
      () => {
        search = location.search
        void handle.update()
      },
      { signal },
    )
  })

  return () => {
    const { route, ...props } = handle.props
    if (route.search !== requestSearch) {
      requestSearch = route.search
      search = requestSearch
    }
    const params = new URLSearchParams(search)
    const name = (field: string) => route.prefix + field
    const sortColumn = params.get(name('Sort'))
    const state: DataTableState = {
      filter: params.get(name('Filter')) ?? '',
      page: Number(params.get(name('Page')) ?? 1),
      sort:
        sortColumn &&
        props.columns.some((column) => column.id === sortColumn && column.sortable !== false)
          ? {
              column: sortColumn,
              direction: params.get(name('Dir')) === 'desc' ? 'descending' : 'ascending',
            }
          : null,
    }
    function destination(next: DataTableState) {
      const query = new URLSearchParams(search)
      for (const field of ['Page', 'Filter', 'Sort', 'Dir']) query.delete(name(field))
      if (next.page > 1) query.set(name('Page'), String(next.page))
      if (next.filter) query.set(name('Filter'), next.filter)
      if (next.sort) {
        query.set(name('Sort'), next.sort.column)
        if (next.sort.direction === 'descending') query.set(name('Dir'), 'desc')
      }
      return route.path + (query.size ? '?' + query : '') + '#' + route.anchor
    }
    return (
      <div mix={history}>
        <DataTable
          {...props}
          state={state}
          href={destination}
          onStateChange={(next) => {
            // Keep independent controls such as the docs Code tab in the current URL.
            search = location.search
            const href = destination(next)
            search = new URL(href, location.href).search
            void updateUrl(href, { signal: handle.signal })
            void handle.update()
          }}
        />
      </div>
    )
  }
}
