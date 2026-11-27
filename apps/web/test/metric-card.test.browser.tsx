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

it('maps pointer scrubbing 1:1 to the Sparkline SVG without shifting layout width', async (t) => {
  let active: number | null = null
  const { $, act, cleanup } = render(
    <Sparkline
      label="Runner CPU"
      values={[10, 20, 30, 40, 50]}
      labels={['12:00', '12:05', '12:10', '12:15', '12:20']}
      width={160}
      height={32}
      interactive
      onActiveIndexChange={(idx) => {
        active = idx
      }}
    />,
  )
  t.after(cleanup)

  const wrap = $('.rf-sparkline-wrap') as HTMLElement
  const svg = $('.rf-sparkline')!
  const widthBefore = wrap.getBoundingClientRect().width
  const rect = svg.getBoundingClientRect()

  await act(() => {
    wrap.dispatchEvent(
      new PointerEvent('pointermove', { clientX: rect.left, clientY: rect.top + 8, bubbles: true }),
    )
  })
  equal(active, 0)
  ok($('.rf-sparkline-readout'))
  equal(
    wrap.getBoundingClientRect().width,
    widthBefore,
    'floating readout must not change wrapper width on hover',
  )

  await act(() => {
    wrap.dispatchEvent(
      new PointerEvent('pointermove', {
        clientX: rect.left + rect.width * 0.5,
        clientY: rect.top + 8,
        bubbles: true,
      }),
    )
  })
  equal(active, 2)

  await act(() => {
    wrap.dispatchEvent(
      new PointerEvent('pointermove', {
        clientX: rect.right,
        clientY: rect.top + 8,
        bubbles: true,
      }),
    )
  })
  equal(active, 4)

  await act(() => {
    wrap.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
  })
  equal(active, null)
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
