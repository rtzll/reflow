import { Button, ChatLayout, ChatMessage, Icon, InputMessage } from '@rtzll/reflow'
import { Markdown } from '@rtzll/reflow/markdown'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { replyTo, type ChatEntry, type Conversation } from './fixtures.ts'
import {
  blankThread,
  localThreadId,
  restoreThreads,
  saveThread,
  type Thread,
} from './local-threads.ts'
import { skillReply, skillTriggers } from './skills.ts'

interface ChatProps {
  conversations: Conversation[]
  initialId: string
  search: string
}

function randomId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
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
    let activeId = handle.props.initialId
    if (!threads.some(({ id }) => id === activeId)) threads.unshift(blankThread(activeId))
    // Keep each opened composer mounted so its queue and editing state follow the thread.
    const opened = new Set([activeId])
    let historyOpen = false
    let root: HTMLElement | undefined

    function href(id: string) {
      const query = new URLSearchParams(root ? location.search : handle.props.search)
      query.set('thread', id)
      return '?' + query.toString() + (root ? location.hash : '')
    }

    function focusComposer() {
      const field = root?.querySelector<HTMLTextAreaElement>('.studio-pane:not([hidden]) textarea')
      if (!field) return
      field.focus({ preventScroll: true })
      field.setSelectionRange(field.value.length, field.value.length)
    }

    function closeHistory() {
      if (!historyOpen) return
      historyOpen = false
      handle.queueTask(() =>
        root?.querySelector<HTMLButtonElement>('.studio-history-toggle')?.focus(),
      )
      void handle.update()
    }

    function select(thread: Thread, navigation: 'link' | 'new' | 'history') {
      if (navigation !== 'history' && activeId !== thread.id)
        history.pushState(history.state, '', href(thread.id))
      activeId = thread.id
      opened.add(activeId)
      const fromMenu = historyOpen
      historyOpen = false
      void handle.update()
      // Remix traversals can reset focus at the end of a Navigation API transition.
      if (navigation === 'history') {
        const focus = () => {
          if (activeId !== thread.id || handle.signal.aborted) return
          const focused = document.activeElement
          if (focused === document.body || focused?.id === 'main') focusComposer()
        }
        const transition = window.navigation?.transition
        if (transition) void transition.finished.then(focus, () => {})
        else handle.queueTask(focus)
      } else if (thread.draft.trim() || navigation === 'new') handle.queueTask(focusComposer)
      else if (fromMenu)
        handle.queueTask(() =>
          root?.querySelector<HTMLButtonElement>('.studio-history-toggle')?.focus(),
        )
    }

    function create() {
      let thread = threads.find((thread) => !thread.messages.length && !thread.draft.trim())
      if (!thread) {
        thread = blankThread(`conversation-${randomId()}`)
        threads.unshift(thread)
      }
      select(thread, 'new')
    }

    const mount = ref((node, signal) => {
      root = node as HTMLElement
      restoreThreads(threads)
      if (new URLSearchParams(location.search).get('thread') !== activeId)
        history.replaceState(history.state, '', href(activeId))
      void handle.update()
      if (threads.find(({ id }) => id === activeId)?.draft.trim()) handle.queueTask(focusComposer)
      window.addEventListener(
        'popstate',
        () => {
          const id = new URLSearchParams(location.search).get('thread')
          let thread = threads.find((thread) => thread.id === id)
          if (!thread && id && localThreadId.test(id)) {
            thread = blankThread(id)
            threads.unshift(thread)
          }
          if (thread) select(thread, 'history')
        },
        { signal },
      )
    })

    return () => (
      <div
        class="studio-chat"
        mix={[
          mount,
          on<HTMLDivElement, 'keydown'>('keydown', (event) => {
            if (event.key === 'Escape' && !event.defaultPrevented && historyOpen) {
              event.preventDefault()
              closeHistory()
            }
          }),
        ]}
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
            <h1>Chat</h1>
          </header>
          <button type="button" class="studio-new" mix={on('click', create)}>
            <Icon name="pencil" size={16} />
            New chat
          </button>
          <nav class="studio-list" aria-label="Chat history" id={`${handle.id}-history`}>
            <h2>Your chats</h2>
            <ul role="list">
              {threads
                .filter((thread) => thread.messages.length || thread.draft.trim())
                .map((thread) => {
                  const draft = thread.draft.trim()
                  return (
                    <li key={thread.id}>
                      <a
                        href={href(thread.id)}
                        class="studio-thread"
                        aria-label={thread.messages.length ? thread.title : `Draft · ${draft}`}
                        aria-description={
                          thread.messages.length && draft ? 'Unfinished draft' : undefined
                        }
                        aria-current={activeId === thread.id ? 'true' : undefined}
                        mix={on<HTMLAnchorElement, 'click'>('click', (event) => {
                          if (
                            event.button ||
                            event.metaKey ||
                            event.ctrlKey ||
                            event.shiftKey ||
                            event.altKey
                          )
                            return
                          event.preventDefault()
                          select(thread, 'link')
                        })}
                      >
                        <Icon name="message-circle" size={16} />
                        <span>{thread.messages.length ? thread.title : draft}</span>
                        {draft && <small>Draft</small>}
                      </a>
                    </li>
                  )
                })}
            </ul>
          </nav>
        </aside>
        {threads
          .filter((thread) => opened.has(thread.id))
          .map((thread) => (
            <ConversationPane
              key={thread.id}
              thread={thread}
              hidden={activeId !== thread.id}
              onChange={() => void handle.update()}
            />
          ))}
      </div>
    )
  },
)

