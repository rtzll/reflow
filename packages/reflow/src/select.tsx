import { Icon } from './icon.tsx'
import { ref } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import * as popover from '@remix-run/ui/popover'
import * as select from '@remix-run/ui/select'
import { fluidHover } from './systems/fluid-hover.ts'
import { positionPickerPopup } from './behaviors/picker-popup.ts'
import { onFormReset } from './behaviors/form-reset.ts'

export interface ChoiceOption {
  value: string
  label: string
  icon?: RemixNode
  disabled?: boolean
  searchValue?: string | string[]
  /** Label for a contiguous group of options in Select. */
  group?: string
}

export interface ChoiceProps {
  label: string
  options: readonly ChoiceOption[]
  name?: string
  defaultValue?: string
  value?: string | null
  onValueChange?: (value: string | null) => void
  disabled?: boolean
  placeholder?: string
  variant?: 'bordered' | 'ghost'
  size?: 'default' | 'compact'
}

export interface SelectProps extends ChoiceProps {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export function Select(handle: Handle<SelectProps>) {
  let resetKey = 0
  let root: HTMLElement | undefined
  let restoreFocus = false
  let previousValue = handle.props.value
  const reset = onFormReset(() => {
    resetKey++
    void handle.update()
  })
  const highlight = fluidHover({
    highlightedSelector: '[data-highlighted="true"]',
  })

  return () => {
    const {
      label,
      options,
      name,
      defaultValue,
      disabled,
      placeholder = 'Choose an option…',
      variant = 'bordered',
      size,
    } = handle.props
    if (previousValue !== handle.props.value && root?.contains(root.ownerDocument.activeElement))
      restoreFocus = true
    previousValue = handle.props.value
    const requested = handle.props.value === undefined ? defaultValue : handle.props.value
    const initial = options.find((option) => option.value === requested && !option.disabled)
    if (restoreFocus)
      handle.queueTask(() => {
        root?.querySelector<HTMLButtonElement>('button')?.focus()
        restoreFocus = false
      })

    return (
      <div
        class="rf-picker rf-select"
        data-variant={variant}
        data-density={size}
        mix={[
          reset,
          ref((node) => {
            root = node as HTMLElement
          }),
          select.onSelectChange((event) => {
            if (handle.props.value !== undefined) {
              restoreFocus = !!root?.contains(root.ownerDocument.activeElement)
              resetKey++
            }
            handle.props.onValueChange?.(event.value)
            if (handle.props.value !== undefined) void handle.update()
          }),
        ]}
      >
        <select.Context
          key={`${resetKey}:${handle.props.value === undefined ? '' : (handle.props.value ?? 'empty')}`}
          defaultLabel={initial?.label ?? placeholder}
          defaultValue={initial?.value}
          disabled={disabled}
          name={name}
        >
          <button
            type="button"
            class="rf-picker-trigger"
            id={handle.props.id}
            aria-label={label}
            aria-describedby={handle.props['aria-describedby']}
            aria-invalid={handle.props['aria-invalid']}
            mix={select.trigger()}
          >
            <SelectValue options={options} />
            <ChoiceChevron />
          </button>
          <popover.Context>
            <div
              class="rf-menu-surface rf-picker-surface rf-select-surface"
              mix={[positionPickerPopup(), select.popover()]}
            >
              <div class="rf-menu-list" aria-label={label} mix={[select.list(), highlight]}>
                <span class="rf-highlight rf-picker-hover" aria-hidden="true" data-rf-hover-layer />
                {options.map((option, index) => (
                  <>
                    {option.group && option.group !== options[index - 1]?.group && (
                      <div class="rf-menu-group-label" aria-hidden="true">
                        {option.group}
                      </div>
                    )}
                    <div
                      key={option.value}
                      class="rf-picker-option"
                      data-rf-hover-item
                      aria-label={option.group ? `${option.group}, ${option.label}` : undefined}
                      mix={select.option({
                        value: option.value,
                        label: option.label,
                        textValue: option.searchValue,
                        disabled: option.disabled,
                      })}
                    >
                      <ChoiceContent option={option} />
                    </div>
                  </>
                ))}
              </div>
            </div>
          </popover.Context>
          <input type="hidden" mix={select.hiddenInput()} />
        </select.Context>
      </div>
    )
  }
}

function SelectValue(handle: Handle<{ options: readonly ChoiceOption[] }>) {
  const context = handle.context.get(select.Context)
  return () => {
    const selected = handle.props.options.find((option) => option.value === context.value)
    return (
      <span class="rf-picker-value" data-placeholder={context.value == null ? '' : undefined}>
        {selected?.icon != null && (
          <span class="rf-picker-icon" aria-hidden="true">
            {selected.icon}
          </span>
        )}
        <span class="rf-picker-label">{context.displayedLabel}</span>
      </span>
    )
  }
}

export function ChoiceChevron() {
  return () => <Icon name="chevron-down" class="rf-picker-chevron" />
}

export function ChoiceContent(handle: Handle<{ option: ChoiceOption; combobox?: boolean }>) {
  return () => {
    const { option } = handle.props
    return (
      <>
        {option.icon != null && (
          <span class="rf-picker-icon" aria-hidden="true">
            {option.icon}
          </span>
        )}
        <span class="rf-picker-label">{option.label}</span>
        {handle.props.combobox ? (
          <svg
            class="rf-picker-check"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 12 9 17 20 6" pathLength="1" />
          </svg>
        ) : (
          <Icon name="check" size={13} class="rf-picker-check" />
        )}
      </>
    )
  }
}
