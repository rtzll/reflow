import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { prefersReducedMotion } from '@remix-run/ui/animation'
import { Icon } from './icon.tsx'
import { ScrollArea } from './scroll-area.tsx'

export interface ChatLayoutProps {
  /** The messages, usually ChatMessage elements, oldest first. */
  children?: RemixNode
  /** Docked below the transcript, usually an InputMessage. */
  composer?: RemixNode
  /** Above the transcript, such as a title or the people in the chat. */
  header?: RemixNode
  /** Shown in place of the transcript until the first message. */
  empty?: RemixNode
  /** Names the transcript. Default "Conversation". */
  label?: string
  class?: string
}

// Within this many pixels of the end, the transcript counts as at the newest message.
const pinSlack = 24

function isEmpty(node: RemixNode): boolean {
  if (node == null || node === false || node === '') return true
  return Array.isArray(node) && node.every(isEmpty)
}

/**
 * The conversation screen: a transcript that fills the space, with the
 * composer docked below it. The transcript opens at the newest message and
 * stays there as messages arrive or a reply streams in, as long as the
 * reader is there too; once they scroll back, it leaves them where they
 * are and offers a button back to the newest message. Sending a message
 * of their own, a ChatMessage with the user role, brings them back. The transcript is a
 * labelled log in a ScrollArea, and the column keeps a readable width.
 */
export function ChatLayout(handle: Handle<ChatLayoutProps>) {
  let viewport: HTMLElement | null = null
  let pinned = true
  let unseen = false
  // While a jump scrolls smoothly, its own scroll events must not unpin it.
  let jumping = false

  function setState(nextPinned: boolean, nextUnseen: boolean) {
    if (nextPinned === pinned && nextUnseen === unseen) return
    pinned = nextPinned
    unseen = nextUnseen
    void handle.update()
  }

  // The end, from layout alone. Messages gliding to new places are moved by
  // transforms, which grow scrollHeight while they play; measured that way,
  // the transcript would scroll past the end and snap back as glides finish.
  function endTop() {
    if (!viewport) return 0
    const content = viewport.firstElementChild as HTMLElement | null
    return Math.max(0, (content?.offsetHeight ?? viewport.scrollHeight) - viewport.clientHeight)
  }

  function atEnd() {
    if (!viewport) return true
    return endTop() - viewport.scrollTop <= pinSlack
  }

  function scrollToEnd(smooth = false) {
    viewport?.scrollTo({
      top: endTop(),
      behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'instant',
    })
  }

  const logMix = ref((node, signal) => {
    if (!(node instanceof HTMLElement)) return
    viewport = node.closest<HTMLElement>('.rf-scroll-viewport')
    if (!viewport) return
    const scroller = viewport
    scrollToEnd()
    let lastHeight = node.offsetHeight
    const observer = new ResizeObserver(() => {
      const grew = node.offsetHeight > lastHeight
      lastHeight = node.offsetHeight
      if (pinned) scrollToEnd()
      else if (grew) setState(false, true)
    })
    observer.observe(node)
    observer.observe(scroller)
    // The reader's own message always brings them to the newest one.
    const added = new MutationObserver((records) => {
      const sent = records.some((record) =>
        Array.from(record.addedNodes).some(
          (child) => child instanceof Element && child.matches('[data-role="user"]'),
        ),
      )
      if (!sent) return
      setState(true, false)
      scrollToEnd()
    })
    added.observe(node, { childList: true })
    scroller.addEventListener(
      'scroll',
      () => {
        if (jumping) {
          if (atEnd()) jumping = false
          return
        }
        const end = atEnd()
        setState(end, end ? false : unseen)
      },
      { signal, passive: true },
    )
    signal.addEventListener(
      'abort',
      () => {
        observer.disconnect()
        added.disconnect()
        if (viewport === scroller) viewport = null
      },
      { once: true },
    )
  })

  return () => {
    const { children, composer, header, empty, label = 'Conversation' } = handle.props
    const blank = isEmpty(children)
    return (
      <div
        class={handle.props.class ? `rf-chat-layout ${handle.props.class}` : 'rf-chat-layout'}
        data-empty={blank || undefined}
      >
        {header != null && <div class="rf-chat-layout-header">{header}</div>}
        <div class="rf-chat-layout-body">
          <ScrollArea
            label={label}
            className="rf-chat-layout-scroll"
            viewportClassName="rf-chat-layout-viewport"
          >
            <div class="rf-chat-transcript" role="log" aria-label={label} mix={logMix}>
              {children}
            </div>
            {blank && empty != null && <div class="rf-chat-layout-empty">{empty}</div>}
          </ScrollArea>
          <button
            type="button"
            class="rf-chat-jump"
            hidden={pinned}
            mix={on('click', () => {
              jumping = true
              setState(true, false)
              scrollToEnd(true)
            })}
          >
            <Icon name="chevron-down" size={14} />
            {unseen ? 'New messages' : 'Jump to latest'}
          </button>
        </div>
        {composer != null && <div class="rf-chat-layout-composer">{composer}</div>}
      </div>
    )
  }
}
