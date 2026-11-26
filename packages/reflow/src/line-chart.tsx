import { on, type Handle } from 'remix/component'
import { classList, type ControlSize } from './systems/styling.ts'

export interface LineChartSeries {
  id: string
  label: string
  values: readonly number[]
  /** Optional CSS color override; defaults to Reflow's semantic palette. */
  color?: string
  /** Fills a subtle translucent area beneath the line. */
  area?: boolean
  /** Renders a dashed comparison line (e.g. p50 baseline). */
  dashed?: boolean
}

export interface LineChartProps {
  /** Accessible name for the chart region. */
  label: string
  /** X-axis category or timestamp labels aligned with each series' `values`. */
  labels: readonly string[]
  /** One or more numeric series to plot. */
  series: readonly LineChartSeries[]
  /** Explicit lower Y-axis bound. */
  min?: number
  /** Explicit upper Y-axis bound. */
  max?: number
  /** Plot height in pixels. Default `180`. */
  height?: number
  /** Shows horizontal gridlines and Y-axis tick labels. Default `true`. */
  showGrid?: boolean
  /** Shows the series legend. Defaults to `true` when multiple series exist. */
  showLegend?: boolean
  /** Formats Y-axis ticks and active readout values. */
  formatValue?: (value: number) => string
  /** Called when the hovered or keyboard-focused X index changes (`null` on leave). */
  onActiveIndexChange?: (index: number | null) => void
  /** Controls spacing and typography scale. */
  size?: ControlSize
  class?: string
}

const SERIES_COLORS = [
  'var(--rf-accent)',
  'var(--rf-info, #3b82f6)',
  'var(--rf-success)',
  'var(--rf-warning)',
  'var(--rf-danger)',
] as const

const PLOT_W = 600
const PLOT_H = 180
const PAD_TOP = 10
const PAD_BOTTOM = 10

function niceBounds(series: readonly LineChartSeries[], minProp?: number, maxProp?: number) {
  const all = series.flatMap((s) => s.values.filter((v) => Number.isFinite(v)))
  if (all.length === 0) return { lo: 0, hi: 100 }
  const dataMin = Math.min(...all)
  const dataMax = Math.max(...all)
  const lo = minProp !== undefined ? minProp : Math.min(0, dataMin)
  const rawHi = maxProp !== undefined ? maxProp : dataMax === lo ? lo + 1 : dataMax
  const hi = maxProp !== undefined ? rawHi : rawHi + (rawHi - lo) * 0.08
  return { lo, hi: hi === lo ? lo + 1 : hi }
}

