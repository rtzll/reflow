import { reveal, scrollFade } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'
import { waitFor } from './browser-helpers.ts'

it('fades only overflowing edges and removes the fade after content shrinks', async (t) => {
  const { $, cleanup } = render(
    <div
      data-scroll-test
      style={{ width: '120px', height: '120px', overflow: 'auto' }}
      mix={scrollFade({ orientation: 'both' })}
    >
      <div data-content style={{ width: '400px', height: '400px' }}>
        Scrollable content
      </div>
    </div>,
  )
  t.after(cleanup)
  const host = $('[data-scroll-test]') as HTMLDivElement
  const content = $('[data-content]') as HTMLDivElement
  await waitFor(() => host.style.getPropertyValue('--rf-scroll-fade-bottom') === '20px')
  equal(host.style.getPropertyValue('--rf-scroll-fade-top'), '0px')
  equal(host.style.getPropertyValue('--rf-scroll-fade-left'), '0px')
  equal(host.style.getPropertyValue('--rf-scroll-fade-right'), '20px')
  host.scrollTo(1000, 1000)
  await waitFor(() => host.style.getPropertyValue('--rf-scroll-fade-bottom') === '0px')
  equal(host.style.getPropertyValue('--rf-scroll-fade-top'), '20px')
  equal(host.style.getPropertyValue('--rf-scroll-fade-right'), '0px')
  content.style.width = '60px'
  content.style.height = '60px'
  await waitFor(() => host.style.getPropertyValue('--rf-scroll-fade-top') === '0px')
  equal(host.style.getPropertyValue('--rf-scroll-fade-bottom'), '0px')
  equal(host.style.getPropertyValue('--rf-scroll-fade-left'), '0px')
})

it('applies the preset stagger through WAAPI and cancels reveal on removal', async () => {
  const { $, cleanup } = render(
    <div data-reveal-test mix={reveal({ preset: 'product', index: 2 })}>
      Revealed content
    </div>,
  )
  const element = $('[data-reveal-test]') as HTMLElement
  element.scrollIntoView()
  await waitFor(() => element.getAnimations().length > 0)
  const animation = element.getAnimations()[0]
  // 60ms, then a gap a quarter shorter.
  equal(animation.effect?.getTiming().delay, 105)
  equal((animation.effect as KeyframeEffect).getKeyframes()[0].opacity, '0')
  cleanup()
  equal(animation.playState, 'idle')
})

it('settles a long stagger instead of queueing every row', async (t) => {
  const { $, cleanup } = render(
    <div data-reveal-late mix={reveal({ preset: 'product', index: 20 })}>
      Row 21
    </div>,
  )
  t.after(cleanup)
  const element = $('[data-reveal-late]') as HTMLElement
  element.scrollIntoView()
  await waitFor(() => element.getAnimations().length > 0)
  const delay = Number(element.getAnimations()[0]!.effect?.getTiming().delay)
  ok(delay > 200 && delay <= 240, `row 21 waits ${delay}ms`)
})

it('tracks the physically overflowing edges in a right-to-left scroll viewport', async (t) => {
  const { $, cleanup } = render(
    <div
      data-rtl-scroll-test
      dir="rtl"
      style={{ width: '120px', height: '120px', overflow: 'auto' }}
      mix={scrollFade({ orientation: 'horizontal' })}
    >
      <div style={{ width: '400px', height: '80px' }}>Scrollable content</div>
    </div>,
  )
  t.after(cleanup)
  const host = $('[data-rtl-scroll-test]') as HTMLDivElement
  await waitFor(() => host.style.getPropertyValue('--rf-scroll-fade-left') === '20px')
  equal(host.style.getPropertyValue('--rf-scroll-fade-right'), '0px')
  host.scrollLeft = -1000
  await waitFor(() => host.style.getPropertyValue('--rf-scroll-fade-left') === '0px')
  equal(host.style.getPropertyValue('--rf-scroll-fade-right'), '20px')
})
