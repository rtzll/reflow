import { messageTransitionName } from './systems/message-transition.ts'
import { ref, type Handle, type RemixNode } from 'remix/component'
import { prefersReducedMotion } from '@remix-run/ui/animation'
import type { ControlSize } from './systems/styling.ts'
import { motion } from './systems/motion.ts'

export interface ChatAttachment {
  name: string
  url?: string
  detail?: string
  type?: string
  previewUrl?: string
}

export interface ChatMessageProps {
  transitionId?: string
  /** `system` shows an event in the conversation, such as a model switch, as a quiet centred line. */
  role: 'user' | 'assistant' | 'system'
  children?: RemixNode
  /** Files shown with a user or assistant message. */
  attachments?: readonly ChatAttachment[]
  /** Names the message. Defaults to You, Assistant or System. */
  label?: string
  size?: ControlSize
  /** Shown under a user message on hover, and inline after a system event. */
  time?: string
  /** Shown on hover under a message, and always after a system event. */
  actions?: RemixNode
  /** A small glyph before a system event. */
  icon?: RemixNode
  animate?: boolean
}

export function ChatMessage(handle: Handle<ChatMessageProps>) {
  // As in the reference, a message glides to its new place when the
  // conversation re-renders around it, such as earlier messages moving up as a
  // new one is sent and the transcript scrolls to it. Its place is read before
  // the update lands and again on the next frame, once the transcript has
  // scrolled. A message still playing its entrance does not glide.
  let element: HTMLElement | null = null
  let entered = false
  let glide: Animation | undefined

  const track = ref((node, signal) => {
    if (!(node instanceof HTMLElement)) return
    element = node
    entered = !node.hasAttribute('data-animate') || node.getAnimations().length === 0
    const settle = (event: AnimationEvent) => {
      if (event.target === node) entered = true
    }
    node.addEventListener('animationend', settle, { signal })
    node.addEventListener('animationcancel', settle, { signal })
    signal.addEventListener(
      'abort',
      () => {
        glide?.cancel()
        if (element === node) element = null
      },
      { once: true },
    )
  })

  function followMove() {
    const node = element
    if (
      !node ||
      !entered ||
      !node.isConnected ||
      prefersReducedMotion() ||
      document.documentElement.hasAttribute('data-rf-message-transition')
    )
      return
    // Where the message shows now, a glide in flight included.
    const before = node.getBoundingClientRect().top
    const glideFrom = (shown: number) => {
      if (element !== node || !node.isConnected) return
      glide?.cancel()
      const offset = shown - node.getBoundingClientRect().top
      if (Math.abs(offset) < 0.5) return
      glide = node.animate(
        [{ transform: `translateY(${offset}px)` }, { transform: 'none' }],
        motion.moderate,
      )
      // A starting animation holds its first frame from now, not from its
      // first tick, so the next paint already shows the old place.
      glide.currentTime = 0
    }
    // Glide as soon as the update lands, so no frame shows the jump. If the
    // transcript scrolls before the next frame, the glide restarts from the
    // same place against the scrolled layout.
    handle.queueTask(() => {
      glideFrom(before)
      const started = glide
      const shown = node.getBoundingClientRect().top
      requestAnimationFrame(() => {
        // The message has not been painted elsewhere yet, so a restart is seamless.
        if (glide === started && Math.abs(node.getBoundingClientRect().top - shown) >= 0.5) {
          glideFrom(before)
        }
      })
    })
  }

  return () => {
    const { role, label, attachments, children, size, time, actions, animate = true } = handle.props
    followMove()
    if (role === 'system')
      return (
        <article
          class="rf-chat-message"
          data-role="system"
          data-size={size}
          data-animate={animate ? '' : undefined}
          aria-label={label ?? 'System'}
          mix={track}
        >
          <p class="rf-chat-system">
            {handle.props.icon != null && (
              <span class="rf-chat-system-icon" aria-hidden="true">
                {handle.props.icon}
              </span>
            )}
            <span class="rf-chat-system-text">{children}</span>
            {time && <span class="rf-chat-time">{time}</span>}
            {actions != null && <span class="rf-chat-actions">{actions}</span>}
          </p>
        </article>
      )
    return (
      <article
        class="rf-chat-message"
        data-role={role}
        data-size={size}
        data-animate={animate ? '' : undefined}
        aria-label={label ?? (role === 'user' ? 'You' : 'Assistant')}
        mix={track}
      >
        {attachments?.length ? (
          <ul class="rf-chat-attachments" aria-label="Attachments">
            {attachments.map((attachment, index) => (
              <li
                key={index}
                class="rf-chat-thumb"
                title={attachment.detail ? `${attachment.name} (${attachment.detail})` : undefined}
              >
                {attachment.previewUrl ? (
                  <img src={attachment.previewUrl} alt={attachment.name} />
                ) : (
                  <span class="rf-chat-thumb-glyph" role="img" aria-label={attachment.name}>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                      <path d="M14 3v5h5" />
                    </svg>
                  </span>
                )}
                {attachment.url && <a href={attachment.url} aria-label={attachment.name} />}
              </li>
            ))}
          </ul>
        ) : null}
        {children != null && children !== '' && (
          <div
            class="rf-chat-body"
            style={
              handle.props.transitionId
                ? { viewTransitionName: messageTransitionName(handle.props.transitionId) }
                : undefined
            }
          >
            {children}
          </div>
        )}
        {((role === 'user' && time) || actions) && (
          <div class="rf-chat-meta">
            {role === 'user' && time && <span class="rf-chat-time">{time}</span>}
            {actions != null && <span class="rf-chat-actions">{actions}</span>}
          </div>
        )}
      </article>
    )
  }
}