function ConversationPane(
  handle: Handle<{ thread: Thread; hidden: boolean; onChange: () => void }>,
) {
  const { thread } = handle.props

  let pane: HTMLElement | undefined
  let hasSent = false
  let response: ChatEntry | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  handle.signal.addEventListener('abort', () => clearInterval(timer), { once: true })

  function changed() {
    saveThread(thread, response)
    handle.props.onChange()
  }

  // A refresh can interrupt a stream between ticks. Keep the visible partial response.
  const persistOnExit = ref((_node, signal) => {
    window.addEventListener(
      'pagehide',
      () => {
        if (response) saveThread(thread, response)
      },
      { signal },
    )
  })

  function finish(stopped: boolean) {
    clearInterval(timer)
    if (response) response.stopped = stopped
    response = undefined
    changed()
  }

  function stop() {
    const field = pane?.querySelector<HTMLTextAreaElement>('textarea')
    finish(true)
    handle.queueTask(() => field?.focus())
  }

  function send(text: string) {
    hasSent = true
    // Sending a queued message immediately also ends the preceding reply.
    if (response) finish(true)
    const subject = thread.messages.length
      ? thread.title.replace(/^\/\S+\s*/, '').trim() || thread.title
      : 'your story'
    const words = (skillReply(text, subject) ?? replyTo(text)).split(' ')
    if (!thread.messages.length) thread.title = text.length > 48 ? text.slice(0, 47) + '…' : text
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
    changed()
  }

  return () => {
    const draft = thread.draft.trim()
    return (
      <section
        class="studio-pane"
        hidden={handle.props.hidden}
        aria-label={thread.title}
        mix={ref<HTMLElement>((node) => {
          pane = node
        })}
      >
        <ChatLayout
          label={thread.title}
          scroll={hasSent ? 'anchor' : 'follow'}
          busy={!!response}
          composer={
            <>
              {!thread.messages.length && <h2 class="studio-welcome">Where should we begin?</h2>}
              <InputMessage
                key="composer"
                attachments={false}
                placeholder="Message or type / for skills"
                triggers={skillTriggers}
                status={response ? 'streaming' : 'idle'}
                onStop={stop}
                actions={
                  <>
                    <Button
                      class="studio-skills-button"
                      size="icon-compact"
                      variant="ghost"
                      aria-label="Choose a skill"
                      title="Choose a skill"
                      mix={on<HTMLButtonElement, 'click'>('click', (event) => {
                        const field = event.currentTarget.form?.querySelector('textarea')
                        if (!field) return
                        if (!field.value.startsWith('/'))
                          field.setRangeText(field.value ? '/ ' : '/', 0, 0)
                        field.focus()
                        field.setSelectionRange(1, 1)
                        field.dispatchEvent(new Event('input', { bubbles: true }))
                      })}
                    >
                      /
                    </Button>
                    {response && draft && (
                      <Button
                        size="icon-compact"
                        variant="ghost"
                        aria-label="Stop response"
                        mix={on('click', stop)}
                      >
                        <Icon name="square-stop" size={14} />
                      </Button>
                    )}
                  </>
                }
                value={thread.draft}
                onValueChange={(nextDraft) => {
                  const prevTrimmed = thread.draft.trim()
                  const nextTrimmed = nextDraft.trim()
                  thread.draft = nextDraft
                  saveThread(thread, response)
                  if (
                    (!thread.messages.length && prevTrimmed !== nextTrimmed) ||
                    Boolean(prevTrimmed) !== Boolean(nextTrimmed)
                  ) {
                    handle.props.onChange()
                  } else {
                    void handle.update()
                  }
                }}
                onSend={({ text }) => send(text)}
              />
              {thread.messages.length > 0 && (
                <p class="studio-status" role="status" mix={persistOnExit}>
                  {response ? 'Replying…' : 'Simulated replies'}
                </p>
              )}
              {!thread.messages.length && !draft && (
                <div class="studio-starters" aria-label="Suggested prompts" role="group">
                  {starters.map(({ icon, label, prompt }) => (
                    <button
                      key={label}
                      type="button"
                      mix={on<HTMLButtonElement, 'click'>('click', () => {
                        const field = pane?.querySelector<HTMLTextAreaElement>('textarea')
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
              {message.role === 'assistant' ? (
                <Markdown source={message.text} />
              ) : (
                <span>{message.text}</span>
              )}
              {message.stopped && <span class="studio-stopped">Response stopped</span>}
            </ChatMessage>
          ))}
        </ChatLayout>
      </section>
    )
  }
}
