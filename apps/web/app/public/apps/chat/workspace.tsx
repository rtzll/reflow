import {
  Button,
  Card,
  CardDescription,
  CardGroup,
  CardHeader,
  CardTitle,
  ChatLayout,
  ChatMessage,
  ChatOutline,
  Confirmation,
  Dropdown,
  Icon,
  InputMessage,
  Sidebar,
  type SidebarItem,
  type SidebarSection,
} from '@rtzll/reflow'
import { Markdown } from '@rtzll/reflow/markdown'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { alternateReply, replyTo, type ChatEntry, type Conversation } from './fixtures.ts'
import {
  blankThread,
  deleteThread,
  localThreadId,
  restoreThreads,
  saveThread,
  type Thread,
} from './local-threads.ts'
import { ModelPicker } from '../../model-picker.tsx'
import { skillReply, skillTriggers } from './skills.ts'
import { startsStretch, timeLabel } from './time.ts'

interface ChatProps {
  conversations: Conversation[]
  initialId: string
  search: string
  links: { reflow: string; apps: string }
}

function randomId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// The element id of a message, so the outline can jump to it.
function messageId(thread: Thread, index: number) {
  return `${thread.id}-message-${index}`
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
    const seeds = new Set(threads.map(({ id }) => id))
    let activeId = handle.props.initialId
    if (!threads.some(({ id }) => id === activeId)) threads.unshift(blankThread(activeId))
    // Keep each opened composer mounted so its queue and editing state follow the thread.
    const opened = new Set([activeId])
    let root: HTMLElement | undefined
    // Times read UTC until the browser can name the reader's own zone.
    let localTime = false

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

    function select(thread: Thread, navigation: 'link' | 'new' | 'history') {
      if (navigation !== 'history' && activeId !== thread.id)
        history.pushState(history.state, '', href(thread.id))
      activeId = thread.id
      opened.add(activeId)
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
    }

    function create() {
      let thread = threads.find((thread) => !thread.messages.length && !thread.draft.trim())
      if (!thread) {
        thread = blankThread(`conversation-${randomId()}`)
        threads.unshift(thread)
      }
      select(thread, 'new')
    }

    function togglePin(thread: Thread) {
      thread.pinned = !thread.pinned
      saveThread(thread)
      void handle.update()
    }

    function remove(thread: Thread) {
      threads.splice(threads.indexOf(thread), 1)
      opened.delete(thread.id)
      deleteThread(thread, seeds.has(thread.id))
      if (activeId === thread.id) create()
      else void handle.update()
    }

    const mount = ref((node, signal) => {
      root = node as HTMLElement
      localTime = true
      restoreThreads(threads)
      if (!threads.some(({ id }) => id === activeId)) threads.unshift(blankThread(activeId))
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

    function row(thread: Thread): SidebarItem {
      const draft = thread.draft.trim()
      const label = thread.messages.length ? thread.title : draft
      return {
        label,
        href: href(thread.id),
        icon: <Icon name="message-circle" />,
        badge: draft ? 'Draft' : undefined,
        onClick: (event) => {
          if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
            return
          event.preventDefault()
          select(thread, 'link')
        },
        actions: (
          <Dropdown
            label={`Options for ${label}`}
            variant="bare"
            triggerClass="rf-sidebar-action"
            chevron={false}
            triggerContent={<Icon name="more-horizontal" />}
            items={[
              { value: 'pin', label: thread.pinned ? 'Unpin' : 'Pin' },
              { value: 'delete', label: 'Delete', separatorBefore: true },
            ]}
            onSelect={(value) => (value === 'pin' ? togglePin(thread) : remove(thread))}
          />
        ),
      }
    }

    return () => {
      const listed = threads.filter((thread) => thread.messages.length || thread.draft.trim())
      const pinned = listed.filter((thread) => thread.pinned)
      const recent = listed.filter((thread) => !thread.pinned)
      const sections: SidebarSection[] = [
        ...(pinned.length ? [{ label: 'Pinned', items: pinned.map(row) }] : []),
        { label: 'Recent', items: recent.map(row) },
      ]
      const active = threads.find(({ id }) => id === activeId)
      return (
        <div class="studio-chat" mix={mount}>
          <Sidebar
            label="Chat history"
            sections={sections}
            activeHref={href(activeId)}
            defaultWidth={256}
            header={
              <div class="studio-library-header">
                <h1>Chat</h1>
                <Button
                  class="studio-new"
                  variant="ghost"
                  size="compact"
                  leadingIcon={<Icon name="pencil" />}
                  mix={on('click', create)}
                >
                  New chat
                </Button>
              </div>
            }
            footer={
              <nav aria-label="App navigation" class="studio-app-nav">
                <a href={handle.props.links.reflow} data-rmx-document="">
                  Reflow
                </a>
                <a href={handle.props.links.apps} data-rmx-document="">
                  Apps
                </a>
                <span aria-current="page" class="rf-basic-sr-only">
                  Chat
                </span>
              </nav>
            }
            toolbar={
              <div class="studio-toolbar">
                <h2 class="studio-title">{active?.messages.length ? active.title : 'New chat'}</h2>
                {active && active.messages.length > 0 && (
                  <div class="studio-toolbar-actions">
                    <ChatOutline
                      items={active.messages.flatMap((message, index) =>
                        message.role === 'user'
                          ? [{ id: messageId(active, index), label: message.text }]
                          : [],
                      )}
                    />
                    <Dropdown
                      label="Conversation options"
                      variant="ghost"
                      size="compact"
                      align="end"
                      chevron={false}
                      triggerContent={<Icon name="more-horizontal" />}
                      items={[
                        { value: 'pin', label: active.pinned ? 'Unpin' : 'Pin' },
                        { value: 'delete', label: 'Delete', separatorBefore: true },
                      ]}
                      onSelect={(value) => (value === 'pin' ? togglePin(active) : remove(active))}
                    />
                  </div>
                )}
              </div>
            }
          >
            {threads
              .filter((thread) => opened.has(thread.id))
              .map((thread) => (
                <ConversationPane
                  key={thread.id}
                  thread={thread}
                  localTime={localTime}
                  hidden={activeId !== thread.id}
                  recent={listed.filter((other) => other.messages.length).slice(0, 3)}
                  onOpen={(other) => select(other, 'link')}
                  onChange={() => void handle.update()}
                />
              ))}
          </Sidebar>
        </div>
      )
    }
  },
)

// The first line of a reply as plain text, for a card's summary.
function summary(thread: Thread) {
  const reply = thread.messages.find((message) => message.role === 'assistant')?.text ?? ''
  return reply
    .split('\n')
    .find((line) => line.trim() && !line.startsWith('#') && !line.startsWith('|'))
    ?.replace(/[*_`#>-]/g, '')
    .trim()
}

function ConversationPane(
  handle: Handle<{
    thread: Thread
    hidden: boolean
    localTime: boolean
    /** Recent conversations offered on a new chat's welcome screen. */
    recent: Thread[]
    onOpen: (thread: Thread) => void
    onChange: () => void
  }>,
) {
  const { thread } = handle.props

  let pane: HTMLElement | undefined
  let hasSent = false
  let response: ChatEntry | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  // Previews of images sent in this session, released with the pane.
  const previews: string[] = []
  handle.signal.addEventListener(
    'abort',
    () => {
      clearInterval(timer)
      for (const url of previews) URL.revokeObjectURL(url)
    },
    { once: true },
  )

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

  function send(text: string, files: readonly File[] = []) {
    hasSent = true
    // Sending a queued message immediately also ends the preceding reply.
    if (response) finish(true)
    const subject = thread.messages.length
      ? thread.title.replace(/^\/\S+\s*/, '').trim() || thread.title
      : 'your story'
    const skill = skillReply(text, subject)
    const words = (skill?.text ?? replyTo(text, files)).split(' ')
    const title = text || files[0]?.name || 'Files'
    if (!thread.messages.length) thread.title = title.length > 48 ? title.slice(0, 47) + '…' : title
    const attachments = files.map((file) => {
      const previewUrl = /^image\/(png|jpeg|gif|webp|avif|svg\+xml)$/.test(file.type)
        ? URL.createObjectURL(file)
        : undefined
      if (previewUrl) previews.push(previewUrl)
      return { name: file.name, type: file.type, previewUrl }
    })
    const reply: ChatEntry = { role: 'assistant', text: '' }
    thread.messages.push(
      {
        role: 'user',
        text,
        attachments: attachments.length ? attachments : undefined,
        sentAt: new Date().toISOString(),
      },
      reply,
    )
    stream(reply, words, () => {
      if (skill?.command === '/proof') reply.proofChecklist = 'requested'
    })
  }

  // Streams words into a reply a couple at a time.
  function stream(reply: ChatEntry, words: string[], done?: () => void) {
    let shown = 2
    reply.text = words.slice(0, shown).join(' ')
    response = reply
    timer = setInterval(() => {
      if (!response) return
      shown = Math.min(shown + 2, words.length)
      response.text = words.slice(0, shown).join(' ')
      if (shown === words.length) {
        done?.()
        finish(false)
      } else void handle.update()
    }, 140)
    changed()
  }

  // Answers the last question again, in other words.
  function retry(reply: ChatEntry) {
    const index = thread.messages.indexOf(reply)
    const question = thread.messages[index - 1]
    if (response || !question || index !== thread.messages.length - 1) return
    reply.stopped = undefined
    reply.proofChecklist = undefined
    stream(reply, alternateReply(question.text, question.attachments).split(' '))
  }

  let copied: ChatEntry | undefined
  let copiedTimer: ReturnType<typeof setTimeout> | undefined
  handle.signal.addEventListener('abort', () => clearTimeout(copiedTimer), { once: true })
  async function copy(message: ChatEntry) {
    try {
      await navigator.clipboard.writeText(message.text)
    } catch {
      return
    }
    copied = message
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied = undefined
      void handle.update()
    }, 1500)
    void handle.update()
  }

  function answerChecklist(message: ChatEntry, answer: 'approved' | 'denied') {
    if (message.proofChecklist !== 'requested') return
    message.proofChecklist = answer
    if (answer === 'approved') {
      thread.draft = thread.draft ? thread.draft + '\n\n' + message.text : message.text
    }
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
                pasteAsFile={2000}
                voice
                maxFiles={4}
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
                        data-stop=""
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
                onSend={({ text, files }) => send(text, files)}
              />
              <div class="studio-composer-footer">
                <p class="studio-status" role="status" mix={persistOnExit}>
                  {thread.messages.length ? (response ? 'Replying…' : 'Simulated replies') : ''}
                </p>
                <ModelPicker />
              </div>
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
              {!thread.messages.length && !draft && handle.props.recent.length > 0 && (
                <section class="studio-recent" aria-labelledby={`${handle.id}-recent`}>
                  <h3 id={`${handle.id}-recent`}>Recent</h3>
                  <CardGroup columns={handle.props.recent.length} border="outlined">
                    {handle.props.recent.map((other) => (
                      <Card
                        key={other.id}
                        label={`Open ${other.title}`}
                        onClick={() => handle.props.onOpen(other)}
                      >
                        <CardHeader>
                          <CardTitle>{other.title}</CardTitle>
                          <CardDescription>{summary(other)}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </CardGroup>
                </section>
              )}
            </>
          }
        >
          {thread.messages.flatMap((message, index) => [
            ...(startsStretch(thread.messages, index) && message.sentAt
              ? [
                  <p key={`time-${index}`} class="studio-time">
                    <time dateTime={message.sentAt}>
                      {timeLabel(message.sentAt, handle.props.localTime)}
                    </time>
                  </p>,
                ]
              : []),
            <ChatMessage
              key={`message-${index}`}
              id={messageId(thread, index)}
              role={message.role}
              attachments={message.attachments}
              actions={
                message.role === 'assistant' && message !== response ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-compact"
                      aria-label={copied === message ? 'Copied' : 'Copy reply'}
                      mix={on('click', () => void copy(message))}
                    >
                      <Icon name={copied === message ? 'check' : 'copy'} />
                    </Button>
                    {index === thread.messages.length - 1 && (
                      <Button
                        variant="ghost"
                        size="icon-compact"
                        aria-label="Try again"
                        mix={on('click', () => retry(message))}
                      >
                        <Icon name="rotate-ccw" />
                      </Button>
                    )}
                  </>
                ) : undefined
              }
              animate={false}
            >
              {message.role === 'assistant' && <strong class="studio-author">Reflow</strong>}
              {message.role === 'assistant' ? (
                <Markdown source={message.text} />
              ) : message.text ? (
                <span>{message.text}</span>
              ) : null}
              {message.proofChecklist && (
                <Confirmation
                  title="Add this checklist to your draft?"
                  description="Appends the checklist to the message you’re writing in this conversation."
                  approveLabel="Add to draft"
                  denyLabel="Skip"
                  approvedLabel="Added to draft"
                  deniedLabel="Skipped"
                  state={message.proofChecklist}
                  onApprove={() => answerChecklist(message, 'approved')}
                  onDeny={() => answerChecklist(message, 'denied')}
                />
              )}
              {message.stopped && <span class="studio-stopped">Response stopped</span>}
            </ChatMessage>,
          ])}
        </ChatLayout>
      </section>
    )
  }
}
