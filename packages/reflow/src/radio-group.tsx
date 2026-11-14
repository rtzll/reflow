import { on, type Handle } from 'remix/component'
import { fluidHover } from './systems/fluid-hover.ts'
import type { GroupProps } from './checkbox-group.tsx'

export interface RadioGroupProps extends GroupProps {
  value?: string
  defaultValue?: string
  required?: boolean
  onValueChange?: (value: string) => void
}

export function RadioGroup(handle: Handle<RadioGroupProps>) {
  return () => {
    const {
      options,
      label,
      hideLabel,
      name = handle.id,
      disabled,
      required,
      value,
      defaultValue,
      onValueChange,
      orientation = 'vertical',
    } = handle.props
    return (
      <fieldset class="rf-choice-group" disabled={disabled}>
        <legend class={hideLabel ? 'rf-basic-sr-only' : undefined}>{label}</legend>
        <div
          class="rf-choice-group-list"
          data-orientation={orientation}
          mix={fluidHover({
            axis: orientation === 'horizontal' ? 'x' : 'y',
            selectedSelector: ':has(input:checked)',
            focusSelector: ':has(input:focus-visible)',
          })}
        >
          <div class="rf-highlight" aria-hidden="true" data-rf-hover-layer />
          <div
            class="rf-highlight rf-choice-selection"
            aria-hidden="true"
            data-rf-selection-layer
          />
          <div class="rf-highlight rf-focus-ring" aria-hidden="true" data-rf-focus-layer />
          {options.map((option) => (
            <label
              key={option.value}
              class="rf-choice-group-row rf-radio"
              data-rf-hover-item
              aria-disabled={disabled || option.disabled || undefined}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                disabled={option.disabled}
                required={required}
                {...(value === undefined
                  ? { defaultChecked: defaultValue === option.value }
                  : { checked: value === option.value })}
                mix={
                  onValueChange &&
                  on<HTMLInputElement, 'change'>('change', (event) => {
                    if (event.currentTarget.checked) onValueChange(option.value)
                  })
                }
              />
              <span class="rf-radio-mark" aria-hidden="true" />
              <span class="rf-radio-body">
                <span class="rf-radio-text">
                  <span class="rf-radio-sizer" aria-hidden="true">
                    {option.label}
                  </span>
                  <span class="rf-radio-label">{option.label}</span>
                </span>
                {option.description && <small>{option.description}</small>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }
}
