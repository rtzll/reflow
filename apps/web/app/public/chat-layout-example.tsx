import { AvatarGroup, ChatLayout, ChatMessage, InputMessage } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

interface Message {
  role: 'user' | 'assistant' | 'system'
  text: string
  animate?: boolean
}

const replies = [
  'Good design is mostly invisible: you notice it when it is missing. It lets you do what you came to do, and it feels right while you do it.',
  'Motion helps when it explains a change: where something came from, where it went, and what is still happening. Springs feel natural because they keep their momentum.',
  'Keep the shared pieces shared: one hover that glides between items, one set of springs, one scrollbar. Consistency is what makes a library feel calm.',
]

const history: Message[] = Array.from({ length: 9 }, (_, index) => [
  { role: 'user' as const, text: `Question ${index + 1}: what makes an interface feel fast?` },
  {
    role: 'assistant' as const,
    text: 'Responding within a frame, showing progress early, and never moving what the reader is looking at.',
  },
]).flat()

export interface ChatLayoutDemoProps {
  variant: string
  size?: 'default' | 'compact'
  header?: boolean
  empty?: boolean
}

/** The ChatLayout docs demos and playground: a working conversation whose replies stream in. */
export function ChatLayoutDemo(handle: Handle<ChatLayoutDemoProps>) {
  const variant = handle.props.variant
  let messages: Message[] =
    variant === 'history'
      ? history.map((message) => ({ ...message, animate: false }))
      : variant === 'empty' || handle.props.empty
        ? []
        : [
            { role: 'user', text: 'What does “good design” actually mean?', animate: false },
            { role: 'assistant', text: replies[0]!, animate: false },
          ]
  let replyIndex = 1
  let timer: ReturnType<typeof setInterval> | undefined
  handle.signal.addEventListener('abort', () => clearInterval(timer), { once: true })

  // Streams the next reply in, a few words at a time.
  function reply() {
    clearInterval(timer)
    const words = replies[replyIndex++ % replies.length]!.split(' ')
    const message: Message = { role: 'assistant', text: '' }
    messages = [...messages, message]
    let shown = 0
    timer = setInterval(() => {
      shown = Math.min(words.length, shown + 2)
      message.text = words.slice(0, shown).join(' ')
      void handle.update()
      if (shown === words.length) clearInterval(timer)
    }, 60)
  }

  return () => {
    const { size } = handle.props
    const showHeader = variant === 'header' || handle.props.header
    return (
      <div class="doc-chat-layout" data-density={size}>
        <ChatLayout
          label="Design chat"
          header={
            showHeader ? (
              <div class="doc-chat-header">
                <strong>Design chat</strong>
                <AvatarGroup
                  avatars={[{ name: 'Ada Lovelace' }, { name: 'Grace Hopper' }, { name: 'Reflow' }]}
                  size={24}
                />
              </div>
            ) : undefined
          }
          empty={
            <div class="doc-chat-empty">
              <strong>Start a conversation</strong>
              <span>Ask about design, motion or the components.</span>
            </div>
          }
          composer={
            <InputMessage
              size={size}
              placeholderSuggestion="What makes motion feel natural?"
              onSend={({ text }) => {
                messages = [...messages, { role: 'user', text: text || 'Sent a file' }]
                void handle.update()
                setTimeout(reply, 400)
              }}
            />
          }
        >
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              size={size}
              animate={message.animate ?? true}
            >
              {message.text}
            </ChatMessage>
          ))}
        </ChatLayout>
      </div>
    )
  }
}
