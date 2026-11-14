import { ref, type Handle, type MixInput, type RemixNode } from 'remix/component'
import { anchor } from '@remix-run/ui/anchor'
import type { PopoverPlacement } from './popover.tsx'
import { hoverIntent } from './behaviors/hover-intent.ts'

export interface HoverCardTriggerProps {
  mix: MixInput<HTMLElement>
}

export interface HoverCardProps {
  /** The card's content. */
  children?: RemixNode
  /** Renders the trigger, usually a link. Spread the provided props onto it. */
  renderTrigger: (props: HoverCardTriggerProps) => RemixNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Which side of the trigger the card opens on. Default bottom. */
  placement?: PopoverPlacement
  /** Distance from the trigger in pixels. Default 8. */
  offset?: number
  /** Milliseconds the pointer rests on the trigger, or focus stays on it, before the card opens. Default 500. */
  openDelay?: number
  /** Milliseconds after the pointer leaves the trigger and the card before it closes. Default 200. */
  closeDelay?: number
  size?: 'default' | 'compact'
}

/**
 * A preview card for a link or a name, such as a profile or a page, shown
 * while the pointer rests on its trigger or keyboard focus is on it. It is
 * supplementary: the trigger still works on its own, a tap on a touch screen
 * follows it, and the card never takes focus or locks scrolling. The pointer
 * can cross into the card and use its links; it closes once the pointer has
 * left both, on Escape, or when the page scrolls. It shares Popover's
 * surface and motion.
 *
 * The card is a span, so a trigger can sit inside a paragraph. Keep its
 * content to phrasing elements there, such as span and a, since a div or a
 * list would end the paragraph when the browser parses server-rendered HTML.
 */
export function HoverCard(handle: Handle<HoverCardProps>) {
  let trigger: HTMLElement | null = null
  let card: HTMLElement | null = null
  let localOpen = handle.props.defaultOpen ?? false
  let stopAnchor: (() => void) | undefined
  const isOpen = () => handle.props.open ?? localOpen
  const intent = hoverIntent(handle.signal, {
    open: () => setOpen(true),
    close: () => setOpen(false),
  })

  function setOpen(next: boolean) {
    intent.cancel()
    if (isOpen() === next) return
    localOpen = next
    handle.props.onOpenChange?.(next)
    void handle.update()
  }

  function scheduleOpen() {
    if (isOpen()) intent.stay()
    else intent.enter(handle.props.openDelay ?? 500)
  }

  function scheduleClose() {
    if (isOpen()) intent.leave(handle.props.closeDelay ?? 200)
    else intent.cancel()
  }

  // Shows or hides the card to match the open state, after each render.
  function sync() {
    if (!trigger?.isConnected || !card?.isConnected) return
    const showing = card.matches(':popover-open')
    if (isOpen() && !showing) {
      card.showPopover?.()
      stopAnchor = anchor(card, trigger, {
        placement: handle.props.placement ?? 'bottom',
        offset: handle.props.offset ?? 8,
      })
    } else if (!isOpen() && showing) {
      stopAnchor?.()
      stopAnchor = undefined
      if (card.contains(document.activeElement)) trigger.focus({ preventScroll: true })
      card.hidePopover?.()
    }
  }

  const triggerMix = ref((element, signal) => {
    if (!(element instanceof HTMLElement)) return
    trigger = element
    const options = { signal }
    element.addEventListener(
      'pointerenter',
      (event) => {
        if (event.pointerType !== 'touch') scheduleOpen()
      },
      options,
    )
    element.addEventListener(
      'pointerleave',
      (event) => {
        if (event.pointerType !== 'touch') scheduleClose()
      },
      options,
    )
    element.addEventListener('focus', scheduleOpen, options)
    element.addEventListener(
      'blur',
      (event) => {
        // Tabbing on into the card keeps it open.
        if (!(event.relatedTarget instanceof Node && card?.contains(event.relatedTarget)))
          scheduleClose()
      },
      options,
    )
    element.ownerDocument.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Escape' || !isOpen()) return
        setOpen(false)
      },
      options,
    )
    // The card is placed by script, so while the trigger scrolls it trails a
    // frame behind. A preview belongs to where the pointer rests, so when the
    // page, or anything holding the trigger, scrolls, it closes at once. Other
    // scrollers, such as a carousel elsewhere, leave it be.
    element.ownerDocument.addEventListener(
      'scroll',
      (event) => {
        if (!isOpen()) return
        const source = event.target
        const movesTrigger =
          source === element.ownerDocument || (source instanceof Node && source.contains(element))
        if (movesTrigger) setOpen(false)
      },
      { capture: true, passive: true, signal },
    )
    signal.addEventListener(
      'abort',
      () => {
        intent.cancel()
        stopAnchor?.()
        if (trigger === element) trigger = null
      },
      { once: true },
    )
  })

  const cardMix = ref((element, signal) => {
    if (!(element instanceof HTMLElement)) return
    card = element
    const options = { signal }
    element.addEventListener('pointerenter', () => intent.stay(), options)
    element.addEventListener(
      'pointerleave',
      (event) => {
        if (event.pointerType !== 'touch') scheduleClose()
      },
      options,
    )
    element.addEventListener(
      'focusout',
      (event) => {
        const next = event.relatedTarget
        if (!(next instanceof Node && (element.contains(next) || next === trigger))) scheduleClose()
      },
      options,
    )
    signal.addEventListener(
      'abort',
      () => {
        if (card === element) card = null
      },
      { once: true },
    )
  })

  return () => {
    handle.queueTask(sync)
    return (
      <>
        {handle.props.renderTrigger({ mix: triggerMix })}
        {/* A span, so a card whose trigger sits in a paragraph keeps the
            paragraph whole when the browser parses the server's HTML. */}
        <span
          class="rf-menu-surface rf-popover-surface rf-hover-card"
          popover="manual"
          data-density={handle.props.size}
          mix={cardMix}
        >
          {handle.props.children}
        </span>
      </>
    )
  }
}
