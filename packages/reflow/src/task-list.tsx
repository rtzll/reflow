import type { Handle } from 'remix/component'
import { Spinner } from './spinner.tsx'

export interface Task {
  id: string
  label: string
  /** Default `pending`. */
  status?: 'pending' | 'active' | 'done'
}

export interface TaskListProps {
  tasks: readonly Task[]
  /** Names the list. Default "Tasks". */
  label?: string
  /** Shows a count above the list, such as "1 of 3 done". */
  progress?: boolean
}

const spoken = { pending: 'not started', active: 'in progress', done: 'done' } as const

/**
 * A read-only list of a plan's steps: done, in progress with a spinner, or
 * not started. See docs/task-list.md.
 */
export function TaskList(handle: Handle<TaskListProps>) {
  return () => {
    const { tasks, label = 'Tasks', progress } = handle.props
    const done = tasks.filter((task) => task.status === 'done').length
    const active = tasks.find((task) => task.status === 'active')
    return (
      <div class="rf-task-list">
        {progress && (
          <p class="rf-task-list-progress">
            {done} of {tasks.length} done
          </p>
        )}
        <ol aria-label={label}>
          {tasks.map((task) => {
            const status = task.status ?? 'pending'
            return (
              <li key={task.id} data-status={status}>
                <span class="rf-task-list-mark" aria-hidden="true">
                  {status === 'active' ? (
                    <Spinner size="14px" />
                  ) : (
                    <svg viewBox="0 0 16 16" width="16" height="16">
                      <circle class="rf-task-list-ring" cx="8" cy="8" r="6.5" />
                      <path
                        class="rf-task-list-check"
                        d="m5.25 8.25 1.9 1.9 3.6-3.9"
                        pathLength="1"
                      />
                    </svg>
                  )}
                </span>
                <span class="rf-task-list-label">
                  {task.label}
                  <span class="rf-basic-sr-only"> ({spoken[status]})</span>
                </span>
              </li>
            )
          })}
        </ol>
        <span class="rf-basic-sr-only" role="status">
          {active ? `Now: ${active.label}` : ''}
        </span>
      </div>
    )
  }
}
