import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { Field, Input, type ControlSize } from './basic.tsx'

export interface NumberFieldProps {
  label: string
  name?: string
  description?: RemixNode
  error?: RemixNode
  value?: number | null
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  size?: ControlSize
  /** Drag the label horizontally to change the number. */
  scrub?: boolean
  onValueChange?: (value: number | null) => void
}

export function NumberField(handle: Handle<NumberFieldProps>) {
  let input: HTMLInputElement | undefined
  let drag: { id: number; x: number; value: string; steps: number } | undefined
  let suppressClick = false
  const inputRef = ref<HTMLInputElement>((element, signal) => {
    input = element
    element.form?.addEventListener(
      'reset',
      (event) => {
        queueMicrotask(() => {
          if (event.defaultPrevented || signal.aborted) return
          const { value, onValueChange } = handle.props
          if (value !== undefined) element.value = value == null ? '' : String(value)
          else onValueChange?.(Number.isNaN(element.valueAsNumber) ? null : element.valueAsNumber)
        })
      },
      { signal },
    )
    signal.addEventListener(
      'abort',
      () => {
        input = undefined
      },
      { once: true },
    )
  })

  return () => {
    const { label, description, error, value, defaultValue, scrub, onValueChange, ...props } =
      handle.props
    const controlLabel = scrub ? (
      <span
        class="rf-number-scrub"
        mix={[
          on<HTMLSpanElement, 'pointerdown'>('pointerdown', (event) => {
            suppressClick = false
            if (
              !input ||
              input.matches(':disabled') ||
              input.readOnly ||
              !event.isPrimary ||
              event.button !== 0
            )
              return
            drag = { id: event.pointerId, x: event.clientX, value: input.value, steps: 0 }
            event.currentTarget.setPointerCapture(event.pointerId)
          }),
          on<HTMLSpanElement, 'pointermove'>('pointermove', (event) => {
            if (
              !drag ||
              drag.id !== event.pointerId ||
              !input ||
              input.matches(':disabled') ||
              input.readOnly
            )
              return
            const steps = Math.trunc((event.clientX - drag.x) / 5)
            if (steps === drag.steps) return
            drag.steps = steps
            suppressClick = true
            const before = input.value
            input.value = drag.value
            if (steps) input.stepUp(steps)
            if (input.value !== before) input.dispatchEvent(new Event('input', { bubbles: true }))
          }),
          on('lostpointercapture', () => {
            drag = undefined
          }),
          on('click', (event) => {
            if (suppressClick) event.preventDefault()
            suppressClick = false
          }),
        ]}
      >
        {label}
      </span>
    ) : (
      label
    )
    return (
      <Field label={controlLabel} description={description} error={error}>
        {(control) => (
          <Input
            {...props}
            {...control}
            type="number"
            value={value === null ? '' : value}
            defaultValue={value === undefined ? defaultValue : undefined}
            mix={[
              inputRef,
              on<HTMLInputElement, 'input'>('input', (event) => {
                const element = event.currentTarget
                const number = element.valueAsNumber
                onValueChange?.(Number.isNaN(number) ? null : number)
                if (handle.props.value !== undefined) {
                  // A rejected edit leaves the prop unchanged, so Remix has no DOM patch to apply.
                  element.value = handle.props.value == null ? '' : String(handle.props.value)
                }
              }),
            ]}
          />
        )}
      </Field>
    )
  }
}
