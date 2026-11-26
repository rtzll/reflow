import { on, type Handle } from 'remix/component'
import { Avatar } from './avatar.tsx'
import { Badge, type BadgeColor } from './badge.tsx'
import { Button } from './button.tsx'
import { Icon } from './icon.tsx'
import { ProportionBar } from './proportion-bar.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type MergeQueueStatus = 'merging' | 'testing' | 'queued' | 'failed' | 'merged'

export interface MergeQueueEntry {
  id: string
  /** PR number or ref (e.g. `#418`). */
  ref: string
  title: string
  author: string
  avatarSrc?: string
  status: MergeQueueStatus
  /** Optional speculative batch name (e.g. `'Batch A'`). */
  batch?: string
  checksPassed?: number
  checksTotal?: number
  /** Estimated time remaining (e.g. `'~2m'`). */
  eta?: string
}

export interface MergeQueueProps {
  /** Ordered pull requests in the merge queue. */
  entries: readonly MergeQueueEntry[]
  /** Called when an entry row is selected. */
  onSelect?: (entry: MergeQueueEntry) => void
  /** Optional dequeue handler; renders a compact remove button per row when provided. */
  onRemove?: (entry: MergeQueueEntry) => void
  /** Accessible name for the merge queue region. Default `'Merge queue'`. */
  label?: string
  /** Controls spacing and typography scale. */
  size?: ControlSize
  class?: string
}

function statusBadge(status: MergeQueueStatus): { label: string; color: BadgeColor } {
  switch (status) {
    case 'merging':
      return { label: 'Merging', color: 'blue' }
    case 'testing':
      return { label: 'Testing', color: 'amber' }
    case 'queued':
      return { label: 'Queued', color: 'gray' }
    case 'failed':
      return { label: 'Ejected', color: 'red' }
    case 'merged':
      return { label: 'Merged', color: 'green' }
  }
}

/**
 * Live speculative CI merge train visualizer showing ordered queue positions,
 * speculative batch labels, author avatars, CI progress meters, and ETAs.
 */
export function MergeQueue(handle: Handle<MergeQueueProps>) {
  return () => {
    const props = handle.props
    const entries = props.entries

    return (
      <section
        class={classList('rf-merge-queue', props.class)}
        data-size={props.size}
        aria-label={props.label ?? 'Merge queue'}
      >
        <header class="rf-merge-queue-header">
          <span class="rf-merge-queue-heading">Merge queue</span>
          <span class="rf-merge-queue-count">
            {entries.length} {entries.length === 1 ? 'PR' : 'PRs'} in train
          </span>
        </header>

        <ol class="rf-merge-queue-list">
          {entries.length === 0 ? (
            <li class="rf-merge-queue-empty">Queue is empty.</li>
          ) : (
            entries.map((entry, index) => {
              const badge = statusBadge(entry.status)
              const showBatch = entry.batch && entry.batch !== entries[index - 1]?.batch
              const hasProgress =
                entry.checksTotal !== undefined &&
                entry.checksTotal > 0 &&
                entry.checksPassed !== undefined

              return (
                <li key={entry.id} class="rf-merge-queue-item" data-status={entry.status}>
                  {showBatch && <div class="rf-merge-queue-batch">{entry.batch}</div>}
                  <div class="rf-merge-queue-row">
                    <span class="rf-merge-queue-pos" aria-label={`Position ${index + 1}`}>
                      #{index + 1}
                    </span>

                    <Avatar name={entry.author} src={entry.avatarSrc} size={24} decorative />

                    {props.onSelect ? (
                      <button
                        type="button"
                        class="rf-merge-queue-main"
                        mix={on('click', () => props.onSelect?.(entry))}
                      >
                        <span class="rf-merge-queue-title-line">
                          <span class="rf-merge-queue-ref">{entry.ref}</span>
                          <span class="rf-merge-queue-title">{entry.title}</span>
                        </span>
                        <span class="rf-merge-queue-author">{entry.author}</span>
                      </button>
                    ) : (
                      <div class="rf-merge-queue-main">
                        <span class="rf-merge-queue-title-line">
                          <span class="rf-merge-queue-ref">{entry.ref}</span>
                          <span class="rf-merge-queue-title">{entry.title}</span>
                        </span>
                        <span class="rf-merge-queue-author">{entry.author}</span>
                      </div>
                    )}

                    <div class="rf-merge-queue-meta">
                      {hasProgress && (
                        <div class="rf-merge-queue-progress">
                          <span class="rf-merge-queue-checks">
                            {entry.checksPassed}/{entry.checksTotal}
                          </span>
                          <ProportionBar
                            class="rf-merge-queue-bar"
                            label={`${entry.checksPassed} of ${entry.checksTotal} checks complete`}
                            showLegend={false}
                            height={5}
                            segments={[
                              {
                                id: 'done',
                                label: 'Done',
                                value: entry.checksPassed!,
                                tone: entry.status === 'failed' ? 'danger' : 'success',
                              },
                              {
                                id: 'rest',
                                label: 'Remaining',
                                value: Math.max(0, entry.checksTotal! - entry.checksPassed!),
                                tone: 'neutral',
                              },
                            ]}
                          />
                        </div>
                      )}

                      <Badge color={badge.color} variant="dot" size="compact">
                        {badge.label}
                      </Badge>

                      {entry.eta && <span class="rf-merge-queue-eta">{entry.eta}</span>}

                      {props.onRemove && (
                        <Button
                          variant="ghost"
                          size="icon-compact"
                          aria-label={`Remove ${entry.ref} from queue`}
                          mix={on('click', () => props.onRemove?.(entry))}
                        >
                          <Icon name="x" size={13} />
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })
          )}
        </ol>
      </section>
    )
  }
}
