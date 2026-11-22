import { DataTable, createRangeSelection, type DataTableState } from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import type { Handle } from 'remix/component'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

const rows = [
  { name: 'Zoe', role: 'Engineer', count: 10 },
  { name: 'Amy', role: 'Designer', count: 2 },
  { name: 'Ben', role: 'Engineer', count: 2 },
  { name: 'Cal', role: 'Engineer', count: 30 },
]
type Person = (typeof rows)[number]
const columns = [
  { id: 'name', label: 'Name', value: (row: Person) => row.name },
  { id: 'role', label: 'Role', value: (row: Person) => row.role },
  { id: 'count', label: 'Count', value: (row: Person) => row.count },
]
const props = { label: 'People', rows, columns, rowKey: (row: Person) => row.name, pageSize: 2 }

it('sorts the full collection before paging and filters back to the first page', async (t) => {
  const { $, $$, act, cleanup } = render(<DataTable {...props} />)
  t.after(cleanup)
  const names = () => Array.from($$('tbody tr td:first-child'), (cell) => cell.textContent)
  await act(() => $('thead th:last-child button')!.click())
  deepEqual(names(), ['Amy', 'Ben'])
  equal($('th[aria-sort]')!.getAttribute('aria-sort'), 'ascending')
  await act(() => $('button[aria-label="Next page"]')!.click())
  deepEqual(names(), ['Zoe', 'Cal'])
  const search = $('input[type=search]') as HTMLInputElement
  await act(() => {
    search.value = 'ENGINEER'
    search.dispatchEvent(new Event('input', { bubbles: true }))
  })
  deepEqual(names(), ['Ben', 'Zoe'])
  await act(() => $('thead th:last-child button')!.click())
  deepEqual(names(), ['Cal', 'Zoe'])
  equal($('th[aria-sort]')!.getAttribute('aria-sort'), 'descending')
})

it('runs a context action on the filtered record and gives each record a visible actions button', async (t) => {
  let chosen = ''
  const { $, act, cleanup } = render(
    <DataTable
      {...props}
      defaultState={{ filter: 'Cal' }}
      rowActions={{
        label: (row) => 'Actions for ' + row.name,
        items: [{ value: 'copy', label: 'Copy name' }],
        onSelect: (action, row) => {
          chosen = action + ':' + row.name
        },
      }}
    />,
  )
  t.after(cleanup)
  const cell = $('tbody td')!
  await act(() =>
    cell.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
  )
  await act(() => $(':popover-open [role=menuitem]')!.click())
  equal(chosen, 'copy:Cal')
  equal($('tbody button[aria-label="Actions for Cal"]')?.getAttribute('aria-haspopup'), 'menu')
  chosen = ''
  await act(() => $('tbody button[aria-label="Actions for Cal"]')!.click())
  await act(() => $(':popover-open [role=menuitem]')!.click())
  equal(chosen, 'copy:Cal')
})

it('clamps the visible page and waits for the owner to apply controlled changes', async (t) => {
  let state: DataTableState = { filter: '', sort: null, page: 99 }
  let requested: DataTableState | undefined
  let owner: Handle
  function Directory(handle: Handle) {
    owner = handle
    return () => (
      <DataTable
        {...props}
        state={state}
        onStateChange={(next) => {
          requested = next
        }}
      />
    )
  }
  const { $, act, cleanup } = render(<Directory />)
  t.after(cleanup)
  equal($('tbody tr td')!.textContent, 'Ben')
  equal($('button[aria-current=page]')!.textContent, '2')
  await act(() => $('thead button')!.click())
  deepEqual(requested, { filter: '', sort: { column: 'name', direction: 'ascending' }, page: 1 })
  equal($('th[aria-sort]'), null)
  state = requested!
  await owner!.update()
  equal($('tbody tr td')!.textContent, 'Amy')
  state = { ...state, filter: 'absent', page: 99 }
  await owner!.update()
  equal($('[role=status]')!.textContent, '0 results, page 1 of 1')
  equal($('tbody')!.textContent?.includes('No matching results'), true)
  equal($('nav'), null)
})

