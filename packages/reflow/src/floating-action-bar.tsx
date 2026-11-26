import { on, type Handle, type RemixNode } from 'remix/component'
import { Button } from './button.tsx'
import { Icon } from './icon.tsx'
import { Kbd } from './kbd.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface FloatingActionBarProps {
  /** Number of currently selected items. Renders nothing when `<= 0`. */
  count: number
  /** Optional custom selection label; defaults to `"<count> selected"`. */
  selectionLabel?: string
  /** Action buttons, pickers, or menus rendered inside the bar. */
  actions?: RemixNode
  /** Called when the clear button or Escape inside the bar is activated. */
  onClear?: () => void
  /** Positioning mode. `'sticky'` stays inside scrolling panes; `'fixed'` docks to viewport; `'inline'` sits in normal flow. Default `'sticky'`. */
  position?: 'sticky' | 'fixed' | 'inline'
  /** Accessible name for the toolbar region. Default `'Bulk actions'`. */
  label?: string
  /** Controls height and spacing. */
  size?: ControlSize
  class?: string
}

/**
 * Contextual floating bulk-action bar that elevates when one or more items are
 * selected, providing count feedback, batch actions, and Escape-to-clear.
 */
export function FloatingActionBar(handle: Handle<FloatingActionBarProps>) {
  return () => {
    const props = handle.props
    if (props.count <= 0) return null
    const position = props.position ?? 'sticky'
    const text = props.selectionLabel ?? `${props.count} selected`

    return (
      <div
        class={classList('rf-floating-action-bar-wrap', props.class)}
        data-position={position}
        data-size={props.size}
      >
        <div
          class="rf-floating-action-bar"
          role="toolbar"
          aria-label={props.label ?? 'Bulk actions'}
          mix={on('keydown', (event) => {
            if (event.key === 'Escape' && props.onClear) {
              event.preventDefault()
              props.onClear()
            }
          })}
        >
          <span class="rf-floating-action-bar-count" aria-live="polite">
            <span class="rf-floating-action-bar-badge">{props.count}</span>
            <span>{props.selectionLabel ?? 'selected'}</span>
          </span>

          {props.actions != null && (
            <>
              <span class="rf-floating-action-bar-sep" aria-hidden="true" />
              <div class="rf-floating-action-bar-actions">{props.actions}</div>
            </>
          )}

          {props.onClear && (
            <>
              <span class="rf-floating-action-bar-sep" aria-hidden="true" />
              <Button
                variant="ghost"
                size="compact"
                aria-label={`Clear ${text}`}
                mix={on('click', () => props.onClear?.())}
              >
                <Icon name="x" size={13} />
                <Kbd size="compact" variant="outline">
                  Esc
                </Kbd>
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }
}
