import { on, type Handle, type MixInput, type RemixNode } from 'remix/component'
import * as popover from '@remix-run/ui/popover'
import { Button, type ButtonProps } from './basic.tsx'

export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

export interface PopoverTriggerProps {
  'aria-haspopup': 'dialog'
  'aria-expanded': boolean
  'aria-controls': string
  mix: MixInput<HTMLElement>
}

export interface PopoverProps {
  /** Names the panel when it has no visible title. */
  label?: string
  /** A visible heading that names the panel. */
  title?: RemixNode
  description?: RemixNode
  children?: RemixNode
  /** Contents of the button that opens the panel. */
  trigger?: RemixNode
  triggerVariant?: ButtonProps['variant']
  triggerSize?: ButtonProps['size']
  /** Renders your own trigger. Spread the provided props onto a focusable element. */
  renderTrigger?: (props: PopoverTriggerProps) => RemixNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Which side of the trigger the panel opens on. Default bottom. */
  placement?: PopoverPlacement
  /** Distance from the trigger in pixels. Default 8. */
  offset?: number
  size?: 'default' | 'compact'
}

// A field to type into, or an element the content marks to take focus. Buttons
// and links are left to Tab, so opening never fires a control's own tooltip.
const initialFocus =
  '[autofocus], input:not(:disabled, [readonly], [type="hidden"]), select:not(:disabled), textarea:not(:disabled, [readonly])'

/**
 * A panel anchored to a trigger, for content that needs more room than a
 * tooltip: a filter, inline settings, a share sheet. A click opens it; Escape
 * and a click outside close it. It is a non-modal dialog: focus moves to its
 * first field, or to the panel, on open and returns to the trigger on close.
 */
export function Popover(handle: Handle<PopoverProps>) {
  let localOpen = handle.props.defaultOpen ?? false
  const panelId = `${handle.id}-panel`
  const titleId = `${handle.id}-title`
  const descriptionId = `${handle.id}-description`
  const isOpen = () => handle.props.open ?? localOpen

  function setOpen(next: boolean) {
    if (isOpen() === next) return
    localOpen = next
    handle.props.onOpenChange?.(next)
    void handle.update()
  }

  // On open, focus the panel's first field, or the panel itself.
  const focusInside = on<HTMLElement, 'toggle'>('toggle', (event) => {
    if (event.newState !== 'open') return
    const panel = event.currentTarget
    const target = panel.querySelector<HTMLElement>(initialFocus) ?? panel
    target.focus({ preventScroll: true })
  })

  return () => {
    const {
      label,
      title,
      description,
      children,
      trigger,
      triggerVariant = 'secondary',
      triggerSize,
      renderTrigger,
      placement = 'bottom',
      offset = 8,
      size,
    } = handle.props
    const open = isOpen()
    const triggerProps: PopoverTriggerProps = {
      'aria-haspopup': 'dialog',
      'aria-expanded': open,
      'aria-controls': panelId,
      mix: [
        popover.anchor({ placement, offset }),
        popover.focusOnHide(),
        on('click', () => setOpen(!isOpen())),
      ],
    }

    return (
      <span class="rf-popover" data-density={size}>
        <popover.Context>
          {renderTrigger ? (
            renderTrigger(triggerProps)
          ) : (
            <Button variant={triggerVariant} size={triggerSize ?? size} {...triggerProps}>
              {trigger}
            </Button>
          )}
          <div
            class="rf-menu-surface rf-popover-surface"
            id={panelId}
            role="dialog"
            tabIndex={-1}
            aria-label={title == null ? label : undefined}
            aria-labelledby={title == null ? undefined : titleId}
            aria-describedby={description == null ? undefined : descriptionId}
            data-density={size}
            mix={[
              popover.surface({
                open,
                closeOnAnchorClick: false,
                onHide: () => setOpen(false),
              }),
              focusInside,
            ]}
          >
            {(title != null || description != null) && (
              <header class="rf-popover-header">
                {title != null && (
                  <h2 class="rf-popover-title" id={titleId}>
                    {title}
                  </h2>
                )}
                {description != null && (
                  <p class="rf-popover-description" id={descriptionId}>
                    {description}
                  </p>
                )}
              </header>
            )}
            {children != null && <div class="rf-popover-body">{children}</div>}
          </div>
        </popover.Context>
      </span>
    )
  }
}
