import { InputCopy } from '@rtzll/reflow'
import { deepEqual, equal } from 'remix/assert'
import { type Handle } from 'remix/component'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('masks secrets until revealed while still copying the real value', async (t) => {
  const secret = 'rf_live_98d4c1f7e2a0b6c39f2c'
  let copiedText = ''
  const revealedChanges: boolean[] = []

  const originalClipboard = navigator.clipboard
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        copiedText = text
      },
    },
  })
  t.after(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    })
  })

  const { $, act, cleanup } = render(
    <InputCopy
      label="API secret"
      value={secret}
      masked
      onRevealChange={(next) => {
        revealedChanges.push(next)
      }}
    />,
  )
  t.after(cleanup)

  const root = $('[data-slot="input-copy"]') as HTMLElement
  const valueEl = $('.rf-copy-value') as HTMLElement
  const copyBtn = $('.rf-copy-row') as HTMLButtonElement
  const revealBtn = $('.rf-copy-reveal') as HTMLButtonElement

  equal(root.dataset.masked, 'true')
  equal(root.dataset.revealed, 'false')
  equal(valueEl.textContent, 'rf_live_••••••••••••9f2c')
  equal(revealBtn.getAttribute('aria-pressed'), 'false')
  equal(revealBtn.getAttribute('aria-label'), 'Reveal API secret')

  // Clicking copy while masked still copies the unmasked secret.
  await act(() => {
    copyBtn.click()
  })
  equal(copiedText, secret)

  // Clicking reveal exposes the secret and flips ARIA state.
  await act(() => {
    revealBtn.click()
  })
  equal(root.dataset.revealed, 'true')
  equal(valueEl.textContent, secret)
  equal(revealBtn.getAttribute('aria-pressed'), 'true')
  equal(revealBtn.getAttribute('aria-label'), 'Hide API secret')
  deepEqual(revealedChanges, [true])

  // Clicking again re-masks it.
  await act(() => {
    revealBtn.click()
  })
  equal(root.dataset.revealed, 'false')
  equal(valueEl.textContent, 'rf_live_••••••••••••9f2c')
  deepEqual(revealedChanges, [true, false])
})

it('supports controlled revealed state and custom maskValue formatter', async (t) => {
  function Controlled(handle: Handle) {
    let open = false
    return () => (
      <InputCopy
        label="Webhook secret"
        value="whsec_test_1234567890"
        masked
        revealed={open}
        maskValue={(v) => `••••${v.slice(-4)}`}
        onRevealChange={(next) => {
          open = next
          handle.update()
        }}
      />
    )
  }

  const { $, act, cleanup } = render(<Controlled />)
  t.after(cleanup)

  const valueEl = $('.rf-copy-value') as HTMLElement
  const revealBtn = $('.rf-copy-reveal') as HTMLButtonElement
  equal(valueEl.textContent, '••••7890')

  await act(() => {
    revealBtn.click()
  })
  equal(valueEl.textContent, 'whsec_test_1234567890')
})
