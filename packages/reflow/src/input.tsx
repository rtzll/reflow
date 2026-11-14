import { Icon } from './icon.tsx'
import { on, ref } from 'remix/component'
import type { Handle, Props } from 'remix/component'
import { type ControlSize, classList } from './systems/styling.ts'

type SizedInput<PropsType> = PropsType extends object
  ? Omit<PropsType, 'size' | 'class' | 'className'> & {
      size?: ControlSize
      class?: string
      className?: string
    }
  : never

export type InputProps = SizedInput<Props<'input'>>

function stepNumberInput(event: MouseEvent, direction: 1 | -1) {
  const trigger = event.currentTarget
  if (!(trigger instanceof HTMLButtonElement)) return
  const input = trigger.closest("[data-slot='input-number']")?.querySelector('input')
  if (!input || input.disabled || input.readOnly) return

  const before = input.value
  if (input.step === 'any') {
    const min = input.min === '' ? -Infinity : Number(input.min)
    const max = input.max === '' ? Infinity : Number(input.max)
    input.value = String(Math.min(max, Math.max(min, (Number(input.value) || 0) + direction)))
  } else if (direction === 1) input.stepUp()
  else input.stepDown()

  if (input.value !== before) {
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

export function Input(handle: Handle<InputProps>) {
  const fileState = ref((element, signal) => {
    if (!(element instanceof HTMLInputElement)) return
    const sync = () => element.toggleAttribute('data-has-file', Boolean(element.files?.length))
    element.addEventListener('change', sync, { signal })
    element.form?.addEventListener('reset', () => queueMicrotask(sync), { signal })
    sync()
  })

  return () => {
    const { class: classProp, className, size, ...props } = handle.props
    const isFile = props.type === 'file'
    const input = (
      <input
        {...props}
        class={classList('rf-input', classProp, className)}
        data-slot="input"
        data-size={size}
        mix={[props.mix, isFile && fileState]}
      />
    )

    if (isFile) {
      return (
        <span class="rf-input-with-icon" data-slot="input-file" data-size={size}>
          {input}
          <Icon name="file" class="rf-input-file-icon" />
        </span>
      )
    }

    if (props.type === 'number') {
      return (
        <span class="rf-input-with-icon" data-slot="input-number" data-size={size}>
          {input}
          <span class="rf-input-steppers">
            {([-1, 1] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                tabIndex={-1}
                aria-label={direction === 1 ? 'Increase' : 'Decrease'}
                disabled={props.disabled || props.readOnly}
                mix={[
                  on('mousedown', (event) => event.preventDefault()),
                  on('click', (event) => stepNumberInput(event, direction)),
                ]}
              >
                <Icon name={direction === 1 ? 'plus' : 'minus'} />
              </button>
            ))}
          </span>
        </span>
      )
    }

    return input
  }
}
