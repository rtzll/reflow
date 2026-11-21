import { Button, Icon, TimeGrid } from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { EventEditor } from './event-editor.tsx'
import { calendars, days, eventLabel, seedEvents, timeLabel, type WeekEvent } from './events.ts'

export const WeekView = clientEntry(import.meta.url, function WeekView(handle: Handle) {
  let events = [...seedEvents]
  let selectedId: string | undefined = 'kickoff'
  let activeDay = 0
  let draft: WeekEvent | undefined
  let schedule: HTMLElement
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
        schedule.querySelector<HTMLElement>(`[data-event="${CSS.escape(event.id)}"]`)?.focus(),
      )
  }

  return () => {
    const selected = events.find((event) => event.id === selectedId)
    return (
      <article class="week-app">
        <header class="week-header">
          <div>
            <h1>Calendar</h1>
            <p>November 16–22, 2026</p>
          </div>
          <Button leadingIcon={<Icon name="plus" />} mix={on('click', () => showEditor())}>
            New event
          </Button>
        </header>
        <section
          class="week-schedule"
          aria-label="Studio schedule"
          mix={ref((node) => {
            schedule = node as HTMLElement
          })}
        >
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
                  selectedId = events.find((event) => event.day === day)?.id
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
          <TimeGrid
            label="Timed events"
            days={days}
            events={events}
            compactDay={activeDay}
            selectedId={selectedId}
            onSelect={select}
            onActivate={showEditor}
            onEventChange={(event) => save(event)}
            onCreate={(range) => showEditor({ ...range, id: '', title: '', calendar: 'Studio' })}
            getEventClass={(event) => 'week-' + event.calendar}
            getEventLabel={eventLabel}
            describedBy="week-shortcuts"
          />
          {selected ? (
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
          ) : (
            <div class="week-detail">No events on {days[activeDay]}.</div>
          )}
        </section>
        <p id="week-shortcuts" class="week-hint">
          Drag down an empty time slot to create an event. Drag an event to move it or its bottom
          edge to resize. Use arrow keys to move, Shift + ↑ or ↓ to resize, and Enter to edit.
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
