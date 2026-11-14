import { on, type Handle, type RemixNode } from 'remix/component'
import { Checkbox } from './checkbox.tsx'
import { fluidHover } from './systems/fluid-hover.ts'
import { selectionRuns } from './selection-runs.ts'
import { navigationIndex } from './behaviors/list-navigation.ts'

export interface GroupOption {
  value: string
  label: RemixNode
  description?: RemixNode
  disabled?: boolean
}

export interface GroupProps {
  options: readonly GroupOption[]
  label: string
  hideLabel?: boolean
  name?: string
  disabled?: boolean
  orientation?: 'vertical' | 'horizontal'
}

export interface CheckboxGroupProps extends GroupProps {
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (value: string[]) => void
}

export function CheckboxGroup(handle: Handle<CheckboxGroupProps>) {
  // The checked fill moves with the selection, as in the reference. A
  // controlled value changes without a change event, so each render resyncs.
  const runs = selectionRuns()
  return () => {
    const {
      options,
      label,
      hideLabel,
      name,
      disabled,
      value,
      defaultValue,
      onValueChange,
      orientation = 'vertical',
    } = handle.props
    const vertical = orientation !== 'horizontal'
    if (vertical) handle.queueTask(runs.sync)
    return (
      <fieldset class="rf-choice-group" disabled={disabled}>
        <legend class={hideLabel ? 'rf-basic-sr-only' : undefined}>{label}</legend>
        <div
          class="rf-choice-group-list"
          data-orientation={orientation}
          mix={[
            vertical && runs.mix,
            fluidHover({
              axis: orientation === 'horizontal' ? 'x' : 'y',
              focusSelector: ':has(input:focus-visible)',
            }),
            on<HTMLDivElement, 'keydown'>('keydown', (event) => {
              // Arrows move focus between rows (wrapping), Home/End jump to the ends.
              const inputs = Array.from(
                event.currentTarget.querySelectorAll<HTMLInputElement>(
                  'input[type="checkbox"]:not(:disabled)',
                ),
              )
              const index = inputs.indexOf(event.target as HTMLInputElement)
              if (index === -1) return
              const next = navigationIndex(event.key, index, inputs.length, {
                orientation: orientation === 'horizontal' ? 'horizontal' : 'vertical',
              })
              if (next === undefined) return
              event.preventDefault()
              inputs[next]?.focus()
            }),
            onValueChange &&
              on<HTMLDivElement, 'change'>('change', (event) => {
                const selected = event.currentTarget.querySelectorAll<HTMLInputElement>(
                  'input[type="checkbox"]:checked',
                )
                onValueChange(Array.from(selected, (input) => input.value))
              }),
          ]}
        >
          {vertical && <div class="rf-choice-runs" aria-hidden="true" data-rf-selection-runs />}
          <div class="rf-highlight" aria-hidden="true" data-rf-hover-layer />
          <div class="rf-highlight rf-focus-ring" aria-hidden="true" data-rf-focus-layer />
          {options.map((option) => (
            <div
              key={option.value}
              class="rf-choice-group-row"
              data-rf-hover-item
              aria-disabled={disabled || option.disabled || undefined}
            >
              <Checkbox
                name={name}
                value={option.value}
                disabled={option.disabled}
                checked={value?.includes(option.value)}
                defaultChecked={
                  value === undefined ? defaultValue?.includes(option.value) : undefined
                }
                label={
                  <>
                    {option.label}
                    {option.description && <small>{option.description}</small>}
                  </>
                }
              />
            </div>
          ))}
        </div>
      </fieldset>
    )
  }
}
