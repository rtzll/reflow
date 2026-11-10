import { ChatMessage } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

describe('ChatMessage system role', () => {
  it('renders an event as a quiet line with its icon, time and actions', async (t) => {
    const { $, cleanup } = render(
      <ChatMessage
        role="system"
        icon={<svg class="model-icon" />}
        time="14:02"
        actions={<button type="button">Undo</button>}
        attachments={[{ name: 'ignored.png' }]}
      >
        Model switched to Opus
      </ChatMessage>,
    )
    t.after(cleanup)
    const message = $('article.rf-chat-message') as HTMLElement
    equal(message.dataset.role, 'system')
    equal(message.getAttribute('aria-label'), 'System')
    const line = message.querySelector('.rf-chat-system') as HTMLElement
    ok(line, 'the event sits on one line')
    equal(line.querySelector('.rf-chat-system-icon')?.getAttribute('aria-hidden'), 'true')
    ok(line.querySelector('.rf-chat-system-icon .model-icon'))
    equal(line.querySelector('.rf-chat-system-text')?.textContent, 'Model switched to Opus')
    equal(line.querySelector('.rf-chat-time')?.textContent, '14:02')
    ok(line.querySelector('.rf-chat-actions button'))
    // A system line has no bubble, no attachments and no hover row.
    ok(!message.querySelector('.rf-chat-body'))
    ok(!message.querySelector('.rf-chat-attachments'))
    ok(!message.querySelector('.rf-chat-meta'))
  })

  it('takes a label and works with text alone', async (t) => {
    const { $, cleanup } = render(
      <ChatMessage role="system" label="Conversation event">
        Conversation resumed
      </ChatMessage>,
    )
    t.after(cleanup)
    const message = $('article.rf-chat-message') as HTMLElement
    equal(message.getAttribute('aria-label'), 'Conversation event')
    ok(!message.querySelector('.rf-chat-system-icon'))
    ok(!message.querySelector('.rf-chat-time'))
    equal(message.textContent, 'Conversation resumed')
  })
})
