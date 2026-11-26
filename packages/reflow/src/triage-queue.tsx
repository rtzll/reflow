import { on, type Handle } from 'remix/component'
import { Avatar } from './avatar.tsx'
import { Button } from './button.tsx'
import { Kbd } from './kbd.tsx'
import { LabelChip, type LabelOption } from './label-picker.tsx'
import { MetadataList } from './metadata-list.tsx'
import { PriorityIndicator, type IssuePriority } from './priority-indicator.tsx'
import { RelativeTime } from './relative-time.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type TriageAction = 'accept' | 'duplicate' | 'decline' | 'snooze'

export interface TriageItem {
  id: string
  key: string
  title: string
  description?: string
  reporter: string
  reporterSrc?: string
  createdAt: string | number | Date
  priority?: IssuePriority
  source?: string
  labels?: readonly LabelOption[]
}

export interface TriageQueueProps {
  /** Incoming issues awaiting triage decision. */
  items: readonly TriageItem[]
  /** Called when the reviewer accepts, marks duplicate, declines, or snoozes an item. */
  onDecision?: (item: TriageItem, action: TriageAction) => void
  /** Optional pinned reference timestamp for deterministic relative dates. */
  now?: string | number | Date
  /** Accessible name for the triage workspace. Default `'Triage queue'`. */
  label?: string
  /** Controls spacing and typography density. */
  size?: ControlSize
  class?: string
}

/**
 * Linear-style incoming triage split workspace pairing a keyboard-navigable
 * queue with an inspector pane and single-key Accept / Duplicate / Decline /
 * Snooze actions that advance cleanly through the inbox.
 */
export function TriageQueue(handle: Handle<TriageQueueProps>) {
  let activeId: string | undefined

  function resolveActive(items: readonly TriageItem[]): TriageItem | undefined {
    if (items.length === 0) return undefined
    const found = activeId ? items.find((item) => item.id === activeId) : undefined
    return found ?? items[0]
  }

  function decide(item: TriageItem, action: TriageAction) {
    const items = handle.props.items
    const idx = items.findIndex((entry) => entry.id === item.id)
    const nextCandidate = items[idx + 1] ?? items[idx - 1]
    activeId = nextCandidate?.id
    handle.props.onDecision?.(item, action)
    void handle.update()
  }

  return () => {
    const props = handle.props
    const items = props.items
    const active = resolveActive(items)

    return (
      <section
        class={classList('rf-triage-queue', props.class)}
        data-size={props.size}
        aria-label={props.label ?? 'Triage queue'}
      >
        <div class="rf-triage-list-pane">
          <header class="rf-triage-pane-head">
            <span>Triage</span>
            <span class="rf-triage-count">{items.length}</span>
          </header>
          {items.length === 0 ? (
            <div class="rf-triage-empty">Inbox zero — nothing awaiting triage.</div>
          ) : (
            <div class="rf-triage-list" role="listbox" aria-label="Incoming issues">
              {items.map((item, index) => {
                const selected = item.id === active?.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={selected ? 'true' : 'false'}
                    class="rf-triage-row"
                    data-selected={selected ? 'true' : undefined}
                    mix={[
                      on('click', () => {
                        activeId = item.id
                        void handle.update()
                      }),
                      on('keydown', (event) => {
                        if (event.key === 'ArrowDown' || event.key === 'j') {
                          event.preventDefault()
                          const next = items[(index + 1) % items.length]
                          if (next) {
                            activeId = next.id
                            void handle.update()
                          }
                        } else if (event.key === 'ArrowUp' || event.key === 'k') {
                          event.preventDefault()
                          const prev = items[(index - 1 + items.length) % items.length]
                          if (prev) {
                            activeId = prev.id
                            void handle.update()
                          }
                        } else if (event.key === 'a') {
                          event.preventDefault()
                          decide(item, 'accept')
                        } else if (event.key === 'd') {
                          event.preventDefault()
                          decide(item, 'duplicate')
                        } else if (event.key === 'x') {
                          event.preventDefault()
                          decide(item, 'decline')
                        } else if (event.key === 'h') {
                          event.preventDefault()
                          decide(item, 'snooze')
                        }
                      }),
                    ]}
                  >
                    <span class="rf-triage-row-top">
                      <span class="rf-triage-key">{item.key}</span>
                      {item.priority && <PriorityIndicator priority={item.priority} size={12} />}
                      <RelativeTime
                        date={item.createdAt}
                        now={props.now}
                        live={false}
                        tooltip={false}
                        class="rf-triage-time"
                      />
                    </span>
                    <span class="rf-triage-row-title">{item.title}</span>
                    <span class="rf-triage-row-sub">
                      <Avatar name={item.reporter} src={item.reporterSrc} size={16} decorative />
                      <span>{item.reporter}</span>
                      {item.source && <span>· {item.source}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div class="rf-triage-detail-pane">
          {active ? (
            <>
              <div class="rf-triage-detail-body">
                <div class="rf-triage-detail-key">{active.key}</div>
                <h3 class="rf-triage-detail-title">{active.title}</h3>
                {active.description && <p class="rf-triage-detail-desc">{active.description}</p>}
                <MetadataList
                  orientation="inline"
                  size="compact"
                  items={[
                    {
                      id: 'reporter',
                      label: 'Reporter',
                      value: (
                        <span class="rf-triage-inline-person">
                          <Avatar
                            name={active.reporter}
                            src={active.reporterSrc}
                            size={18}
                            decorative
                          />
                          <span>{active.reporter}</span>
                        </span>
                      ),
                    },
                    ...(active.priority
                      ? [
                          {
                            id: 'priority',
                            label: 'Priority',
                            value: (
                              <PriorityIndicator priority={active.priority} showLabel size={13} />
                            ),
                          },
                        ]
                      : []),
                    ...(active.labels && active.labels.length > 0
                      ? [
                          {
                            id: 'labels',
                            label: 'Labels',
                            value: (
                              <span class="rf-triage-labels">
                                {active.labels.map((lbl) => (
                                  <LabelChip
                                    key={lbl.id}
                                    label={lbl.label}
                                    color={lbl.color}
                                    size="compact"
                                  />
                                ))}
                              </span>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>

              <div class="rf-triage-actions" role="toolbar" aria-label="Triage decision">
                <Button
                  size="compact"
                  variant="primary"
                  mix={on('click', () => decide(active, 'accept'))}
                >
                  Accept{' '}
                  <Kbd size="compact" variant="outline">
                    A
                  </Kbd>
                </Button>
                <Button
                  size="compact"
                  variant="secondary"
                  mix={on('click', () => decide(active, 'duplicate'))}
                >
                  Duplicate{' '}
                  <Kbd size="compact" variant="outline">
                    D
                  </Kbd>
                </Button>
                <Button
                  size="compact"
                  variant="secondary"
                  mix={on('click', () => decide(active, 'snooze'))}
                >
                  Snooze{' '}
                  <Kbd size="compact" variant="outline">
                    H
                  </Kbd>
                </Button>
                <Button
                  size="compact"
                  variant="ghost"
                  mix={on('click', () => decide(active, 'decline'))}
                >
                  Decline{' '}
                  <Kbd size="compact" variant="outline">
                    X
                  </Kbd>
                </Button>
              </div>
            </>
          ) : (
            <div class="rf-triage-empty">Select an item to review.</div>
          )}
        </div>
      </section>
    )
  }
}
