import { on, type Handle } from 'remix/component'
import type { BadgeColor } from './badge.tsx'
import { Dropdown, type DropdownItem } from './dropdown.tsx'
import { Icon } from './icon.tsx'
import { badgeColors } from './systems/colors.ts'
import { classList, type ControlSize } from './systems/styling.ts'

export interface LabelOption {
  id: string
  label: string
  /** Named Reflow badge color or custom CSS color string. */
  color?: BadgeColor | string
}

export interface LabelChipProps {
  /** Visible label text. */
  label: string
  /** Named Reflow badge color (e.g. `'blue'`, `'violet'`) or custom CSS color. Default `'gray'`. */
  color?: BadgeColor | string
  /** Optional remove handler; renders a compact dismiss button when provided. */
  onRemove?: () => void
  /** Controls chip padding and font scale. */
  size?: ControlSize
  class?: string
}

export interface LabelPickerProps {
  /** Available labels to toggle. */
  options: readonly LabelOption[]
  /** Currently applied label IDs. */
  value: readonly string[]
  /** Called whenever the selected label IDs change. */
  onChange?: (next: string[]) => void
  /** Optional callback to create and select a brand-new label from search input. */
  onCreate?: (label: string) => void
  /** Trigger button text when no labels are selected. Default `'Add label'`. */
  triggerLabel?: string
  /** Controls chip and trigger scale. */
  size?: ControlSize
  class?: string
}

function resolveLabelColor(color: BadgeColor | string | undefined): string {
  if (!color) return badgeColors.gray
  return color in badgeColors ? badgeColors[color as BadgeColor] : color
}

/**
 * Color-dot issue label chip with subtle tinted border and optional remove action.
 */
export function LabelChip(handle: Handle<LabelChipProps>) {
  return () => {
    const props = handle.props
    const swatch = resolveLabelColor(props.color)

    return (
      <span
        class={classList('rf-label-chip', props.class)}
        data-size={props.size}
        style={{ '--rf-label-dot': swatch }}
      >
        <span class="rf-label-chip-dot" aria-hidden="true" />
        <span class="rf-label-chip-text">{props.label}</span>
        {props.onRemove && (
          <button
            type="button"
            class="rf-label-chip-remove"
            aria-label={`Remove ${props.label}`}
            mix={on('click', () => props.onRemove?.())}
          >
            <Icon name="x" size={10} />
          </button>
        )}
      </span>
    )
  }
}

/**
 * Multi-select searchable label picker rendering active LabelChips beside an
 * anchored checkbox Dropdown with optional inline label creation.
 */
export function LabelPicker(handle: Handle<LabelPickerProps>) {
  return () => {
    const props = handle.props
    const selectedSet = new Set(props.value)
    const activeLabels = props.options.filter((opt) => selectedSet.has(opt.id))
    const items: DropdownItem[] = props.options.map((opt) => ({
      value: opt.id,
      label: opt.label,
      type: 'checkbox',
      checked: selectedSet.has(opt.id),
      icon: (
        <span
          class="rf-label-chip-dot"
          style={{ '--rf-label-dot': resolveLabelColor(opt.color) }}
        />
      ),
    }))

    function toggle(id: string) {
      const next = new Set(props.value)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      props.onChange?.(Array.from(next))
    }

    return (
      <div class={classList('rf-label-picker', props.class)} data-size={props.size}>
        {activeLabels.map((opt) => (
          <LabelChip
            key={opt.id}
            label={opt.label}
            color={opt.color}
            size={props.size}
            onRemove={props.onChange ? () => toggle(opt.id) : undefined}
          />
        ))}
        <Dropdown
          label="Labels"
          variant="bare"
          chevron={false}
          searchable
          creatable={Boolean(props.onCreate)}
          searchPlaceholder="Filter or create label…"
          items={items}
          onSelect={(value) => toggle(value)}
          onCreate={(label) => props.onCreate?.(label)}
          triggerClass="rf-label-picker-trigger"
          triggerContent={
            <>
              <Icon name="plus" size={12} />
              {activeLabels.length === 0 && <span>{props.triggerLabel ?? 'Add label'}</span>}
            </>
          }
        />
      </div>
    )
  }
}
