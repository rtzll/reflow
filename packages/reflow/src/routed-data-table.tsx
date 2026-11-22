import { DataTable, type DataTableProps, type DataTableState } from './data-table.tsx'
import { navigate, on, ref, updateUrl, type Handle } from 'remix/component'

export interface DataTableRoute {
  path: string
  search: string
  prefix: string
  anchor: string
}

export type RoutedDataTableProps<Row> = Omit<
  DataTableProps<Row>,
  'state' | 'defaultState' | 'href' | 'onStateChange' | 'filterInput'
> & { route: DataTableRoute; class?: string }

function normalizeSearch(value: string) {
  return value && !value.startsWith('?') ? '?' + value : value
}

/** Derive state from the request so links and filter submission work before hydration. */
export function RoutedDataTable<Row>(handle: Handle<RoutedDataTableProps<Row>>) {
  let requestSearch = normalizeSearch(handle.props.route.search)
  let search = requestSearch
  let draftFilter: string | undefined
  const history = ref((_node, signal) => {
    function readLocation() {
      if (handle.props.rowCount !== undefined || search === location.search) return
      search = location.search
      requestSearch = normalizeSearch(handle.props.route.search)
      void handle.update()
    }
    if (window.navigation) {
      window.navigation.addEventListener(
        'currententrychange',
        (event) => {
          if (event.navigationType === 'replace') readLocation()
        },
        { signal },
      )
      // A link can return to the last server query after a local filter edit.
      // Wait for the response so the current table stays usable while the link loads.
      window.navigation.addEventListener('navigatesuccess', readLocation, { signal })
    } else {
      window.addEventListener('popstate', readLocation, { signal })
    }
  })

  return () => {
    const { route, class: className, ...props } = handle.props
    const normalizedRouteSearch = normalizeSearch(route.search)
    if (normalizedRouteSearch !== requestSearch) {
      requestSearch = normalizedRouteSearch
      search = requestSearch
      draftFilter = undefined
    }
    const params = new URLSearchParams(
      props.rowCount === undefined ? search : normalizedRouteSearch,
    )
    const name = (field: string) => route.prefix + field
    const formId = handle.id + '-filter'
    const hash = route.anchor ? '#' + route.anchor : ''
    const filterFields = Array.from(params).filter(
      ([key]) => key !== name('Filter') && key !== name('Page'),
    )
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
      return route.path + (query.size ? '?' + query : '') + hash
    }
    return (
      <div class={className} mix={history}>
        <form
          id={formId}
          action={route.path + hash}
          method="get"
          data-rmx-reset-scroll="manual"
          mix={
            props.rowCount === undefined
              ? on('submit', (event) => event.preventDefault())
              : undefined
          }
          data-rmx-reset-focus="manual"
        >
          {filterFields.map(([key, value], index) => (
            <input key={`${key}-${index}`} type="hidden" name={key} value={value} />
          ))}
        </form>
        <DataTable
          {...props}
          filterInput={{
            name: name('Filter'),
            form: formId,
            value: props.rowCount === undefined ? state.filter : (draftFilter ?? state.filter),
          }}
          state={state}
          href={destination}
          onStateChange={(next) => {
            // Keep independent controls such as the docs Code tab in the current URL.
            search = location.search
            const href = destination(next)
            if (props.rowCount !== undefined) {
              // Keep editing the draft while the request is in flight. Selection and
              // row actions still describe the filter that produced the loaded rows.
              draftFilter = next.filter
              void handle.update()
              // Without frame navigation the native GET form submits the complete filter on Enter.
              if (
                !window.navigation ||
                typeof NavigateEvent === 'undefined' ||
                !('sourceElement' in NavigateEvent.prototype)
              )
                return
              void navigate(href, {
                history: 'replace',
                resetScroll: 'manual',
                resetFocus: 'manual',
              }).catch((error: unknown) => {
                if (!(error instanceof DOMException && error.name === 'AbortError')) throw error
              })
              return
            }
            search = new URL(href, location.href).search
            void updateUrl(href, { signal: handle.signal })
            void handle.update()
          }}
        />
      </div>
    )
  }
}
