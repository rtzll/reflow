import { calendars, days, seedEvents, type WeekEvent } from './events.ts'

// Separate records let different tabs change unrelated events without losing either edit.
const prefix = 'reflow.calendar.2026-11-16.v1.'

function isWeekEvent(value: unknown, id: string): value is WeekEvent {
  if (!id || typeof value !== 'object' || !value) return false
  const event = value as Partial<WeekEvent>
  return (
    event.id === id &&
    typeof event.title === 'string' &&
    !!event.title.trim() &&
    event.title.length <= 100 &&
    calendars.some((name) => name === event.calendar) &&
    typeof event.day === 'number' &&
    Number.isInteger(event.day) &&
    event.day >= 0 &&
    event.day < days.length &&
    (event.allDay === true
      ? event.span === undefined ||
        (Number.isInteger(event.span) && event.span >= 1 && event.span <= days.length)
      : event.allDay === undefined &&
        typeof event.start === 'number' &&
        event.start >= 0 &&
        event.start < 1440 &&
        event.start % 15 === 0 &&
        typeof event.duration === 'number' &&
        event.duration >= 15 &&
        event.duration <= 1440 &&
        event.duration % 15 === 0)
  )
}

export function restoreWeekEvents() {
  const events = new Map(seedEvents.map((event) => [event.id, event]))
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(prefix)) continue
      const id = key.slice(prefix.length)
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
        if (isWeekEvent(saved, id)) events.set(id, saved)
      } catch {
        // Restore the remaining appointments if this record is damaged.
      }
    }
  } catch {
    // A restricted browser can still use the seeded schedule.
  }
  return [...events.values()]
}

export function persistWeekEvent(event: WeekEvent) {
  try {
    localStorage.setItem(prefix + event.id, JSON.stringify(event))
  } catch {
    // The open calendar retains edits when browser storage is full or unavailable.
  }
}
