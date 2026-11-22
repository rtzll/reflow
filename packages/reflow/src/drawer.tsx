import { on, ref, type Handle, type MixInput, type RemixNode } from 'remix/component'
import { Button, type ButtonProps } from './button.tsx'
import { Icon } from './icon.tsx'
import { modal, onBackdrop } from './behaviors/modal.ts'

export type DrawerSide = 'bottom' | 'top' | 'left' | 'right'

export interface DrawerTriggerProps {
  'aria-haspopup': 'dialog'
  'aria-expanded': boolean
  'aria-controls': string
  mix: MixInput<HTMLElement>
}

export interface DrawerProps {
  /** Contents of the button that opens the drawer. */
  trigger?: RemixNode
  triggerVariant?: ButtonProps['variant']
  triggerSize?: ButtonProps['size']
  /** Renders your own trigger instead of the built-in button. Spread the provided props onto it. */
  renderTrigger?: (props: DrawerTriggerProps) => RemixNode
  title: string
  description?: string
  children?: RemixNode
  /** Footer actions; a callback receives a function that closes the drawer. */
  footer?: RemixNode | ((close: () => void) => RemixNode)
  /** The edge the drawer slides in from. Default bottom. */
  side?: DrawerSide
  /** Shows a grab handle. Default true for dismissible top and bottom drawers. */
  handle?: boolean
  /** Shows a close button. Default true for left and right drawers. */
  showCloseButton?: boolean
  /** Whether Escape, a click on the backdrop or a drag can close it. Default true. */
  dismissible?: boolean
  /** Let the content fill the panel edge to edge, and visually hide the title. */
  flush?: boolean
  class?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Resting heights for a top or bottom drawer, smallest first: a share of the
   * viewport height such as `0.4`, or pixels such as `'320px'`. The panel is
   * as tall as the largest and rests at the current one.
   */
  snapPoints?: readonly DrawerSnapPoint[]
  /** The index of the current snap point, when controlled by the parent. */
  snap?: number
  /** The snap point it opens at when uncontrolled. Default 0. */
  defaultSnap?: number
  /** Called when a drag, the handle or its arrow keys move to another snap point. */
  onSnapChange?: (index: number) => void
  /**
   * Scales the element marked `data-rf-drawer-background` back while a bottom
   * drawer is open, as iOS sheets do.
   */
  scaleBackground?: boolean
}

export type DrawerSnapPoint = number | `${number}px`

// A release past this share of the panel's size, or faster than this many
// pixels per millisecond, closes it; anything less springs back.
const closeShare = 0.25
const flickVelocity = 0.4
const interactive =
  'button, a, input, select, textarea, label, pre, code, [contenteditable], [role="slider"]'

// Open drawers, oldest first. The one under the newest steps back.
const openDrawers: HTMLDialogElement[] = []

function stepBack(dialog: HTMLDialogElement | undefined, behind: boolean) {
  if (!dialog) return
  dialog.toggleAttribute('data-behind', behind)
  if (behind) dialog.style.setProperty('--rf-drawer-behind', '1')
  else dialog.style.removeProperty('--rf-drawer-behind')
  dialog.removeAttribute('data-following')
}

// Leaves the stack, and lets the drawer it covered come forward again.
function leaveStack(dialog: HTMLDialogElement) {
  const index = openDrawers.indexOf(dialog)
  if (index === -1) return
  openDrawers.splice(index, 1)
  stepBack(dialog, false)
  if (index === openDrawers.length) stepBack(openDrawers.at(-1), false)
}

interface Drag {
  pointer: number
  // Where the panel rested when the drag began, and at which snap point.
  start: number
  snap: number
  x: number
  y: number
  started: boolean
  offset: number
  size: number
  // The last two samples, for the release velocity.
  time: number
  previousTime: number
  previousOffset: number
}

/**
 * A panel that slides in from an edge of the screen, for navigation on small
 * screens, filters, details or a short task. It is a modal dialog built on
 * the native element, like Dialog: it traps focus, closes on Escape or a
 * click on the backdrop, and returns focus to its trigger. It follows a drag
 * toward its edge and closes past a quarter of its size or on a quick flick;
 * a drag the other way resists.
 */