it('keeps independent checks when a keyboard range contracts and clears them when the view changes', async (t) => {
  let current = rows
  let loading = false
  let owner: Handle
  function Directory(handle: Handle) {
    owner = handle
    return () => (
      <DataTable
        {...props}
        rows={current}
        pageSize={4}
        loading={loading}
        rowSelection={{
          label: (row) => 'Select ' + row.name,
          actions: (selected) => selected.map((row) => row.name).join(', '),
        }}
      />
    )
  }
  const { $, $$, act, cleanup } = render(<Directory />)
  t.after(cleanup)
  const box = (name: string) => $('input[aria-label="Select ' + name + '"]') as HTMLInputElement
  const all = () => $('thead input[type=checkbox]') as HTMLInputElement
  const checked = () =>
    Array.from($$('tbody input:checked'), (node) => node.getAttribute('aria-label'))
  function arrow(name: string, key: string) {
    return act(() =>
      box(name).dispatchEvent(
        new KeyboardEvent('keydown', { key, shiftKey: true, bubbles: true, cancelable: true }),
      ),
    )
  }
  await act(() => box('Cal').click())
  await act(() => box('Zoe').focus())
  await arrow('Zoe', 'ArrowDown')
  await arrow('Amy', 'ArrowDown')
  await arrow('Ben', 'ArrowUp')
  deepEqual(checked(), ['Select Zoe', 'Select Amy', 'Select Cal'])
  equal(document.activeElement, box('Amy'))
  equal(all().indeterminate, true)
  await act(() => $('thead th:nth-child(2) button')!.click())
  deepEqual(checked(), [])
  await act(() => all().click())
  equal(all().checked, true)
  current = current.filter((row) => row.name !== 'Zoe')
  await owner!.update()
  deepEqual(checked(), [])
  await act(() => box('Ben').click())
  loading = true
  await owner!.update()
  equal($('tbody input[type=checkbox]'), null)
  equal(all().disabled, true)
  loading = false
  await owner!.update()
  deepEqual(checked(), [])
})

it('announces loading with empty rows, supports per-row action lists, and re-anchors range selection when the anchor leaves', async (t) => {
  const { $, $$, act, cleanup } = render(
    <div>
      <DataTable {...props} rows={[]} loading={true} />
      <DataTable
        {...props}
        rowActions={{
          label: (row) => 'Actions for ' + row.name,
          items: (row) => [
            { value: 'promote', label: 'Promote', disabled: row.role === 'Engineer' },
          ],
          onSelect: () => {},
        }}
      />
    </div>,
  )
  t.after(cleanup)
  equal($('[role=status]')!.textContent, 'Loading')
  equal($('tbody')!.getAttribute('aria-hidden'), null)

  const secondTable = $$('.rf-data-table')[1]!
  const zoeButton = secondTable.querySelector('button[aria-label="Actions for Zoe"]') as HTMLElement
  await act(() => zoeButton.click())
  equal($(':popover-open [role=menuitem]')!.getAttribute('aria-disabled'), 'true')

  const selection = createRangeSelection<string>()
  const initial = selection.extend(['a', 'b', 'c'], new Set(), 'a', 'b')
  deepEqual(Array.from(initial), ['a', 'b'])
  const afterAnchorRemoved = selection.extend(['b', 'c'], initial, 'b', 'c')
  deepEqual(Array.from(afterAnchorRemoved), ['a', 'b', 'c'])
})

it('moves focus to the current page button when Next or Previous reaches a boundary', async (t) => {
  const { $, act, cleanup } = render(<DataTable {...props} />)
  t.after(cleanup)
  const next = $('button[aria-label="Next page"]') as HTMLButtonElement
  await act(() => {
    next.focus()
    next.click()
  })
  equal(document.activeElement, $('button[aria-current="page"]'))
  equal(document.activeElement?.textContent, '2')
  const prev = $('button[aria-label="Previous page"]') as HTMLButtonElement
  await act(() => {
    prev.focus()
    prev.click()
  })
  equal(document.activeElement, $('button[aria-current="page"]'))
  equal(document.activeElement?.textContent, '1')
})

