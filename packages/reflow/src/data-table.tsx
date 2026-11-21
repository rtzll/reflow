import { on, type Handle, type RemixNode } from 'remix/component'
import { ContextMenu } from './context-menu.tsx'
import { Dropdown, type DropdownItem } from './dropdown.tsx'
import { Skeleton } from './skeleton.tsx'
import { Icon } from './icon.tsx'
import { Input, type InputProps } from './input.tsx'
import { Pagination } from './pagination.tsx'
import type { ControlSize } from './systems/styling.ts'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from './table.tsx'

export interface DataTableColumn<Row> {
  id: string
  label: string
  /** Comparable and searchable value, independent of the rendered cell. */
  value: (row: Row) => string | number
  cell?: (row: Row) => RemixNode
  sortable?: boolean
  rowHeader?: boolean
}

export interface DataTableState {
  filter: string
  sort: { column: string; direction: 'ascending' | 'descending' } | null
  page: number
}

export interface DataTableProps<Row> {
  label: string
  rows: readonly Row[]
  columns: readonly DataTableColumn<Row>[]
  rowKey: (row: Row) => string
  /** Omit to show all matching rows. */
  pageSize?: number
  size?: ControlSize
  state?: DataTableState
  defaultState?: Partial<DataTableState>
  onStateChange?: (state: DataTableState) => void
  /** Associate search with a native form for server-rendered filtering. */
  filterInput?: Pick<InputProps, 'name' | 'form'>
  /** Render native sort and page links. The destination supplies the new state. */
  href?: (state: DataTableState) => string
  loading?: boolean
  /** The same actions are available from the row button and the context menu. */
  rowActions?: {
    label: (row: Row) => string
    items: readonly DropdownItem[]
    onSelect: (action: string, row: Row, checked?: boolean) => void
  }
  paginationLabel?: string
  id?: string
}

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

export function DataTable<Row>(handle: Handle<DataTableProps<Row>>) {
  let local: DataTableState = { filter: '', sort: null, page: 1, ...handle.props.defaultState }

  function change(next: DataTableState) {
    local = next
    handle.props.onStateChange?.(next)
    void handle.update()
  }

  return () => {
    const { label, rows, columns, rowKey, pageSize, size, href, paginationLabel } = handle.props
    const state = handle.props.state ?? local
    const query = state.filter.trim().toLowerCase()
    const matches = query
      ? rows.filter((row) =>
          columns.some((column) => String(column.value(row)).toLowerCase().includes(query)),
        )
      : rows
    const sortedColumn = columns.find(
      (column) => column.sortable !== false && column.id === state.sort?.column,
    )
    const sorted = sortedColumn
      ? matches.toSorted((a, b) => {
          const left = sortedColumn.value(a)
          const right = sortedColumn.value(b)
          const difference =
            typeof left === 'number' && typeof right === 'number'
              ? left - right
              : collator.compare(String(left), String(right))
          return state.sort?.direction === 'descending' ? -difference : difference
        })
      : matches
    const limit =
      pageSize && Number.isSafeInteger(pageSize) && pageSize > 0
        ? pageSize
        : Math.max(1, sorted.length)
    const pageCount = Math.max(1, Math.ceil(sorted.length / limit))
    const page = Number.isSafeInteger(state.page) ? Math.min(Math.max(1, state.page), pageCount) : 1
    const visible = sorted.slice((page - 1) * limit, page * limit)
    const filterLabel = `Filter ${label}`

    function header(column: DataTableColumn<Row>) {
      if (column.sortable === false) return <TableHead key={column.id}>{column.label}</TableHead>
      const direction = sortedColumn === column ? state.sort?.direction : undefined
      const next: DataTableState = {
        ...state,
        page: 1,
        sort: {
          column: column.id,
          direction: direction === 'ascending' ? 'descending' : 'ascending',
        },
      }
      const content = (
        <>
          {column.label}
          <Icon name={direction ? 'arrow-up' : 'chevrons-up-down'} />
        </>
      )
      return (
        <TableHead key={column.id} aria-sort={direction}>
          {href ? (
            <a class="rf-data-sort" href={href(next)} data-rmx-reset-scroll="manual">
              {content}
            </a>
          ) : (
            <button class="rf-data-sort" type="button" mix={on('click', () => change(next))}>
              {content}
            </button>
          )}
        </TableHead>
      )
    }

    const { rowActions, loading } = handle.props
    const table = (
      <Table
        id={handle.props.id}
        size={size}
        aria-label={label}
        aria-busy={loading}
        fluidHover={!!rowActions && !loading}
      >
        <TableHeader>
          <TableRow hover={false}>
            {columns.map(header)}
            {rowActions && (
              <TableHead class="rf-data-action-cell">
                <span class="rf-basic-sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody aria-hidden={loading || undefined}>
          {visible.map((row) => (
            <TableRow
              key={rowKey(row)}
              hover={!!rowActions && !loading}
              data-rf-data-row={rowActions && !loading ? rowKey(row) : undefined}
              tabIndex={rowActions && !loading ? -1 : undefined}
            >
              {columns.map((column) => {
                const content = loading ? (
                  <Skeleton />
                ) : column.cell ? (
                  column.cell(row)
                ) : (
                  column.value(row)
                )
                return column.rowHeader ? (
                  <th key={column.id} scope="row">
                    {content}
                  </th>
                ) : (
                  <TableCell key={column.id}>{content}</TableCell>
                )
              })}
              {rowActions && (
                <TableCell class="rf-data-action-cell">
                  {loading ? (
                    <Skeleton width="24px" height="24px" />
                  ) : (
                    <Dropdown
                      label={rowActions.label(row)}
                      variant="bare"
                      triggerClass="rf-data-actions"
                      triggerContent={<Icon name="more-horizontal" size={16} />}
                      chevron={false}
                      align="end"
                      size={size}
                      items={rowActions.items}
                      onSelect={(action, checked) => rowActions.onSelect(action, row, checked)}
                    />
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
          {!visible.length && (
            <TableEmpty
              colSpan={columns.length + (rowActions ? 1 : 0)}
              title={loading ? 'Loading' : query ? 'No matching results' : 'No results'}
            />
          )}
        </TableBody>
      </Table>
    )
    return (
      <div class="rf-data-table">
        <Input
          {...handle.props.filterInput}
          type="search"
          size={size}
          aria-label={filterLabel}
          placeholder={filterLabel}
          value={state.filter}
          mix={on<HTMLInputElement, 'input'>('input', (event) =>
            change({ ...state, filter: event.currentTarget.value, page: 1 }),
          )}
        />
        {rowActions ? (
          <ContextMenu
            label={`${label} row actions`}
            target="[data-rf-data-row]"
            items={rowActions.items}
            size={size}
            onSelect={(action, target, checked) => {
              const row = visible.find((item) => rowKey(item) === target.dataset.rfDataRow)
              if (row !== undefined && target.isConnected) rowActions.onSelect(action, row, checked)
            }}
          >
            {table}
          </ContextMenu>
        ) : (
          table
        )}
        <span role="status" class="rf-basic-sr-only">
          {sorted.length} {sorted.length === 1 ? 'result' : 'results'}, page {page} of {pageCount}
        </span>
        <Pagination
          page={page}
          pageCount={pageCount}
          size={size}
          label={paginationLabel ?? `${label} pages`}
          resetScroll="manual"
          {...(href
            ? { href: (next: number) => href({ ...state, page: next }) }
            : { onPageChange: (next: number) => change({ ...state, page: next }) })}
        />
      </div>
    )
  }
}
