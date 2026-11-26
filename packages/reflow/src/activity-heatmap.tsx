import { on, type Handle } from 'remix/component'
import { ScrollArea } from './scroll-area.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type HeatmapTone = 'success' | 'accent' | 'warning' | 'danger'
export type HeatmapLevel = 0 | 1 | 2 | 3 | 4

export interface HeatmapCell {
  /** ISO calendar date (`YYYY-MM-DD`) or label key. */
  date: string
  /** Non-negative activity count for this day. */
  count: number
  /** Optional custom description shown in the live readout. */
  label?: string
}

export interface ActivityHeatmapProps {
  /** Chronological daily cells, grouped into 7-day weekly columns. */
  cells: readonly HeatmapCell[]
  /** Noun shown in readouts (e.g. `'commits'`, `'deploys'`, `'failures'`). Default `'events'`. */
  unit?: string
  /** Semantic color ramp for non-zero levels. Default `'success'`. */
  tone?: HeatmapTone
  /** Called when a cell is clicked or activated with Enter/Space. */
  onSelectCell?: (cell: HeatmapCell) => void
  /** Shows the Less…More intensity legend. Default `true`. */
  showLegend?: boolean
  /** Accessible name for the heatmap region. Default `'Activity heatmap'`. */
  label?: string
  /** Controls tile size and spacing. */
  size?: ControlSize
  class?: string
}

export function computeHeatmapLevel(count: number, maxCount: number): HeatmapLevel {
  if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(maxCount) || maxCount <= 0) {
    return 0
  }
  const ratio = Math.min(1, count / maxCount)
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

/**
 * Compact SVG calendar heatmap for commit cadence, deploy frequency, and CI
 * failure density with pointer and keyboard arrow scrubbing.
 */
export function ActivityHeatmap(handle: Handle<ActivityHeatmapProps>) {
  let activeIndex: number | null = null

  function moveActive(next: number, total: number) {
    if (total === 0) return
    activeIndex = Math.max(0, Math.min(total - 1, next))
    void handle.update()
  }

  return () => {
    const props = handle.props
    const cells = props.cells
    const unit = props.unit ?? 'events'
    const tone = props.tone ?? 'success'
    const showLegend = props.showLegend ?? true
    const maxCount = cells.reduce(
      (max, cell) => (Number.isFinite(cell.count) && cell.count > max ? cell.count : max),
      0,
    )
    const totalCount = cells.reduce(
      (sum, cell) => sum + (Number.isFinite(cell.count) && cell.count > 0 ? cell.count : 0),
      0,
    )

    const cols = Math.max(1, Math.ceil(cells.length / 7))
    const tile = props.size === 'compact' ? 10 : 12
    const gap = 3
    const pad = 2
    const svgWidth = cols * (tile + gap) - gap + pad * 2
    const svgHeight = 7 * (tile + gap) - gap + pad * 2
    const activeCell = activeIndex !== null ? cells[activeIndex] : undefined

    return (
      <section
        class={classList('rf-activity-heatmap', props.class)}
        data-tone={tone}
        data-size={props.size}
        aria-label={props.label ?? 'Activity heatmap'}
      >
        <div class="rf-activity-heatmap-head">
          <span class="rf-activity-heatmap-readout" aria-live="polite">
            {activeCell
              ? (activeCell.label ?? `${activeCell.count} ${unit} on ${activeCell.date}`)
              : `${totalCount} ${unit} across ${cells.length} days`}
          </span>

          {showLegend && (
            <span class="rf-activity-heatmap-legend" aria-hidden="true">
              <span>Less</span>
              {([0, 1, 2, 3, 4] as const).map((level) => (
                <span key={level} class="rf-activity-heatmap-swatch" data-level={level} />
              ))}
              <span>More</span>
            </span>
          )}
        </div>

        <ScrollArea orientation="horizontal">
          <div
            class="rf-activity-heatmap-canvas"
            tabIndex={0}
            role="group"
            aria-label={`${props.label ?? 'Activity heatmap'}, use arrow keys to scrub days`}
            mix={[
              on('mouseleave', () => {
                if (activeIndex !== null) {
                  activeIndex = null
                  void handle.update()
                }
              }),
              on('keydown', (event) => {
                if (cells.length === 0) return
                const current = activeIndex ?? 0
                if (event.key === 'ArrowRight') {
                  event.preventDefault()
                  moveActive(current + 7, cells.length)
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault()
                  moveActive(current - 7, cells.length)
                } else if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  moveActive(current + 1, cells.length)
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  moveActive(current - 1, cells.length)
                } else if (event.key === 'Home') {
                  event.preventDefault()
                  moveActive(0, cells.length)
                } else if (event.key === 'End') {
                  event.preventDefault()
                  moveActive(cells.length - 1, cells.length)
                } else if (event.key === 'Escape') {
                  activeIndex = null
                  void handle.update()
                } else if ((event.key === 'Enter' || event.key === ' ') && activeIndex !== null) {
                  event.preventDefault()
                  const target = cells[activeIndex]
                  if (target) props.onSelectCell?.(target)
                }
              }),
            ]}
          >
            <svg
              class="rf-activity-heatmap-svg"
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              role="img"
              aria-label={`${totalCount} ${unit} over ${cells.length} days`}
            >
              {cells.map((cell, index) => {
                const col = Math.floor(index / 7)
                const row = index % 7
                const x = pad + col * (tile + gap)
                const y = pad + row * (tile + gap)
                const level = computeHeatmapLevel(cell.count, maxCount)
                const isActive = activeIndex === index

                return (
                  <rect
                    key={`${cell.date}-${index}`}
                    class="rf-activity-heatmap-cell"
                    x={x}
                    y={y}
                    width={tile}
                    height={tile}
                    rx={2.5}
                    data-level={level}
                    data-active={isActive ? 'true' : undefined}
                    mix={[
                      on('pointerenter', () => {
                        activeIndex = index
                        void handle.update()
                      }),
                      on('click', () => {
                        activeIndex = index
                        void handle.update()
                        props.onSelectCell?.(cell)
                      }),
                    ]}
                  >
                    <title>{cell.label ?? `${cell.count} ${unit} on ${cell.date}`}</title>
                  </rect>
                )
              })}
            </svg>
          </div>
        </ScrollArea>
      </section>
    )
  }
}
