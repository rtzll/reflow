import type { TimeGridEvent } from '@rtzll/reflow'

export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const calendars = ['Studio', 'Design', 'Focus'] as const
export type CalendarName = (typeof calendars)[number]

export interface WeekEvent extends TimeGridEvent {
  calendar: CalendarName
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
  {
    id: 'offsite',
    title: 'Studio offsite',
    calendar: 'Studio',
    day: 3,
    start: 0,
    duration: 0,
    allDay: true,
    span: 2,
  },
]

/** The last day an all-day event covers, cut off at Sunday. */
export function lastDay(event: WeekEvent) {
  return Math.min(days.length - 1, event.day + Math.max(1, event.span ?? 1) - 1)
}

export function coversDay(event: WeekEvent, day: number) {
  if (event.allDay) return day >= event.day && day <= lastDay(event)
  return day === event.day || (day === event.day + 1 && event.start + event.duration > 1440)
}

export function timeLabel(minutes: number) {
  return [Math.floor(minutes / 60), minutes % 60].map((n) => String(n).padStart(2, '0')).join(':')
}

// When the event happens: its days for an all-day event, and both days for one
// that runs past midnight.
export function eventWhen(event: WeekEvent, separator = ', ') {
  if (event.allDay) {
    const last = lastDay(event)
    return last > event.day ? `${days[event.day]}–${days[last]}` : days[event.day]!
  }
  const end = event.start + event.duration
  return end > 1440 && event.day + 1 < days.length
    ? `${days[event.day]}${separator}${timeLabel(event.start)}–${days[event.day + 1]}${separator}${timeLabel(end - 1440)} UTC`
    : `${days[event.day]}${separator}${timeLabel(event.start)}–${timeLabel(Math.min(end, 1440))} UTC`
}

export function eventLabel(event: WeekEvent) {
  if (event.allDay) {
    const last = lastDay(event)
    return last > event.day
      ? `${event.title}, ${days[event.day]} to ${days[last]}, all day`
      : `${event.title}, ${days[event.day]}, all day`
  }
  return `${event.title}, ${eventWhen(event)}`
}
