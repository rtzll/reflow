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

const articles = ['Field notes', 'Studio journal', 'Autumn lookbook', 'Materials guide', 'Print archive']
const changes = ['Draft updated', 'Review requested', 'Page published']
const dailyEdits = [4, 6, 5, 7, 4, 2, 3, 6, 8, 5, 7, 6, 4, 3]

export const days = dailyEdits.map((count, index) => {
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

export function readRange(search: string): ActivityRange {
  const params = new URLSearchParams(search)
  const start = params.get('from') ?? fullRange.start
  const end = params.get('to') ?? fullRange.end
  if (start > end || ![start, end].every((date) => days.some(({ day }) => day === date))) {
    return fullRange
  }
  return { start, end }
}

export function rangeHref(path: string, search: string, range: ActivityRange) {
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
  month: 'short', day: 'numeric', timeZone: 'UTC',
})

export function dayLabel(day: string) {
  return formatter.format(new Date(day + 'T00:00:00Z'))
}

export function rangeLabel(range: ActivityRange) {
  return range.start === range.end ? dayLabel(range.start) : dayLabel(range.start) + ' – ' + dayLabel(range.end)
}
