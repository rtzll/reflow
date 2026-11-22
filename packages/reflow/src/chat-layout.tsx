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
  /**
   * `follow` keeps the newest message in view. `anchor` glides a message the
   * reader sends to the top of the view and grows its reply below it, then
   * follows once the reply fills the view. Default `follow`.
   */
  scroll?: 'follow' | 'anchor'
  /** While a reply streams, so assistive technology reads it once it is complete. */
  busy?: boolean
  class?: string
}

// Within this many pixels of the end, the transcript counts as at the newest message.
const pinSlack = 24
// How much of the previous message shows above an anchored one.
const anchorPeek = 16

// The distance from the top of the document, from layout alone: transforms,
// such as a message's entrance glide, do not move it.
function layoutTop(element: HTMLElement) {
  let top = 0
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null)
    top += node.offsetTop
  return top
}

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
  // The reader's newest message while it is held at the top, and the space
  // after the transcript that makes that position the end.
  let anchor: HTMLElement | null = null
  let space: HTMLElement | null = null
  const spaceRef = ref((node) => {
    space = node instanceof HTMLElement ? node : null
  })

  // Sizes the space so the anchored message, 16px below the top of the view,
  // is the end. It only shrinks as the reply grows; at 0 the anchor lets go.
  function sizeSpace(log: HTMLElement, fresh = false) {
    if (!space || !viewport) return
    const content = viewport.firstElementChild as HTMLElement | null
    if (!anchor?.isConnected || !content) {
      anchor = null
      space.style.height = '0px'
      return
    }
    const origin = layoutTop(content)
    const below = layoutTop(log) - origin + log.offsetHeight - (layoutTop(anchor) - origin)
    const needed = Math.max(0, viewport.clientHeight - anchorPeek - below)
    const current = parseFloat(space.style.height) || 0
    const next = fresh ? needed : Math.min(current, needed)
    space.style.height = `${Math.round(next)}px`
    if (next === 0) anchor = null
  }

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
      if (anchor) sizeSpace(node)
      if (pinned) scrollToEnd()
      else if (grew) setState(false, true)
    })
    observer.observe(node)
    observer.observe(scroller)
    // The reader's own message always brings them to the newest one.
    const added = new MutationObserver((records) => {
      const sent = records
        .flatMap((record) => Array.from(record.addedNodes))
        .filter(
          (child): child is HTMLElement =>
            child instanceof HTMLElement && child.matches('[data-role="user"]'),
        )
        .at(-1)
      if (!sent) return
      setState(true, false)
      if (handle.props.scroll === 'anchor') {
        // Glide the new message up; the space makes its place the end.
        anchor = sent
        sizeSpace(node, true)
        jumping = true
        scrollToEnd(true)
        return
      }
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
    const { children, composer, header, empty, label = 'Conversation', scroll, busy } = handle.props
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
            <div
              class="rf-chat-transcript"
              role="log"
              aria-label={label}
              aria-busy={busy || undefined}
              mix={logMix}
            >
              {children}
            </div>
            {scroll === 'anchor' && (
              <div class="rf-chat-anchor-space" aria-hidden="true" mix={spaceRef} />
            )}
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
