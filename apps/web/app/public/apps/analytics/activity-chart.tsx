import { Button, Tooltip } from '@rtzll/reflow'
import { navigate, on, ref, type Handle } from 'remix/component'
import { days, dayLabel, rangeLabel, type ActivityRange } from './activity.ts'

interface ChartProps {
  range: ActivityRange
  href: (range: ActivityRange) => string
}

export function ActivityChart(handle: Handle<ChartProps>) {
  let selecting = false
  let firstDay: string | undefined
  let focusDay = handle.props.range.start
  let previousRange = handle.props.range
  let interactive = false
  const mount = ref(() => {
    interactive = true
    void handle.update()
  })
  const scale = 3 * Math.ceil(Math.max(...days.map(({ events }) => events.length)) / 3)

  function cancel() {
    selecting = false
    firstDay = undefined
    void handle.update()
  }

  return () => {
    const { range, href } = handle.props
    if (previousRange.start !== range.start || previousRange.end !== range.end) {
      firstDay = undefined
      selecting = false
      previousRange = range
    }
    return (
      <section class="analytics-chart" aria-labelledby="daily-activity" mix={mount}>
        <div class="analytics-section-heading">
          <h2 id="daily-activity">Daily activity</h2>
          <Button
            variant="secondary"
            size="compact"
            aria-pressed={selecting}
            mix={on('click', () => {
              if (selecting) cancel()
              else {
                selecting = true
                void handle.update()
              }
            })}
          >
            {selecting ? 'Cancel selection' : 'Select range'}
          </Button>
        </div>
        <div class="analytics-chart-unit">Events per day</div>
        <div class="analytics-plot">
          <div class="analytics-grid" aria-hidden="true">
            {[scale, (scale * 2) / 3, scale / 3, 0].map((tick) => (
              <span key={tick}>
                <span>{tick}</span>
              </span>
            ))}
          </div>
          <div
            class="analytics-bars"
            role="group"
            aria-label="Daily event counts"
            aria-describedby="chart-help"
          >
            {days.map(({ day, events }, index) => {
              const active = day >= range.start && day <= range.end
              const start = firstDay && firstDay < day ? firstDay : day
              const end = firstDay && firstDay > day ? firstDay : day
              const label = dayLabel(day) + ', ' + events.length + ' events'
              return (
                <Tooltip
                  key={day}
                  content={label}
                  followCursor="x"
                  delayDuration={100}
                  renderTrigger={(trigger) => (
                    <a
                      {...trigger}
                      class="analytics-column"
                      href={href({ start, end })}
                      aria-label={label}
                      aria-current={range.start === range.end && active ? 'date' : undefined}
                      tabIndex={!interactive || day === focusDay ? 0 : -1}
                      data-active={active || undefined}
                      data-start={firstDay === day || undefined}
                      data-peak={events.length === scale || undefined}
                      data-day={day}
                      data-rmx-reset-scroll="manual"
                      data-rmx-reset-focus="manual"
                      mix={[
                        trigger.mix,
                        on('focus', () => {
                          focusDay = day
                          void handle.update()
                        }),
                        on('keydown', (event) => {
                          if (event.key === 'Escape' && selecting) {
                            event.preventDefault()
                            cancel()
                            return
                          }
                          const next = {
                            ArrowLeft: Math.max(0, index - 1),
                            ArrowRight: Math.min(days.length - 1, index + 1),
                            Home: 0,
                            End: days.length - 1,
                          }[event.key]
                          if (next === undefined) return
                          event.preventDefault()
                          event.currentTarget.parentElement
                            ?.querySelector<HTMLElement>('[data-day="' + days[next].day + '"]')
                            ?.focus()
                        }),
                        on('click', (event) => {
                          if (
                            !selecting ||
                            event.metaKey ||
                            event.ctrlKey ||
                            event.shiftKey ||
                            event.altKey
                          )
                            return
                          event.preventDefault()
                          if (!firstDay) {
                            firstDay = day
                            void handle.update()
                          } else {
                            const destination = href({ start, end })
                            cancel()
                            void navigate(destination, {
                              resetScroll: 'manual',
                              resetFocus: 'manual',
                            })
                          }
                        }),
                      ]}
                    >
                      <span
                        class="analytics-bar"
                        style={{ height: (events.length / scale) * 100 + '%' }}
                      />
                    </a>
                  )}
                />
              )
            })}
          </div>
          <div class="analytics-ticks" aria-hidden="true">
            {days.map(({ day }, i) => (
              <span key={day}>{[0, 4, 9, 13].includes(i) && dayLabel(day)}</span>
            ))}
          </div>
        </div>
        <p id="chart-help" role="status" class="analytics-hint">
          {selecting
            ? firstDay
              ? dayLabel(firstDay) + ' selected. Choose the other end of the range.'
              : 'Choose the first day of the range.'
            : 'Use the arrow keys to inspect a day. Select a bar to see its events.'}
        </p>
        <span class="site-sr-only">Showing events for {rangeLabel(range)}.</span>
      </section>
    )
  }
}
