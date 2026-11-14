import { Icon } from './icon.tsx'
import { on, ref } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import { statusIcon } from './systems/status-icon.tsx'
import { type ControlSize, classList, type StyledProps } from './systems/styling.ts'
import { type ButtonProps, Button } from './button.tsx'

export type BannerStatus = 'default' | 'info' | 'success' | 'warning' | 'error'

export type BannerProps = StyledProps<'div'> & {
  status?: BannerStatus
  contrast?: 'low' | 'high'
  variant?: 'inline' | 'fixed'
  size?: ControlSize
  icon?: RemixNode
  dismissible?: boolean
  dismissLabel?: string
  open?: boolean
  onDismiss?: () => void
}

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Where keyboard focus goes when a banner holding it closes, as in the
 *  reference: the first focusable element after it, else the last before it. */
function focusNeighbour(banner: Element) {
  const candidates = Array.from(
    banner.ownerDocument.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((node) => !banner.contains(node) && !node.closest('[inert]') && node.checkVisibility())
  const after = candidates.find(
    (node) => banner.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING,
  )
  const before = candidates
    .filter((node) => banner.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING)
    .pop()
  ;(after ?? before)?.focus({ preventScroll: true })
}

export function Banner(handle: Handle<BannerProps>) {
  let dismissed = false
  let root: Element | null = null
  let wasVisible = true
  // Set when the dismiss button held focus, so the close hands it on.
  let handOff = false
  const rootRef = ref((node) => {
    root = node
  })

  return () => {
    const {
      class: classProp,
      className,
      status = 'default',
      contrast = 'low',
      variant = 'inline',
      size,
      icon,
      dismissible,
      dismissLabel = 'Dismiss',
      open,
      onDismiss,
      role,
      children,
      ...props
    } = handle.props
    const visible = open ?? !dismissed
    if (wasVisible && !visible && handOff) {
      handOff = false
      handle.queueTask(() => {
        if (root) focusNeighbour(root)
      })
    }
    if (visible) handOff = false
    wasVisible = visible

    return (
      <div
        class="rf-banner-collapse"
        data-open={visible ? 'true' : 'false'}
        data-variant={variant}
        mix={rootRef}
      >
        <div class="rf-banner-overflow" inert={!visible} aria-hidden={!visible || undefined}>
          <div
            {...props}
            class={classList('rf-banner', classProp, className)}
            data-slot="banner"
            data-size={size}
            data-status={status}
            data-contrast={contrast}
            role={role ?? (status === 'error' || status === 'warning' ? 'alert' : 'status')}
          >
            <span class="rf-banner-icon" aria-hidden="true">
              {icon ?? statusIcon(status)}
            </span>
            <div class="rf-banner-content">{children}</div>
            {dismissible && (
              <button
                type="button"
                class="rf-banner-dismiss"
                aria-label={dismissLabel}
                mix={on('click', (event) => {
                  handOff = event.currentTarget === document.activeElement
                  onDismiss?.()
                  if (open === undefined) {
                    dismissed = true
                    handle.update()
                  }
                })}
              >
                <Icon name="x" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export function BannerTitle(handle: Handle<StyledProps<'p'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <p
        {...props}
        class={classList('rf-banner-title', classProp, className)}
        data-slot="banner-title"
      />
    )
  }
}

export function BannerDescription(handle: Handle<StyledProps<'p'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <p
        {...props}
        class={classList('rf-banner-description', classProp, className)}
        data-slot="banner-description"
      />
    )
  }
}

export function BannerActions(handle: Handle<StyledProps<'div'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-banner-actions', classProp, className)}
        data-slot="banner-actions"
      />
    )
  }
}

export function BannerAction(handle: Handle<ButtonProps>) {
  return () => <Button variant="secondary" size="compact" {...handle.props} />
}
