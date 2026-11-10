import { QueuedStack, type QueuedMessage } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { type Handle } from 'remix/component'
import { describe, it } from 'remix/test'

async function waitFor(check: () => boolean, frames = 60) {
  for (let i = 0; i < frames; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected focus did not settle')
}

function Queue(handle: Handle) {
  let messages: QueuedMessage[] = [
    { id: 'a', content: 'First' },
    { id: 'b', content: 'Second' },
    { id: 'c', content: 'Third' },
  ]
  return () => (
    <QueuedStack
      messages={messages}
      onOrderChange={(ids) => {
        messages = ids.map((id) => messages.find((message) => message.id === id)!)
        void handle.update()
      }}
      onRemove={(id) => {
        messages = messages.filter((message) => message.id !== id)
        void handle.update()
      }}
      onSend={async (id) => {
        messages = messages.filter((message) => message.id !== id)
        await handle.update()
      }}
    />
  )
}

const rowOf = (element: Element | null) =>
  element?.closest('li')?.querySelector('.rf-queue-content')?.textContent

describe('QueuedStack focus', () => {
  it('keeps focus on the same action for the message that takes a sent one’s place', async (t) => {
    const { $$, cleanup } = render(<Queue />)
    t.after(cleanup)
    const send = Array.from($$('button')).find((button) => button.textContent === 'Send')!
    send.focus()
    send.click()
    await waitFor(() => rowOf(document.activeElement) === 'Second')
    equal(document.activeElement?.textContent, 'Send')
  })

  it('moves focus to the previous message when the last one is removed', async (t) => {
    const { $, cleanup } = render(<Queue />)
    t.after(cleanup)
    const remove = $('button[aria-label="Remove message 3"]') as HTMLButtonElement
    remove.focus()
    remove.click()
    await waitFor(() => rowOf(document.activeElement) === 'Second')
    equal(document.activeElement?.getAttribute('aria-label'), 'Remove message 2')
  })

  it('follows a moved message, switching arrows when one runs out', async (t) => {
    const { $, cleanup } = render(<Queue />)
    t.after(cleanup)
    const down = $('button[aria-label="Move message 1 down"]') as HTMLButtonElement
    down.focus()
    down.click()
    await waitFor(() => rowOf(document.activeElement) === 'First')
    equal(document.activeElement?.getAttribute('aria-label'), 'Move message 2 down')
    ;(document.activeElement as HTMLButtonElement).click()
    // At the bottom, down is disabled, so focus takes the up arrow.
    await waitFor(() => document.activeElement?.getAttribute('aria-label') === 'Move message 3 up')
    equal(rowOf(document.activeElement), 'First')
  })
})
