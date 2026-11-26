import { on, type Handle } from 'remix/component'
import { Avatar } from './avatar.tsx'
import { Button } from './button.tsx'
import { Icon } from './icon.tsx'
import { PriorityIndicator, type IssuePriority } from './priority-indicator.tsx'
import { ProgressRing } from './progress-ring.tsx'
import { StatusIcon, type IssueStatusKind } from './status-icon.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface SubIssue {
  id: string
  key?: string
  title: string
  status: IssueStatusKind
  priority?: IssuePriority
  assignee?: string
  assigneeSrc?: string
}

export interface SubIssueListProps {
  /** Child issues in order. */
  items: readonly SubIssue[]
  /** Called when the status button is clicked to toggle between `'done'` and `'todo'`. */
  onToggleStatus?: (item: SubIssue, nextStatus: IssueStatusKind) => void
  /** Called when a sub-issue title is clicked. */
  onSelect?: (item: SubIssue) => void
  /** Optional inline add handler; renders an `+ Add sub-issue` form when provided. */
  onAdd?: (title: string) => void
  /** Optional remove handler. */
  onRemove?: (item: SubIssue) => void
  /** Section heading. Default `'Sub-issues'`. */
  title?: string
  /** Controls row spacing and font scale. */
  size?: ControlSize
  class?: string
}

/**
 * Nested sub-issue checklist for issue detail panels with a radial completion
 * ring, one-click status toggles, assignee avatars, and inline creation.
 */
export function SubIssueList(handle: Handle<SubIssueListProps>) {
  let draft = ''

  function submitDraft() {
    const trimmed = draft.trim()
    if (!trimmed) return
    handle.props.onAdd?.(trimmed)
    draft = ''
    void handle.update()
  }

  return () => {
    const props = handle.props
    const items = props.items
    const doneCount = items.filter((item) => item.status === 'done').length

    return (
      <section
        class={classList('rf-sub-issue-list', props.class)}
        data-size={props.size}
        aria-label={props.title ?? 'Sub-issues'}
      >
        <header class="rf-sub-issue-header">
          <ProgressRing
            label={`${doneCount} of ${items.length} sub-issues done`}
            value={doneCount}
            max={Math.max(1, items.length)}
            size={16}
            tone="success"
          />
          <span class="rf-sub-issue-heading">{props.title ?? 'Sub-issues'}</span>
          <span class="rf-sub-issue-count">
            {doneCount}/{items.length}
          </span>
        </header>

        <ul class="rf-sub-issue-rows">
          {items.map((item) => {
            const isDone = item.status === 'done'
            const nextStatus: IssueStatusKind = isDone ? 'todo' : 'done'
            return (
              <li key={item.id} class="rf-sub-issue-row" data-done={isDone ? 'true' : undefined}>
                <button
                  type="button"
                  class="rf-sub-issue-status-btn"
                  aria-label={`Mark ${item.title} as ${nextStatus}`}
                  disabled={!props.onToggleStatus}
                  mix={
                    props.onToggleStatus
                      ? on('click', () => props.onToggleStatus?.(item, nextStatus))
                      : undefined
                  }
                >
                  <StatusIcon status={item.status} size={14} decorative />
                </button>

                {item.priority && <PriorityIndicator priority={item.priority} size={12} />}
                {item.key && <span class="rf-sub-issue-key">{item.key}</span>}

                {props.onSelect ? (
                  <button
                    type="button"
                    class="rf-sub-issue-title-btn"
                    mix={on('click', () => props.onSelect?.(item))}
                  >
                    {item.title}
                  </button>
                ) : (
                  <span class="rf-sub-issue-title">{item.title}</span>
                )}

                <span class="rf-sub-issue-trailing">
                  {item.assignee && (
                    <Avatar name={item.assignee} src={item.assigneeSrc} size={18} decorative />
                  )}
                  {props.onRemove && (
                    <Button
                      variant="ghost"
                      size="icon-compact"
                      aria-label={`Remove ${item.title}`}
                      mix={on('click', () => props.onRemove?.(item))}
                    >
                      <Icon name="x" size={12} />
                    </Button>
                  )}
                </span>
              </li>
            )
          })}
        </ul>

        {props.onAdd && (
          <form
            class="rf-sub-issue-add"
            mix={on('submit', (event) => {
              event.preventDefault()
              submitDraft()
            })}
          >
            <Icon name="plus" size={13} class="rf-sub-issue-add-icon" />
            <input
              type="text"
              class="rf-sub-issue-add-input"
              placeholder="Add sub-issue…"
              aria-label="Add sub-issue"
              value={draft}
              mix={on('input', (event) => {
                const target = event.currentTarget
                draft = target instanceof HTMLInputElement ? target.value : ''
                void handle.update()
              })}
            />
            {draft.trim().length > 0 && (
              <Button type="submit" size="compact" variant="secondary">
                Add
              </Button>
            )}
          </form>
        )}
      </section>
    )
  }
}
