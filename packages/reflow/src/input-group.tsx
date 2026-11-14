import { on } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import { fluidHover } from './systems/fluid-hover.ts'
import { type ControlSize, classList, type StyledProps } from './systems/styling.ts'
import { Field } from './field.tsx'
import { type InputProps, Input } from './input.tsx'

export type InputGroupProps = StyledProps<'div'> & {
  size?: ControlSize
}

export function InputGroup(handle: Handle<InputGroupProps>) {
  return () => {
    const { class: classProp, className, size, mix, children, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-input-group', classProp, className)}
        data-slot="input-group"
        data-size={size}
        mix={[fluidHover({ nearest: true }), mix]}
      >
        {children}
      </div>
    )
  }
}

type InputFieldAttributes<Input> = Input extends object
  ? Omit<Input, 'children' | 'id'> & {
      id?: string
      label: string
      labelHidden?: boolean
      description?: RemixNode
      error?: RemixNode
      icon?: RemixNode
      onChange?: (value: string, event: Event) => void
    }
  : never

export type InputFieldProps = InputFieldAttributes<InputProps>

export function InputField(handle: Handle<InputFieldProps>) {
  return () => {
    const {
      class: classProp,
      className,
      id,
      label,
      labelHidden,
      description,
      error,
      icon,
      onChange,
      mix,
      'aria-describedby': describedBy,
      'aria-invalid': invalid,
      ...props
    } = handle.props

    return (
      <Field
        class={classList('rf-input-field', classProp, className)}
        aria-disabled={props.disabled || undefined}
        controlId={id}
        label={labelHidden ? <span class="rf-basic-sr-only">{label}</span> : label}
        description={description}
        error={error}
      >
        {(control) => (
          <div
            class="rf-input-field-control"
            data-rf-hover-item
            aria-disabled={props.disabled || undefined}
            mix={on<HTMLDivElement, 'mousedown'>('mousedown', (event) => {
              // A click anywhere on the row (icon, padding) focuses the input.
              const input = event.currentTarget.querySelector('input')
              if (!input || event.target === input) return
              event.preventDefault()
              input.focus()
            })}
          >
            {icon && (
              <span class="rf-input-field-icon" aria-hidden="true">
                {icon}
              </span>
            )}
            <Input
              {...props}
              {...control}
              aria-describedby={
                [describedBy, control['aria-describedby']].filter(Boolean).join(' ') || undefined
              }
              aria-invalid={control['aria-invalid'] ?? invalid}
              mix={[
                onChange &&
                  on<HTMLInputElement, 'input'>('input', (event) => {
                    onChange(event.currentTarget.value, event)
                  }),
                mix,
              ]}
            />
          </div>
        )}
      </Field>
    )
  }
}
