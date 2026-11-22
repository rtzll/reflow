import type { activityReport } from '../../../analytics-data.ts'
import {
  RoutedDataTable,
  Button,
  CodeBlock,
  DatePicker,
  Drawer,
  type DataTableColumn,
  type DateRange,
} from '@rtzll/reflow'
import { clientEntry, navigate, ref, type Handle } from 'remix/component'
import { ActivityChart } from './activity-chart.tsx'
import {
  eventFields,
  pageSize,
  sources,
  dayLabel,
  rangeHref,
  rangeLabel,
  type ActivityEvent,
  type ActivityRange,
} from './activity.ts'

const columns: readonly DataTableColumn<ActivityEvent>[] = [
  {
    id: 'action',
    label: 'Event',
    value: eventFields.action,
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
            aria-label={`Inspect ${row.action} for ${row.item}, ${dayLabel(row.day)} ${row.time} UTC`}
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
  { id: 'item', label: 'Item', value: eventFields.item },
  { id: 'source', label: 'Source', value: eventFields.source },
  {
    id: 'time',
    label: 'Time (UTC)',
    value: eventFields.time,
    cell: (row) => (
      <time dateTime={row.day + 'T' + row.time + ':00Z'}>
        {dayLabel(row.day)} · {row.time}
      </time>
    ),
  },
]

const sourceList = new Intl.ListFormat('en', { type: 'conjunction' })

function SourceInsight(
  handle: Handle<{ total: number; counts: number[]; path: string; search: string }>,
) {
  return () => {
    const { counts, total, path, search } = handle.props
    if (!total) return null
    const count = Math.max(...counts)
    const leaders = sources
      .filter((_, i) => counts[i] === count)
      .map(({ label }) => label)
      .sort()
    const imports = leaders.length === 1 && leaders[0] === 'Media import'
    const links = sourceList.formatToParts(leaders).map(({ type, value }) => {
      if (type === 'literal') return value
      const query = new URLSearchParams(search)
      query.set('eventFilter', value)
      query.delete('eventPage')
      const label = imports ? (count === 1 ? 'media import' : 'media imports') : value
      return (
        <a
          key={value}
          href={path + '?' + query + '#events'}
          aria-label={
            imports
              ? `View ${count} ${label}`
              : `View ${count} ${count === 1 ? 'event' : 'events'} from ${value}`
          }
        >
          {label}
        </a>
      )
    })
    let quantity = `${count} of ${total} events`
    if (count === total) {
      quantity =
        count === 1 ? 'The only event' : count === 2 ? 'Both events' : `All ${count} events`
    }
    return (
      <p class="analytics-insight">
        {leaders.length > 1 ? (
          <>
            {links} each accounted for <strong>{quantity}</strong>.
          </>
        ) : (
          <>
            <strong>{quantity}</strong> {imports ? (count === 1 ? 'was a' : 'were') : 'came from'}{' '}
            {links}.
          </>
        )}
      </p>
    )
  }
}

export const AnalyticsExplorer = clientEntry(
  import.meta.url,
  function AnalyticsExplorer(
    handle: Handle<{ path: string; search: string; report: ReturnType<typeof activityReport> }>,
  ) {
    let draft: DateRange | undefined
    let previousRange: string | undefined
    const clearDraftOnClose = ref<HTMLDivElement>((node, signal) => {
      node.addEventListener(
        'toggle',
        (event) => {
          if ((event as ToggleEvent).newState === 'closed' && draft && !draft.end) {
            draft = undefined
            void handle.update()
          }
        },
        { capture: true, signal },
      )
    })
    return () => {
      const { path, search, report } = handle.props
      const { range, fullRange, total, dayCount, peak } = report
      const rangeKey = range.start + '/' + range.end
      if (rangeKey !== previousRange) {
        previousRange = rangeKey
        draft = undefined
      }
      const href = (next: ActivityRange) => rangeHref(path, search, next, fullRange)

      return (
        <article class="analytics-explorer">
          <header class="analytics-header">
            <h1>Analytics</h1>
            <div class="analytics-controls" mix={clearDraftOnClose}>
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
              <dd>{total}</dd>
            </div>
            <div>
              <dt>Daily average</dt>
              <dd>
                {(total / dayCount).toLocaleString('en-US', {
                  maximumFractionDigits: 1,
                })}
                <small>events/day</small>
              </dd>
            </div>
            <div>
              <dt>Busiest day</dt>
              <dd>
                {peak.count}
                <small>
                  on{' '}
                  {dayCount > 1 ? (
                    <a
                      class="analytics-peak-link"
                      href={href({ start: peak.day, end: peak.day })}
                      aria-label={`View ${peak.count} events on ${dayLabel(peak.day)}`}
                      data-rmx-reset-scroll="manual"
                    >
                      {dayLabel(peak.day)}
                    </a>
                  ) : (
                    dayLabel(peak.day)
                  )}
                </small>
              </dd>
            </div>
          </dl>
          <ActivityChart range={range} href={href} bars={report.bars}>
            <SourceInsight total={total} counts={report.counts} path={path} search={search} />
          </ActivityChart>
          <section
            class="analytics-events"
            id="events"
            tabIndex={-1}
            aria-labelledby="events-heading"
          >
            <div class="analytics-section-heading">
              <h2 id="events-heading">Event log</h2>
              <p>
                {rangeLabel(range)} · {total} events
              </p>
            </div>
            <RoutedDataTable
              rows={report.rows}
              rowCount={report.rowCount}
              columns={columns}
              label="Studio events"
              rowKey={(row) => row.id}
              pageSize={pageSize}
              route={{ path, search, prefix: 'event', anchor: 'events' }}
            />
          </section>
        </article>
      )
    }
  },
)
