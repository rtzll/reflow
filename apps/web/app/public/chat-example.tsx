import { on, type Handle } from 'remix/component'
import { Button, ChatMessage, Icon } from '@rtzll/reflow'
import { playCopyError } from './showcase-sound.ts'

const conversation = [
  {
    role: 'user',
    time: 'Wednesday 6:06 PM',
    text: 'What does “good design” actually mean? Everyone says it, no one defines it.',
  },
  {
    role: 'assistant',
    text: 'Good design is mostly invisible — you only notice it when it’s missing. It’s less about how something looks and more about how effortlessly it lets you do what you came to do.',
  },
  { role: 'user', time: 'Wednesday 6:07 PM', text: 'So function over form?' },
  {
    role: 'assistant',
    text: 'Not quite. Form is part of function — something that feels good to use is, in a real sense, working better. The split between the two is mostly a myth.',
  },
  { role: 'user', time: 'Wednesday 6:08 PM', text: 'That reframes it completely.' },
] as const

export const chatAvatar =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"%3E%3Crect width="160" height="160" fill="%236b97ff"/%3E%3Ccircle cx="80" cy="62" r="27" fill="%23e1eaff"/%3E%3Cpath fill="%23e1eaff" d="M24 160a56 56 0 0 1 112 0z"/%3E%3C/svg%3E'

export function ChatExample(
  handle: Handle<{ variant?: 'conversation' | 'roles' | 'attachments' }>,
) {
  let copied = -1
  return () => {
    const { variant = 'conversation' } = handle.props
    return (
      <div class="example-chat-thread">
        {variant === 'roles' ? (
          <>
            <ChatMessage role="user" animate={false}>
              Right-aligned accent bubble.
            </ChatMessage>
            <ChatMessage role="assistant" animate={false}>
              Left-aligned, no background.
            </ChatMessage>
          </>
        ) : variant === 'attachments' ? (
          <>
            <ChatMessage
              role="user"
              animate={false}
              attachments={[{ name: 'avatar.svg', previewUrl: chatAvatar }]}
            >
              Can you use this as my new avatar?
            </ChatMessage>
            <ChatMessage role="assistant" animate={false}>
              Looks great — it’ll crop cleanly into the circle.
            </ChatMessage>
          </>
        ) : (
          conversation.map(({ role, text, ...details }, index) => (
            <ChatMessage
              key={index}
              role={role}
              animate={false}
              {...details}
              actions={
                <>
                  <Button
                    size="icon-compact"
                    variant="ghost"
                    aria-label={copied === index ? 'Copied message' : 'Copy message'}
                    mix={on('click', async () => {
                      try {
                        await navigator.clipboard.writeText(text)
                        copied = index
                        handle.update()
                      } catch {
                        playCopyError()
                      }
                    })}
                  >
                    <Icon name={copied === index ? 'check' : 'copy'} size={13} />
                  </Button>
                  <Button
                    size="icon-compact"
                    variant="ghost"
                    aria-label={role === 'user' ? 'Edit message' : 'Regenerate response'}
                  >
                    <Icon name={role === 'user' ? 'pencil' : 'rotate-ccw'} size={13} />
                  </Button>
                </>
              }
            >
              {text}
            </ChatMessage>
          ))
        )}
      </div>
    )
  }
}

export const conversationCode = `const messages = ${JSON.stringify(conversation, null, 2)} as const
let copied = -1

<div style={{ display: 'grid', gap: '8px', width: 'min(100%, 568px)' }}>
  {messages.map(({ role, text, ...details }, index) => (
    <ChatMessage key={index} role={role} animate={false} {...details} actions={<>
      <Button size="icon-compact" variant="ghost" aria-label={copied === index ? 'Copied message' : 'Copy message'}
        mix={on('click', async () => {
          try {
            await navigator.clipboard.writeText(text)
            copied = index
            handle.update()
          } catch { /* Clipboard unavailable */ }
        })}>
        <Icon name={copied === index ? 'check' : 'copy'} size={13} />
      </Button>
      <Button size="icon-compact" variant="ghost" aria-label={role === 'user' ? 'Edit message' : 'Regenerate response'}>
        <Icon name={role === 'user' ? 'pencil' : 'rotate-ccw'} size={13} />
      </Button>
    </>}>{text}</ChatMessage>
  ))}
</div>`
