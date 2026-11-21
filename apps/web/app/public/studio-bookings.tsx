import { Button, TimeGrid, type TimeGridEvent } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'

export function StudioBookings(handle: Handle<{ stepMinutes?: number }>) {
  let events: TimeGridEvent[] = [
    { id: 'portraits', title: 'Portrait session', day: 0, start: 540, duration: 30 },
    { id: 'lighting', title: 'Lighting setup', day: 0, start: 600, duration: 30 },
  ]
  let selectedId: string | undefined
  let message = ''

  function book(event: TimeGridEvent) {
    const overlaps = events.some(
      (other) =>
        other.id !== event.id &&
        event.start < other.start + other.duration &&
        other.start < event.start + event.duration,
    )
    if (overlaps) {
      message = 'The studio is already booked during that time.'
    } else {
      events = [...events.filter((other) => other.id !== event.id), event]
      selectedId = event.id
      message = event.title + ' booked.'
    }
    handle.update()
  }

  return () => (
    <section class="booking-example" aria-label="Friday studio">
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
        onCreate={(range) => book({ ...range, id: crypto.randomUUID(), title: 'Studio booking' })}
        onEventChange={book}
      />
      <footer>
        <span role="status">{message || 'Drag through open time to book the studio.'}</span>
        {selectedId && (
          <Button
            size="compact"
            variant="secondary"
            mix={on('click', () => {
              events = events.filter((event) => event.id !== selectedId)
              selectedId = undefined
              message = 'Booking canceled.'
              handle.update()
            })}
          >
            Cancel booking
          </Button>
        )}
      </footer>
    </section>
  )
}
