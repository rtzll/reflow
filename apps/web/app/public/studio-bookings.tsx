import { Button, TimeGrid, type TimeGridEvent } from '@rtzll/reflow'
import { on, ref, type Handle } from 'remix/component'

function formatClock(minutes: number) {
  return [Math.floor(minutes / 60), minutes % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

export function StudioBookings(handle: Handle<{ stepMinutes?: number }>) {
  let events: TimeGridEvent[] = [
    { id: 'portraits', title: 'Portrait session', day: 0, start: 540, duration: 30 },
    { id: 'lighting', title: 'Lighting setup', day: 0, start: 600, duration: 30 },
  ]
  let selectedId: string | undefined
  let nextId = 1
  let message = ''
  let section: HTMLElement | undefined

  function book(event: TimeGridEvent, created: boolean) {
    const existing = events.find((other) => other.id === event.id)
    if (
      existing &&
      existing.day === event.day &&
      existing.start === event.start &&
      existing.duration === event.duration
    )
      return
    const overlaps = events.some(
      (other) =>
        other.id !== event.id &&
        event.start < other.start + other.duration &&
        other.start < event.start + event.duration,
    )
    const windowLabel = `${formatClock(event.start)}–${formatClock(event.start + event.duration)}`
    if (overlaps) {
      message = `The studio is already booked during ${windowLabel}.`
    } else {
      events = [...events.filter((other) => other.id !== event.id), event]
      selectedId = event.id
      message = `${event.title} ${created ? 'booked for' : 'moved to'} ${windowLabel}.`
    }
    handle.update()
  }

  return () => (
    <section
      class="booking-example"
      aria-label="Friday studio"
      mix={ref<HTMLElement>((node) => {
        section = node
      })}
    >
      <header>
        <strong>Recording studio</strong>
        <span>Friday · 09:00–13:00</span>
      </header>
      <TimeGrid
        label="Studio bookings"
        days={['Friday']}
        events={events}
        selectedId={selectedId}
        startMinute={540}
        endMinute={780}
        stepMinutes={handle.props.stepMinutes ?? 30}
        onSelect={(event) => {
          selectedId = event.id
          message = event.title
          handle.update()
        }}
        onCreate={(range) =>
          book({ ...range, id: `booking-${nextId++}`, title: 'Studio booking' }, true)
        }
        onEventChange={(event) => book(event, false)}
      />
      <footer>
        <span role="status">{message || 'Drag through open time to book the studio.'}</span>
        {selectedId && (
          <Button
            size="compact"
            variant="secondary"
            mix={on('click', async () => {
              events = events.filter((event) => event.id !== selectedId)
              selectedId = undefined
              message = 'Booking canceled.'
              await handle.update()
              if (!handle.signal.aborted) {
                section?.querySelector<HTMLElement>('[role="group"]')?.focus()
              }
            })}
          >
            Cancel booking
          </Button>
        )}
      </footer>
    </section>
  )
}
