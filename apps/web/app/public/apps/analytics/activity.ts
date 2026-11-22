export interface ActivityEvent {
  id: string
  day: string
  time: string
  action: string
  item: string
  source: string
}

export interface ActivityRange {
  start: string
  end: string
}

export const sources = [
  { id: 'editor', label: 'Studio editor' },
  { id: 'import', label: 'Media import' },
]

export const eventFields = {
  action: (event: ActivityEvent) => event.action,
  source: (event: ActivityEvent) => event.source,
  item: (event: ActivityEvent) => event.item,
  time: (event: ActivityEvent) => event.day + ' ' + event.time,
}
export const pageSize = 6

export function rangeHref(
  path: string,
  search: string,
  range: ActivityRange,
  fullRange: ActivityRange,
) {
  const query = new URLSearchParams(search)
  for (const name of ['from', 'to', 'eventPage', 'eventFilter', 'eventSort', 'eventDir']) {
    query.delete(name)
  }
  if (range.start !== fullRange.start || range.end !== fullRange.end) {
    query.set('from', range.start)
    query.set('to', range.end)
  }
  return path + (query.size ? '?' + query : '')
}

const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

export function dayLabel(day: string) {
  return formatter.format(new Date(day + 'T00:00:00Z'))
}

export function rangeLabel(range: ActivityRange) {
  return range.start === range.end
    ? dayLabel(range.start)
    : dayLabel(range.start) + ' – ' + dayLabel(range.end)
}
