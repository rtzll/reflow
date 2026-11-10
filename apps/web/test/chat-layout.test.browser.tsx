import { ChatLayout, ChatMessage } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

describe('ChatLayout', () => {
  it('holds a header, a labelled log of messages, and the composer below it', async (t) => {
    const { $, cleanup } = render(
      <ChatLayout
        label="Design chat"
        header={<h2 class="title">Design chat</h2>}
        composer={<textarea aria-label="Message" />}
      >
        <ChatMessage role="user" animate={false}>
          Hello
        </ChatMessage>
        <ChatMessage role="assistant" animate={false}>
          Hi
        </ChatMessage>
      </ChatLayout>,
    )
    t.after(cleanup)
    const root = $('.rf-chat-layout') as HTMLElement
    const header = root.querySelector('.rf-chat-layout-header') as HTMLElement
    const log = root.querySelector('[role="log"]') as HTMLElement
    const composer = root.querySelector('.rf-chat-layout-composer') as HTMLElement
    ok(header.querySelector('h2.title'))
    equal(log.getAttribute('aria-label'), 'Design chat')
    equal(log.querySelectorAll('.rf-chat-message').length, 2)
    ok(composer.querySelector('textarea'))
    // Header, log, then composer, in reading order.
    ok(header.compareDocumentPosition(log) & Node.DOCUMENT_POSITION_FOLLOWING)
    ok(log.compareDocumentPosition(composer) & Node.DOCUMENT_POSITION_FOLLOWING)
    ok(!root.querySelector('.rf-chat-layout-empty'))
    const jump = root.querySelector('button.rf-chat-jump') as HTMLButtonElement
    ok(jump.hidden, 'at the newest message, there is nothing to jump to')
    equal(jump.textContent, 'Jump to latest')
  })

  it('shows its empty state until the first message', async (t) => {
    const { $, cleanup } = render(
      <ChatLayout empty={<p class="start">Ask anything</p>} composer={<textarea />}>
        {[]}
      </ChatLayout>,
    )
    t.after(cleanup)
    const root = $('.rf-chat-layout') as HTMLElement
    ok(root.querySelector('.rf-chat-layout-empty .start'))
    equal(root.querySelector('[role="log"]')?.getAttribute('aria-label'), 'Conversation')
    ok(root.hasAttribute('data-empty'))
  })
})
