import { LineChart } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('renders multi-series curves, area fills, legend, and supports keyboard crosshair scrubbing', async (t) => {
  let active: number | null = null
  const { $, $$, act, cleanup } = render(
    <LineChart
      label="Build duration trend"
      labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
      series={[
        { id: 'p95', label: 'p95', values: [240, 228, 255, 215, 204], area: true },
        { id: 'p50', label: 'p50', values: [180, 175, 190, 168, 162], dashed: true },
      ]}
      formatValue={(v) => `${v}s`}
      onActiveIndexChange={(idx) => {
        active = idx
      }}
    />,
  )
  t.after(cleanup)

  equal($$('.rf-line-chart-line').length, 2)
  equal($$('.rf-line-chart-area').length, 1)
  equal($$('.rf-line-chart-legend-item').length, 2)

  const stage = $('.rf-line-chart-stage') as HTMLElement
  await act(() => {
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
  })
  equal(active, 3)
  equal($('.rf-line-chart-readout')?.textContent, 'Thu')
  equal($$('.rf-line-chart-dot').length, 2)
  ok($('.rf-line-chart-crosshair'))

  await act(() => {
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
  })
  equal(active, 0)
  equal($('.rf-line-chart-readout')?.textContent, 'Mon')

  await act(() => {
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
  })
  equal(active, 4)
  equal($('.rf-line-chart-readout')?.textContent, 'Fri')

  await act(() => {
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  equal(active, null)
  equal($('.rf-line-chart-crosshair'), null)
})

it('respects showGrid=false, showLegend=false, and handles empty series cleanly', (t) => {
  const { $, $$, cleanup } = render(
    <LineChart label="Empty trend" labels={[]} series={[]} showGrid={false} showLegend={false} />,
  )
  t.after(cleanup)

  equal($('.rf-line-chart-yaxis'), null)
  equal($('.rf-line-chart-legend'), null)
  equal($$('.rf-line-chart-line').length, 0)
})
