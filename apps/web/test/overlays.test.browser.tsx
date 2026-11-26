import { Button, Dialog, Tooltip } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'
import { waitFor } from './browser-helpers.ts'

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
  it('skips the delay and motion for a neighbouring tooltip once one has shown', async (t) => {
    const { $$, act, cleanup } = render(
      <>
        <Tooltip content="Bold" renderTrigger={(props) => <Button {...props}>B</Button>} />
        <Tooltip content="Italic" renderTrigger={(props) => <Button {...props}>I</Button>} />
      </>,
    )
    t.after(cleanup)

    const [first, second] = $$('button')
    const [bold, italic] = $$('[role="tooltip"]')
    ok(first instanceof HTMLButtonElement && second instanceof HTMLButtonElement)
    ok(bold instanceof HTMLElement && italic instanceof HTMLElement)
    // Outlast the warmth an earlier test's tooltip may have left behind.
    await new Promise((resolve) => setTimeout(resolve, 350))
    const pointer = (type: string) => new PointerEvent(type, { pointerType: 'mouse' })

    await act(() => first.dispatchEvent(pointer('pointerenter')))
    equal(bold.matches(':popover-open'), false, 'the first tooltip waits out its delay')
    await waitFor(() => bold.matches(':popover-open'))
    equal(bold.hasAttribute('data-instant'), false)

    await act(() => {
      first.dispatchEvent(pointer('pointerleave'))
      second.dispatchEvent(pointer('pointerenter'))
    })
    await waitFor(() => italic.matches(':popover-open'))
    equal(italic.hasAttribute('data-instant'), true)
    equal(bold.matches(':popover-open'), false, 'the first leaves rather than overlap')
    equal(getComputedStyle(italic).transitionDuration, '0s')
  })

  it('lets a modal handle Escape while an outside tooltip is leaving, and dismisses a tooltip inside it', async (t) => {
    const { $, act, cleanup } = render(
      <>
        <Tooltip
          content="Outside"
          renderTrigger={(props) => (
            <button type="button" id="outside" {...props}>
              Inspect
            </button>
          )}
        />
        <dialog>
          <input aria-label="Name" />
          <Tooltip
            content="Inside"
            renderTrigger={(props) => (
              <button type="button" id="inside" {...props}>
                Help
              </button>
            )}
          />
        </dialog>
      </>,
    )
    t.after(cleanup)
    const dialog = $('dialog') as HTMLDialogElement
    const tip = (name: string) =>
      document.getElementById($(name)!.getAttribute('aria-describedby')!)!
    const escape = () =>
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    await act(() => $('#outside')!.focus())
    await waitFor(() => tip('#outside').matches(':popover-open'))
    dialog.showModal()
    ok(tip('#outside').matches(':popover-open'))
    equal($('input')!.dispatchEvent(escape()), true)
    await act(() => $('#inside')!.focus())
    await waitFor(() => tip('#inside').matches(':popover-open'))
    equal($('#inside')!.dispatchEvent(escape()), false)
    await waitFor(() => !tip('#inside').matches(':popover-open'))
    ok(dialog.matches(':modal'))
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
