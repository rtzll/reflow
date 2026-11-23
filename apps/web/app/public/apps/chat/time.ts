import type { ChatEntry } from './fixtures.ts'

// A pause this long between two messages starts a new stretch of the
// conversation, marked with its time. The rule ignores the time zone, so the
// server and the browser place the same separators.
const pause = 3 * 60 * 60 * 1000

const utc = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Whether a time separator goes before the message at `index`. */
export function startsStretch(messages: readonly ChatEntry[], index: number) {
  const at = messages[index]?.sentAt
  if (!at) return false
  for (let previous = index - 1; previous >= 0; previous--) {
    const before = messages[previous]?.sentAt
    if (before) return Date.parse(at) - Date.parse(before) >= pause
  }
  return true
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * The separator's label. The server cannot know the reader's time zone, so it
 * and the first render in the browser write UTC; once mounted, the browser
 * writes local time, as "Today 14:12" or "Nov 20, 09:14".
 */
export function timeLabel(iso: string, local: boolean, now = new Date()) {
  const date = new Date(iso)
  if (!local) return `${utc.format(date)} UTC`
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (days === 0) return `Today ${time}`
  if (days === 1) return `Yesterday ${time}`
  const day = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  })
  return `${day}, ${time}`
}
