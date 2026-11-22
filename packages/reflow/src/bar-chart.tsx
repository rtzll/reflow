import { on, ref, type Handle } from 'remix/component'
import { navigationIndex } from './behaviors/list-navigation.ts'
import { Tooltip } from './tooltip.tsx'

export interface BarChartItem {
  id: string
  label: string
  /** A finite quantity on a shared zero baseline. Negative values hang below zero. */
  value: number
  /** With `series`, one value per series in the same order; `value` is then ignored. */
  values?: readonly number[]
}

export interface BarChartSeries {
  id: string
  label: string
}

/** An item in a named series chart. No single value is required. */
export interface BarChartSeriesItem {
  id: string
  label: string
  values: readonly number[]
  value?: number
}

type ChartItem = BarChartItem | BarChartSeriesItem

export type BarChartProps<Item extends ChartItem = BarChartItem> = {
  label: string
  items: readonly Item[]
  /** Inclusive item IDs in either order. Omit to show all bars at full emphasis. */
  range?: { start: string; end: string }
  /** Include units in the accessible name and tooltip. */
  formatValue?: (value: number) => string
  /** Render native links that also work in server-rendered markup. */
  href?: (item: Item) => string
  /** Render buttons, or handle an unmodified link activation. */
  onSelect?: (item: Item, event: MouseEvent) => void
  describedBy?: string
  showAxes?: boolean
  /** Series side by side, or piled into one bar. Default grouped. */
  layout?: 'grouped' | 'stacked'
  /** Categories as columns, or as rows with their labels beside them. Default vertical. */
  orientation?: 'vertical' | 'horizontal'
} & ([Item] extends [BarChartItem]
  ? { series?: readonly BarChartSeries[] }
  : { series: readonly BarChartSeries[] })

// Eight hues in a fixed order; past them a series is gray rather than a
// repeat of another series' hue.
function seriesSlot(position: number) {
  return position < 8 ? position + 1 : 'other'
}

const axisNumbers = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumSignificantDigits: 3,
})

// Round the axis top up so each of its three gridline steps is a round number.
const roundSteps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
function axisTop(peak: number) {
  const step = peak / 3
  if (!(step > 0)) return peak
  const magnitude = 10 ** Math.floor(Math.log10(step))
  if (!(magnitude > 0)) return peak
  const round = roundSteps.find((value) => value * magnitude >= step * (1 - 1e-9)) ?? 10
  const top = 3 * magnitude * round
  return Number.isFinite(top) && top >= peak ? top : peak
}

// A round step for an axis spanning `span` in about three steps.
function roundStep(span: number) {
  const step = span / 3
  if (!(step > 0)) return 0
  const magnitude = 10 ** Math.floor(Math.log10(step))
  if (!(magnitude > 0)) return 0
  return magnitude * (roundSteps.find((value) => value * magnitude >= step * (1 - 1e-9)) ?? 10)
}

// Floating point would print 0.30000000000000004.
const tidy = (value: number) => Number(value.toPrecision(12))