export function Drawer(handle: Handle<DrawerProps>) {
  let internalOpen = handle.props.defaultOpen ?? false
  let internalSnap = handle.props.defaultSnap ?? 0
  let drag: Drag | undefined
  let element: HTMLDialogElement | null = null
  let scaled = false
  const id = handle.id
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`
  const open = () => handle.props.open ?? internalOpen
  const side = () => handle.props.side ?? 'bottom'
  const dismissible = () => handle.props.dismissible ?? true

  function requestOpen(next: boolean) {
    if (open() === next) return
    internalOpen = next
    handle.props.onOpenChange?.(next)
    void handle.update()
  }

  function close() {
    requestOpen(false)
  }

  const snapping = () =>
    (side() === 'bottom' || side() === 'top') && (handle.props.snapPoints?.length ?? 0) > 0

  // Each snap point's height in pixels, never taller than the drawer may be.
  function heights() {
    const room = Math.max(0, innerHeight - 48)
    return (handle.props.snapPoints ?? []).map((point) =>
      Math.min(room, typeof point === 'number' ? point * innerHeight : parseFloat(point)),
    )
  }

  function currentSnap() {
    const last = (handle.props.snapPoints?.length ?? 1) - 1
    return Math.min(last, Math.max(0, handle.props.snap ?? internalSnap))
  }

  function requestSnap(index: number) {
    if (index === currentSnap()) return
    internalSnap = index
    handle.props.onSnapChange?.(index)
    void handle.update()
  }

  // Sizes the panel for its largest point and rests it at the current one.
  function applySnap(dialog: HTMLDialogElement) {
    if (!snapping()) {
      dialog.style.removeProperty('--rf-drawer-height')
      delete dialog.dataset.snap
      dialog.removeAttribute('data-snap-full')
      return
    }
    if (drag?.started) return
    const sizes = heights()
    const tallest = sizes[sizes.length - 1]!
    const index = currentSnap()
    dialog.style.setProperty('--rf-drawer-height', `${Math.round(tallest)}px`)
    dialog.dataset.snap = String(index)
    dialog.toggleAttribute('data-snap-full', index === sizes.length - 1)
    setDrag(dialog, tallest - sizes[index]!)
  }

  // Pushes the marked page back while a bottom drawer with scaleBackground is open.
  function syncScale() {
    const root = document.documentElement
    const next = open() && !!handle.props.scaleBackground && side() === 'bottom'
    if (next === scaled) return
    scaled = next
    root.toggleAttribute('data-rf-drawer-scaled', next)
    if (!next) {
      root.removeAttribute('data-rf-drawer-dragging')
      root.style.removeProperty('--rf-drawer-scale')
    }
  }

  handle.signal.addEventListener('abort', () => {
    if (!scaled) return
    scaled = false
    const root = document.documentElement
    root.removeAttribute('data-rf-drawer-scaled')
    root.removeAttribute('data-rf-drawer-dragging')
    root.style.removeProperty('--rf-drawer-scale')
  })

  // While dragged, the scaled page eases back toward its place.
  function scaleProgress(progress: number | undefined) {
    if (!scaled) return
    const root = document.documentElement
    root.toggleAttribute('data-rf-drawer-dragging', progress !== undefined)
    if (progress === undefined) root.style.removeProperty('--rf-drawer-scale')
    else root.style.setProperty('--rf-drawer-scale', String(1 - progress))
  }

  // The drawer behind comes forward as this one is dragged toward closing.
  function followBehind(dialog: HTMLDialogElement, progress: number | undefined) {
    const index = openDrawers.indexOf(dialog)
    if (index < 1 || index !== openDrawers.length - 1) return
    const behind = openDrawers[index - 1]!
    behind.toggleAttribute('data-following', progress !== undefined)
    behind.style.setProperty('--rf-drawer-behind', String(1 - (progress ?? 0)))
  }

  // Arrow keys on the handle: toward the open side expands.
  function snapKey(event: KeyboardEvent) {
    const expand = side() === 'bottom' ? 'ArrowUp' : 'ArrowDown'
    const collapse = side() === 'bottom' ? 'ArrowDown' : 'ArrowUp'
    if (event.key !== expand && event.key !== collapse) return
    event.preventDefault()
    const last = (handle.props.snapPoints?.length ?? 1) - 1
    const index = currentSnap() + (event.key === expand ? 1 : -1)
    requestSnap(Math.min(last, Math.max(0, index)))
  }

  function cycleSnap() {
    const count = handle.props.snapPoints?.length ?? 1
    requestSnap((currentSnap() + 1) % count)
  }

  const panel = modal({
    open,
    onClose: close,
    closeOnEscape: dismissible,
    closeOnBackdrop: dismissible,
    beforeOpen: (dialog) => {
      setDrag(dialog, 0)
      applySnap(dialog)
      // Opened over another drawer, that one steps back.
      leaveStack(dialog)
      stepBack(openDrawers.at(-1), true)
      openDrawers.push(dialog)
    },
  })

  function setDrag(element: HTMLElement, offset: number, size = 1) {
    element.style.setProperty('--rf-drawer-drag', `${Math.round(offset)}px`)
    element.style.setProperty(
      '--rf-drawer-progress',
      String(Math.min(1, Math.max(0, offset / size))),
    )
  }

  // Whether the content under the pointer would scroll instead: a drag
  // toward the edge belongs to a scroller that is not at its start.
  function scrollsFirst(target: Element, element: HTMLDialogElement) {
    const vertical = side() === 'bottom' || side() === 'top'
    for (let node: Element | null = target; node; node = node.parentElement) {
      if (node instanceof HTMLElement) {
        const style = getComputedStyle(node)
        const overflow = vertical ? style.overflowY : style.overflowX
        if (/auto|scroll/.test(overflow)) {
          if (side() === 'bottom' && node.scrollTop > 0) return true
          if (side() === 'top' && node.scrollTop + node.clientHeight < node.scrollHeight - 1)
            return true
          if (side() === 'right' && node.scrollLeft > 0) return true
          if (side() === 'left' && node.scrollLeft + node.clientWidth < node.scrollWidth - 1)
            return true
        }
      }
      if (node === element) break
    }
    return false
  }

  // How far the pointer has moved toward the drawer's edge, and across it.
  function travel(event: PointerEvent, start: Drag) {
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    switch (side()) {
      case 'bottom':
        return [dy, dx]
      case 'top':
        return [-dy, dx]
      case 'right':
        return [dx, dy]
      case 'left':
        return [-dx, dy]
    }
  }

  function endDrag(event: PointerEvent, element: HTMLDialogElement) {
    if (!drag || drag.pointer !== event.pointerId) return
    const current = drag
    drag = undefined
    if (!current.started) return
    element.removeAttribute('data-dragging')
    scaleProgress(undefined)
    followBehind(element, undefined)
    const now = performance.now()
    // Held still before letting go, the throw has no speed left.
    const velocity =
      now - current.time > 100
        ? 0
        : (current.offset - current.previousOffset) /
          Math.max(1, current.time - current.previousTime)
    if (snapping()) {
      settleSnap(element, current, velocity)
      return
    }
    if (
      current.offset > 0 &&
      (current.offset > current.size * closeShare || velocity > flickVelocity)
    ) {
      close()
      return
    }
    setDrag(element, 0)
  }

  // A flick moves one point; otherwise the nearest point wins. Past a quarter
  // of the smallest point, or flicked down from it, the drawer closes.
  function settleSnap(element: HTMLDialogElement, current: Drag, velocity: number) {
    const sizes = heights()
    const tallest = sizes[sizes.length - 1]!
    const rests = sizes.map((size) => tallest - size)
    let target: number
    if (Math.abs(velocity) > flickVelocity) {
      target = current.snap + (velocity > 0 ? -1 : 1)
    } else if (current.offset > rests[0]! + sizes[0]! * closeShare) {
      target = -1
    } else {
      target = 0
      rests.forEach((rest, index) => {
        if (Math.abs(current.offset - rest) < Math.abs(current.offset - rests[target]!))
          target = index
      })
    }
    if (target < 0 && dismissible()) {
      close()
      return
    }
    target = Math.min(sizes.length - 1, Math.max(0, target))
    if (target === currentSnap()) applySnap(element)
    else requestSnap(target)
  }

  // Follows a drag toward the drawer's edge. The modal behavior handles the rest.
  const dragMix = ref((node, signal) => {
    element = node instanceof HTMLDialogElement ? node : null
    signal.addEventListener('abort', () => {
      if (element === node) element = null
    })
    attachDrag(node, signal)
  })

  function attachDrag(element: Element, signal: AbortSignal) {
    if (!(element instanceof HTMLDialogElement)) return
    const options = { signal }
    element.addEventListener('close', () => leaveStack(element), options)
    signal.addEventListener('abort', () => leaveStack(element), { once: true })
    addEventListener(
      'resize',
      () => {
        if (element.open && snapping()) applySnap(element)
      },
      options,
    )
    element.addEventListener(
      'pointerdown',
      (event) => {
        if (onBackdrop(event, element) || event.button !== 0) return
        if (!dismissible() && !snapping()) return
        const target = event.target
        if (!(target instanceof Element)) return
        // A drawer opened inside this one handles its own drags.
        if (target.closest('dialog') !== element) return
        if (target.closest(interactive) && !target.closest('.rf-drawer-handle')) return
        if (scrollsFirst(target, element)) return
        const rect = element.getBoundingClientRect()
        const now = performance.now()
        const start = parseFloat(element.style.getPropertyValue('--rf-drawer-drag')) || 0
        drag = {
          pointer: event.pointerId,
          start,
          snap: currentSnap(),
          x: event.clientX,
          y: event.clientY,
          started: false,
          offset: start,
          size: side() === 'bottom' || side() === 'top' ? rect.height : rect.width,
          time: now,
          previousTime: now,
          previousOffset: start,
        }
      },
      options,
    )
    element.addEventListener(
      'pointermove',
      (event) => {
        if (!drag || drag.pointer !== event.pointerId) return
        const [along, across] = travel(event, drag)
        if (!drag.started) {
          if (Math.abs(along) < 4 && Math.abs(across) < 4) return
          // Sideways first, it is a selection or a scroll, not a drag.
          if (Math.abs(across) > Math.abs(along)) {
            drag = undefined
            return
          }
          drag.started = true
          element.setAttribute('data-dragging', '')
          try {
            element.setPointerCapture(event.pointerId)
          } catch {
            // Synthetic pointers have nothing to capture.
          }
        }
        // Toward the edge it follows the pointer; away from it, it resists.
        const resist = (distance: number) => distance / (1 + Math.abs(distance) / 24)
        let offset = drag.start + along
        let progress: number
        if (snapping()) {
          const sizes = heights()
          const lowest = sizes[sizes.length - 1]! - sizes[0]!
          if (offset < 0) offset = resist(offset)
          // A drawer that cannot close resists past its smallest point too.
          else if (!dismissible() && offset > lowest) offset = lowest + resist(offset - lowest)
          progress = Math.min(1, Math.max(0, (offset - lowest) / sizes[0]!))
        } else {
          offset = along >= 0 ? along : resist(along)
          progress = Math.min(1, Math.max(0, offset / drag.size))
        }
        drag.previousOffset = drag.offset
        drag.previousTime = drag.time
        drag.offset = offset
        drag.time = performance.now()
        element.style.setProperty('--rf-drawer-drag', `${Math.round(offset)}px`)
        element.style.setProperty('--rf-drawer-progress', String(progress))
        scaleProgress(progress)
        followBehind(element, progress)
      },
      options,
    )
    element.addEventListener('pointerup', (event) => endDrag(event, element), options)
    element.addEventListener('pointercancel', (event) => endDrag(event, element), options)
  }

  return () => {
    const props = handle.props
    handle.queueTask(() => {
      panel.sync()
      if (element?.open) applySnap(element)
      syncScale()
    })
    const footer = typeof props.footer === 'function' ? props.footer(close) : props.footer
    const vertical = side() === 'bottom' || side() === 'top'
    const snaps = snapping()
    const showHandle = props.handle ?? (vertical && (dismissible() || snaps))
    const expanded = snaps && currentSnap() === (props.snapPoints?.length ?? 1) - 1
    const showClose = props.showCloseButton ?? (!vertical && !props.flush)
    const triggerProps: DrawerTriggerProps = {
      'aria-haspopup': 'dialog',
      'aria-expanded': open(),
      'aria-controls': id,
      mix: [panel.trigger, on('click', () => requestOpen(true))],
    }
    return (
      <>
        {props.renderTrigger
          ? props.renderTrigger(triggerProps)
          : props.trigger != null && (
              <Button
                variant={props.triggerVariant ?? 'tertiary'}
                size={props.triggerSize}
                {...triggerProps}
              >
                {props.trigger}
              </Button>
            )}
        <dialog
          id={id}
          class={props.class ? `rf-drawer ${props.class}` : 'rf-drawer'}
          data-side={side()}
          data-flush={props.flush || undefined}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={props.description ? descriptionId : undefined}
          mix={[panel.dialog, dragMix]}
        >
          {showHandle &&
            (snaps ? (
              <button
                type="button"
                class="rf-drawer-handle"
                aria-label={expanded ? 'Collapse drawer' : 'Expand drawer'}
                aria-expanded={expanded}
                aria-controls={id}
                mix={[on('click', cycleSnap), on<HTMLButtonElement, 'keydown'>('keydown', snapKey)]}
              />
            ) : (
              <div class="rf-drawer-handle" aria-hidden="true" />
            ))}
          <header class="rf-drawer-header">
            <h2 id={titleId}>{props.title}</h2>
            {props.description && <p id={descriptionId}>{props.description}</p>}
          </header>
          {props.children != null && <div class="rf-drawer-body">{props.children}</div>}
          {footer != null && <footer class="rf-drawer-footer">{footer}</footer>}
          {showClose && (
            <Button
              variant="ghost"
              size="icon-compact"
              class="rf-drawer-close"
              aria-label="Close drawer"
              mix={on('click', close)}
            >
              <Icon name="x" size={14} />
            </Button>
          )}
        </dialog>
      </>
    )
  }
}
