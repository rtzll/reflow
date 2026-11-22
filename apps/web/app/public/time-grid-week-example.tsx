import { TimeGrid, type TimeGridEvent } from '@rtzll/reflow'
import { ref, type Handle } from 'remix/component'

const days = ['Monday', 'Tuesday', 'Wednesday']

/** A release week with all-day events above the hours and an overnight migration. */
export function ReleaseWeek(handle: Handle) {
  let events: (TimeGridEvent & { team?: 'engineering' | 'editorial' })[] = [
    { id: 'freeze', title: 'Code freeze', day: 0, start: 0, duration: 0, allDay: true, span: 2 },
    {
      id: 'release',
      title: 'Release day',
      team: 'editorial',
      day: 2,
      start: 0,
      duration: 0,
      allDay: true,
    },
    { id: 'migration', title: 'Database migration', day: 0, start: 1320, duration: 300 },
    { id: 'qa', title: 'QA walkthrough', team: 'engineering', day: 0, start: 570, duration: 90 },
    { id: 'standup', title: 'Standup', day: 1, start: 540, duration: 15 },
    { id: 'notes', title: 'Release notes', team: 'editorial', day: 2, start: 600, duration: 30 },
  ]
  let selectedId: string | undefined
  const showMorning = ref<HTMLDivElement>((viewport) => {
    const hour = viewport.querySelector('.rf-time-grid-times span')?.getBoundingClientRect().height
    if (hour) viewport.scrollTop = 8 * hour
  })

  return () => (
    <div class="release-week">
      <div class="release-week-days" aria-hidden="true">
        {days.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div class="release-week-scroll" mix={showMorning}>
        <TimeGrid
          label="Release week"
          days={days}
          events={events}
          startMinute={0}
          endMinute={1440}
          stepMinutes={15}
          selectedId={selectedId}
          getEventClass={(event) => (event.team ? 'release-' + event.team : '')}
          onSelect={(event) => {
            selectedId = event.id
            void handle.update()
          }}
          onCreate={(range) => {
            const event = { ...range, id: `event-${events.length}`, title: 'New event' }
            events = [...events, event]
            selectedId = event.id
            void handle.update()
          }}
          onCreateAllDay={({ day, span }) => {
            const event = {
              id: `all-day-${events.length}`,
              title: 'New all-day event',
              day,
              span,
              start: 0,
              duration: 0,
              allDay: true,
            }
            events = [...events, event]
            selectedId = event.id
            void handle.update()
          }}
          onEventChange={(next) => {
            events = events.map((event) => (event.id === next.id ? next : event))
            selectedId = next.id
            void handle.update()
          }}
        />
      </div>
    </div>
  )
}
