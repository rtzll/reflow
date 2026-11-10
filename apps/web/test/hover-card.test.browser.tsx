import { HoverCard } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { type Handle } from 'remix/component'
import { describe, it } from 'remix/test'

async function waitFor(check: () => boolean, frames = 60) {
  for (let i = 0; i < frames; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected hover card state did not settle')
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function point(node: Element, type: 'pointerenter' | 'pointerleave', pointerType = 'mouse') {
  node.dispatchEvent(new PointerEvent(type, { pointerType }))
}

function profile(props: {
  openDelay?: number
  closeDelay?: number
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <HoverCard
      {...props}
      renderTrigger={(trigger) => (
        <a href="#profile" {...trigger}>
          @reflow
        </a>
      )}
    >
      <p>Fluid components for Remix.</p>
      <a href="#follow">Follow</a>
    </HoverCard>
  )
}

describe('HoverCard', () => {
  it('opens after the pointer rests on its trigger and stays open over the card', async (t) => {
    const changes: boolean[] = []
    const { $, cleanup } = render(
      profile({ openDelay: 40, closeDelay: 40, onOpenChange: (open) => changes.push(open) }),
    )
    t.after(cleanup)
    const trigger = $('a[href="#profile"]') as HTMLAnchorElement
    const card = $('.rf-hover-card') as HTMLElement

    point(trigger, 'pointerenter')
    ok(!card.matches(':popover-open'), 'waits for the open delay')
    await waitFor(() => card.matches(':popover-open'))
    equal(card.getAttribute('data-anchor-placement'), 'bottom')

    // Crossing from the trigger into the card keeps it open.
    point(trigger, 'pointerleave')
    point(card, 'pointerenter')
    await pause(80)
    ok(card.matches(':popover-open'))

    point(card, 'pointerleave')
    await waitFor(() => !card.matches(':popover-open'))
    equal(changes.join(), 'true,false')
  })

  it('opens on keyboard focus, closes on Escape, and ignores touch', async (t) => {
    const { $, cleanup } = render(profile({ openDelay: 0, closeDelay: 0 }))
    t.after(cleanup)
    const trigger = $('a[href="#profile"]') as HTMLAnchorElement
    const card = $('.rf-hover-card') as HTMLElement

    point(trigger, 'pointerenter', 'touch')
    await pause(40)
    ok(!card.matches(':popover-open'), 'a tap follows the link instead')

    trigger.focus()
    await waitFor(() => card.matches(':popover-open'))
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await waitFor(() => !card.matches(':popover-open'))
    equal(document.activeElement, trigger)
  })

  it('closes when the page scrolls, but not when its own content does', async (t) => {
    const { $, cleanup } = render(profile({ openDelay: 0, closeDelay: 0 }))
    t.after(cleanup)
    const trigger = $('a[href="#profile"]') as HTMLAnchorElement
    const card = $('.rf-hover-card') as HTMLElement
    trigger.focus()
    await waitFor(() => card.matches(':popover-open'))
    card.dispatchEvent(new Event('scroll'))
    await pause(40)
    ok(card.matches(':popover-open'), 'scrolling inside the card keeps it')
    // A scroller elsewhere on the page, such as an autoplaying carousel, leaves it be.
    const elsewhere = document.createElement('div')
    document.body.append(elsewhere)
    t.after(() => elsewhere.remove())
    elsewhere.dispatchEvent(new Event('scroll'))
    await pause(40)
    ok(card.matches(':popover-open'), 'an unrelated scroller keeps it')
    document.dispatchEvent(new Event('scroll'))
    await waitFor(() => !card.matches(':popover-open'))
  })

  it('follows a controlled open state', async (t) => {
    let open = true
    let view: Handle | undefined
    function Controlled(handle: Handle) {
      view = handle
      return () => (
        <HoverCard
          open={open}
          onOpenChange={(next) => {
            open = next
            void handle.update()
          }}
          renderTrigger={(trigger) => (
            <a href="#profile" {...trigger}>
              @reflow
            </a>
          )}
        >
          <p>Card</p>
        </HoverCard>
      )
    }
    const { $, cleanup } = render(<Controlled />)
    t.after(cleanup)
    const card = $('.rf-hover-card') as HTMLElement
    await waitFor(() => card.matches(':popover-open'))
    open = false
    await view!.update()
    await waitFor(() => !card.matches(':popover-open'))
  })
})
