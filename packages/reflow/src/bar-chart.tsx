import { on, ref, type Handle } from 'remix/component'
import { navigationIndex } from './behaviors/list-navigation.ts'
import { Tooltip } from './tooltip.tsx'

export interface BarChartItem {
  id: string
  label: string
  /** A finite, nonnegative magnitude on a shared zero baseline. */
  value: number
}

export interface BarChartProps<Item extends BarChartItem = BarChartItem> {
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
}

const axisNumbers = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumSignificantDigits: 3,
})

// Round the axis top up so each of its three gridline steps is a round number.
const roundSteps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
function axisTop(peak: number) {
  const step = peak / 3
  const magnitude = 10 ** Math.floor(Math.log10(step))
  return 3 * magnitude * roundSteps.find((round) => round * magnitude >= step * (1 - 1e-9))!
}

export function BarChart<Item extends BarChartItem>(handle: Handle<BarChartProps<Item>>) {
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
    } = handle.props
    const values = items.map(({ value }) => (Number.isFinite(value) && value > 0 ? value : 0))
    const peak = values.reduce((max, value) => Math.max(max, value), 0)
    // Without labels, the tallest bar fills the plot.
    const top = peak > 0 && showAxes ? axisTop(peak) : peak
    const start = items.findIndex(({ id }) => id === range?.start)
    const end = items.findIndex(({ id }) => id === range?.end)
    const bounded = start >= 0 && end >= 0
    const tabId = items.some(({ id }) => id === focusId) ? focusId : items[bounded ? start : 0]?.id
    const last = items.length - 1
    const ticks = new Set([0, Math.round(last / 3), Math.round((last * 2) / 3), last])

    return (
      <div
        class="rf-bar-chart"
        role="group"
        aria-label={label}
        aria-describedby={describedBy}
        data-axes={showAxes || undefined}
        mix={mount}
      >
        {items.length === 0 ? (
          <span class="rf-bar-chart-empty">No data</span>
        ) : (
          <>
            <div class="rf-bar-chart-grid" aria-hidden="true">
              {(peak > 0 ? [1, 2 / 3, 1 / 3, 0] : [0]).map((ratio) => (
                <span key={ratio} style={{ bottom: ratio * 100 + '%' }}>
                  {showAxes && <span>{axisNumbers.format(top * ratio)}</span>}
                </span>
              ))}
            </div>
            <div class="rf-bar-chart-columns">
              {items.map((item, index) => {
                const value = values[index]
                const name = item.label + ', ' + formatValue(value)
                const active =
                  !bounded || (index >= Math.min(start, end) && index <= Math.max(start, end))
                const current = bounded && start === end && index === start
                const attrs = {
                  class: 'rf-bar-chart-column',
                  'aria-label': name,
                  'data-active': active || undefined,
                  'data-peak': (peak > 0 && value === peak) || undefined,
                }
                const fill = (
                  <span
                    class="rf-bar-chart-fill"
                    data-value={value}
                    style={{ height: (top ? (value / top) * 100 : 0) + '%' }}
                  />
                )
                if (!href && !onSelect)
                  return (
                    <span key={item.id} {...attrs} role="img">
                      {fill}
                    </span>
                  )
                return (
                  <Tooltip
                    key={item.id}
                    content={name}
                    followCursor="x"
                    delayDuration={100}
                    renderTrigger={(trigger) => {
                      const control = {
                        ...attrs,
                        ...trigger,
                        tabIndex: !mounted || item.id === tabId ? 0 : -1,
                        'aria-current': current || undefined,
                        mix: [
                          trigger.mix,
                          on<HTMLElement, 'focus'>('focus', () => {
                            focusId = item.id
                            void handle.update()
                          }),
                          on<HTMLElement, 'keydown'>('keydown', (event) => {
                            const next = navigationIndex(event.key, index, items.length, {
                              orientation: 'horizontal',
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
                              (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
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
                          {fill}
                        </a>
                      ) : (
                        <button {...control} type="button">
                          {fill}
                        </button>
                      )
                    }}
                  />
                )
              })}
            </div>
            {showAxes && (
              <div class="rf-bar-chart-ticks" aria-hidden="true">
                {items.map((item, index) => (
                  <span key={item.id}>{ticks.has(index) && item.label}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }
}
