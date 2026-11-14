import { Icon } from './icon.tsx'
import { on, ref } from 'remix/component'
import type { Handle, MixInput, RemixNode } from 'remix/component'
import { anchor } from '@remix-run/ui/anchor'
import { Button, type ButtonProps } from './basic.tsx'
import { hoverIntent } from './behaviors/hover-intent.ts'
import { modal } from './behaviors/modal.ts'

export interface DialogProps {
  /** Contents of the button that opens the dialog. */
  trigger?: RemixNode
  triggerVariant?: ButtonProps['variant']
  triggerSize?: ButtonProps['size']
  title: string
  description?: string
  children?: RemixNode
  /** Render footer actions with a callback that requests dismissal. */
  footer?: RemixNode | ((close: () => void) => RemixNode)
  size?: 'sm' | 'lg' | 'xl'
  position?: 'center' | 'top'
  /** Let a child composition fill the panel and visually hide the title. */
  flush?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  showCloseButton?: boolean
  dismissOnBackdrop?: boolean
  modal?: boolean
}

export function Dialog(handle: Handle<DialogProps>) {
  return () => <DialogSurface {...handle.props} />
}

interface DialogSurfaceProps extends DialogProps {
  role?: 'alertdialog'
}

function DialogSurface(handle: Handle<DialogSurfaceProps>) {
  let internalOpen = handle.props.defaultOpen ?? false
  const id = handle.id
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`
  const open = () => handle.props.open ?? internalOpen

  function requestOpen(next: boolean) {
    if (open() === next) return
    internalOpen = next
    handle.props.onOpenChange?.(next)
    void handle.update()
  }

  function close() {
    requestOpen(false)
  }

  const dialog = modal({
    open,
    onClose: close,
    closeOnBackdrop: () => handle.props.dismissOnBackdrop ?? true,
    nonModal: () => handle.props.modal === false,
  })

  return () => {
    const props = handle.props
    handle.queueTask(dialog.sync)
    const footer = typeof props.footer === 'function' ? props.footer(close) : props.footer
    return (
      <>
        {props.trigger != null && (
          <Button
            variant={props.triggerVariant ?? 'tertiary'}
            size={props.triggerSize}
            aria-haspopup="dialog"
            aria-controls={id}
            aria-expanded={open()}
            mix={[dialog.trigger, on('click', () => requestOpen(true))]}
          >
            {props.trigger}
          </Button>
        )}
        <dialog
          id={id}
          role={props.role}
          class="rf-dialog"
          data-size={props.size ?? 'sm'}
          data-flush={props.flush || undefined}
          data-position={props.position ?? 'center'}
          aria-modal={props.modal === false ? undefined : true}
          aria-labelledby={titleId}
          aria-describedby={props.description ? descriptionId : undefined}
          mix={dialog.dialog}
        >
          <header class="rf-dialog-header">
            <h2 id={titleId}>{props.title}</h2>
            {props.description && <p id={descriptionId}>{props.description}</p>}
          </header>
          {props.children != null && <div class="rf-dialog-body">{props.children}</div>}
          {footer != null && <footer class="rf-dialog-footer">{footer}</footer>}
          {(props.showCloseButton ?? true) && (
            <Button
              variant="ghost"
              size="icon-compact"
              class="rf-dialog-close"
              aria-label="Close dialog"
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

export interface AlertDialogProps extends Pick<
  DialogProps,
  'trigger' | 'triggerVariant' | 'triggerSize' | 'title' | 'open' | 'defaultOpen' | 'onOpenChange'
> {
  description: string
  confirmLabel: string
  cancelLabel?: string
  confirmVariant?: ButtonProps['variant']
  onConfirm: () => void
}

/** Confirm an action in a modal with the safer choice focused first. */
export function AlertDialog(handle: Handle<AlertDialogProps>) {
  return () => {
    const {
      confirmLabel,
      cancelLabel = 'Cancel',
      confirmVariant = 'destructive',
      onConfirm,
      ...props
    } = handle.props
    return (
      <DialogSurface
        {...props}
        role="alertdialog"
        dismissOnBackdrop={false}
        showCloseButton={false}
        footer={(close) => (
          <>
            <Button autofocus variant="secondary" mix={on('click', close)}>
              {cancelLabel}
            </Button>
            <Button
              variant={confirmVariant}
              mix={on('click', () => {
                onConfirm()
                close()
              })}
            >
              {confirmLabel}
            </Button>
          </>
        )}
      />
    )
  }
}

export interface TooltipTriggerProps {
  'aria-describedby': string
  mix: MixInput
}

export interface TooltipProps {
  content: RemixNode
  /** Return a focusable element, spreading the provided props onto it. */
  renderTrigger: (props: TooltipTriggerProps) => RemixNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  delayDuration?: number
  followCursor?: boolean | 'x' | 'y'
  /** Forces the tooltip open (true) or closed (false). Leave undefined for hover and focus behaviour. */
  open?: boolean
  /** Called when hover or focus opens or closes the tooltip, before `open` is applied. */
  onOpenChange?: (open: boolean) => void
}

export function Tooltip(handle: Handle<TooltipProps>) {
  let trigger: HTMLElement | null = null
  let popup: HTMLElement | null = null
  let stopAnchor: (() => void) | undefined
  let openEvents: AbortController | undefined
  const intent = hoverIntent(handle.signal, { open: show, close: hide })
  let triggerHovered = false
  let popupHovered = false
  let focused = false
  let dismissed = false
  let cursor: { x: number; y: number } | undefined
  let internalOpen = false
  let pointerDown = false

  function positionCursor() {
    if (!popup || !cursor || !handle.props.followCursor || focused) return
    const rect = popup.getBoundingClientRect()
    const triggerRect = trigger?.getBoundingClientRect()
    const { followCursor, side = 'top', sideOffset = 8 } = handle.props
    let left = cursor.x + 12
    let top = cursor.y + 16
    if (followCursor === 'x' && triggerRect) {
      left = cursor.x - rect.width / 2
      top =
        side === 'bottom'
          ? triggerRect.bottom + sideOffset
          : triggerRect.top - rect.height - sideOffset
    } else if (followCursor === 'y' && triggerRect) {
      left =
        side === 'left'
          ? triggerRect.left - rect.width - sideOffset
          : triggerRect.right + sideOffset
      top = cursor.y - rect.height / 2
    }
    popup.style.left = `${Math.max(8, Math.min(left, innerWidth - rect.width - 8))}px`
    popup.style.top = `${Math.max(8, Math.min(top, innerHeight - rect.height - 8))}px`
  }

  function setInternal(next: boolean) {
    if (internalOpen === next) return
    internalOpen = next
    handle.props.onOpenChange?.(next)
  }

  function menuIsOpen() {
    return (
      trigger?.getAttribute('aria-haspopup') === 'menu' &&
      trigger.getAttribute('aria-expanded') === 'true'
    )
  }

  // The tooltip is shown when `open` forces it, otherwise when hover or focus asks for it.
  function sync() {
    const visible = handle.props.open ?? internalOpen
    if (visible && !menuIsOpen()) open()
    else close()
  }

  function hide() {
    intent.cancel()
    setInternal(false)
    sync()
  }

  function show() {
    intent.stay()
    if (!trigger?.isConnected || !popup?.isConnected || dismissed || menuIsOpen()) return
    setInternal(true)
    sync()
  }

  function close() {
    stopAnchor?.()
    stopAnchor = undefined
    openEvents?.abort()
    openEvents = undefined
    if (popup?.hasAttribute('data-open')) {
      if (popup.isConnected) popup.hidePopover?.()
      popup.removeAttribute('data-open')
    }
    popupHovered = false
  }

  function open() {
    if (!trigger?.isConnected || !popup?.isConnected || popup.hasAttribute('data-open')) return
    const { side = 'top', sideOffset = 8 } = handle.props
    popup.setAttribute('data-open', '')
    popup.showPopover?.()
    // A forced-open tooltip has no pointer to follow: it rests on the trigger.
    if (handle.props.followCursor && !focused && triggerHovered && cursor) positionCursor()
    else stopAnchor = anchor(popup, trigger, { placement: side, offset: sideOffset })
    openEvents = new AbortController()
    trigger.ownerDocument.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Escape' || event.defaultPrevented) return
        dismissed = true
        hide()
        event.preventDefault()
      },
      { capture: true, signal: openEvents.signal },
    )
  }

  function leave() {
    if (triggerHovered || popupHovered || focused) {
      intent.cancel()
      return
    }
    // Let the pointer cross the gap between the trigger and the tooltip.
    intent.leave(130)
  }

  const triggerMix = ref((element, signal) => {
    if (!(element instanceof HTMLElement)) return
    trigger = element
    if (element.getAttribute('aria-haspopup') === 'menu') {
      const observer = new MutationObserver(() => {
        if (menuIsOpen()) hide()
      })
      observer.observe(element, { attributeFilter: ['aria-expanded'] })
      signal.addEventListener('abort', () => observer.disconnect(), { once: true })
    }
    element.addEventListener(
      'pointerenter',
      (event) => {
        if (event.pointerType === 'touch') return
        cursor = { x: event.clientX, y: event.clientY }
        triggerHovered = true
        dismissed = false
        intent.enter(handle.props.delayDuration ?? 200)
      },
      { signal },
    )
    // A press closes the tooltip and keeps it closed until the pointer leaves and returns.
    element.addEventListener(
      'pointerdown',
      (event) => {
        if (event.pointerType === 'touch') return
        pointerDown = true
        element.ownerDocument.addEventListener(
          'pointerup',
          () => {
            pointerDown = false
          },
          { once: true },
        )
        dismissed = true
        hide()
      },
      { signal },
    )
    element.addEventListener(
      'pointermove',
      (event) => {
        cursor = { x: event.clientX, y: event.clientY }
        if (popup?.hasAttribute('data-open')) positionCursor()
      },
      { signal },
    )
    element.addEventListener(
      'pointerleave',
      () => {
        triggerHovered = false
        leave()
      },
      { signal },
    )
    element.addEventListener(
      'focus',
      () => {
        focused = true
        if (pointerDown) return
        dismissed = false
        show()
      },
      { signal },
    )
    element.addEventListener(
      'blur',
      () => {
        focused = false
        leave()
      },
      { signal },
    )
    signal.addEventListener(
      'abort',
      () => {
        if (trigger !== element) return
        hide()
        trigger = null
        triggerHovered = false
        focused = false
      },
      { once: true },
    )
  })

  const popupMix = ref((element, signal) => {
    if (!(element instanceof HTMLElement)) return
    popup = element
    element.addEventListener(
      'pointerenter',
      () => {
        popupHovered = true
        intent.stay()
      },
      { signal },
    )
    element.addEventListener(
      'pointerleave',
      () => {
        popupHovered = false
        leave()
      },
      { signal },
    )
    signal.addEventListener(
      'abort',
      () => {
        if (popup !== element) return
        hide()
        popup = null
      },
      { once: true },
    )
  })

  return () => {
    handle.queueTask(sync)
    return (
      <>
        {handle.props.renderTrigger({ 'aria-describedby': handle.id, mix: triggerMix })}
        <span
          id={handle.id}
          class="rf-tooltip"
          role="tooltip"
          popover="manual"
          data-side={handle.props.side ?? 'top'}
          mix={popupMix}
        >
          {handle.props.content}
        </span>
      </>
    )
  }
}
