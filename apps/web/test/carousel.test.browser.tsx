import { Carousel } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

async function waitFor(check: () => boolean, frames = 60) {
  for (let i = 0; i < frames; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected carousel state did not settle')
}

const slides = ['Inbox', 'Drafts', 'Sent']

describe('Carousel', () => {
  it('is a labelled carousel of slides, each named by its place', async (t) => {
    const { $, $$, cleanup } = render(
      <Carousel label="Mailboxes">
        {slides.map((name) => (
          <p key={name}>{name}</p>
        ))}
      </Carousel>,
    )
    t.after(cleanup)
    const root = $('section.rf-carousel') as HTMLElement
    equal(root.getAttribute('aria-roledescription'), 'carousel')
    equal(root.getAttribute('aria-label'), 'Mailboxes')
    const items = Array.from($$('.rf-carousel-slide')) as HTMLElement[]
    equal(items.length, 3)
    equal(items[1]!.getAttribute('role'), 'group')
    equal(items[1]!.getAttribute('aria-roledescription'), 'slide')
    equal(items[1]!.getAttribute('aria-label'), '2 of 3')
    const viewport = $('.rf-carousel-viewport') as HTMLElement
    equal(viewport.tabIndex, 0)
    equal(viewport.getAttribute('aria-live'), 'polite')
    // Dots between previous and next.
    equal($$('.rf-carousel-dots button').length, 3)
    const previous = $('button[aria-label="Previous slide"]') as HTMLButtonElement
    const next = $('button[aria-label="Next slide"]') as HTMLButtonElement
    ok(previous.disabled, 'nothing before the first slide')
    ok(!next.disabled)
  })

  it('names slides by their labels and moves with the buttons and dots', async (t) => {
    const changes: number[] = []
    const { $, $$, cleanup } = render(
      <Carousel
        label="Mailboxes"
        slideLabels={slides}
        onIndexChange={(index) => changes.push(index)}
      >
        {slides.map((name) => (
          <p key={name}>{name}</p>
        ))}
      </Carousel>,
    )
    t.after(cleanup)
    equal($$('.rf-carousel-slide')[2]!.getAttribute('aria-label'), 'Sent, 3 of 3')
    equal($$('.rf-carousel-dots button')[2]!.getAttribute('aria-label'), 'Show Sent')
    ;($('button[aria-label="Next slide"]') as HTMLButtonElement).click()
    await waitFor(() => changes.length === 1)
    equal(changes[0], 1)
    ;($$('.rf-carousel-dots button')[2] as HTMLButtonElement).click()
    await waitFor(() => changes.length === 2)
    equal(changes[1], 2)
    await waitFor(() => ($('button[aria-label="Next slide"]') as HTMLButtonElement).disabled)
    equal($$('.rf-carousel-dots button')[2]!.getAttribute('aria-current'), 'true')
  })

  it('hides its controls on request and follows a controlled index', async (t) => {
    const { $, cleanup } = render(
      <Carousel label="Photos" controls={false} dots={false} index={1}>
        <p>One</p>
        <p>Two</p>
      </Carousel>,
    )
    t.after(cleanup)
    ok(!$('.rf-carousel-dots'))
    ok(!$('button[aria-label="Next slide"]'))
    ok($('.rf-carousel-slide[data-current]')?.textContent?.includes('Two'))
  })

  it('autoplays through its dots, with a button that stops it', async (t) => {
    const { $, cleanup } = render(
      <Carousel label="Highlights" autoplay={{ duration: 4000 }}>
        <p>One</p>
        <p>Two</p>
      </Carousel>,
    )
    t.after(cleanup)
    const dots = $('.rf-carousel-dots') as HTMLElement
    ok(dots.hasAttribute('data-rf-autoplay'))
    ok(!dots.hasAttribute('data-rf-paused'))
    equal($('.rf-carousel-viewport')?.getAttribute('aria-live'), 'off')
    const toggle = $('button.rf-carousel-play') as HTMLButtonElement
    equal(toggle.getAttribute('aria-label'), 'Pause slides')
    toggle.click()
    await waitFor(() => dots.hasAttribute('data-rf-paused'))
    equal(toggle.getAttribute('aria-label'), 'Play slides')
    equal($('.rf-carousel-viewport')?.getAttribute('aria-live'), 'polite')
  })
})
