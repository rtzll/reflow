import { TimeGrid, type TimeGridEvent, type TimeGridRange } from '@rtzll/reflow'
import { equal, deepEqual } from 'remix/assert'
import type { Handle } from 'remix/component'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('requests snapped changes without mutating controlled events and selection', async (t) => {
  let bookings = [
    { id: 'exam', title: 'Consultation', day: 0, start: 607, duration: 20, room: 'B' },
  ]
  let requested: (typeof bookings)[number] | undefined
  let selected: string | undefined
  let owner: Handle
  function Booking(handle: Handle) {
    owner = handle
    return () => (
      <TimeGrid
        label="Bookings"
        days={['Friday']}
        events={bookings}
        startMinute={605}
        endMinute={665}
        stepMinutes={10}
        onEventChange={(next) => {
          requested = next
        }}
        onSelect={(next) => {
          selected = next.id
        }}
      />
    )
  }
  const { $, act, cleanup } = render(<Booking />)
  t.after(cleanup)
  const event = $('button')!
  await act(() => event.click())
  equal(selected, 'exam')
  equal(event.getAttribute('aria-pressed'), 'false')
  await act(() =>
    event.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })),
  )
  deepEqual(requested, { ...bookings[0], start: 617 })
  equal(event.getAttribute('aria-label'), 'Consultation, Friday, 10:07–10:27')
  bookings = [requested!]
  await owner!.update()
  equal(event.getAttribute('aria-label'), 'Consultation, Friday, 10:17–10:37')
  await act(() =>
    event.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true }),
    ),
  )
  deepEqual(requested, { ...bookings[0], duration: 10 })
})

it('keeps an unbound grid read-only and gives touching appointments independent lanes', async (t) => {
  const events: TimeGridEvent[] = [
    { id: 'a', title: 'A', day: 0, start: 600, duration: 60 },
    { id: 'b', title: 'B', day: 0, start: 630, duration: 30 },
    { id: 'c', title: 'C', day: 0, start: 660, duration: 15 },
  ]
  const { $, $$, cleanup } = render(
    <TimeGrid label="Appointments" days={['Monday']} events={events} />,
  )
  t.after(cleanup)
  equal($('[aria-label="Appointments"]')?.getAttribute('role'), 'group')
  equal($$('.rf-time-grid-resize').length, 0)
  const cards = Array.from($$('.rf-time-grid-event'))
  deepEqual(
    cards.map((el) => el.style.getPropertyValue('--lanes')),
    ['2', '2', '1'],
  )
})

it('opens an activation-only appointment with a click', async (t) => {
  const event = { id: 'check', title: 'Camera check', day: 0, start: 570, duration: 20 }
  let opened = ''
  const { $, act, cleanup } = render(
    <TimeGrid
      label="Room"
      days={['Friday']}
      events={[event]}
      onActivate={(appointment) => {
        opened = appointment.id
      }}
    />,
  )
  t.after(cleanup)
  await act(() => $('button')!.click())
  equal(opened, event.id)
})

it('keeps a partial final slot on the configured grid when creating by pointer', async (t) => {
  let booked: TimeGridRange | undefined
  const { $, act, cleanup } = render(
    <TimeGrid
      label="Room"
      days={['Friday']}
      events={[]}
      startMinute={605}
      endMinute={630}
      stepMinutes={10}
      onCreate={(range) => {
        booked = range
      }}
    />,
  )
  t.after(cleanup)
  const board = $('[role=group]')!
  board.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100)
  board.setPointerCapture = () => {}
  // A short drag that stays in the final, shorter slot.
  for (const [type, clientY] of [
    ['pointerdown', 99],
    ['pointerup', 104],
  ] as const) {
    await act(() =>
      board.dispatchEvent(
        new PointerEvent(type, {
          pointerId: 1,
          isPrimary: true,
          clientX: 20,
          clientY,
          bubbles: true,
        }),
      ),
    )
  }
  deepEqual(booked, { day: 0, start: 625, duration: 5 })
})

it('creates a keyboard range and clears it on Escape before starting another', async (t) => {
  let created: TimeGridRange | undefined
  const { $, act, cleanup } = render(
    <TimeGrid
      label="Rooms"
      days={['Thursday', 'Friday']}
      events={[]}
      startMinute={600}
      endMinute={720}
      stepMinutes={20}
      onCreate={(range) => {
        created = range
      }}
    />,
  )
  t.after(cleanup)
  const board = $('[role=group]')!
  const press = (key: string, shiftKey = false) =>
    act(() =>
      board.dispatchEvent(
        new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
      ),
    )
  await press('ArrowDown')
  await press('ArrowRight')
  await press('ArrowDown', true)
  equal($('[role=status]')?.textContent, 'Friday, 10:20–11:00')
  await press('Escape')
  equal($('.rf-time-grid-range'), null)
  equal(created, undefined)
  await press('Enter')
  deepEqual(created, { day: 0, start: 600, duration: 20 })
})

it('does not activate after an Escape-canceled drag, skips boundary no-ops, and handles evening startMinute', async (t) => {
  let activated = 0
  let changes = 0
  let created = 0
  const event = { id: 'late', title: 'Late shift', day: 0, start: 1080, duration: 30 }
  const { $, $$, act, cleanup } = render(
    <TimeGrid
      label="Evening"
      days={['Friday']}
      events={[event]}
      startMinute={1080}
      onActivate={() => {
        activated++
      }}
      onEventChange={() => {
        changes++
      }}
      onCreate={() => {
        created++
      }}
    />,
  )
  t.after(cleanup)
  deepEqual(
    Array.from($$('.rf-time-grid-times span'), (node) => node.textContent),
    ['18:00'],
  )
  const board = $('[role=group]')!
  board.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100)
  board.setPointerCapture = () => {}
  // A click with no drag clears the preview on release without calling onCreate.
  await act(() =>
    board.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        isPrimary: true,
        clientX: 20,
        clientY: 20,
        bubbles: true,
      }),
    ),
  )
  await act(() =>
    board.dispatchEvent(
      new PointerEvent('pointerup', {
        pointerId: 1,
        isPrimary: true,
        clientX: 20,
        clientY: 20,
        bubbles: true,
      }),
    ),
  )
  equal($('.rf-time-grid-range'), null)
  equal(created, 0)

  const button = $('button')!
  // Boundary ArrowLeft on a single-day grid should not emit a redundant onEventChange.
  await act(() =>
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })),
  )
  equal(changes, 0)

  // Canceling an active drag with Escape must suppress the subsequent click activation.
  await act(() =>
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 2,
        isPrimary: true,
        clientX: 20,
        clientY: 20,
        bubbles: true,
      }),
    ),
  )
  await act(() =>
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
  )
  await act(() => button.click())
  equal(activated, 0)
})
