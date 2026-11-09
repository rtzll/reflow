import { Icon } from './icon.tsx'
import * as accordion from '@remix-run/ui/accordion'
import { on, type Handle, type RemixNode } from 'remix/component'
import { Checkbox } from './basic.tsx'
import { fluidHover } from './interactive.tsx'
import { selectionRuns } from './selection-runs.ts'

export interface AccordionItem {
  value: string
  title: RemixNode
  content: RemixNode
  disabled?: boolean
}

export type AccordionProps = accordion.AccordionContextProps & {
  items: readonly AccordionItem[]
  variant?: 'grouped' | 'separated'
  /** Highlight the whole expanded item or only the trigger on hover. */
  highlight?: 'item' | 'trigger'
  headingLevel?: 2 | 3 | 4 | 5 | 6
}

export function Accordion(handle: Handle<AccordionProps>) {
  return () => {
    const {
      items,
      variant = 'grouped',
      highlight = 'item',
      headingLevel = 3,
      children: _children,
      ...props
    } = handle.props
    const Heading = `h${headingLevel}` as const
    return (
      <accordion.Context {...props}>
        <div
          class="rf-accordion"
          data-variant={variant}
          data-highlight={highlight}
          mix={[accordion.root(), fluidHover()]}
        >
          {variant === 'grouped' && (
            <div class="rf-highlight" aria-hidden="true" data-rf-hover-layer />
          )}
          <div class="rf-highlight rf-focus-ring" aria-hidden="true" data-rf-focus-layer />
          {items.map(({ value, title, content, disabled }) => (
            <accordion.ItemContext key={value} value={value} disabled={disabled}>
              <section class="rf-accordion-item" mix={accordion.item()}>
                <span class="rf-accordion-tint" aria-hidden="true" />
                <Heading>
                  <button
                    type="button"
                    class="rf-accordion-trigger"
                    data-rf-hover-item
                    mix={accordion.trigger()}
                  >
                    <span class="rf-accordion-label">
                      <span aria-hidden="true">{title}</span>
                      <span>{title}</span>
                    </span>
                    <span class="rf-accordion-chevron">
                      <Icon name="chevron-right" />
                    </span>
                  </button>
                </Heading>
                <div class="rf-accordion-panel" mix={accordion.content()}>
                  <div>
                    <div class="rf-accordion-content">{content}</div>
                  </div>
                </div>
              </section>
            </accordion.ItemContext>
          ))}
        </div>
      </accordion.Context>
    )
  }
}

export interface GroupOption {
  value: string
  label: RemixNode
  description?: RemixNode
  disabled?: boolean
}

interface GroupProps {
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
              // Up/Down move focus between rows (wrapping), Home/End jump to the ends.
              const keys =
                orientation === 'horizontal'
                  ? ['ArrowRight', 'ArrowLeft']
                  : ['ArrowDown', 'ArrowUp']
              if (![...keys, 'Home', 'End'].includes(event.key)) return
              const inputs = Array.from(
                event.currentTarget.querySelectorAll<HTMLInputElement>(
                  'input[type="checkbox"]:not(:disabled)',
                ),
              )
              const index = inputs.indexOf(event.target as HTMLInputElement)
              if (index === -1) return
              event.preventDefault()
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? inputs.length - 1
                    : (index + (event.key === keys[0] ? 1 : -1) + inputs.length) % inputs.length
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
