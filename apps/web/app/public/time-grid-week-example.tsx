import { TimeGrid, type TimeGridEvent } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const days = ['Monday', 'Tuesday', 'Wednesday']

/** A release week with all-day events above the hours and an overnight migration. */
export function ReleaseWeek(handle: Handle) {
  let events: TimeGridEvent[] = [
    { id: 'freeze', title: 'Code freeze', day: 0, start: 0, duration: 0, allDay: true, span: 2 },
    { id: 'release', title: 'Release day', day: 2, start: 0, duration: 0, allDay: true },
    { id: 'migration', title: 'Database migration', day: 0, start: 1320, duration: 300 },
    { id: 'standup', title: 'Standup', day: 1, start: 540, duration: 15 },
    { id: 'notes', title: 'Release notes', day: 2, start: 600, duration: 60 },
  ]
  let selectedId: string | undefined

  return () => (
    <div class="release-week">
      <div class="release-week-days" aria-hidden="true">
        {days.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <TimeGrid
        label="Release week"
        days={days}
        events={events}
        startMinute={0}
        endMinute={1440}
        stepMinutes={15}
        selectedId={selectedId}
        onSelect={(event) => {
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
  )
}
