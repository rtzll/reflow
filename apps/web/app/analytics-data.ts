import {
  dayLabel,
  eventFields,
  pageSize,
  sources,
  type ActivityEvent,
  type ActivityRange,
} from './public/apps/analytics/activity.ts'

const articles = [
  'Field notes',
  'Studio journal',
  'Autumn lookbook',
  'Materials guide',
  'Print archive',
]
const changes = ['Draft updated', 'Review requested', 'Page published']
const dailyEdits = [4, 6, 5, 7, 4, 2, 3, 6, 8, 5, 7, 6, 4, 3]

const days = dailyEdits.map((count, index) => {
  const day = '2026-10-' + String(5 + index).padStart(2, '0')
  const events: ActivityEvent[] = Array.from({ length: count }, (_, i) => ({
    id: day + '-edit-' + i,
    day,
    time: String(8 + i).padStart(2, '0') + ':' + String((index * 7 + i * 13) % 60).padStart(2, '0'),
    action: changes[(index + i) % changes.length],
    item: articles[(index + i) % articles.length],
    source: 'Studio editor',
  }))
  if (day === '2026-10-14') {
    for (let i = 0; i < 19; i++) {
      events.push({
        id: day + '-import-' + i,
        day,
        time: '15:' + String(i + 12),
        action: 'Asset imported',
        item: 'Autumn lookbook / ' + String(i + 1).padStart(2, '0'),
        source: 'Media import',
      })
    }
  }
  return { day, events }
})

export const fullRange: ActivityRange = { start: days[0].day, end: days[days.length - 1].day }

function readRange(search: string): ActivityRange {
  const params = new URLSearchParams(search)
  const start = params.get('from') ?? fullRange.start
  const end = params.get('to') ?? fullRange.end
  if (start > end || ![start, end].every((date) => days.some(({ day }) => day === date))) {
    return fullRange
  }
  return { start, end }
}

// Only the daily totals, counts by source and requested page cross the client boundary.
export const activityBars = days.map(({ day, events }) => ({
  id: day,
  label: dayLabel(day),
  value: events.length,
}))

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
export function activityReport(search: string) {
  const range = readRange(search)
  const selected = days.filter(({ day }) => day >= range.start && day <= range.end)
  const events = selected.flatMap(({ events }) => events).reverse()
  const counts = sources.map(({ label }) => events.filter((event) => event.source === label).length)
  const peak = selected.reduce((best, day) => (day.events.length > best.events.length ? day : best))
  const params = new URLSearchParams(search)
  const filter = params.get('eventFilter')?.trim().toLowerCase()
  const matches = filter
    ? events.filter((event) =>
        Object.values(eventFields).some((field) => field(event).toLowerCase().includes(filter)),
      )
    : events
  const sort = params.get('eventSort')
  if (sort && Object.hasOwn(eventFields, sort)) {
    const field = eventFields[sort as keyof typeof eventFields]
    const direction = params.get('eventDir') === 'desc' ? -1 : 1
    matches.sort((a, b) => direction * collator.compare(field(a), field(b)))
  }
  const requested = Number(params.get('eventPage') ?? 1)
  const page = Number.isSafeInteger(requested)
    ? Math.max(1, Math.min(requested, Math.ceil(matches.length / pageSize)))
    : 1
  return {
    range,
    fullRange,
    bars: activityBars,
    total: events.length,
    counts,
    dayCount: selected.length,
    peak: { day: peak.day, count: peak.events.length },
    rowCount: matches.length,
    rows: matches.slice((page - 1) * pageSize, page * pageSize),
  }
}
