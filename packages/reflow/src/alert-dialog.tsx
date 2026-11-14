import { on } from 'remix/component'
import type { Handle } from 'remix/component'
import { Button, type ButtonProps } from './button.tsx'
import { type DialogProps, DialogSurface } from './dialog.tsx'

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
