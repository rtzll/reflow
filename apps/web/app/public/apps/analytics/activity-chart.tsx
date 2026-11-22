import { BarChart, Button } from '@rtzll/reflow'
import { navigate, on, type Handle, type RemixNode } from 'remix/component'
import type { activityBars } from '../../../analytics-data.ts'
import { sources, dayLabel, rangeLabel, type ActivityRange } from './activity.ts'

interface ChartProps {
  range: ActivityRange
  bars: typeof activityBars
  href: (range: ActivityRange) => string
  children: RemixNode
}

export function ActivityChart(handle: Handle<ChartProps>) {
  let selecting = false
  let firstDay: string | undefined
  let previousRange = handle.props.range

  function cancel() {
    selecting = false
    firstDay = undefined
  }

  function interval(day: string): ActivityRange {
    if (!firstDay) return { start: day, end: day }
    return firstDay < day ? { start: firstDay, end: day } : { start: day, end: firstDay }
  }

  return () => {
    const { range, href } = handle.props
    if (previousRange.start !== range.start || previousRange.end !== range.end) {
      cancel()
      previousRange = range
    }
    return (
      <section
        class="analytics-chart"
        aria-labelledby="daily-activity"
        mix={on('keydown', (event) => {
          if (event.key === 'Escape' && selecting) {
            event.preventDefault()
            cancel()
            void handle.update()
          }
        })}
      >
        <div class="analytics-section-heading">
          <h2 id="daily-activity">Daily activity</h2>
          <Button
            variant="secondary"
            size="compact"
            aria-pressed={selecting}
            mix={on('click', () => {
              if (selecting) cancel()
              else selecting = true
              void handle.update()
            })}
          >
            {selecting ? 'Cancel selection' : 'Select range'}
          </Button>
        </div>
        <div class="analytics-chart-unit">Events per day</div>
        <BarChart
          label="Daily event counts"
          items={handle.props.bars}
          series={sources}
          layout="stacked"
          formatValue={(count) => count + ' events'}
          range={firstDay ? { start: firstDay, end: firstDay } : range}
          describedBy="chart-help"
          href={({ id }) => href(interval(id))}
          onSelect={({ id }, event) => {
            if (!selecting) return
            event.preventDefault()
            if (firstDay) {
              const destination = href(interval(id))
              cancel()
              void navigate(destination, { resetScroll: 'manual', resetFocus: 'manual' })
            } else firstDay = id
            void handle.update()
          }}
        />
        {handle.props.children}
        <p id="chart-help" role="status" class="analytics-hint">
          {selecting
            ? firstDay
              ? dayLabel(firstDay) + ' selected. Choose the other end of the range.'
              : 'Choose the first day of the range.'
            : 'Use the arrow keys to inspect a day. Select a bar to see its events.'}
        </p>
        <span class="site-sr-only" aria-live="polite">
          Showing events for {rangeLabel(range)}.
        </span>
      </section>
    )
  }
}