export function BarChart<Item extends ChartItem>(handle: Handle<BarChartProps<Item>>) {
  let mounted = false
  let focusId: string | undefined
  const mount = ref(() => {
    mounted = true
    void handle.update()
  })

  return () => {
    const {
      items,
      label,
      describedBy,
      range,
      formatValue = String,
      href,
      onSelect,
      showAxes = true,
      series = [],
      layout = 'grouped',
      orientation = 'vertical',
    } = handle.props
    const finite = (value: number | undefined) =>
      typeof value === 'number' && Number.isFinite(value) ? value : 0
    const multi = series.length > 0
    const stacked = multi && layout === 'stacked'
    const horizontal = orientation === 'horizontal'
    // Each category's numbers: one per series, or its single value.
    const numbers = items.map((item) =>
      multi ? series.map((_, index) => finite(item.values?.[index])) : [finite(item.value)],
    )
    const values = numbers.map((list) => list[0]!)
    // The extent the bars reach, stacked bars by their positive and negative sums.
    const reach = numbers.map((list) =>
      stacked
        ? [
            list.reduce((sum, value) => sum + Math.min(0, value), 0),
            list.reduce((sum, value) => sum + Math.max(0, value), 0),
          ]
        : [Math.min(0, ...list), Math.max(0, ...list)],
    )
    const low = reach.reduce((min, [bottom]) => Math.min(min, bottom!), 0)
    const high = reach.reduce((max, [, top]) => Math.max(max, top!), 0)
    const peak = multi ? 0 : high
    // A nonnegative single series keeps its original scale and markup.
    const simple = !multi && !horizontal && low === 0
    let top = high
    let bottom = low
    let step = 0
    if (simple) top = peak > 0 && showAxes ? axisTop(peak) : peak
    else if (showAxes && high - low > 0) {
      step = roundStep(high - low)
      bottom = step > 0 ? Math.floor(tidy(low / step)) * step : low
      top = step > 0 ? Math.ceil(tidy(high / step)) * step : high
    }
    const span = top - bottom
    const at = (value: number) => (span > 0 ? ((value - bottom) / span) * 100 : 0)
    // Gridlines from the top down: three steps for the original scale, else every round step.
    const gridlines = simple
      ? (peak > 0 ? [1, 2 / 3, 1 / 3, 0] : [0]).map((ratio) => tidy(top * ratio))
      : step > 0
        ? Array.from({ length: Math.round((top - bottom) / step) + 1 }, (_, k) =>
            tidy(top - k * step),
          )
        : [0]
    // Where each segment sits, as percentages of the scale.
    function segments(list: readonly number[]) {
      let up = 0
      let down = 0
      return list.map((value) => {
        let from = Math.min(0, value)
        let to = Math.max(0, value)
        if (stacked) {
          if (value >= 0) {
            from = up
            to = up += value
          } else {
            to = down
            from = down += value
          }
        }
        // A segment that starts on zero sits on the baseline; one piled on
        // another, or beside another in a group, keeps a gap from it.
        const base = !stacked || from === 0 || to === 0
        return { start: at(from), size: (Math.abs(to - from) / (span || 1)) * 100, base }
      })
    }
    const start = items.findIndex(({ id }) => id === range?.start)
    const end = items.findIndex(({ id }) => id === range?.end)
    const bounded = start >= 0 && end >= 0
    const tabId = items.some(({ id }) => id === focusId)
      ? focusId
      : items[bounded ? Math.min(start, end) : 0]?.id
    const last = items.length - 1
    const ticks = new Set([0, Math.round(last / 3), Math.round((last * 2) / 3), last])

    return (
      <div
        class="rf-bar-chart"
        role="group"
        aria-label={label}
        aria-describedby={describedBy}
        data-axes={showAxes || undefined}
        data-orientation={orientation}
        data-positioned={!simple || undefined}
        mix={mount}
      >
        {items.length === 0 ? (
          <span class="rf-bar-chart-empty">No data</span>
        ) : (
          <>
            <div class="rf-bar-chart-grid" aria-hidden="true">
              {gridlines.map((value) => (
                <span
                  key={value}
                  data-zero={value === 0 || undefined}
                  style={{
                    [horizontal ? 'left' : 'bottom']:
                      (simple ? (top ? (value / top) * 100 : 0) : at(value)) + '%',
                  }}
                >
                  {showAxes && <span>{axisNumbers.format(value)}</span>}
                </span>
              ))}
            </div>
            <div class="rf-bar-chart-columns">
              {items.map((item, index) => {
                const value = values[index]!
                const name = multi
                  ? `${item.label}: ${series
                      .map(
                        (entry, position) =>
                          `${entry.label} ${formatValue(numbers[index]![position]!)}`,
                      )
                      .join(', ')}`
                  : item.label + ', ' + formatValue(value)
                const active =
                  !bounded || (index >= Math.min(start, end) && index <= Math.max(start, end))
                const current = bounded && start === end && index === start
                const attrs = {
                  class: 'rf-bar-chart-column',
                  'aria-label': name,
                  'data-active': active || undefined,
                  'data-current': current || undefined,
                  'data-peak': (!multi && peak > 0 && value === peak) || undefined,
                }
                const fill = simple ? (
                  <span
                    class="rf-bar-chart-fill"
                    data-value={value}
                    style={{ height: (top ? (value / top) * 100 : 0) + '%' }}
                  />
                ) : (
                  <span class="rf-bar-chart-plot">
                    {segments(numbers[index]!).map((segment, position) => (
                      <span
                        key={position}
                        class="rf-bar-chart-fill"
                        data-series={multi ? seriesSlot(position) : undefined}
                        data-negative={numbers[index]![position]! < 0 || undefined}
                        data-after={
                          segment.size > 0 && (stacked ? !segment.base : position > 0)
                            ? stacked
                              ? 'stacked'
                              : 'grouped'
                            : undefined
                        }
                        data-value={numbers[index]![position]}
                        style={{
                          '--start': segment.start,
                          '--size': segment.size,
                          '--index': stacked ? 0 : position,
                          '--count': stacked ? 1 : numbers[index]!.length,
                        }}
                      />
                    ))}
                  </span>
                )
                const row = horizontal ? (
                  <>
                    <span class="rf-bar-chart-row-label" aria-hidden="true">
                      {item.label}
                    </span>
                    {fill}
                  </>
                ) : (
                  fill
                )
                if (!href && !onSelect)
                  return (
                    <span key={item.id} {...attrs} role="img">
                      {row}
                    </span>
                  )
                return (
                  <Tooltip
                    key={item.id}
                    content={name}
                    followCursor="x"
                    delayDuration={100}
                    renderTrigger={(trigger) => {
                      const { 'aria-describedby': _tooltipId, ...triggerProps } = trigger
                      const control = {
                        ...attrs,
                        ...triggerProps,
                        tabIndex: !mounted || item.id === tabId ? 0 : -1,
                        'aria-current': current || undefined,
                        mix: [
                          trigger.mix,
                          on<HTMLElement, 'focus'>('focus', () => {
                            if (focusId === item.id) return
                            focusId = item.id
                            void handle.update()
                          }),
                          on<HTMLElement, 'keydown'>('keydown', (event) => {
                            const next = navigationIndex(event.key, index, items.length, {
                              orientation: horizontal ? 'vertical' : 'horizontal',
                              wrap: false,
                              rtl: getComputedStyle(event.currentTarget).direction === 'rtl',
                            })
                            if (next === undefined) return
                            event.preventDefault()
                            event.currentTarget.parentElement
                              ?.querySelectorAll<HTMLElement>('.rf-bar-chart-column')
                              [next]?.focus()
                          }),
                          on<HTMLElement, 'click'>('click', (event) => {
                            if (
                              href &&
                              (event.defaultPrevented ||
                                event.button !== 0 ||
                                event.metaKey ||
                                event.ctrlKey ||
                                event.shiftKey ||
                                event.altKey)
                            )
                              return
                            onSelect?.(item, event)
                          }),
                        ],
                      }
                      return href ? (
                        <a
                          {...control}
                          href={href(item)}
                          data-rmx-reset-scroll="manual"
                          data-rmx-reset-focus="manual"
                        >
                          {row}
                        </a>
                      ) : (
                        <button {...control} type="button">
                          {row}
                        </button>
                      )
                    }}
                  />
                )
              })}
            </div>
            {showAxes && !horizontal && (
              <div class="rf-bar-chart-ticks" aria-hidden="true">
                {items.map((item, index) => (
                  <span key={item.id}>{ticks.has(index) && item.label}</span>
                ))}
              </div>
            )}
            {multi && (
              <ul class="rf-bar-chart-legend" aria-label={`${label} series`}>
                {series.map((entry, position) => (
                  <li key={entry.id}>
                    <span
                      class="rf-bar-chart-swatch"
                      data-series={seriesSlot(position)}
                      aria-hidden="true"
                    />
                    {entry.label}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    )
  }
}
