import type { Handle } from 'remix/component'
import { classList } from './systems/styling.ts'

export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'

export interface PriorityIndicatorProps {
  /** Priority level. */
  priority: IssuePriority
  /** Renders the text label beside the icon. Default `false`. */
  showLabel?: boolean
  /** Icon size in pixels. Default `14`. */
  size?: number
  /** Hides from assistive tech when an adjacent text already states priority. Default `false`. */
  decorative?: boolean
  class?: string
}

const labels: Record<IssuePriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'No priority',
}

/**
 * Linear-style 4-level priority signal icon (Urgent alert, High/Medium/Low
 * ascending signal bars, and None dashes) with optional inline label.
 */
export function PriorityIndicator(handle: Handle<PriorityIndicatorProps>) {
  return () => {
    const props = handle.props
    const size = props.size ?? 14
    const text = labels[props.priority]
    const hidden = props.decorative || props.showLabel

    return (
      <span
        class={classList('rf-priority-indicator', props.class)}
        data-priority={props.priority}
        role={hidden ? undefined : 'img'}
        aria-label={hidden ? undefined : `Priority: ${text}`}
        aria-hidden={props.decorative ? 'true' : undefined}
        title={text}
      >
        <svg
          class="rf-priority-indicator-svg"
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          {props.priority === 'urgent' ? (
            <>
              <rect x="2" y="2" width="12" height="12" rx="3" fill="currentColor" />
              <path d="M8 5v4" stroke="var(--rf-bg)" stroke-width="1.6" stroke-linecap="round" />
              <circle cx="8" cy="11.3" r="0.9" fill="var(--rf-bg)" />
            </>
          ) : props.priority === 'none' ? (
            <>
              <rect
                x="2.5"
                y="7.2"
                width="2.6"
                height="1.6"
                rx="0.6"
                fill="currentColor"
                opacity="0.55"
              />
              <rect
                x="6.7"
                y="7.2"
                width="2.6"
                height="1.6"
                rx="0.6"
                fill="currentColor"
                opacity="0.55"
              />
              <rect
                x="10.9"
                y="7.2"
                width="2.6"
                height="1.6"
                rx="0.6"
                fill="currentColor"
                opacity="0.55"
              />
            </>
          ) : (
            <>
              <rect x="2.5" y="9.5" width="2.6" height="4" rx="0.8" fill="currentColor" />
              <rect
                x="6.7"
                y="6.5"
                width="2.6"
                height="7"
                rx="0.8"
                fill="currentColor"
                opacity={props.priority === 'low' ? '0.24' : '1'}
              />
              <rect
                x="10.9"
                y="3.5"
                width="2.6"
                height="10"
                rx="0.8"
                fill="currentColor"
                opacity={props.priority === 'high' ? '1' : '0.24'}
              />
            </>
          )}
        </svg>
        {props.showLabel && <span class="rf-priority-indicator-label">{text}</span>}
      </span>
    )
  }
}
