import { on, ref, type Handle } from 'remix/component'
import { Button } from './button.tsx'
import { Icon } from './icon.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface InlineEditProps {
  /** Controlled text value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Called when the user commits a non-empty edit via Enter or Save. */
  onCommit?: (value: string) => void
  /** Called when the user cancels editing via Escape or Cancel. */
  onCancel?: () => void
  /** Accessible name for the editable field (e.g. `'Pull request title'`). */
  label: string
  /** Placeholder shown when the value is empty. */
  placeholder?: string
  /** Disables entering edit mode. */
  disabled?: boolean
  /** Controls spacing and font scale. */
  size?: ControlSize
  class?: string
}

/**
 * Click-to-edit inline text control for pull request titles, issue headings,
 * and saved view names with Enter-to-save, Escape-to-cancel, and focus return.
 */
export function InlineEdit(handle: Handle<InlineEditProps>) {
  let uncontrolled = handle.props.defaultValue ?? ''
  let editing = false
  let draft = ''
  let inputEl: HTMLInputElement | null = null
  let triggerEl: HTMLButtonElement | null = null

  function currentValue(): string {
    return handle.props.value !== undefined ? handle.props.value : uncontrolled
  }

  const mountInput = ref<HTMLInputElement>((node) => {
    inputEl = node
  })

  const mountTrigger = ref<HTMLButtonElement>((node) => {
    triggerEl = node
  })

  return () => {
    const props = handle.props
    const value = currentValue()

    function startEdit() {
      if (props.disabled) return
      draft = value
      editing = true
      void handle.update()
      queueMicrotask(() => {
        inputEl?.focus()
        inputEl?.select()
      })
    }

    function commit() {
      const trimmed = draft.trim()
      if (!trimmed) {
        cancel()
        return
      }
      if (props.value === undefined) uncontrolled = trimmed
      editing = false
      props.onCommit?.(trimmed)
      void handle.update()
      queueMicrotask(() => triggerEl?.focus())
    }

    function cancel() {
      editing = false
      draft = value
      props.onCancel?.()
      void handle.update()
      queueMicrotask(() => triggerEl?.focus())
    }

    if (editing) {
      return (
        <div
          class={classList('rf-inline-edit', props.class)}
          data-editing="true"
          data-size={props.size}
        >
          <input
            type="text"
            class="rf-inline-edit-input"
            aria-label={props.label}
            placeholder={props.placeholder}
            value={draft}
            mix={[
              mountInput,
              on<HTMLInputElement, 'input'>('input', (event) => {
                draft = event.currentTarget.value
                void handle.update()
              }),
              on<HTMLInputElement, 'keydown'>('keydown', (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commit()
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  cancel()
                }
              }),
            ]}
          />
          <Button size="compact" variant="primary" mix={on('click', commit)}>
            Save
          </Button>
          <Button size="compact" variant="ghost" mix={on('click', cancel)}>
            Cancel
          </Button>
        </div>
      )
    }

    return (
      <div class={classList('rf-inline-edit', props.class)} data-size={props.size}>
        <button
          type="button"
          class="rf-inline-edit-trigger"
          aria-label={`Edit ${props.label}`}
          disabled={props.disabled}
          mix={[mountTrigger, on('click', startEdit)]}
        >
          <span class="rf-inline-edit-text">{value || props.placeholder || 'Untitled'}</span>
          {!props.disabled && (
            <span class="rf-inline-edit-icon" aria-hidden="true">
              <Icon name="pencil" size={12} />
            </span>
          )}
        </button>
      </div>
    )
  }
}
