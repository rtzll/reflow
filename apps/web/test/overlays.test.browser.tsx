import { Button, Dialog, Tooltip } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

async function waitFor(check: () => boolean) {
  for (let i = 0; i < 60; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected overlay state did not settle')
}

describe('Reflow overlays', () => {
  it('names the modal and restores focus after a native cancel event', async (t) => {
    const { $, act, cleanup } = render(
      <Dialog trigger="Edit profile" title="Your profile" description="Update the display name.">
        <label>
          Display name <input />
        </label>
      </Dialog>,
    )
    t.after(cleanup)

    const trigger = $('button[aria-haspopup="dialog"]')
    const dialog = $('dialog')
    ok(trigger instanceof HTMLButtonElement)
    ok(dialog instanceof HTMLDialogElement)

    trigger.focus()
    await act(() => trigger.click())
    await waitFor(() => dialog.matches(':modal'))
    equal(dialog.querySelector('h2')?.id, dialog.getAttribute('aria-labelledby'))
    equal(dialog.querySelector('header p')?.id, dialog.getAttribute('aria-describedby'))
    equal(document.activeElement, dialog.querySelector('input'))

    await act(() => {
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }))
    })
    await waitFor(() => !dialog.open && document.activeElement === trigger)
    equal(trigger.getAttribute('aria-expanded'), 'false')
  })

  it('reveals the tooltip on focus and dismisses it without moving focus', async (t) => {
    const { $, act, cleanup } = render(
      <Tooltip
        content="Your last update"
        renderTrigger={(props) => <Button {...props}>Details</Button>}
      />,
    )
    t.after(cleanup)

    const trigger = $('button')
    const tooltip = $('[role="tooltip"]')
    ok(trigger instanceof HTMLButtonElement)
    ok(tooltip instanceof HTMLElement)
    equal(trigger.getAttribute('aria-describedby'), tooltip.id)
    equal(tooltip.matches(':popover-open'), false)

    await act(() => trigger.focus())
    await waitFor(() => tooltip.matches(':popover-open'))
    ok(['top', 'bottom'].includes(tooltip.getAttribute('data-anchor-placement') ?? ''))

    await act(() => {
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    await waitFor(() => !tooltip.matches(':popover-open'))
    equal(document.activeElement, trigger)
  })
  it('follows the pointer along the configured axis', async (t) => {
    const { $, act, cleanup } = render(
      <Tooltip
        content="Following x"
        followCursor="x"
        delayDuration={0}
        renderTrigger={(props) => <Button {...props}>Move</Button>}
      />,
    )
    t.after(cleanup)
    const trigger = $('button')
    const tooltip = $('[role="tooltip"]')
    ok(trigger instanceof HTMLButtonElement)
    ok(tooltip instanceof HTMLElement)
    const rect = trigger.getBoundingClientRect()
    await act(() =>
      trigger.dispatchEvent(
        new PointerEvent('pointerenter', {
          pointerType: 'mouse',
          clientX: rect.left + 10,
          clientY: rect.top + 10,
        }),
      ),
    )
    await waitFor(() => tooltip.matches(':popover-open'))
    const top = tooltip.style.top
    await act(() =>
      trigger.dispatchEvent(
        new PointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: rect.left + 30,
          clientY: rect.top + 20,
        }),
      ),
    )
    equal(tooltip.style.top, top)
  })
})
