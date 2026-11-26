import type { Handle, RemixNode } from 'remix/component'
import { Dropdown, type DropdownItem } from './dropdown.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface InlinePropertyOption {
  value: string
  label: string
  icon?: RemixNode
  shortcut?: string
  hint?: string
  disabled?: boolean
}

export interface InlinePropertyPickerProps {
  /** Property name for accessible labeling (e.g. `'Priority'`, `'Status'`, `'Assignee'`). */
  label: string
  /** Currently selected option value. */
  value?: string
  /** Available choices rendered in the anchored dropdown menu. */
  options: readonly InlinePropertyOption[]
  /** Called when the user picks an option. */
  onChange?: (value: string) => void
  /** Placeholder text when no value matches an option. Default `'Unset'`. */
  placeholder?: string
  /** Enables search input inside the dropdown for larger option lists. Default `false`. */
  searchable?: boolean
  /** Dropdown alignment relative to the pill. Default `'start'`. */
  align?: 'start' | 'end'
  /** Hides the visible text label and renders only the icon (compact row mode). Default `false`. */
  iconOnly?: boolean
  /** Controls pill height and typography scale. */
  size?: ControlSize
  class?: string
}

/**
 * Compact inline property pill (Status, Priority, Assignee, Cycle) opening a
 * searchable Dropdown directly from a list row, board card, or inspector rail.
 */
export function InlinePropertyPicker(handle: Handle<InlinePropertyPickerProps>) {
  return () => {
    const props = handle.props
    const current = props.options.find((opt) => opt.value === props.value)
    const items: DropdownItem[] = props.options.map((opt) => ({
      value: opt.value,
      label: opt.label,
      icon: opt.icon,
      shortcut: opt.shortcut,
      hint: opt.hint,
      disabled: opt.disabled,
      type: 'radio',
      checked: opt.value === props.value,
      closeOnSelect: true,
    }))
    const displayLabel = current?.label ?? props.placeholder ?? 'Unset'

    return (
      <span
        class={classList('rf-inline-property-picker', props.class)}
        data-size={props.size}
        data-unset={current ? undefined : 'true'}
        data-icon-only={props.iconOnly ? 'true' : undefined}
      >
        <Dropdown
          label={`${props.label}: ${displayLabel}`}
          variant="bare"
          chevron={false}
          align={props.align ?? 'start'}
          searchable={props.searchable}
          searchPlaceholder={`Set ${props.label.toLowerCase()}…`}
          items={items}
          onSelect={(value) => props.onChange?.(value)}
          triggerClass="rf-inline-property-trigger"
          triggerContent={
            <>
              {current?.icon != null && (
                <span class="rf-inline-property-icon" aria-hidden="true">
                  {current.icon}
                </span>
              )}
              {!props.iconOnly && <span class="rf-inline-property-label">{displayLabel}</span>}
            </>
          }
        />
      </span>
    )
  }
}
