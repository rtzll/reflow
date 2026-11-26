import { on, ref, type Handle } from 'remix/component'
import { Button } from './button.tsx'
import { EstimatePill } from './estimate-pill.tsx'
import { InlinePropertyPicker, type InlinePropertyOption } from './inline-property-picker.tsx'
import { PriorityIndicator, type IssuePriority } from './priority-indicator.tsx'
import { StatusIcon, type IssueStatusKind } from './status-icon.tsx'
import { Switch } from './switch.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface QuickCreateDraft {
  title: string
  status: IssueStatusKind
  priority: IssuePriority
  assignee?: string
  estimate?: string | number | null
}

export interface QuickCreateBarProps {
  /** Called when the user submits a non-empty issue draft. */
  onCreate: (draft: QuickCreateDraft) => void
  /** Initial status value. Default `'todo'`. */
  defaultStatus?: IssueStatusKind
  /** Initial priority value. Default `'medium'`. */
  defaultPriority?: IssuePriority
  /** Optional assignee choices. */
  assignees?: readonly InlinePropertyOption[]
  /** Placeholder text for the title input. Default `'Issue title…'`. */
  placeholder?: string
  /** Submit button label. Default `'Create issue'`. */
  submitLabel?: string
  /** Shows the "Create more" switch so rapid capture keeps focus in the title input. Default `true`. */
  showCreateMore?: boolean
  /** Accessible name for the quick-create form. Default `'Create issue'`. */
  label?: string
  /** Controls spacing and typography scale. */
  size?: ControlSize
  class?: string
}

const statusOptions: readonly InlinePropertyOption[] = [
  {
    value: 'backlog',
    label: 'Backlog',
    icon: <StatusIcon status="backlog" size={13} decorative />,
  },
  { value: 'todo', label: 'Todo', icon: <StatusIcon status="todo" size={13} decorative /> },
  {
    value: 'in-progress',
    label: 'In progress',
    icon: <StatusIcon status="in-progress" size={13} decorative />,
  },
  {
    value: 'in-review',
    label: 'In review',
    icon: <StatusIcon status="in-review" size={13} decorative />,
  },
  { value: 'done', label: 'Done', icon: <StatusIcon status="done" size={13} decorative /> },
]

const priorityOptions: readonly InlinePropertyOption[] = [
  {
    value: 'urgent',
    label: 'Urgent',
    icon: <PriorityIndicator priority="urgent" size={13} decorative />,
  },
  {
    value: 'high',
    label: 'High',
    icon: <PriorityIndicator priority="high" size={13} decorative />,
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: <PriorityIndicator priority="medium" size={13} decorative />,
  },
  { value: 'low', label: 'Low', icon: <PriorityIndicator priority="low" size={13} decorative /> },
  {
    value: 'none',
    label: 'No priority',
    icon: <PriorityIndicator priority="none" size={13} decorative />,
  },
]

/**
 * Linear-style inline issue capture bar with title input, quick property pills
 * (Status, Priority, Assignee, Estimate), Create more toggle, and Enter submit.
 */
export function QuickCreateBar(handle: Handle<QuickCreateBarProps>) {
  let title = ''
  let status: IssueStatusKind = handle.props.defaultStatus ?? 'todo'
  let priority: IssuePriority = handle.props.defaultPriority ?? 'medium'
  let assignee: string | undefined
  let estimate: string | number | null = null
  let createMore = false
  let inputEl: HTMLInputElement | null = null

  const inputRef = ref<HTMLInputElement>((node) => {
    inputEl = node
  })

  function submit() {
    const trimmed = title.trim()
    if (!trimmed) return
    handle.props.onCreate({
      title: trimmed,
      status,
      priority,
      assignee,
      estimate,
    })
    title = ''
    if (!createMore) {
      estimate = null
    }
    void handle.update()
    if (createMore) {
      queueMicrotask(() => inputEl?.focus())
    }
  }

  return () => {
    const props = handle.props
    const showCreateMore = props.showCreateMore ?? true

    return (
      <form
        class={classList('rf-quick-create', props.class)}
        data-size={props.size}
        aria-label={props.label ?? 'Create issue'}
        mix={on('submit', (event) => {
          event.preventDefault()
          submit()
        })}
      >
        <input
          type="text"
          class="rf-quick-create-input"
          placeholder={props.placeholder ?? 'Issue title…'}
          aria-label="Issue title"
          value={title}
          mix={[
            inputRef,
            on('input', (event) => {
              const target = event.currentTarget
              title = target instanceof HTMLInputElement ? target.value : ''
              void handle.update()
            }),
            on('keydown', (event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            }),
          ]}
        />

        <div class="rf-quick-create-footer">
          <div class="rf-quick-create-props">
            <InlinePropertyPicker
              label="Status"
              size="compact"
              value={status}
              options={statusOptions}
              onChange={(next) => {
                status = next as IssueStatusKind
                void handle.update()
              }}
            />
            <InlinePropertyPicker
              label="Priority"
              size="compact"
              value={priority}
              options={priorityOptions}
              onChange={(next) => {
                priority = next as IssuePriority
                void handle.update()
              }}
            />
            {props.assignees && props.assignees.length > 0 && (
              <InlinePropertyPicker
                label="Assignee"
                size="compact"
                placeholder="Assignee"
                searchable
                value={assignee}
                options={props.assignees}
                onChange={(next) => {
                  assignee = next
                  void handle.update()
                }}
              />
            )}
            <EstimatePill
              size="compact"
              value={estimate}
              onChange={(next) => {
                estimate = next
                void handle.update()
              }}
            />
          </div>

          <div class="rf-quick-create-submit">
            {showCreateMore && (
              <Switch
                label="Create more"
                size="compact"
                checked={createMore}
                onCheckedChange={(checked) => {
                  createMore = checked
                  void handle.update()
                }}
              />
            )}
            <Button type="submit" size="compact" disabled={title.trim().length === 0}>
              {props.submitLabel ?? 'Create issue'}
            </Button>
          </div>
        </div>
      </form>
    )
  }
}
