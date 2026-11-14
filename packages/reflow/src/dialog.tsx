import { Icon } from './icon.tsx'
import { on } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import { Button, type ButtonProps } from './button.tsx'
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

export function DialogSurface(handle: Handle<DialogSurfaceProps>) {
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
