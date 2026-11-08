import { reveal, scrollFade } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

async function waitFor(check: () => boolean) {
  for (let index = 0; index < 60; index++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'The system interaction did not settle')
}

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
  equal(animation.effect?.getTiming().delay, 120)
  cleanup()
  equal(animation.playState, 'idle')
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
