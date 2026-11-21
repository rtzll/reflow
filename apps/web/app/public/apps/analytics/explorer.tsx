import {
  Button,
  CodeBlock,
  DatePicker,
  Drawer,
  type DataTableColumn,
  type DateRange,
} from '@rtzll/reflow'
import { clientEntry, navigate, type Handle } from 'remix/component'
import { RoutedDataTable } from '../../routed-data-table.tsx'
import { ActivityChart } from './activity-chart.tsx'
import {
  days,
  dayLabel,
  fullRange,
  rangeHref,
  rangeLabel,
  readRange,
  type ActivityEvent,
  type ActivityRange,
} from './activity.ts'

const columns: readonly DataTableColumn<ActivityEvent>[] = [
  {
    id: 'action',
    label: 'Event',
    value: (row) => row.action,
    rowHeader: true,
    cell: (row) => (
      <Drawer
        title={row.action}
        description={`${row.item} · ${dayLabel(row.day)}, ${row.time} UTC`}
        side="right"
        renderTrigger={(trigger) => (
          <button
            {...trigger}
            type="button"
            class="analytics-event-trigger"
            aria-label={`Inspect ${row.action} for ${row.item}`}
          >
            {row.action}
          </button>
        )}
      >
        <CodeBlock
          code={JSON.stringify(row, null, 2)}
          filename="event.json"
          label="Event payload"
          wrap
        />
      </Drawer>
    ),
  },
  { id: 'item', label: 'Item', value: (row) => row.item },
  { id: 'source', label: 'Source', value: (row) => row.source },
  {
    id: 'time',
    label: 'Time (UTC)',
    value: (row) => row.day + ' ' + row.time,
    cell: (row) => (
      <time dateTime={row.day + 'T' + row.time + ':00Z'}>
        {dayLabel(row.day)} · {row.time}
      </time>
    ),
  },
]

export const AnalyticsExplorer = clientEntry(
  import.meta.url,
  function AnalyticsExplorer(handle: Handle<{ path: string; search: string }>) {
    let draft: DateRange | undefined
    let previousRange: string | undefined
    return () => {
      const { path, search } = handle.props
      const range = readRange(search)
      const rangeKey = range.start + '/' + range.end
      if (rangeKey !== previousRange) {
        previousRange = rangeKey
        draft = undefined
      }
      const selected = days.filter(({ day }) => day >= range.start && day <= range.end)
      const events = selected.flatMap(({ events }) => events).reverse()
      const peak = selected.reduce((best, next) =>
        next.events.length > best.events.length ? next : best,
      )
      const href = (next: ActivityRange) => rangeHref(path, search, next)

      return (
        <article class="analytics-explorer">
          <header class="analytics-header">
            <h1>Analytics</h1>
            <div class="analytics-controls">
              <DatePicker
                label="Activity date range"
                mode="range"
                value={draft ?? range}
                min={fullRange.start}
                max={fullRange.end}
                today={fullRange.end}
                defaultMonth={range.start}
                onValueChange={(next) => {
                  if (!next || typeof next === 'string') return
                  draft = next
                  if (next.end) {
                    draft = undefined
                    void navigate(href({ start: next.start, end: next.end }), {
                      resetScroll: 'manual',
                      resetFocus: 'manual',
                    })
                  }
                  void handle.update()
                }}
              />
              {rangeKey !== fullRange.start + '/' + fullRange.end && (
                <Button href={href(fullRange)} variant="ghost" data-rmx-reset-scroll="manual">
                  All dates
                </Button>
              )}
            </div>
          </header>
          <dl class="analytics-metrics">
            <div>
              <dt>Total events</dt>
              <dd>{events.length}</dd>
            </div>
            <div>
              <dt>Daily average</dt>
              <dd>
                {(events.length / selected.length).toLocaleString('en-US', {
                  maximumFractionDigits: 1,
                })}
                <small>events/day</small>
              </dd>
            </div>
            <div>
              <dt>Busiest day</dt>
              <dd>
                {peak.events.length}
                <small>on {dayLabel(peak.day)}</small>
              </dd>
            </div>
          </dl>
          <ActivityChart range={range} href={href} />
          <section class="analytics-events" id="events" aria-labelledby="events-heading">
            <div class="analytics-section-heading">
              <h2 id="events-heading">Event log</h2>
              <p>
                {rangeLabel(range)} · {events.length} events
              </p>
            </div>
            <RoutedDataTable
              rows={events}
              columns={columns}
              label="Studio events"
              rowKey={(row) => row.id}
              pageSize={6}
              route={{ path, search, prefix: 'event', anchor: 'events' }}
            />
          </section>
        </article>
      )
    }
  },
)
