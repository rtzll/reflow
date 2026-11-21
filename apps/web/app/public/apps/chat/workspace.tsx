import { Button, ChatLayout, ChatMessage, Icon, InputMessage } from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import type { ChatEntry, Conversation } from './fixtures.ts'

interface Thread extends Conversation {
  draft: string
}

interface ChatProps {
  conversations: Conversation[]
  initialId?: string
}

const starters = [
  {
    icon: 'pencil',
    label: 'Work on a cover',
    prompt: 'How should I choose a cover for the next issue?',
  },
  { icon: 'image', label: 'Sequence a photo essay', prompt: 'How do I sequence a photo essay?' },
  {
    icon: 'message-circle',
    label: 'Prepare an interview',
    prompt: 'What makes a good opening interview question?',
  },
] as const

export const ChatWorkspace = clientEntry(
  import.meta.url,
  function ChatWorkspace(handle: Handle<ChatProps>) {
    const threads: Thread[] = handle.props.conversations.map((thread) => ({
      ...thread,
      messages: [...thread.messages],
      draft: '',
    }))
    let sequence = 0
    function newThread() {
      const thread: Thread = {
        id: `conversation-${++sequence}`,
        title: 'New chat',
        messages: [],
        draft: '',
      }
      threads.unshift(thread)
      return thread
    }

    let activeId = handle.props.initialId ?? newThread().id
    // Keep each opened composer mounted so its queue and editing state follow the thread.
    const opened = new Set([activeId])
    let historyOpen = false
    let root: HTMLElement | undefined

    function select(id: string) {
      activeId = id
      opened.add(id)
      if (historyOpen) {
        historyOpen = false
        handle.queueTask(() =>
          root?.querySelector<HTMLButtonElement>('.studio-history-toggle')?.focus(),
        )
      }
      void handle.update()
    }

    function create() {
      const blank = threads.find((thread) => !thread.messages.length && !thread.draft)
      select((blank ?? newThread()).id)
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
        <aside
          class="studio-library"
          aria-label="Conversation library"
          data-open={historyOpen || undefined}
        >
          <header class="studio-library-header">
            <button
              type="button"
              class="studio-history-toggle"
              aria-label="Chat history"
              aria-expanded={historyOpen}
              aria-controls={`${handle.id}-history`}
              mix={on('click', () => {
                historyOpen = !historyOpen
                void handle.update()
              })}
            >
              <Icon name="panel-left" size={18} />
            </button>
            <h1>Reflow Chat</h1>
          </header>
          <button type="button" class="studio-new" mix={on('click', create)}>
            <Icon name="pencil" size={16} />
            New chat
          </button>
          <nav class="studio-list" aria-label="Chat history" id={`${handle.id}-history`}>
            <h2>Your chats</h2>
            <ul role="list">
              {threads
                .filter((thread) => thread.messages.length || thread.draft)
                .map((thread) => (
                  <li key={thread.id}>
                    <button
                      type="button"
                      class="studio-thread"
                      aria-label={thread.messages.length ? thread.title : `Draft · ${thread.draft}`}
                      aria-current={activeId === thread.id ? 'true' : undefined}
                      mix={on('click', () => select(thread.id))}
                    >
                      <Icon name="message-circle" size={16} />
                      <span>{thread.messages.length ? thread.title : thread.draft}</span>
                      {thread.draft && <small>Draft</small>}
                    </button>
                  </li>
                ))}
            </ul>
          </nav>
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

  let response: ChatEntry | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  handle.signal.addEventListener('abort', () => clearInterval(timer), { once: true })

  function finish(stopped: boolean) {
    clearInterval(timer)
    if (response) response.stopped = stopped
    response = undefined
    handle.props.onChange()
  }

  function stop() {
    const field = document.activeElement?.closest('form')?.querySelector('textarea')
    finish(true)
    handle.queueTask(() => field?.focus())
  }

  function send(text: string) {
    // Sending a queued message immediately also ends the preceding reply.
    if (response) finish(true)
    if (!thread.messages.length) thread.title = text.length > 48 ? text.slice(0, 47) + '…' : text
    const words = replyTo(text).split(' ')
    let shown = 2
    response = { role: 'assistant', text: words.slice(0, shown).join(' ') }
    thread.messages.push({ role: 'user', text }, response)
    timer = setInterval(() => {
      if (!response) return
      shown = Math.min(shown + 2, words.length)
      response.text = words.slice(0, shown).join(' ')
      if (shown === words.length) finish(false)
      else void handle.update()
    }, 140)
    handle.props.onChange()
  }

  return () => (
    <ChatLayout
      label={thread.title}
      header={
        thread.messages.length ? (
          <header class="studio-heading">
            <h2>{thread.title}</h2>
            <p role="status">{response ? 'Replying…' : 'Simulated replies'}</p>
          </header>
        ) : undefined
      }
      composer={
        <>
          {!thread.messages.length && <h2 class="studio-welcome">Where should we begin?</h2>}
          <InputMessage
            key="composer"
            attachments={false}
            placeholder="Ask Reflow"
            status={response ? 'streaming' : 'idle'}
            onStop={stop}
            actions={
              response && thread.draft.trim() ? (
                <Button
                  size="icon-compact"
                  variant="ghost"
                  aria-label="Stop response"
                  mix={on('click', stop)}
                >
                  <Icon name="square-stop" size={14} />
                </Button>
              ) : undefined
            }
            defaultValue={thread.draft}
            onValueChange={(draft) => {
              thread.draft = draft
              handle.props.onChange()
            }}
            onSend={({ text }) => send(text)}
          />
          {!thread.messages.length && !thread.draft && (
            <div class="studio-starters" aria-label="Suggested prompts" role="group">
              {starters.map(({ icon, label, prompt }) => (
                <button
                  key={label}
                  type="button"
                  mix={on<HTMLButtonElement, 'click'>('click', (event) => {
                    const field = event.currentTarget
                      .closest('.rf-chat-layout-composer')
                      ?.querySelector('textarea')
                    send(prompt)
                    handle.queueTask(() => field?.focus())
                  })}
                >
                  <Icon name={icon} size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      }
    >
      {thread.messages.map((message, index) => (
        <ChatMessage key={index} role={message.role} animate={false}>
          {message.role === 'assistant' && <strong class="studio-author">Reflow</strong>}
          <span aria-busy={message === response || undefined}>{message.text}</span>
          {message.stopped && <span class="studio-stopped">Response stopped</span>}
        </ChatMessage>
      ))}
    </ChatLayout>
  )
}

function replyTo(text: string) {
  if (/\b(cover|masthead|type|layout)\b/i.test(text))
    return 'Print the two versions at the size your reader will hold. Set them side by side and step back. Which one makes the subject clear first? Keep that version, then adjust the spacing around the title in small increments.'
  if (/\b(photo|photograph|sequence|essay)\b/i.test(text))
    return 'Lay the photographs out as small prints. Choose your opening and closing frames first, then build the middle around a change of distance or pace. Read the sequence without captions once before deciding where the page turns belong.'
  if (/\b(interview|question|mara)\b/i.test(text))
    return 'Start with a moment your subject can place in time. Ask what they could see or hear, then leave room for the details to emerge. Use one of those details to shape your next question.'
  return 'Start by choosing one thing you want the reader to remember. Write it in a sentence, then pick a detail that makes it concrete. Read the two together and see which words you can take away without losing the idea.'
}
