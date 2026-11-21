export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const calendars = ['Studio', 'Design', 'Focus'] as const
export type CalendarName = (typeof calendars)[number]

export interface WeekEvent {
  id: string
  title: string
  calendar: CalendarName
  day: number
  start: number
  duration: number
}

// November 16–22, 2026. Wall-clock minutes in UTC keep the example independent
// of the visitor's timezone, including on the server.
export const seedEvents: WeekEvent[] = [
  { id: 'kickoff', title: 'Weekly kickoff', calendar: 'Studio', day: 0, start: 540, duration: 60 },
  {
    id: 'identity',
    title: 'Identity studies',
    calendar: 'Design',
    day: 0,
    start: 660,
    duration: 90,
  },
  { id: 'writing', title: 'Writing block', calendar: 'Focus', day: 0, start: 840, duration: 120 },
  {
    id: 'research',
    title: 'Research synthesis',
    calendar: 'Design',
    day: 1,
    start: 570,
    duration: 90,
  },
  {
    id: 'check-in',
    title: 'Partner check-in',
    calendar: 'Studio',
    day: 1,
    start: 615,
    duration: 60,
  },
  { id: 'prototype', title: 'Prototype lab', calendar: 'Focus', day: 1, start: 810, duration: 120 },
  { id: 'crit', title: 'Design critique', calendar: 'Design', day: 2, start: 600, duration: 90 },
  { id: 'office', title: 'Office hours', calendar: 'Studio', day: 2, start: 855, duration: 75 },
  { id: 'deep-work', title: 'Deep work', calendar: 'Focus', day: 3, start: 540, duration: 120 },
  { id: 'review', title: 'Launch review', calendar: 'Studio', day: 3, start: 780, duration: 60 },
  { id: 'handoff', title: 'Design handoff', calendar: 'Design', day: 4, start: 615, duration: 75 },
  { id: 'retro', title: 'Studio retro', calendar: 'Studio', day: 4, start: 840, duration: 60 },
]

export function timeLabel(minutes: number) {
  return [Math.floor(minutes / 60), minutes % 60].map((n) => String(n).padStart(2, '0')).join(':')
}

export function eventLabel(event: WeekEvent) {
  return `${event.title}, ${days[event.day]}, ${timeLabel(event.start)}–${timeLabel(event.start + event.duration)} UTC`
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

// Events that overlap transitively share a width. Reuse a lane as soon as its
// previous event ends, including when an event starts at that exact minute.
export function positionEvents(events: WeekEvent[]) {
  const positioned: { event: WeekEvent; lane: number; lanes: number }[] = []
  for (let day = 0; day < days.length; day++) {
    const sorted = events.filter((event) => event.day === day).sort((a, b) => a.start - b.start)
    let groupStart = positioned.length
    let groupEnd = -1
    let laneEnds: number[] = []
    function finishGroup() {
      for (let i = groupStart; i < positioned.length; i++) positioned[i]!.lanes = laneEnds.length
    }
    for (const event of sorted) {
      if (event.start >= groupEnd) {
        finishGroup()
        groupStart = positioned.length
        laneEnds = []
      }
      let lane = laneEnds.findIndex((end) => end <= event.start)
      if (lane === -1) lane = laneEnds.length
      const end = event.start + event.duration
      laneEnds[lane] = end
      groupEnd = Math.max(groupEnd, end)
      positioned.push({ event, lane, lanes: 1 })
    }
    finishGroup()
  }
  return positioned
}
