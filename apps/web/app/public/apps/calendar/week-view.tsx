import { Button, Icon } from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { EventEditor } from './event-editor.tsx'
import {
  calendars,
  clamp,
  days,
  eventLabel,
  positionEvents,
  seedEvents,
  timeLabel,
  type WeekEvent,
} from './events.ts'

interface Drag {
  pointer: number
  original: WeekEvent
  preview: WeekEvent
  resize: boolean
  x: number
  y: number
  dayWidth: number
  minutesPerPixel: number
  first: number
  last: number
  singleDay: boolean
}

export const WeekView = clientEntry(import.meta.url, function WeekView(handle: Handle) {
  let events = [...seedEvents]
  let selectedId = 'kickoff'
  let activeDay = 0
  let draft: WeekEvent | undefined
  let drag: Drag | undefined
  let board: HTMLDivElement
  let message = ''

  function showEditor(event?: WeekEvent) {
    draft = event ?? {
      id: '',
      title: '',
      day: activeDay,
      start: 540,
      duration: 60,
      calendar: 'Studio',
    }
    handle.update()
  }

  function select(event: WeekEvent) {
    selectedId = event.id
    activeDay = event.day
    handle.update()
  }

  function save(event: WeekEvent, focus = false) {
    if (!event.id) {
      event = { ...event, id: crypto.randomUUID() }
      events = [...events, event]
    } else {
      events = events.map((entry) => (entry.id === event.id ? event : entry))
    }
    draft = undefined
    message = eventLabel(event)
    select(event)
    if (focus)
      handle.queueTask(() =>
        board.querySelector<HTMLElement>(`[data-event="${event.id}"]`)?.focus(),
      )
  }

  function keydown(e: KeyboardEvent, event: WeekEvent) {
    if (e.altKey || e.metaKey || e.ctrlKey) return
    const next = { ...event }
    switch (e.key) {
      case 'ArrowLeft':
        next.day = clamp(event.day - 1, 0, 6)
        break
      case 'ArrowRight':
        next.day = clamp(event.day + 1, 0, 6)
        break
      case 'ArrowDown':
      case 'ArrowUp': {
        const delta = e.key === 'ArrowDown' ? 15 : -15
        if (e.shiftKey) next.duration = clamp(event.duration + delta, 15, 1440 - event.start)
        else next.start = clamp(event.start + delta, 0, 1440 - event.duration)
        break
      }
      case 'Enter':
        e.preventDefault()
        select(event)
        showEditor(event)
        return
      default:
        return
    }
    e.preventDefault()
    save(next, true)
  }

  function begin(e: PointerEvent, event: WeekEvent, first: number, last: number) {
    if (e.button !== 0 || !e.isPrimary) return
    const rect = board.getBoundingClientRect()
    const singleDay = getComputedStyle(board).getPropertyValue('--day-count').trim() === '1'
    drag = {
      pointer: e.pointerId,
      original: event,
      preview: event,
      resize: e.target instanceof Element && !!e.target.closest('.week-resize'),
      x: e.clientX,
      y: e.clientY,
      dayWidth: rect.width / (singleDay ? 1 : 7),
      minutesPerPixel: (last - first) / rect.height,
      first,
      last,
      singleDay,
    }
    board.setPointerCapture(e.pointerId)
    select(event)
  }

  function move(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.pointer) return
    const { original, first, last } = drag
    const delta = Math.round(((e.clientY - drag.y) * drag.minutesPerPixel) / 15) * 15
    drag.preview = drag.resize
      ? { ...original, duration: clamp(original.duration + delta, 15, last - original.start) }
      : {
          ...original,
          day: drag.singleDay
            ? original.day
            : clamp(original.day + Math.round((e.clientX - drag.x) / drag.dayWidth), 0, 6),
          start: clamp(original.start + delta, first, last - original.duration),
        }
    handle.update()
  }

  function finish(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.pointer) return
    move(e)
    const event = drag.preview
    drag = undefined
    save(event)
  }

  function cancel(e: PointerEvent) {
    if (e.pointerId !== drag?.pointer) return
    drag = undefined
    handle.update()
  }

  return () => {
    const displayed = drag
      ? events.map((event) => (event.id === drag!.original.id ? drag!.preview : event))
      : events
    const selected = displayed.find((event) => event.id === selectedId)!
    const first = Math.floor(Math.min(540, ...events.map((event) => event.start)) / 60) * 60
    const last =
      Math.ceil(Math.max(1020, ...events.map((event) => event.start + event.duration)) / 60) * 60
    const hours = Array.from({ length: (last - first) / 60 }, (_, index) => first + index * 60)
    return (
      <article class="week-app">
        <header class="week-header">
          <div>
            <h1>Team calendar</h1>
            <p>November 16–22, 2026</p>
          </div>
          <Button leadingIcon={<Icon name="plus" />} mix={on('click', () => showEditor())}>
            New event
          </Button>
        </header>
        <section class="week-schedule" aria-label="Studio schedule">
          <div class="week-toolbar">
            <h2>
              <Icon name="calendar" />
              Week 47
            </h2>
            <ul aria-label="Calendars">
              {calendars.map((name) => (
                <li key={name} data-calendar={name}>
                  <span class="week-dot" />
                  {name}
                </li>
              ))}
            </ul>
          </div>
          <div class="week-day-picker" role="group" aria-label="Day to display">
            {days.map((name, day) => (
              <button
                key={name}
                type="button"
                aria-label={name}
                aria-pressed={day === activeDay}
                mix={on('click', () => {
                  activeDay = day
                  handle.update()
                })}
              >
                <span>{name.slice(0, 3)}</span>
                <strong>{16 + day}</strong>
              </button>
            ))}
          </div>
          <div class="week-dates">
            <span class="week-zone">UTC</span>
            {days.map((name, day) => (
              <div key={name} data-active={day === activeDay} data-weekend={day >= 5}>
                <span>{name.slice(0, 3)}</span>
                <strong>{16 + day}</strong>
              </div>
            ))}
          </div>
          <div class="week-timeline" style={{ '--hours': hours.length }}>
            <div class="week-times" aria-hidden="true">
              {hours.map((hour) => (
                <span key={hour}>{timeLabel(hour)}</span>
              ))}
            </div>
            <div
              class="week-board"
              aria-label="Timed events"
              role="group"
              mix={[
                ref((node) => {
                  board = node as HTMLDivElement
                }),
                on<HTMLDivElement, 'pointermove'>('pointermove', move),
                on<HTMLDivElement, 'pointerup'>('pointerup', finish),
                on<HTMLDivElement, 'pointercancel'>('pointercancel', cancel),
                on<HTMLDivElement, 'lostpointercapture'>('lostpointercapture', cancel),
              ]}
            >
              {positionEvents(displayed).map(({ event, lane, lanes }) => (
                <button
                  key={event.id}
                  type="button"
                  class="week-event"
                  data-event={event.id}
                  data-calendar={event.calendar}
                  data-visible={event.day === activeDay}
                  data-short={event.duration <= 30}
                  aria-label={eventLabel(event)}
                  aria-pressed={event.id === selectedId}
                  aria-describedby="week-shortcuts"
                  title={eventLabel(event)}
                  style={{
                    '--day': event.day,
                    '--lane': lane,
                    '--lanes': lanes,
                    top: `${(100 * (event.start - first)) / (last - first)}%`,
                    height: `calc(${(100 * event.duration) / (last - first)}% - 2px)`,
                  }}
                  mix={[
                    on('pointerdown', (e) => begin(e, event, first, last)),
                    on('keydown', (e) => keydown(e, event)),
                    on('click', () => select(event)),
                  ]}
                >
                  <span class="week-event-time">{timeLabel(event.start)}</span>
                  <strong>{event.title}</strong>
                  <span class="week-resize" aria-hidden="true" title="Drag to change duration" />
                </button>
              ))}
            </div>
          </div>
          <div class="week-detail" data-calendar={selected.calendar}>
            <div>
              <span class="week-dot" />
              <strong>{selected.title}</strong>
              <span>
                {days[selected.day]} · {timeLabel(selected.start)}–
                {timeLabel(selected.start + selected.duration)} UTC
              </span>
            </div>
            <Button
              variant="secondary"
              size="compact"
              leadingIcon={<Icon name="pencil" size={13} />}
              mix={on('click', () => showEditor(selected))}
            >
              Edit event
            </Button>
          </div>
        </section>
        <p id="week-shortcuts" class="week-hint">
          Drag an event to move it or its bottom edge to resize. Use arrow keys to move, Shift + ↑
          or ↓ to resize, and Enter to edit.
        </p>
        <span class="site-sr-only" role="status">
          {message}
        </span>
        <EventEditor
          draft={draft}
          close={() => {
            draft = undefined
            handle.update()
          }}
          save={(event) => save(event, true)}
        />
      </article>
    )
  }
})
