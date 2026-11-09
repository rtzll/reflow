import { ref, type Handle, type MixInput, type RemixNode } from 'remix/component'
import { anchor } from '@remix-run/ui/anchor'
import type { PopoverPlacement } from './popover.tsx'

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
 * left both, or on Escape. It shares Popover's surface and motion.
 */
export function HoverCard(handle: Handle<HoverCardProps>) {
  let trigger: HTMLElement | null = null
  let card: HTMLElement | null = null
  let localOpen = handle.props.defaultOpen ?? false
  let stopAnchor: (() => void) | undefined
  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  const isOpen = () => handle.props.open ?? localOpen

  function setOpen(next: boolean) {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
    if (isOpen() === next) return
    localOpen = next
    handle.props.onOpenChange?.(next)
    void handle.update()
  }

  function scheduleOpen() {
    clearTimeout(closeTimer)
    if (isOpen()) return
    clearTimeout(openTimer)
    openTimer = setTimeout(() => setOpen(true), Math.max(0, handle.props.openDelay ?? 500))
  }

  function scheduleClose() {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
    if (!isOpen()) return
    closeTimer = setTimeout(() => setOpen(false), Math.max(0, handle.props.closeDelay ?? 200))
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
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(openTimer)
        clearTimeout(closeTimer)
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
    element.addEventListener('pointerenter', () => clearTimeout(closeTimer), options)
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
        <div
          class="rf-menu-surface rf-popover-surface rf-hover-card"
          popover="manual"
          data-density={handle.props.size}
          mix={cardMix}
        >
          {handle.props.children}
        </div>
      </>
    )
  }
}
