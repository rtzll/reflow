import { DataTable, type DataTableState } from '@rtzll/reflow'
import { deepEqual, equal } from 'remix/assert'
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
