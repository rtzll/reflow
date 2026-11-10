import { on, ref, type Handle, type MixInput, type RemixNode } from 'remix/component'
import { Button, type ButtonProps } from './basic.tsx'
import { Icon } from './icon.tsx'

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
}

// A release past this share of the panel's size, or faster than this many
// pixels per millisecond, closes it; anything less springs back.
const closeShare = 0.25
const flickVelocity = 0.4
const interactive = 'button, a, input, select, textarea, label, [contenteditable], [role="slider"]'

interface Drag {
  pointer: number
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
  let dialog: HTMLDialogElement | null = null
  let invoker: HTMLElement | null = null
  let internalOpen = handle.props.defaultOpen ?? false
  let pressedBackdrop = false
  let drag: Drag | undefined
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

  function sync() {
    if (!dialog?.isConnected || dialog.open === open()) return
    if (open()) {
      setDrag(dialog, 0)
      dialog.showModal()
    } else dialog.close()
  }

  function setDrag(element: HTMLElement, offset: number, size = 1) {
    element.style.setProperty('--rf-drawer-drag', `${Math.round(offset)}px`)
    element.style.setProperty(
      '--rf-drawer-progress',
      String(Math.min(1, Math.max(0, offset / size))),
    )
  }

  function outsidePanel(event: MouseEvent, element: HTMLDialogElement) {
    if (event.target !== element) return false
    const rect = element.getBoundingClientRect()
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
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
    const now = performance.now()
    // Held still before letting go, the throw has no speed left.
    const velocity =
      now - current.time > 100
        ? 0
        : (current.offset - current.previousOffset) /
          Math.max(1, current.time - current.previousTime)
    if (
      current.offset > 0 &&
      (current.offset > current.size * closeShare || velocity > flickVelocity)
    ) {
      close()
      return
    }
    setDrag(element, 0)
  }

  const dialogMix = ref((element, signal) => {
    if (!(element instanceof HTMLDialogElement)) return
    dialog = element
    const options = { signal }
    element.addEventListener(
      'cancel',
      (event) => {
        event.preventDefault()
        if (dismissible()) close()
      },
      options,
    )
    element.addEventListener(
      'close',
      () => {
        if (element.open) return
        close()
        const target = invoker
        invoker = null
        if (
          target?.isConnected &&
          element.ownerDocument.activeElement === element.ownerDocument.body
        )
          target.focus({ preventScroll: true })
      },
      options,
    )
    element.addEventListener(
      'pointerdown',
      (event) => {
        pressedBackdrop = outsidePanel(event, element)
        if (pressedBackdrop || !dismissible() || event.button !== 0) return
        const target = event.target
        if (!(target instanceof Element) || target.closest(interactive)) return
        if (scrollsFirst(target, element)) return
        const rect = element.getBoundingClientRect()
        const now = performance.now()
        drag = {
          pointer: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          started: false,
          offset: 0,
          size: side() === 'bottom' || side() === 'top' ? rect.height : rect.width,
          time: now,
          previousTime: now,
          previousOffset: 0,
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
        const offset = along >= 0 ? along : along / (1 + Math.abs(along) / 24)
        drag.previousOffset = drag.offset
        drag.previousTime = drag.time
        drag.offset = offset
        drag.time = performance.now()
        setDrag(element, offset, drag.size)
      },
      options,
    )
    element.addEventListener('pointerup', (event) => endDrag(event, element), options)
    element.addEventListener('pointercancel', (event) => endDrag(event, element), options)
    element.addEventListener(
      'click',
      (event) => {
        if (pressedBackdrop && outsidePanel(event, element) && dismissible()) close()
        pressedBackdrop = false
      },
      options,
    )
    signal.addEventListener(
      'abort',
      () => {
        if (dialog === element) dialog = null
      },
      { once: true },
    )
  })

  return () => {
    const props = handle.props
    handle.queueTask(sync)
    const footer = typeof props.footer === 'function' ? props.footer(close) : props.footer
    const vertical = side() === 'bottom' || side() === 'top'
    const showHandle = props.handle ?? (vertical && dismissible())
    const showClose = props.showCloseButton ?? (!vertical && !props.flush)
    const triggerProps: DrawerTriggerProps = {
      'aria-haspopup': 'dialog',
      'aria-expanded': open(),
      'aria-controls': id,
      mix: on('click', (event) => {
        if (event.currentTarget instanceof HTMLElement) invoker = event.currentTarget
        requestOpen(true)
      }),
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
          mix={dialogMix}
        >
          {showHandle && <div class="rf-drawer-handle" aria-hidden="true" />}
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
