import { on, type Handle } from 'remix/component'
import { Avatar } from './avatar.tsx'
import { ProgressRing } from './progress-ring.tsx'
import { ScrollArea } from './scroll-area.tsx'
import { SegmentedControl } from './segmented-control.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type RoadmapZoom = 'weeks' | 'months' | 'quarters'
export type RoadmapTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

export interface RoadmapMilestone {
  id: string
  label: string
  /** ISO date string (`YYYY-MM-DD`). */
  date: string
  completed?: boolean
}

export interface RoadmapItem {
  id: string
  title: string
  owner?: string
  avatarSrc?: string
  /** ISO start date (`YYYY-MM-DD`). */
  startDate: string
  /** ISO end date (`YYYY-MM-DD`). */
  endDate: string
  /** Completion percentage (`0–100`). */
  progress?: number
  tone?: RoadmapTone
  milestones?: readonly RoadmapMilestone[]
}

export interface RoadmapTimelineProps {
  /** Projects or initiatives displayed as horizontal roadmap bars. */
  items: readonly RoadmapItem[]
  /** Timeline window start (`YYYY-MM-DD`). Defaults to earliest item start. */
  rangeStart?: string
  /** Timeline window end (`YYYY-MM-DD`). Defaults to latest item end. */
  rangeEnd?: string
  /** Vertical "today" marker date (`YYYY-MM-DD`). */
  today?: string
  /** Initial zoom level. Default `'months'`. */
  defaultZoom?: RoadmapZoom
  /** Called when a project bar is clicked. */
  onSelectItem?: (item: RoadmapItem) => void
  /** Called when a diamond milestone marker is clicked. */
  onSelectMilestone?: (item: RoadmapItem, milestone: RoadmapMilestone) => void
  /** Accessible name for the roadmap region. Default `'Project roadmap'`. */
  label?: string
  /** Controls row height and density. */
  size?: ControlSize
  class?: string
}

function parseIsoMs(iso: string): number {
  const ms = Date.parse(iso.includes('T') ? iso : `${iso}T00:00:00Z`)
  return Number.isFinite(ms) ? ms : 0
}

export function computeTimelinePercent(date: string, rangeStart: string, rangeEnd: string): number {
  const start = parseIsoMs(rangeStart)
  const end = parseIsoMs(rangeEnd)
  if (end <= start) return 0
  const val = parseIsoMs(date)
  return Math.max(0, Math.min(100, ((val - start) / (end - start)) * 100))
}

function buildTicks(
  rangeStart: string,
  rangeEnd: string,
  zoom: RoadmapZoom,
): Array<{ label: string; pct: number }> {
  const start = parseIsoMs(rangeStart)
  const end = parseIsoMs(rangeEnd)
  if (end <= start) return []
  const count = zoom === 'weeks' ? 8 : zoom === 'quarters' ? 4 : 6
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const ticks: Array<{ label: string; pct: number }> = []
  for (let i = 0; i < count; i++) {
    const frac = i / count
    const d = new Date(start + frac * (end - start))
    const label =
      zoom === 'quarters'
        ? `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`
        : zoom === 'weeks'
          ? `${months[d.getUTCMonth()]} ${d.getUTCDate()}`
          : `${months[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`
    ticks.push({ label, pct: frac * 100 })
  }
  return ticks
}

/**
 * Linear-style horizontal project roadmap timeline with zoom switcher,
 * completion rings, duration bars, diamond milestones, and a today marker.
 */
