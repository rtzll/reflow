import { DataTable } from '@rtzll/reflow'
import { deepEqual, equal } from 'remix/assert'
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
