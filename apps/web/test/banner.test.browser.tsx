import { Banner } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

async function waitFor(check: () => boolean) {
  for (let i = 0; i < 60; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected state did not settle')
}

// As in the reference: a banner that closes while holding keyboard focus
// hands it on instead of dropping it on the document body.
describe('Banner dismissal', () => {
  it('moves keyboard focus to the next focusable element', async (t) => {
    const { $, act, cleanup } = render(
      <div>
        <button type="button">Before</button>
        <Banner dismissible>Saved</Banner>
        <button type="button">After</button>
      </div>,
    )
    t.after(cleanup)
    const dismiss = $('button[aria-label="Dismiss"]')
    ok(dismiss instanceof HTMLButtonElement)
    dismiss.focus()
    await act(() => dismiss.click())
    await waitFor(() => document.activeElement?.textContent === 'After')
  })

  it('falls back to the previous focusable element when nothing follows', async (t) => {
    const { $, act, cleanup } = render(
      <div>
        <button type="button">Before</button>
        <Banner dismissible>Saved</Banner>
      </div>,
    )
    t.after(cleanup)
    const dismiss = $('button[aria-label="Dismiss"]')
    ok(dismiss instanceof HTMLButtonElement)
    dismiss.focus()
    await act(() => dismiss.click())
    await waitFor(() => document.activeElement?.textContent === 'Before')
  })

  it('leaves focus alone when the dismiss button did not hold it', async (t) => {
    const outside = document.createElement('input')
    document.body.append(outside)
    t.after(() => outside.remove())
    const { $, act, cleanup } = render(
      <div>
        <Banner dismissible>Saved</Banner>
        <button type="button">After</button>
      </div>,
    )
    t.after(cleanup)
    outside.focus()
    const dismiss = $('button[aria-label="Dismiss"]')
    ok(dismiss instanceof HTMLButtonElement)
    await act(() => dismiss.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await new Promise((resolve) => setTimeout(resolve, 50))
    equal(document.activeElement, outside)
  })
})
