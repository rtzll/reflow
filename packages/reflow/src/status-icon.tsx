import type { Handle } from 'remix/component'
import { classList } from './systems/styling.ts'

export type IssueStatusKind =
  | 'backlog'
  | 'todo'
  | 'in-progress'
  | 'in-review'
  | 'done'
  | 'cancelled'

export interface StatusIconProps {
  /** Semantic issue workflow status. */
  status: IssueStatusKind
  /** Renders the status label beside the icon. Default `false`. */
  showLabel?: boolean
  /** Custom label override when `showLabel` is true or for accessibility. */
  label?: string
  /** Icon diameter in pixels. Default `14`. */
  size?: number
  /** Hides from assistive tech when an adjacent text already states status. Default `false`. */
  decorative?: boolean
  class?: string
}

const defaultLabels: Record<IssueStatusKind, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in-progress': 'In progress',
  'in-review': 'In review',
  done: 'Done',
  cancelled: 'Cancelled',
}

/**
 * Semantic workflow state glyph (Backlog, Todo, In progress, In review, Done,
 * Cancelled) built as crisp inline SVG aligned with Reflow semantic tokens.
 */
export function StatusIcon(handle: Handle<StatusIconProps>) {
  return () => {
    const props = handle.props
    const size = props.size ?? 14
    const text = props.label ?? defaultLabels[props.status]
    const hidden = props.decorative || props.showLabel

    return (
      <span
        class={classList('rf-status-icon', props.class)}
        data-status={props.status}
        role={hidden ? undefined : 'img'}
        aria-label={hidden ? undefined : `Status: ${text}`}
        aria-hidden={props.decorative ? 'true' : undefined}
        title={text}
      >
        <svg
          class="rf-status-icon-svg"
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          {props.status === 'backlog' && (
            <circle
              cx="8"
              cy="8"
              r="5.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-dasharray="2.4 2.4"
            />
          )}
          {props.status === 'todo' && (
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5" />
          )}
          {props.status === 'in-progress' && (
            <>
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5" />
              <path d="M8 4.2A3.8 3.8 0 0 1 8 11.8Z" fill="currentColor" />
            </>
          )}
          {props.status === 'in-review' && (
            <>
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5" />
              <circle cx="8" cy="8" r="2.6" fill="currentColor" />
            </>
          )}
          {props.status === 'done' && (
            <>
              <circle cx="8" cy="8" r="6" fill="currentColor" />
              <path
                d="m5.4 8.1 1.7 1.7 3.5-3.6"
                stroke="var(--rf-bg)"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </>
          )}
          {props.status === 'cancelled' && (
            <>
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5" />
              <path
                d="m5.8 5.8 4.4 4.4M10.2 5.8l-4.4 4.4"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linecap="round"
              />
            </>
          )}
        </svg>
        {props.showLabel && <span class="rf-status-icon-label">{text}</span>}
      </span>
    )
  }
}
