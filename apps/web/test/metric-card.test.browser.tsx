import { Badge, MetricCard, Sparkline } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('renders MetricCard with value, delta tone, badge, and inline Sparkline', (t) => {
  const { $, cleanup } = render(
    <MetricCard
      label="CPU"
      value="94% peak"
      detail="avg 71%"
      delta="−12% vs p50"
      deltaTone="positive"
      badge={
        <Badge size="compact" color="green">
          HIT
        </Badge>
      }
      sparkline={{ values: [12, 34, 62, 94, 54], max: 100, tone: 'accent' }}
    />,
  )
  t.after(cleanup)

  equal($('.rf-metric-label')?.textContent, 'CPU')
  equal($('.rf-metric-value')?.textContent, '94% peak')
  equal($('.rf-metric-delta')?.getAttribute('data-tone'), 'positive')
  ok($('.rf-sparkline .rf-sparkline-line')?.getAttribute('d')?.startsWith('M '))
})

it('supports interactive keyboard scrubbing on Sparkline', async (t) => {
  let active: number | null = null
  const { $, act, cleanup } = render(
    <Sparkline
      label="Latency samples"
      values={[120, 145, 98, 210]}
      labels={['t1', 't2', 't3', 't4']}
      interactive
      onActiveIndexChange={(idx) => {
        active = idx
      }}
    />,
  )
  t.after(cleanup)

  const slider = $('.rf-sparkline-wrap') as HTMLElement
  await act(() => {
    slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
  })
  equal(active, 2)
  ok($('.rf-sparkline-readout')?.textContent?.includes('t3 · 98'))
  ok($('.rf-sparkline-dot'))

  await act(() => {
    slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
  })
  equal(active, 0)

  await act(() => {
    slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
  })
  equal(active, 3)

  await act(() => {
    slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  equal(active, null)
  equal($('.rf-sparkline-readout'), null)
})

it('handles empty and single-point Sparkline series cleanly', (t) => {
  const empty = render(<Sparkline label="Empty" values={[]} interactive />)
  t.after(empty.cleanup)
  equal(
    empty.$('.rf-sparkline-wrap'),
    null,
    'empty interactive sparkline is not a focusable slider',
  )
  equal(empty.$('.rf-sparkline-line'), null)

  const single = render(<Sparkline label="Single" values={[42]} />)
  t.after(single.cleanup)
  ok(single.$('.rf-sparkline-line')?.getAttribute('d')?.startsWith('M 0 '))
})
