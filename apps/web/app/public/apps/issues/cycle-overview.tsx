import { Avatar, Icon, ProgressRing, StatusIcon, type IssueStatusKind } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'
import { statuses, type Issue, type Status } from './fixtures.ts'

export type IssueFilter = { field: 'status'; value: Status } | { field: 'owner'; value: string }

interface OverviewProps {
  issues: Issue[]
  filter?: IssueFilter
  onFilter: (filter: IssueFilter) => void
}

function toStatusKind(status: Status): IssueStatusKind {
  if (status === 'Done') return 'done'
  if (status === 'In progress') return 'in-progress'
  return 'todo'
}

export function CycleOverview(handle: Handle<OverviewProps>) {
  let expanded = false
  const panelId = handle.id + '-insights'
  return () => {
    const { issues, filter, onFilter } = handle.props
    const count = (status: Status) => issues.filter((issue) => issue.status === status).length
    const percent = (value: number) => (issues.length ? (value / issues.length) * 100 : 0)
    const completion = Math.round(percent(count('Done'))) + '%'
    const owners = Array.from(new Set(issues.map((issue) => issue.owner)), (name) => ({
      name,
      assigned: issues.filter((issue) => issue.owner === name),
    })).sort((a, b) => b.assigned.length - a.assigned.length || a.name.localeCompare(b.name))
    const largest = owners[0]?.assigned.length ?? 1

    return (
      <>
        <button
          type="button"
          class="issues-overview-toggle"
          aria-controls={panelId}
          aria-expanded={expanded}
          mix={on('click', () => {
            expanded = !expanded
            void handle.update()
          })}
        >
          <strong>Cycle overview</strong>
          <span>{completion} complete</span>
          <Icon name="chevron-down" size={16} />
        </button>
        <div id={panelId} class="issues-insights">
          <section class="issues-insight" aria-label="Cycle progress">
            <div class="issues-section-heading">
              <h2>Cycle progress</h2>
              <span>{issues.length} issues</span>
            </div>
            <div class="issues-distribution">
              <ProgressRing
                label={`Cycle progress ${completion} complete`}
                size={92}
                strokeWidth={10}
                segments={[
                  { id: 'done', label: 'Done', value: count('Done'), tone: 'success' },
                  {
                    id: 'in-progress',
                    label: 'In progress',
                    value: count('In progress'),
                    tone: 'warning',
                  },
                  { id: 'todo', label: 'Todo', value: count('Todo'), tone: 'neutral' },
                ]}
              >
                <strong style={{ fontSize: '15px', lineHeight: 1 }}>{completion}</strong>
                <span style={{ fontSize: '11px', color: 'var(--rf-muted)' }}>complete</span>
              </ProgressRing>
              <div class="issues-legend">
                {statuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    aria-label={'Show ' + status + ' issues'}
                    aria-description={count(status) + ' issues'}
                    aria-pressed={filter?.field === 'status' && filter.value === status}
                    mix={on('click', () => onFilter({ field: 'status', value: status }))}
                  >
                    <StatusIcon status={toStatusKind(status)} size={13} decorative />
                    <span>{status}</span>
                    <strong>{count(status)}</strong>
                  </button>
                ))}
              </div>
            </div>
          </section>
          <section class="issues-insight" aria-label="Team workload">
            <div class="issues-section-heading">
              <h2>Team workload</h2>
              <span>{owners.length} assignees</span>
            </div>
            <div class="issues-workload">
              {owners.map(({ name, assigned }) => {
                const breakdown = statuses.map((status) => ({
                  status,
                  total: assigned.filter((issue) => issue.status === status).length,
                }))
                const summary = breakdown
                  .map(({ status, total }) => total + ' ' + status.toLowerCase())
                  .join(', ')
                return (
                  <button
                    key={name}
                    type="button"
                    aria-label={'Show issues assigned to ' + name}
                    title={summary}
                    aria-description={summary}
                    aria-pressed={filter?.field === 'owner' && filter.value === name}
                    mix={on('click', () => onFilter({ field: 'owner', value: name }))}
                  >
                    <Avatar name={name} size={21} decorative />
                    <span class="issues-owner">{name}</span>
                    <span class="issues-workload-track" aria-hidden="true">
                      {breakdown
                        .filter(({ total }) => total > 0)
                        .map(({ status, total }) => (
                          <span
                            key={status}
                            data-status={status}
                            style={{
                              width: (total / largest) * 100 + '%',
                            }}
                          />
                        ))}
                    </span>
                    <strong>{assigned.length}</strong>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </>
    )
  }
}
