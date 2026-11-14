import { on, ref } from 'remix/component'

/**
 * Drives a native `<dialog>` from a component's open state, for Dialog,
 * AlertDialog and Drawer.
 *
 * The native element already traps focus, makes the page inert and closes on
 * Escape. This adds what it leaves to the page: opening and closing to match
 * state, asking the component before Escape or a backdrop click closes it,
 * following a form with `method="dialog"`, and returning focus to the element
 * that opened it.
 *
 * Remix UI has no dialog primitive. Replace this once it has one.
 */
export interface ModalOptions {
  /** Whether the dialog should be open now. Read on every `sync()`. */
  open(): boolean
  /** Escape, a backdrop click or a dialog form asks to close. */
  onClose(): void
  /** Whether Escape closes it. Default true. */
  closeOnEscape?(): boolean
  /** Whether a press and release on the backdrop closes it. Default true. */
  closeOnBackdrop?(): boolean
  /** Open in place, without the backdrop and focus trap. Default false. */
  nonModal?(): boolean
  /** Runs just before the dialog opens. */
  beforeOpen?(dialog: HTMLDialogElement): void
}

export function modal(options: ModalOptions) {
  let dialog: HTMLDialogElement | null = null
  let invoker: HTMLElement | null = null
  let pressedBackdrop = false

  return {
    /** Mix into the `<dialog>`. */
    dialog: ref((element, signal) => {
      if (!(element instanceof HTMLDialogElement)) return
      dialog = element
      const listen = { signal }
      element.addEventListener(
        'cancel',
        (event) => {
          event.preventDefault()
          if (options.closeOnEscape?.() ?? true) options.onClose()
        },
        listen,
      )
      element.addEventListener(
        'close',
        () => {
          if (element.open) return
          // A form with method="dialog" closes the element directly.
          options.onClose()
          const target = invoker
          invoker = null
          if (
            target?.isConnected &&
            element.ownerDocument.activeElement === element.ownerDocument.body
          )
            target.focus({ preventScroll: true })
        },
        listen,
      )
      // A click counts as a backdrop click only when it starts there too, so
      // a text selection dragged out of the panel does not close it.
      element.addEventListener(
        'pointerdown',
        (event) => {
          pressedBackdrop = onBackdrop(event, element)
        },
        listen,
      )
      element.addEventListener(
        'click',
        (event) => {
          if (
            pressedBackdrop &&
            onBackdrop(event, element) &&
            (options.closeOnBackdrop?.() ?? true)
          )
            options.onClose()
          pressedBackdrop = false
        },
        listen,
      )
      signal.addEventListener(
        'abort',
        () => {
          if (dialog === element) dialog = null
        },
        { once: true },
      )
    }),

    /** Mix into the trigger, so focus returns to it on close. */
    trigger: on<HTMLElement, 'click'>('click', (event) => {
      invoker = event.currentTarget
    }),

    /** Open or close the dialog to match `open()`. Call after each render. */
    sync() {
      if (!dialog?.isConnected || dialog.open === options.open()) return
      if (!options.open()) {
        dialog.close()
        return
      }
      options.beforeOpen?.(dialog)
      if (options.nonModal?.()) dialog.show()
      else dialog.showModal()
    },
  }
}

/** Whether a pointer event landed on a dialog's backdrop rather than its panel. */
export function onBackdrop(event: MouseEvent, dialog: HTMLDialogElement) {
  if (event.target !== dialog) return false
  const rect = dialog.getBoundingClientRect()
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
}
