import { VirtualList } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('renders only the visible slice of a 10,000-row list and updates on scroll', async (t) => {
  const rows = Array.from({ length: 10_000 }, (_, i) => ({ id: `row-${i}`, label: `Commit #${i}` }))
  let latestRange = { start: -1, end: -1 }

  const { $, $$, act, cleanup } = render(
    <VirtualList
      label="Commit history"
      items={rows}
      itemHeight={32}
      height={160}
      overscan={2}
      getKey={(item) => item.id}
      renderItem={(item) => <span>{item.label}</span>}
      onRangeChange={(range) => {
        latestRange = range
      }}
    />,
  )
  t.after(cleanup)

  const renderedInitial = $$('.rf-virtual-list-row').length
  ok(renderedInitial < 20, `expected small window, got ${renderedInitial}`)
  equal(latestRange.start, 0)
  equal($('.rf-virtual-list-spacer')?.getAttribute('style'), 'height: 320000px;')

  // Scroll deep into the list (row 500 = 16,000px).
  const viewport = $('.rf-virtual-list') as HTMLDivElement
  await act(() => {
    viewport.scrollTop = 16_000
    viewport.dispatchEvent(new Event('scroll'))
  })
  ok(latestRange.start >= 490 && latestRange.start <= 500, `start=${latestRange.start}`)
  ok(
    Array.from($$('.rf-virtual-list-row')).some((el) => el.textContent?.includes('Commit #500')),
    'row 500 is rendered after scrolling',
  )
})

it('renders the empty fallback when items is empty', (t) => {
  const { $, cleanup } = render(
    <VirtualList
      label="Empty list"
      items={[]}
      itemHeight={32}
      height={160}
      renderItem={() => null}
      empty={<p data-empty="">No rows</p>}
    />,
  )
  t.after(cleanup)

  equal($('[data-empty]')?.textContent, 'No rows')
})