it('selects every matching row across pages and clears it when the matching rows change', async (t) => {
  let current = rows
  let owner: Handle
  function Directory(handle: Handle) {
    owner = handle
    return () => (
      <DataTable
        {...props}
        rows={current}
        rowSelection={{
          label: (row) => 'Select ' + row.name,
          actions: (selected) => <output>{selected.map((row) => row.name).join(', ')}</output>,
          selectAllMatching: true,
        }}
      />
    )
  }
  const { $, $$, act, cleanup } = render(<Directory />)
  t.after(cleanup)
  const box = (name: string) => $('input[aria-label="Select ' + name + '"]') as HTMLInputElement
  const all = () => $('thead input[type=checkbox]') as HTMLInputElement
  const checked = () =>
    Array.from($$('tbody input:checked'), (node) => node.getAttribute('aria-label'))
  const toolbar = () => $('.rf-data-selection') as HTMLElement | null
  const button = (name: string) =>
    Array.from($$('.rf-data-selection button')).find((node) => node.textContent === name) as
      | HTMLButtonElement
      | undefined
  const acted = () => $('.rf-data-selection output')?.textContent
  const status = () => $('[role=status]')!.textContent

  // Part of a page offers nothing more.
  await act(() => box('Zoe').click())
  equal(button('Select all 4 matching'), undefined)
  // A full page with more matching rows offers every row.
  await act(() => all().click())
  ok(button('Select all 4 matching'))
  await act(() => button('Select all 4 matching')!.click())
  ok(toolbar()!.textContent!.includes('All 4 selected'))
  equal(acted(), 'Zoe, Amy, Ben, Cal')
  equal(document.activeElement, button('Select this page only'))
  ok(status().includes('all 4 selected'), status())

  // Paging and sorting keep it; actions follow the sort.
  await act(() => ($('button[aria-label="Next page"]') as HTMLButtonElement).click())
  deepEqual(checked(), ['Select Ben', 'Select Cal'])
  equal(all().checked, true)
  await act(() => $('thead th:nth-child(2) button')!.click())
  equal(acted(), 'Amy, Ben, Cal, Zoe')

  // Back to the page, then unchecking a row keeps the rest of the page.
  await act(() => button('Select this page only')!.click())
  ok(toolbar()!.textContent!.includes('2 selected'))
  equal(document.activeElement, button('Select all 4 matching'))
  await act(() => button('Select all 4 matching')!.click())
  await act(() => box('Amy').click())
  deepEqual(checked(), ['Select Ben'])
  equal(acted(), 'Ben')

  // A change to which rows match clears an all-matching selection.
  await act(() => all().click())
  await act(() => button('Select all 4 matching')!.click())
  current = [...rows, { name: 'Dee', role: 'Engineer', count: 4 }]
  await owner!.update()
  equal(toolbar(), null)
  deepEqual(checked(), [])
})

it('shows rows from a server as given and selects every matching row by count', async (t) => {
  // A server with 5 matching people; the table receives one page of 2.
  const all = [...rows, { name: 'Dee', role: 'Engineer', count: 4 }]
  let state: DataTableState = { filter: '', sort: null, page: 1 }
  const requests: DataTableState[] = []
  const acted: string[] = []
  let owner: Handle
  function Server(handle: Handle) {
    owner = handle
    return () => {
      const page = all.slice((state.page - 1) * 2, state.page * 2)
      return (
        <DataTable
          {...props}
          rows={page}
          rowCount={all.length}
          state={state}
          onStateChange={(next) => {
            requests.push(next)
            state = next
            void handle.update()
          }}
          rowSelection={{
            label: (row) => 'Select ' + row.name,
            selectAllMatching: true,
            actions: (selected, _clear, selection) => {
              acted.push(
                selected.map((row) => row.name).join('+') +
                  (selection.allMatching ? ` all ${selection.count}` : ` ${selection.count}`),
              )
              return null
            },
          }}
        />
      )
    }
  }
  const { $, $$, act, cleanup } = render(<Server />)
  t.after(cleanup)
  const names = () => Array.from($$('tbody tr td:nth-child(2)'), (cell) => cell.textContent)
  // Shown as given: Zoe before Amy, no client-side sort or slice.
  deepEqual(names(), ['Zoe', 'Amy'])
  ok($('[role=status]')!.textContent!.includes('5 results, page 1 of 3'))

  // Headers and filters ask the owner.
  await act(() => $('thead th:nth-child(2) button')!.click())
  deepEqual(requests.at(-1)!.sort, { column: 'name', direction: 'ascending' })
  deepEqual(names(), ['Zoe', 'Amy'], 'the owner decides the order')

  const all_ = () => $('thead input[type=checkbox]') as HTMLInputElement
  await act(() => all_().click())
  equal(acted.at(-1), 'Zoe+Amy 2')
  const offer = Array.from($$('.rf-data-selection button')).find(
    (node) => node.textContent === 'Select all 5 matching',
  ) as HTMLButtonElement
  ok(offer, 'the offer counts rowCount')
  await act(() => offer.click())
  equal(acted.at(-1), 'Zoe+Amy all 5')

  // A different count clears it.
  all.push({ name: 'Eve', role: 'Designer', count: 1 })
  await act(() => owner!.update())
  equal($('.rf-data-selection'), null)
})

it('writes large counts with thousands separators', async (t) => {
  const { $, $$, act, cleanup } = render(
    <DataTable
      {...props}
      rowCount={1284}
      rowSelection={{ label: (row) => row.name, actions: () => null, selectAllMatching: true }}
    />,
  )
  t.after(cleanup)
  equal($('[role=status]')!.textContent, '1,284 results, page 1 of 642')
  await act(() => ($('thead input[type=checkbox]') as HTMLInputElement).click())
  const matching = Array.from($$('.rf-data-selection button')).find((node) =>
    node.textContent?.startsWith('Select all'),
  )
  equal(matching?.textContent, 'Select all 1,284 matching')
  await act(() => matching!.click())
  ok($('.rf-data-selection')!.textContent!.includes('All 1,284 selected'))
})
