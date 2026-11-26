import { on, type Handle, type RemixNode } from 'remix/component'
import { Button, type ButtonVariant } from './button.tsx'
import { Dropdown, type DropdownItem } from './dropdown.tsx'
import { Icon } from './icon.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface SplitButtonProps {
  /** Primary action label. */
  label: RemixNode
  /** Called when the primary button is activated. */
  onClick?: () => void
  /** Secondary actions opened from the attached chevron menu. */
  items: readonly DropdownItem[]
  /** Called when an option in the dropdown menu is selected. */
  onSelect?: (value: string, checked?: boolean) => void
  /** Visual variant shared across both halves. Default `'primary'`. */
  variant?: Exclude<ButtonVariant, 'ghost'>
  /** Optional leading icon on the primary button. */
  leadingIcon?: RemixNode
  /** Accessible name for the chevron dropdown trigger. Default `'More options'`. */
  menuLabel?: string
  /** Dropdown alignment relative to the chevron trigger. Default `'end'`. */
  align?: 'start' | 'end'
  /** Disables both the primary action and the dropdown trigger. */
  disabled?: boolean
  /** Shows loading state on the primary action and disables menu opening. */
  loading?: boolean
  /** Controls height and spacing. */
  size?: ControlSize
  class?: string
}

/**
 * Joined primary action button and attached dropdown menu for multi-mode forge
 * actions (Squash and merge, Approve / Request changes, Re-run failed jobs, Clone).
 */
export function SplitButton(handle: Handle<SplitButtonProps>) {
  return () => {
    const props = handle.props
    const variant = props.variant ?? 'primary'
    const menuLabel = props.menuLabel ?? 'More options'
    const disabled = Boolean(props.disabled || props.loading)

    return (
      <div
        class={classList('rf-split-button', props.class)}
        data-variant={variant}
        data-size={props.size}
        role="group"
      >
        <Button
          class="rf-split-button-primary"
          variant={variant}
          size={props.size}
          leadingIcon={props.leadingIcon}
          disabled={props.disabled}
          loading={props.loading}
          mix={props.onClick ? on('click', () => props.onClick?.()) : undefined}
        >
          {props.label}
        </Button>
        <span class="rf-split-button-divider" aria-hidden="true" />
        <span class="rf-split-button-menu">
          {disabled ? (
            <button
              type="button"
              class="rf-dropdown-trigger"
              data-variant="bare"
              disabled
              aria-label={menuLabel}
            >
              <span class="rf-split-button-chevron" aria-hidden="true">
                <Icon name="chevron-down" size={14} />
              </span>
            </button>
          ) : (
            <Dropdown
              label={menuLabel}
              variant="bare"
              chevron={false}
              align={props.align ?? 'end'}
              items={props.items}
              onSelect={props.onSelect}
              triggerContent={
                <span class="rf-split-button-chevron" aria-hidden="true">
                  <Icon name="chevron-down" size={14} />
                </span>
              }
            />
          )}
        </span>
      </div>
    )
  }
}
