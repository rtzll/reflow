import type { Handle, RemixNode } from 'remix/component'
import { classList, type ControlSize } from './systems/styling.ts'

export interface MetadataItem {
  id: string
  /** Property heading (e.g. `'Reviewers'`, `'Labels'`, `'Commit'`). */
  label: string
  /** Property value slot (avatars, badges, CopyChip, RelativeTime, etc.). */
  value: RemixNode
  /** Optional trailing control beside the label (such as an Edit or `+` trigger). */
  action?: RemixNode
}

export interface MetadataListProps {
  /** Ordered key/value metadata sections. */
  items: readonly MetadataItem[]
  /** Accessible name for the metadata list. */
  label?: string
  /** Layout direction for each row. Default `'stacked'`. */
  orientation?: 'stacked' | 'inline'
  /** Controls spacing and typography scale. */
  size?: ControlSize
  class?: string
}

/**
 * Structured key/value inspector rail for pull requests, issues, and CI runs,
 * supporting inline action slots for reviewers, labels, refs, and timestamps.
 */
export function MetadataList(handle: Handle<MetadataListProps>) {
  return () => {
    const props = handle.props
    const orientation = props.orientation ?? 'stacked'

    return (
      <dl
        class={classList('rf-metadata-list', props.class)}
        data-orientation={orientation}
        data-size={props.size}
        aria-label={props.label}
      >
        {props.items.map((item) => (
          <div key={item.id} class="rf-metadata-row">
            <dt class="rf-metadata-term">
              <span class="rf-metadata-label">{item.label}</span>
              {item.action && <span class="rf-metadata-action">{item.action}</span>}
            </dt>
            <dd class="rf-metadata-value">{item.value}</dd>
          </div>
        ))}
      </dl>
    )
  }
}
