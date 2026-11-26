import { on, type Handle } from 'remix/component'
import { Avatar } from './avatar.tsx'
import { LineChart, type LineChartSeries } from './line-chart.tsx'
import { ProgressRing, type ProgressRingTone } from './progress-ring.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface CycleStatusCount {
  id: string
  label: string
  count: number
  tone?: ProgressRingTone
  /** Marks this status as completed for the central completion percentage. */
  completed?: boolean
}

export interface CycleAssigneeWorkload {
  name: string
  avatarSrc?: string
  total: number
  completed: number
  inProgress?: number
}

export interface CycleOverviewProps {
  /** Cycle heading (e.g. `'Cycle 14'`). */
  title?: string
  /** Optional date window subtitle (e.g. `'Nov 18 – Dec 2'`). */
  dateRange?: string
  /** Status counts rendered in the radial ring and interactive legend. */
  statuses: readonly CycleStatusCount[]
  /** Optional assignee workload breakdown with click-to-filter support. */
  assignees?: readonly CycleAssigneeWorkload[]
  /** Optional scope/completed burnup or burndown chart series. */
  burndown?: {
    labels: readonly string[]
    series: readonly LineChartSeries[]
  }
  /** Currently active status filter ID. */
  activeStatusId?: string | null
  /** Currently active assignee filter name. */
  activeAssignee?: string | null
  /** Called when a status legend row is clicked. */
  onFilterStatus?: (statusId: string) => void
  /** Called when an assignee workload row is clicked. */
  onFilterAssignee?: (assignee: string) => void
  /** Accessible name for the cycle overview region. Default `'Cycle overview'`. */
  label?: string
  /** Controls spacing and typography scale. */
  size?: ControlSize
  class?: string
}

/**
 * Sprint / cycle summary dashboard composing ProgressRing, interactive status
 * breakdown, assignee workload bars, and an optional scope burndown LineChart.
 */
export function CycleOverview(handle: Handle<CycleOverviewProps>) {
  return () => {
    const props = handle.props
    const total = props.statuses.reduce((sum, s) => sum + Math.max(0, s.count), 0)
    const completed = props.statuses
      .filter((s) => s.completed)
      .reduce((sum, s) => sum + Math.max(0, s.count), 0)
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const largestWorkload = Math.max(1, ...(props.assignees?.map((a) => a.total) ?? [1]))

    return (
      <section
        class={classList('rf-cycle-overview', props.class)}
        data-size={props.size}
        aria-label={props.label ?? props.title ?? 'Cycle overview'}
      >
        {(props.title || props.dateRange) && (
          <header class="rf-cycle-overview-head">
            {props.title && <h2 class="rf-cycle-overview-title">{props.title}</h2>}
            {props.dateRange && <span class="rf-cycle-overview-dates">{props.dateRange}</span>}
            <span class="rf-cycle-overview-total">
              {completed}/{total} done ({pct}%)
            </span>
          </header>
        )}

        <div class="rf-cycle-overview-grid">
          <div class="rf-cycle-overview-card">
            <div class="rf-cycle-overview-card-head">
              <span>Progress</span>
              <span>{total} issues</span>
            </div>
            <div class="rf-cycle-overview-progress">
              <ProgressRing
                label={`Cycle ${pct}% complete`}
                size={84}
                strokeWidth={9}
                segments={props.statuses.map((s) => ({
                  id: s.id,
                  label: s.label,
                  value: s.count,
                  tone: s.tone ?? (s.completed ? 'success' : 'neutral'),
                }))}
              >
                <strong class="rf-cycle-overview-pct">{pct}%</strong>
                <span class="rf-cycle-overview-pct-sub">done</span>
              </ProgressRing>

              <div class="rf-cycle-overview-legend">
                {props.statuses.map((status) => {
                  const active = props.activeStatusId === status.id
                  const tone = status.tone ?? (status.completed ? 'success' : 'neutral')
                  return (
                    <button
                      key={status.id}
                      type="button"
                      class="rf-cycle-overview-legend-row"
                      data-active={active ? 'true' : undefined}
                      aria-pressed={active ? 'true' : 'false'}
                      disabled={!props.onFilterStatus}
                      mix={
                        props.onFilterStatus
                          ? on('click', () => props.onFilterStatus?.(status.id))
                          : undefined
                      }
                    >
                      <span class="rf-cycle-overview-dot" data-tone={tone} aria-hidden="true" />
                      <span class="rf-cycle-overview-legend-label">{status.label}</span>
                      <strong class="rf-cycle-overview-legend-count">{status.count}</strong>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {props.assignees && props.assignees.length > 0 && (
            <div class="rf-cycle-overview-card">
              <div class="rf-cycle-overview-card-head">
                <span>Team workload</span>
                <span>{props.assignees.length} assignees</span>
              </div>
              <div class="rf-cycle-overview-workload">
                {props.assignees.map((person) => {
                  const active = props.activeAssignee === person.name
                  const doneWidth = (person.completed / largestWorkload) * 100
                  const activeWidth = ((person.inProgress ?? 0) / largestWorkload) * 100
                  const remainingWidth =
                    (Math.max(0, person.total - person.completed - (person.inProgress ?? 0)) /
                      largestWorkload) *
                    100
                  return (
                    <button
                      key={person.name}
                      type="button"
                      class="rf-cycle-overview-assignee"
                      data-active={active ? 'true' : undefined}
                      aria-pressed={active ? 'true' : 'false'}
                      disabled={!props.onFilterAssignee}
                      mix={
                        props.onFilterAssignee
                          ? on('click', () => props.onFilterAssignee?.(person.name))
                          : undefined
                      }
                    >
                      <Avatar name={person.name} src={person.avatarSrc} size={20} decorative />
                      <span class="rf-cycle-overview-assignee-name">{person.name}</span>
                      <span class="rf-cycle-overview-bar" aria-hidden="true">
                        {doneWidth > 0 && (
                          <span
                            class="rf-cycle-overview-bar-seg"
                            data-tone="success"
                            style={{ width: `${doneWidth}%` }}
                          />
                        )}
                        {activeWidth > 0 && (
                          <span
                            class="rf-cycle-overview-bar-seg"
                            data-tone="warning"
                            style={{ width: `${activeWidth}%` }}
                          />
                        )}
                        {remainingWidth > 0 && (
                          <span
                            class="rf-cycle-overview-bar-seg"
                            data-tone="neutral"
                            style={{ width: `${remainingWidth}%` }}
                          />
                        )}
                      </span>
                      <strong class="rf-cycle-overview-assignee-count">{person.total}</strong>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {props.burndown && (
          <div class="rf-cycle-overview-chart">
            <LineChart
              label="Cycle velocity"
              labels={props.burndown.labels}
              series={props.burndown.series}
              height={140}
              size="compact"
            />
          </div>
        )}
      </section>
    )
  }
}
