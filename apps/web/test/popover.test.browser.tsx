import { Input, Popover } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { on, type Handle } from 'remix/component'
import { describe, it } from 'remix/test'

async function waitFor(check: () => boolean) {
  for (let i = 0; i < 60; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected popover state did not settle')
}

function press(node: Element, key: string) {
  node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

describe('Popover', () => {
  it('opens a named panel from its trigger, moves focus in and returns it on Escape', async (t) => {
    const changes: boolean[] = []
    const { $, act, cleanup } = render(
      <Popover label="Dimensions" trigger="Dimensions" onOpenChange={(open) => changes.push(open)}>
        <Input aria-label="Width" defaultValue="100%" />
      </Popover>,
    )
    t.after(cleanup)
    const trigger = $('button') as HTMLButtonElement
    const panel = $('[role="dialog"]') as HTMLElement
    equal(panel.getAttribute('aria-label'), 'Dimensions')
    equal(trigger.getAttribute('aria-haspopup'), 'dialog')
    equal(trigger.getAttribute('aria-controls'), panel.id)
    equal(trigger.getAttribute('aria-expanded'), 'false')

    await act(() => trigger.click())
    await waitFor(() => panel.matches(':popover-open'))
    equal(trigger.getAttribute('aria-expanded'), 'true')
    // Focus moves to the first control in the panel.
    await waitFor(() => document.activeElement === panel.querySelector('input'))

    await act(() => press(document.activeElement!, 'Escape'))
    await waitFor(() => !panel.matches(':popover-open'))
    await waitFor(() => document.activeElement === trigger)
    equal(changes.join(), 'true,false')
  })

  it('closes on an outside click', async (t) => {
    const { $, act, cleanup } = render(
      <div>
        <button type="button" id="outside">
          Outside
        </button>
        <Popover label="Details" trigger="Details">
          <p>Some details.</p>
        </Popover>
      </div>,
    )
    t.after(cleanup)
    const trigger = $('button[aria-haspopup]') as HTMLButtonElement
    const panel = $('[role="dialog"]') as HTMLElement
    await act(() => trigger.click())
    await waitFor(() => panel.matches(':popover-open'))
    // Without a focusable child, the panel itself takes focus.
    await waitFor(() => document.activeElement === panel)
    const outside = $('#outside') as HTMLButtonElement
    await act(() => {
      outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      outside.click()
    })
    await waitFor(() => !panel.matches(':popover-open'))
  })

  it('follows a controlled open state and accepts a custom trigger', async (t) => {
    let open = false
    function Controlled(handle: Handle) {
      return () => (
        <Popover
          title="Share"
          description="Anyone with the link can view."
          open={open}
          onOpenChange={(next) => {
            open = next
            void handle.update()
          }}
          renderTrigger={(trigger) => (
            <a href="#share" {...trigger}>
              Share
            </a>
          )}
        >
          <button
            type="button"
            mix={on('click', () => {
              open = false
              void handle.update()
            })}
          >
            Done
          </button>
        </Popover>
      )
    }
    const { $, act, cleanup } = render(<Controlled />)
    t.after(cleanup)
    const trigger = $('a[aria-haspopup]') as HTMLAnchorElement
    const panel = $('[role="dialog"]') as HTMLElement
    // A visible title names the panel.
    const title = panel.querySelector(`#${panel.getAttribute('aria-labelledby')}`)
    equal(title?.textContent, 'Share')
    equal(
      panel.querySelector(`#${panel.getAttribute('aria-describedby')}`)?.textContent,
      'Anyone with the link can view.',
    )

    await act(() => trigger.click())
    await waitFor(() => panel.matches(':popover-open'))
    ok(open)
    await act(() => (panel.querySelector('button') as HTMLButtonElement).click())
    await waitFor(() => !panel.matches(':popover-open'))
    ok(!open)
  })
})

it('focuses the panel rather than a button when it has no field', async (t) => {
  const { $, act, cleanup } = render(
    <Popover label="Actions" trigger="Actions">
      <button type="button">Archive</button>
    </Popover>,
  )
  t.after(cleanup)
  const panel = $('[role="dialog"]') as HTMLElement
  await act(() => ($('button[aria-haspopup]') as HTMLButtonElement).click())
  await waitFor(() => panel.matches(':popover-open'))
  await waitFor(() => document.activeElement === panel)
})
