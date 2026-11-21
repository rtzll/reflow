import { Button, ChatLayout, ChatMessage, Icon, InputMessage } from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import type { Conversation } from './fixtures.ts'

interface Thread extends Conversation {
  draft: string
}

interface ChatProps {
  conversations: Conversation[]
  initialId: string
}

export const ChatWorkspace = clientEntry(
  import.meta.url,
  function ChatWorkspace(handle: Handle<ChatProps>) {
    const threads: Thread[] = handle.props.conversations.map((thread) => ({
      ...thread,
      messages: [...thread.messages],
      draft: '',
    }))
    let activeId = handle.props.initialId
    // Keep each opened composer mounted so its queue and editing state follow the thread.
    const opened = new Set([activeId])
    let sequence = 0
    let root: HTMLElement | undefined

    function select(id: string) {
      activeId = id
      opened.add(id)
      void handle.update()
    }

    function create() {
      const id = `conversation-${++sequence}`
      threads.unshift({ id, title: 'Untitled conversation', messages: [], draft: '' })
      select(id)
      handle.queueTask(() =>
        root?.querySelector<HTMLTextAreaElement>('.studio-pane:not([hidden]) textarea')?.focus(),
      )
    }

    return () => (
      <div
        class="studio-chat"
        mix={ref((node) => {
          root = node as HTMLElement
        })}
      >
        <aside class="studio-library" aria-label="Conversation library">
          <header class="studio-library-header">
            <span class="studio-mark">
              <Icon name="book" size={20} />
            </span>
            <h1>Studio chat</h1>
          </header>
          <Button
            class="studio-new"
            variant="secondary"
            leadingIcon={<Icon name="plus" />}
            mix={on('click', create)}
          >
            New conversation
          </Button>
          <div class="studio-list">
            <h2>Conversations</h2>
            <ul>
              {threads.map((thread) => (
                <li key={thread.id}>
                  <button
                    type="button"
                    class="studio-thread"
                    aria-label={thread.title}
                    aria-current={activeId === thread.id ? 'true' : undefined}
                    mix={on('click', () => select(thread.id))}
                  >
                    <Icon name="message-circle" size={15} />
                    <span class="studio-thread-summary">
                      <strong>{thread.title}</strong>
                      <span>
                        {thread.draft
                          ? `Draft · ${thread.draft}`
                          : thread.messages.at(-1)?.text || 'No messages yet'}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <select
            class="studio-picker"
            aria-label="Conversation"
            mix={on<HTMLSelectElement, 'change'>('change', (event) =>
              select(event.currentTarget.value),
            )}
          >
            {threads.map((thread) => (
              <option key={thread.id} value={thread.id} selected={activeId === thread.id}>
                {thread.title}
                {thread.draft ? ' · Draft' : ''}
              </option>
            ))}
          </select>
        </aside>
        {threads
          .filter((thread) => opened.has(thread.id))
          .map((thread) => (
            <section
              key={thread.id}
              class="studio-pane"
              hidden={activeId !== thread.id}
              aria-label={thread.title}
            >
              <ConversationPane thread={thread} onChange={() => void handle.update()} />
            </section>
          ))}
      </div>
    )
  },
)

function ConversationPane(handle: Handle<{ thread: Thread; onChange: () => void }>) {
  const { thread } = handle.props

  function send(text: string) {
    if (!thread.messages.length) thread.title = text.length > 48 ? text.slice(0, 47) + '…' : text
    thread.messages.push({ role: 'user', text })
    handle.props.onChange()
  }

  return () => (
    <ChatLayout
      label={thread.title}
      header={
        <header class="studio-heading">
          <h2>{thread.title}</h2>
          <p>Simulated conversation with Studio assistant</p>
        </header>
      }
      empty={
        <div class="studio-empty">
          <Icon name="pencil" size={24} />
          <h3>What are you working on?</h3>
          <p>Send a message to start this conversation.</p>
        </div>
      }
      composer={
        <InputMessage
          attachments={false}
          placeholder="Message Studio assistant…"
          defaultValue={thread.draft}
          onValueChange={(draft) => {
            thread.draft = draft
            handle.props.onChange()
          }}
          onSend={({ text }) => send(text)}
        />
      }
    >
      {thread.messages.map((message, index) => (
        <ChatMessage key={index} role={message.role} animate={false}>
          {message.role === 'assistant' && <strong class="studio-author">Studio assistant</strong>}
          {message.text}
        </ChatMessage>
      ))}
    </ChatLayout>
  )
}
