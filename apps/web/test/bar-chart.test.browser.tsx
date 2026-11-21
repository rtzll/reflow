import { BarChart } from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { type Handle } from 'remix/component'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

const bars = [
  { id: 'compile', label: 'Compile', value: 0.5 },
  { id: 'test', label: 'Test', value: 1.5 },
  { id: 'upload', label: 'Upload', value: 0 },
]

it('renders static values inside a link and scales fractional peaks', (t) => {
  const { $, $$, cleanup } = render(
    <a href="/report">
      <BarChart label="Run times" items={bars} />
    </a>,
  )
  t.after(cleanup)
  equal($$('a').length, 1)
  equal($$('button, [tabindex]').length, 0)
  equal($$('[role=img]').length, 3)
  ok($('[aria-label="Test, 1.5"]'))
  equal($('[data-peak] .rf-bar-chart-fill')?.style.height, '100%')
})

it('handles empty and zero-only series without false peaks or invalid geometry', async (t) => {
  let items: typeof bars = []
  let owner: Handle
  function Chart(handle: Handle) {
    owner = handle
    return () => <BarChart label="Run times" items={items} />
  }
  const { $, cleanup } = render(<Chart />)
  t.after(cleanup)
  equal($('[role=group]')?.textContent?.trim(), 'No data')
  items = [bars[2]]
  await owner!.update()
  equal($('.rf-bar-chart-fill')?.style.height, '0%')
  equal($('[data-peak]'), null)
})

it('roves between controls and preserves the owner’s activation and range state', async (t) => {
  let selected = ''
  const { $, $$, act, cleanup } = render(
    <BarChart
      label="Run times"
      items={bars}
      range={{ start: 'test', end: 'upload' }}
      formatValue={(value) => value + ' seconds'}
      onSelect={(item) => {
        selected = item.id
      }}
    />,
  )
  t.after(cleanup)
  const controls = [...$$('button')]
  deepEqual(
    controls.map((bar) => bar.tabIndex),
    [-1, 0, -1],
  )
  equal(controls[1].getAttribute('aria-label'), 'Test, 1.5 seconds')
  equal(controls[0].hasAttribute('data-active'), false)
  const key = async (node: HTMLElement, key: string) => {
    await act(() => node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })))
  }
  await act(() => controls[1].focus())
  await key(controls[1], 'End')
  equal(document.activeElement, controls[2])
  await key(controls[2], 'Home')
  await key(controls[0], 'ArrowRight')
  equal(document.activeElement, controls[1])
  await act(() => controls[1].click())
  equal(selected, 'test')
  equal($('[aria-current]'), null)
})

it('rounds the axis up to whole steps and scales bars to it', (t) => {
  const { $, $$, cleanup } = render(
    <BarChart
      label="Events"
      items={[
        { id: 'mon', label: 'Mon', value: 23 },
        { id: 'tue', label: 'Tue', value: 4 },
      ]}
    />,
  )
  t.after(cleanup)
  deepEqual(
    Array.from($$('.rf-bar-chart-grid > span > span'), (tick) => tick.textContent),
    ['24', '16', '8', '0'],
  )
  ok($('[data-peak]'))
  equal(Number.parseFloat($('[data-peak] .rf-bar-chart-fill')!.style.height).toFixed(2), '95.83')
})
