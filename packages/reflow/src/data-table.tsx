import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { createRangeSelection } from './behaviors/range-selection.ts'
import { Button } from './button.tsx'
import { Checkbox } from './checkbox.tsx'
import { Toolbar } from './toolbar.tsx'
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
  /** Optional control at the trailing edge of the filter row. */
  filterAction?: RemixNode
  /** Render native sort and page links. The destination supplies the new state. */
  href?: (state: DataTableState) => string
  loading?: boolean
  /** The same actions are available from the row button and the context menu. */
  rowActions?: {
    label: (row: Row) => string
    items: readonly DropdownItem[] | ((row: Row) => readonly DropdownItem[])
    onSelect: (action: string, row: Row, checked?: boolean) => void
  }
  /** Select rows on the current page. A changed view clears the selection. */
  rowSelection?: {
    label: (row: Row) => string
    /** Receives the selected rows in displayed order: every matching row while all are selected. */
    actions: (rows: readonly Row[], clear: () => void) => RemixNode
    /**
     * Once a full page is checked and more rows match, offer to select every
     * matching row. That selection lasts across pages, sorting and page size,
     * and clears when the filter or the matching rows change.
     */
    selectAllMatching?: boolean
  }
  paginationLabel?: string
  id?: string
}

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

export function DataTable<Row>(handle: Handle<DataTableProps<Row>>) {
  let local: DataTableState = { filter: '', sort: null, page: 1, ...handle.props.defaultState }

  const range = createRangeSelection<string>()
  let selected = new Set<string>()
  // Every row the filter matches, on every page, rather than `selected`.
  let allMatching = false
  let selectionView: string | undefined
  // Switching between a page and an all-matching selection changes the view
  // on purpose; the next render adopts it instead of clearing.
  let adoptView = false
  let lastFocused: string | undefined
  let root: HTMLDivElement
  const mount = ref<HTMLDivElement>((node) => {
    root = node
  })

  function checkbox(key: string | undefined) {
    return key === undefined
      ? null
      : root.querySelector<HTMLInputElement>(`input[data-rf-select-row="${CSS.escape(key)}"]`)
  }

  function change(next: DataTableState) {
    handle.props.onStateChange?.(next)
    if (handle.props.state === undefined) {
      local = next
      void handle.update()
    }
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
              ? left === right
                ? 0
                : Number.isNaN(left)
                  ? 1
                  : Number.isNaN(right)
                    ? -1
                    : left - right
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

    const { rowActions, rowSelection, loading } = handle.props
    const keys = visible.map(rowKey)
    // A page selection belongs to the view; an all-matching one to the filter
    // and the rows it matches.
    const view =
      rowSelection && !loading
        ? JSON.stringify(
            allMatching
              ? ['all', state.filter, matches.map(rowKey)]
              : [state.filter, state.sort?.column, state.sort?.direction, page, limit, keys],
          )
        : undefined
    if (adoptView && view !== undefined) {
      adoptView = false
      selectionView = view
    }
    if (selectionView !== view) {
      const hadSelection = selected.size > 0
      const focusInToolbar =
        hadSelection &&
        !!root?.querySelector('.rf-data-selection')?.contains(root.ownerDocument.activeElement)
      selectionView = view
      selected = new Set()
      allMatching = false
      lastFocused = undefined
      range.reset()
      if (focusInToolbar) {
        handle.queueTask(() => {
          if (!handle.signal.aborted) {
            root?.querySelector<HTMLInputElement>('input[data-rf-select-row]')?.focus()
          }
        })
      }
    }
    const snapshot = selected
    async function clearSelection() {
      // An asynchronous action may finish after a newer selection or view has replaced it.
      if (handle.signal.aborted || snapshot !== selected) return
      const returnFocus = root
        .querySelector('.rf-data-selection')
        ?.contains(root.ownerDocument.activeElement)
      selected = new Set()
      if (allMatching) adoptView = true
      allMatching = false
      range.reset()
      await handle.update()
      if (returnFocus && !handle.signal.aborted) {
        ;(
          checkbox(lastFocused) ?? root.querySelector<HTMLInputElement>('input[data-rf-select-row]')
        )?.focus()
      }
    }
    // Swaps between this page and every matching row, keeping focus on the
    // toolbar button whose label changes.
    async function selectMatching(all: boolean) {
      allMatching = all
      selected = new Set(keys)
      adoptView = true
      range.reset()
      await handle.update()
      if (!handle.signal.aborted)
        root.querySelector<HTMLButtonElement>('.rf-data-select-matching')?.focus()
    }
    // Leaving an all-matching selection from a row keeps the rest of the page.
    function leaveAllMatching() {
      if (!allMatching) return
      allMatching = false
      selected = new Set(keys)
      adoptView = true
    }
    const selectedCount = allMatching ? sorted.length : selected.size
    const pageSelected = !!keys.length && keys.every((key) => selected.has(key))
    function navigateSelection(event: KeyboardEvent, index: number) {
      if (event.key === 'Tab') range.reset()
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.isComposing ||
        (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')
      )
        return
      event.preventDefault()
      const next = keys[index + (event.key === 'ArrowDown' ? 1 : -1)]
      if (!event.shiftKey) range.reset()
      if (next === undefined) return
      checkbox(next)?.focus()
      if (event.shiftKey) {
        leaveAllMatching()
        selected = range.extend(keys, selected, keys[index]!, next)
        void handle.update()
      }
    }
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
            {rowSelection && (
              <TableHead class="rf-data-select-cell">
                <Checkbox
                  aria-label="Select all rows on this page"
                  size={size}
                  disabled={loading || !keys.length}
                  checked={!!keys.length && (allMatching || selected.size === keys.length)}
                  indeterminate={!allMatching && selected.size > 0 && selected.size < keys.length}
                  onCheckedChange={(checked) => {
                    range.reset()
                    if (allMatching) adoptView = true
                    allMatching = false
                    selected = new Set(checked ? keys : [])
                    void handle.update()
                  }}
                />
              </TableHead>
            )}
            {columns.map(header)}
            {rowActions && (
              <TableHead class="rf-data-action-cell">
                <span class="rf-basic-sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody aria-hidden={loading && visible.length > 0 ? true : undefined}>
          {visible.map((row, index) => {
            const key = keys[index]!
            return (
              <TableRow
                key={key}
                selected={!!rowSelection && (allMatching || selected.has(key))}
                hover={!!rowActions && !loading}
                data-rf-data-row={rowActions && !loading ? key : undefined}
                tabIndex={rowActions && !loading ? -1 : undefined}
              >
                {rowSelection && (
                  <TableCell class="rf-data-select-cell">
                    {loading ? (
                      <Skeleton width="16px" height="16px" />
                    ) : (
                      <Checkbox
                        size={size}
                        aria-label={rowSelection.label(row)}
                        data-rf-select-row={key}
                        checked={allMatching || selected.has(key)}
                        onCheckedChange={(checked) => {
                          range.reset()
                          leaveAllMatching()
                          selected = new Set(selected)
                          if (checked) selected.add(key)
                          else selected.delete(key)
                          void handle.update()
                        }}
                        mix={[
                          on('focus', () => {
                            lastFocused = key
                          }),
                          on('blur', (event) => {
                            if (
                              !(event.relatedTarget instanceof HTMLInputElement) ||
                              !root.contains(event.relatedTarget) ||
                              !event.relatedTarget.hasAttribute('data-rf-select-row')
                            )
                              range.reset()
                          }),
                          on('keydown', (event) => navigateSelection(event, index)),
                        ]}
                      />
                    )}
                  </TableCell>
                )}
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
                        items={
                          typeof rowActions.items === 'function'
                            ? rowActions.items(row)
                            : rowActions.items
                        }
                        onSelect={(action, checked) => rowActions.onSelect(action, row, checked)}
                      />
                    )}
                  </TableCell>
                )}
              </TableRow>
            )
          })}
          {!visible.length && (
            <TableEmpty
              colSpan={columns.length + (rowActions ? 1 : 0) + (rowSelection ? 1 : 0)}
              title={loading ? 'Loading' : query ? 'No matching results' : 'No results'}
            />
          )}
        </TableBody>
      </Table>
    )
    return (
      <div class="rf-data-table" data-size={size} mix={mount}>
        <div class="rf-data-filter">
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
          {handle.props.filterAction}
        </div>
        {rowActions ? (
          <ContextMenu
            label={`${label} row actions`}
            target="[data-rf-data-row]"
            items={
              typeof rowActions.items === 'function'
                ? ((buildItems) => (target: HTMLElement) => {
                    const row = visible.find((item) => rowKey(item) === target.dataset.rfDataRow)
                    return row !== undefined && !loading ? buildItems(row) : []
                  })(rowActions.items)
                : rowActions.items
            }
            size={size}
            onSelect={(action, target, checked) => {
              const row = visible.find((item) => rowKey(item) === target.dataset.rfDataRow)
              if (!loading && row !== undefined && target.isConnected)
                rowActions.onSelect(action, row, checked)
            }}
          >
            {table}
          </ContextMenu>
        ) : (
          table
        )}
        {rowSelection && selectedCount > 0 && (
          <Toolbar label="Selected row actions" class="rf-data-selection">
            <span>
              {allMatching ? `All ${selectedCount} selected` : `${selectedCount} selected`}
            </span>
            {rowSelection.selectAllMatching &&
              (allMatching ? (
                <Button
                  size="compact"
                  variant="ghost"
                  class="rf-data-select-matching"
                  mix={on('click', () => selectMatching(false))}
                >
                  Select this page only
                </Button>
              ) : (
                pageSelected &&
                sorted.length > keys.length && (
                  <Button
                    size="compact"
                    variant="ghost"
                    class="rf-data-select-matching"
                    mix={on('click', () => selectMatching(true))}
                  >
                    {`Select all ${sorted.length} matching`}
                  </Button>
                )
              ))}
            {rowSelection.actions(
              allMatching ? sorted : visible.filter((_, index) => selected.has(keys[index]!)),
              clearSelection,
            )}
            <Button size="compact" variant="ghost" mix={on('click', clearSelection)}>
              Clear selection
            </Button>
          </Toolbar>
        )}
        <span role="status" class="rf-basic-sr-only">
          {loading
            ? 'Loading'
            : `${sorted.length} ${sorted.length === 1 ? 'result' : 'results'}, page ${page} of ${pageCount}${allMatching ? `, all ${sorted.length} selected` : ''}`}
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