function defaultFormat(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/**
 * Responsive continuous time-series and area chart with multi-series support,
 * Y-axis gridlines, and pointer/keyboard crosshair scrubbing.
 */
export function LineChart(handle: Handle<LineChartProps>) {
  let activeIndex: number | null = null

  function setActive(next: number | null) {
    if (activeIndex === next) return
    activeIndex = next
    handle.props.onActiveIndexChange?.(next)
    void handle.update()
  }

  return () => {
    const props = handle.props
    const count = Math.max(props.labels.length, ...props.series.map((s) => s.values.length), 0)
    const { lo, hi } = niceBounds(props.series, props.min, props.max)
    const span = hi - lo || 1
    const format = props.formatValue ?? defaultFormat
    const showGrid = props.showGrid ?? true
    const showLegend = props.showLegend ?? props.series.length > 1
    const height = props.height ?? 180
    const usableH = PLOT_H - PAD_TOP - PAD_BOTTOM

    const xAt = (idx: number) => (count <= 1 ? PLOT_W / 2 : (idx / (count - 1)) * PLOT_W)
    const yAt = (val: number) => {
      const safe = Number.isFinite(val) ? val : lo
      const norm = Math.max(0, Math.min(1, (safe - lo) / span))
      return Number((PLOT_H - PAD_BOTTOM - norm * usableH).toFixed(1))
    }

    const ticks = [hi, lo + span * 0.66, lo + span * 0.33, lo]
    const xTicks =
      count <= 6
        ? props.labels.map((text, idx) => ({ text, idx }))
        : [
            { text: props.labels[0] ?? '', idx: 0 },
            {
              text: props.labels[Math.floor((count - 1) / 2)] ?? '',
              idx: Math.floor((count - 1) / 2),
            },
            { text: props.labels[count - 1] ?? '', idx: count - 1 },
          ]

    const renderedSeries = props.series.map((s, seriesIndex) => {
      const color = s.color ?? SERIES_COLORS[seriesIndex % SERIES_COLORS.length]!
      const pts = s.values.map((val, idx) => [Number(xAt(idx).toFixed(1)), yAt(val)] as const)
      const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
      const areaPath =
        s.area && pts.length >= 2
          ? `${line} L ${pts[pts.length - 1]![0]} ${PLOT_H - PAD_BOTTOM} L ${pts[0]![0]} ${PLOT_H - PAD_BOTTOM} Z`
          : ''
      return { ...s, color, pts, line, areaPath }
    })

    const currentIndex = activeIndex
    const activeLabel =
      currentIndex !== null ? (props.labels[currentIndex] ?? `#${currentIndex + 1}`) : null
    const activeX = currentIndex !== null ? xAt(currentIndex) : null

    return (
      <figure
        class={classList('rf-line-chart', props.class)}
        data-size={props.size}
        aria-label={props.label}
      >
        {(showLegend || activeLabel !== null) && (
          <figcaption class="rf-line-chart-head">
            <div class="rf-line-chart-legend">
              {renderedSeries.map((s) => {
                const val = activeIndex !== null ? s.values[activeIndex] : undefined
                return (
                  <span key={s.id} class="rf-line-chart-legend-item">
                    <span
                      class="rf-line-chart-swatch"
                      style={{ background: s.color }}
                      aria-hidden="true"
                    />
                    <span class="rf-line-chart-legend-label">{s.label}</span>
                    {val !== undefined && (
                      <strong class="rf-line-chart-legend-val">{format(val)}</strong>
                    )}
                  </span>
                )
              })}
            </div>
            <span class="rf-line-chart-readout" aria-live="polite">
              {activeLabel ?? ''}
            </span>
          </figcaption>
        )}

        <div class="rf-line-chart-frame" data-grid={showGrid ? 'true' : undefined}>
          {showGrid && (
            <div class="rf-line-chart-yaxis" style={{ height: `${height}px` }} aria-hidden="true">
              {ticks.map((tick, idx) => (
                <span key={idx}>{format(tick)}</span>
              ))}
            </div>
          )}

          <div class="rf-line-chart-main">
            <div
              class="rf-line-chart-stage"
              style={{ height: `${height}px` }}
              tabIndex={0}
              role="slider"
              aria-label={props.label}
              aria-valuemin={0}
              aria-valuemax={Math.max(0, count - 1)}
              aria-valuenow={activeIndex ?? Math.max(0, count - 1)}
              aria-valuetext={
                currentIndex !== null
                  ? `${activeLabel}: ${renderedSeries
                      .map((s) => `${s.label} ${format(s.values[currentIndex] ?? 0)}`)
                      .join(', ')}`
                  : undefined
              }
              mix={[
                on<HTMLDivElement, 'pointermove'>('pointermove', (event) => {
                  if (count === 0) return
                  const rect = event.currentTarget.getBoundingClientRect()
                  if (rect.width <= 0) return
                  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
                  setActive(Math.round(ratio * (count - 1)))
                }),
                on('pointerleave', () => setActive(null)),
                on('blur', () => setActive(null)),
                on<HTMLDivElement, 'keydown'>('keydown', (event) => {
                  if (count === 0) return
                  const cur = activeIndex ?? count - 1
                  if (event.key === 'ArrowLeft') {
                    event.preventDefault()
                    setActive(Math.max(0, cur - 1))
                  } else if (event.key === 'ArrowRight') {
                    event.preventDefault()
                    setActive(Math.min(count - 1, cur + 1))
                  } else if (event.key === 'Home') {
                    event.preventDefault()
                    setActive(0)
                  } else if (event.key === 'End') {
                    event.preventDefault()
                    setActive(count - 1)
                  }
                }),
              ]}
            >
              <svg
                class="rf-line-chart-svg"
                viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {showGrid &&
                  ticks.map((tick, idx) => {
                    const y = yAt(tick)
                    return (
                      <line
                        key={idx}
                        class="rf-line-chart-gridline"
                        x1={0}
                        y1={y}
                        x2={PLOT_W}
                        y2={y}
                        vector-effect="non-scaling-stroke"
                      />
                    )
                  })}

                {renderedSeries.map((s) => (
                  <g key={s.id} style={{ '--series-color': s.color }}>
                    {s.areaPath && <path class="rf-line-chart-area" d={s.areaPath} />}
                    {s.line && (
                      <path
                        class="rf-line-chart-line"
                        data-dashed={s.dashed ? 'true' : undefined}
                        d={s.line}
                        vector-effect="non-scaling-stroke"
                      />
                    )}
                  </g>
                ))}

                {activeX !== null && (
                  <line
                    class="rf-line-chart-crosshair"
                    x1={activeX}
                    y1={0}
                    x2={activeX}
                    y2={PLOT_H}
                    vector-effect="non-scaling-stroke"
                  />
                )}
              </svg>

              {currentIndex !== null && (
                <div class="rf-line-chart-dots" aria-hidden="true">
                  {renderedSeries.map((s) => {
                    const pt = s.pts[currentIndex]
                    if (!pt) return null
                    const leftPct = (pt[0] / PLOT_W) * 100
                    const topPct = (pt[1] / PLOT_H) * 100
                    return (
                      <span
                        key={s.id}
                        class="rf-line-chart-dot"
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          background: s.color,
                        }}
                      />
                    )
                  })}
                </div>
              )}
            </div>

            {xTicks.length > 0 && (
              <div class="rf-line-chart-xaxis" aria-hidden="true">
                {xTicks.map((tick) => (
                  <span key={tick.idx}>{tick.text}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </figure>
    )
  }
}
