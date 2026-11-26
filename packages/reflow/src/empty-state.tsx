import type { Handle, RemixNode } from 'remix/component'
import { classList, type ControlSize } from './systems/styling.ts'

export interface EmptyStateProps {
  /** Primary heading explaining why the view is empty. */
  title: string
  /** Optional supporting copy beneath the heading. */
  description?: RemixNode
  /** Optional leading icon rendered in a quiet framed tile. */
  icon?: RemixNode
  /** Optional action buttons or links (e.g. Clear filters, New item). */
  actions?: RemixNode
  /** Surface treatment. Default `'plain'`. */
  surface?: 'plain' | 'outlined'
  /** Controls spacing and icon tile scale. */
  size?: ControlSize
  /** Accessible name for the region; defaults to the visible `title`. */
  label?: string
  class?: string
}

/**
 * Quiet centered placeholder for empty views, cleared queues, or zero-match
 * filters, with an optional icon tile, description, and action row.
 * See docs/empty-state.md.
 */
export function EmptyState(handle: Handle<EmptyStateProps>) {
  return () => {
    const {
      title,
      description,
      icon,
      actions,
      surface = 'plain',
      size,
      label,
      class: classProp,
    } = handle.props
    const titleId = `${handle.id}-title`

    return (
      <section
        class={classList('rf-empty-state', classProp)}
        data-surface={surface}
        data-density={size === 'compact' ? 'compact' : undefined}
        aria-label={label}
        aria-labelledby={label ? undefined : titleId}
      >
        {icon != null && (
          <span class="rf-empty-state-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <h3 id={titleId} class="rf-empty-state-title">
          {title}
        </h3>
        {description != null && <p class="rf-empty-state-description">{description}</p>}
        {actions != null && <div class="rf-empty-state-actions">{actions}</div>}
      </section>
    )
  }
}