export function RoadmapTimeline(handle: Handle<RoadmapTimelineProps>) {
  let zoom: RoadmapZoom = handle.props.defaultZoom ?? 'months'

  return () => {
    const props = handle.props
    const items = props.items
    const sortedStarts = items.map((item) => item.startDate).sort()
    const sortedEnds = items.map((item) => item.endDate).sort()
    const rangeStart = props.rangeStart ?? sortedStarts[0] ?? '2026-01-01'
    const rangeEnd = props.rangeEnd ?? sortedEnds[sortedEnds.length - 1] ?? '2026-12-31'
    const ticks = buildTicks(rangeStart, rangeEnd, zoom)
    const todayPct = props.today ? computeTimelinePercent(props.today, rangeStart, rangeEnd) : null

    return (
      <section
        class={classList('rf-roadmap', props.class)}
        data-size={props.size}
        data-zoom={zoom}
        aria-label={props.label ?? 'Project roadmap'}
      >
        <header class="rf-roadmap-toolbar">
          <span class="rf-roadmap-title">{props.label ?? 'Roadmap'}</span>
          <SegmentedControl
            label="Timeline zoom"
            size="compact"
            value={zoom}
            options={[
              { value: 'weeks', label: 'Weeks' },
              { value: 'months', label: 'Months' },
              { value: 'quarters', label: 'Quarters' },
            ]}
            onValueChange={(value) => {
              zoom = value as RoadmapZoom
              void handle.update()
            }}
          />
        </header>

        <ScrollArea orientation="horizontal">
          <div class="rf-roadmap-grid">
            <div class="rf-roadmap-head-row">
              <div class="rf-roadmap-sidebar-head">Project</div>
              <div class="rf-roadmap-axis">
                {ticks.map((tick, index) => (
                  <span
                    key={`${tick.label}-${index}`}
                    class="rf-roadmap-tick"
                    style={{ insetInlineStart: `${tick.pct}%` }}
                  >
                    {tick.label}
                  </span>
                ))}
              </div>
            </div>

            <div class="rf-roadmap-rows">
              {items.map((item) => {
                const left = computeTimelinePercent(item.startDate, rangeStart, rangeEnd)
                const right = computeTimelinePercent(item.endDate, rangeStart, rangeEnd)
                const width = Math.max(4, right - left)
                const progress = Math.max(0, Math.min(100, item.progress ?? 0))

                return (
                  <div key={item.id} class="rf-roadmap-row">
                    <div class="rf-roadmap-sidebar-cell">
                      <ProgressRing
                        label={`${item.title} ${progress}% complete`}
                        value={progress}
                        max={100}
                        size={16}
                        tone={
                          item.tone === 'danger'
                            ? 'danger'
                            : item.tone === 'warning'
                              ? 'warning'
                              : 'accent'
                        }
                      />
                      <span class="rf-roadmap-item-title">{item.title}</span>
                      {item.owner && (
                        <Avatar name={item.owner} src={item.avatarSrc} size={20} decorative />
                      )}
                    </div>

                    <div class="rf-roadmap-track">
                      {todayPct !== null && (
                        <span
                          class="rf-roadmap-today"
                          style={{ insetInlineStart: `${todayPct}%` }}
                          aria-hidden="true"
                        />
                      )}

                      <button
                        type="button"
                        class="rf-roadmap-bar"
                        data-tone={item.tone ?? 'accent'}
                        style={{ insetInlineStart: `${left}%`, width: `${width}%` }}
                        aria-label={`${item.title}: ${item.startDate} to ${item.endDate} (${progress}%)`}
                        mix={on('click', () => props.onSelectItem?.(item))}
                      >
                        <span class="rf-roadmap-bar-fill" style={{ width: `${progress}%` }} />
                        <span class="rf-roadmap-bar-label">{item.title}</span>
                      </button>

                      {item.milestones?.map((ms) => {
                        const pos = computeTimelinePercent(ms.date, rangeStart, rangeEnd)
                        return (
                          <button
                            key={ms.id}
                            type="button"
                            class="rf-roadmap-milestone"
                            data-completed={ms.completed ? 'true' : undefined}
                            style={{ insetInlineStart: `${pos}%` }}
                            aria-label={`Milestone: ${ms.label} (${ms.date})`}
                            title={`${ms.label} · ${ms.date}`}
                            mix={on('click', () => props.onSelectMilestone?.(item, ms))}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ScrollArea>
      </section>
    )
  }
}
