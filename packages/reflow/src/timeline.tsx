import type { Handle, RemixNode } from 'remix/component'
import { classList, type ControlSize } from './systems/styling.ts'

export type TimelineTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

export interface TimelineItem {
  id: string
  /** Concise event headline (e.g. commit pushed, review approved, checks passed). */
  title: RemixNode
  /** Optional timestamp shown beside the title. */
  timestamp?: RemixNode
  /** Optional icon or avatar displayed inside the timeline marker. */
  icon?: RemixNode
  /** Semantic color tone for the marker. Default `'neutral'`. */
  tone?: TimelineTone
  /** Optional inline metadata (such as a commit SHA or status badge). */
  meta?: RemixNode
  /** Optional supporting body rendered beneath the heading. */
  detail?: RemixNode
  /** Optional trailing action button or link aligned to the end of the header. */
  action?: RemixNode
}

export interface TimelineProps {
  /** Chronological sequence of timeline events. */
  items: readonly TimelineItem[]
  /** Accessible name for the timeline list. Default `'Timeline'`. */
  label?: string
  /** Controls spacing and marker scale. */
  size?: ControlSize
  class?: string
}

/**
 * Vertical connected stream of commits, review decisions, check runs, or
 * activity events with semantic markers and optional detail blocks.
 * See docs/timeline.md.
 */
export function Timeline(handle: Handle<TimelineProps>) {
  return () => {
    const { items, label = 'Timeline', size, class: classProp } = handle.props

    return (
      <ol
        class={classList('rf-timeline', classProp)}
        aria-label={label}
        data-density={size === 'compact' ? 'compact' : undefined}
      >
        {items.map((item) => {
          const tone = item.tone ?? 'neutral'
          return (
            <li key={item.id} class="rf-timeline-item" data-tone={tone}>
              <div class="rf-timeline-rail" aria-hidden="true">
                <span class="rf-timeline-marker" data-has-icon={item.icon != null ? '' : undefined}>
                  {item.icon ?? <span class="rf-timeline-dot" />}
                </span>
                <span class="rf-timeline-line" />
              </div>
              <div class="rf-timeline-content">
                <div class="rf-timeline-header">
                  <span class="rf-timeline-title">{item.title}</span>
                  {item.meta != null && <span class="rf-timeline-meta">{item.meta}</span>}
                  {item.timestamp != null && <span class="rf-timeline-time">{item.timestamp}</span>}
                  {item.action != null && <span class="rf-timeline-action">{item.action}</span>}
                </div>
                {item.detail != null && <div class="rf-timeline-detail">{item.detail}</div>}
              </div>
            </li>
          )
        })}
      </ol>
    )
  }
}
