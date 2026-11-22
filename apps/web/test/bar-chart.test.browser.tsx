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

it('handles extreme finite peaks without NaN or Infinity, marks static current bars, and avoids duplicate descriptions', (t) => {
  const { $, $$, cleanup } = render(
    <div>
      <BarChart
        label="Huge"
        items={[{ id: 'max', label: 'Max', value: 1.6e308 }]}
        range={{ start: 'max', end: 'max' }}
      />
      <BarChart label="Tiny" items={[{ id: 'min', label: 'Min', value: Number.MIN_VALUE }]} />
      <BarChart label="Interactive" items={bars} onSelect={() => {}} />
    </div>,
  )
  t.after(cleanup)
  const charts = Array.from($$('.rf-bar-chart'))
  equal(charts[0]!.querySelector('[data-current]')?.getAttribute('role'), 'img')
  equal(charts[0]!.querySelector('.rf-bar-chart-fill')?.getAttribute('style'), 'height: 100%;')
  equal(charts[1]!.querySelector('.rf-bar-chart-fill')?.getAttribute('style'), 'height: 100%;')
  for (const label of Array.from($$('.rf-bar-chart-grid > span > span'), (el) => el.textContent)) {
    ok(label && !label.includes('NaN') && !label.includes('∞'))
  }
  const firstButton = charts[2]!.querySelector('button')!
  equal(firstButton.getAttribute('aria-describedby'), null)
  ok(firstButton.getAttribute('aria-label'))
})

// Where each segment sits on the value scale, as percentages: [start, size].
function segments(chart: ParentNode) {
  return Array.from(chart.querySelectorAll<HTMLElement>('.rf-bar-chart-column'), (column) =>
    Array.from(column.querySelectorAll<HTMLElement>('.rf-bar-chart-fill'), (fill) => [
      Number.parseFloat(fill.style.getPropertyValue('--start')),
      Number.parseFloat(fill.style.getPropertyValue('--size')),
    ]),
  )
}

it('draws negative values below a zero line on round steps', (t) => {
  const { $, $$, cleanup } = render(
    <BarChart
      label="Balance"
      items={[
        { id: 'jan', label: 'Jan', value: 30 },
        { id: 'feb', label: 'Feb', value: -15 },
      ]}
    />,
  )
  t.after(cleanup)
  // The axis runs from −15 to 30 in steps of 15: −15, 0, 15, 30.
  deepEqual(
    Array.from($$('.rf-bar-chart-grid > span > span'), (label) => label.textContent),
    ['30', '15', '0', '-15'],
  )
  const zero = $('.rf-bar-chart-grid > span[data-zero]') as HTMLElement
  equal(Number.parseFloat(zero.style.bottom).toFixed(2), '33.33')
  // Jan rises from the zero line to the top; Feb hangs from it to the bottom.
  deepEqual(
    segments($('.rf-bar-chart')!).map((bar) =>
      bar.map(([start, size]) => [Math.round(start!), Math.round(size!)]),
    ),
    [[[33, 67]], [[0, 33]]],
  )
  ok($('[aria-label="Feb, -15"]'))
  equal($('[data-peak]')?.getAttribute('aria-label'), 'Jan, 30')
})

it('groups and stacks series, names each value and shows a legend', (t) => {
  const series = [
    { id: 'builds', label: 'Builds' },
    { id: 'tests', label: 'Tests' },
  ]
  const items = [
    { id: 'mon', label: 'Monday', value: 0, values: [4, -2] },
    { id: 'tue', label: 'Tuesday', value: 0, values: [2, 2] },
  ]
  const grouped = render(<BarChart label="Runs" items={items} series={series} showAxes={false} />)
  t.after(grouped.cleanup)
  ok(grouped.$('[aria-label="Monday: Builds 4, Tests -2"]'))
  deepEqual(
    Array.from(grouped.$$('.rf-bar-chart-legend li'), (entry) => entry.textContent),
    ['Builds', 'Tests'],
  )
  equal(grouped.$('[data-peak]'), null, 'series have no single peak')
  // Scale −2 to 4: zero at a third. Grouped bars start at zero.
  const groupedSegments = segments(grouped.$('.rf-bar-chart')!).map((bar) =>
    bar.map(([start, size]) => [Math.round(start!), Math.round(size!)]),
  )
  deepEqual(groupedSegments, [
    [
      [33, 67],
      [0, 33],
    ],
    [
      [33, 33],
      [33, 33],
    ],
  ])

  const stacked = render(
    <BarChart label="Runs" items={items} series={series} layout="stacked" showAxes={false} />,
  )
  t.after(stacked.cleanup)
  // Stacked: scale −2 to 4 (Tuesday sums to 4). Positive values pile upward.
  const stackedSegments = segments(stacked.$('.rf-bar-chart')!).map((bar) =>
    bar.map(([start, size]) => [Math.round(start!), Math.round(size!)]),
  )
  deepEqual(stackedSegments, [
    [
      [33, 67],
      [0, 33],
    ],
    [
      [33, 33],
      [67, 33],
    ],
  ])
})

it('moves between rows with Up and Down in a horizontal chart', async (t) => {
  const { $, $$, act, cleanup } = render(
    <BarChart label="Run times" items={bars} orientation="horizontal" onSelect={() => {}} />,
  )
  t.after(cleanup)
  equal($('.rf-bar-chart')?.getAttribute('data-orientation'), 'horizontal')
  const columns = Array.from($$('.rf-bar-chart-column')) as HTMLElement[]
  columns[0]!.focus()
  await act(() =>
    columns[0]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    ),
  )
  equal(document.activeElement, columns[1])
  await act(() =>
    columns[1]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    ),
  )
  equal(document.activeElement, columns[1], 'Left and Right do not move between rows')
})
