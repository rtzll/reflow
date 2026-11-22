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

function keydown(target: Element, key: string, shiftKey = false) {
  return target.dispatchEvent(
    new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
  )
}

it('shows all-day events in a strip that spans, stacks and moves by whole days', async (t) => {
  const changes: TimeGridEvent[] = []
  const events = [
    { id: 'holiday', title: 'Holiday', day: 0, start: 0, duration: 0, allDay: true },
    {
      id: 'trip',
      title: 'Trip',
      day: 1,
      start: 0,
      duration: 0,
      allDay: true,
      span: 5,
      place: 'Porto',
    },
    { id: 'deadline', title: 'Deadline', day: 1, start: 0, duration: 0, allDay: true },
    { id: 'standup', title: 'Standup', day: 1, start: 600, duration: 15 },
  ]
  const { $, $$, act, cleanup } = render(
    <TimeGrid
      label="Week"
      days={['Monday', 'Tuesday', 'Wednesday']}
      events={events}
      onEventChange={(next) => changes.push(next)}
      onSelect={() => {}}
    />,
  )
  t.after(cleanup)
  const strip = $('.rf-time-grid-all-day') as HTMLElement
  equal($('.rf-time-grid-all-day-label')?.textContent, 'All day')
  const button = (id: string) => $('[data-event="' + id + '"]') as HTMLButtonElement
  equal($$('.rf-time-grid-board [data-event]').length, 1, 'only timed events sit on the board')
  equal(button('trip').getAttribute('aria-label'), 'Trip, Tuesday to Wednesday, all day')
  equal(button('holiday').getAttribute('aria-label'), 'Holiday, Monday, all day')
  deepEqual(
    ['holiday', 'trip', 'deadline'].map((id) => {
      const style = button(id).style
      return [
        style.getPropertyValue('--day'),
        style.getPropertyValue('--span'),
        style.getPropertyValue('--row'),
      ]
    }),
    [
      ['0', '1', '0'],
      ['1', '2', '0'],
      ['1', '1', '1'],
    ],
    'spans are cut at the last column and events sharing a day stack',
  )

  // Arrows move by a day and keep every field; nothing moves past the edges or in time.
  await act(() => keydown(button('trip'), 'ArrowRight'))
  await act(() => keydown(button('holiday'), 'ArrowLeft'))
  await act(() => keydown(button('holiday'), 'ArrowDown'))
  deepEqual(changes, [{ ...events[1], day: 2 }])

  // A horizontal drag moves by whole days.
  strip.getBoundingClientRect = () => new DOMRect(0, 0, 300, 40)
  strip.setPointerCapture = () => {}
  for (const [type, clientX] of [
    ['pointerdown', 150],
    ['pointermove', 210],
    ['pointerup', 250],
  ] as const) {
    await act(() =>
      button('deadline').dispatchEvent(
        new PointerEvent(type, {
          pointerId: 2,
          isPrimary: true,
          clientX,
          clientY: 30,
          bubbles: true,
        }),
      ),
    )
  }
  deepEqual(changes[1], { ...events[2], day: 2 })
})

it('continues an overnight event in the next column and edits it across midnight', async (t) => {
  let shift = { id: 'night', title: 'Night shift', day: 0, start: 1320, duration: 480 }
  const changes: TimeGridEvent[] = []
  let owner: Handle
  function Rota(handle: Handle) {
    owner = handle
    return () => (
      <TimeGrid
        label="Rota"
        days={['Monday', 'Tuesday']}
        events={[shift]}
        onEventChange={(next) => {
          changes.push(next)
          shift = { ...shift, ...next }
          void handle.update()
        }}
      />
    )
  }
  const { $, act, cleanup } = render(<Rota />)
  t.after(cleanup)
  const button = () => $('button[data-event="night"]') as HTMLButtonElement
  equal(button().getAttribute('aria-label'), 'Night shift, Monday, 22:00–Tuesday, 06:00')
  equal(
    $('.rf-time-grid-times span')?.textContent,
    '00:00',
    'the fitted window shows the early hours',
  )
  const next = $('[data-continues="night"]') as HTMLElement
  equal(next.getAttribute('aria-hidden'), 'true')
  equal(next.style.getPropertyValue('--day'), '1')
  equal(next.style.top, '0%')
  equal(next.style.height, 'calc(25% - 2px)')

  await act(() => keydown(button(), 'ArrowDown'))
  await act(() => keydown(button(), 'ArrowDown', true))
  deepEqual(
    changes.map(({ start, duration }) => [start, duration]),
    [
      [1335, 480],
      [1335, 495],
    ],
  )
  // At most 24 hours long.
  shift = { ...shift, duration: 1440 }
  await act(() => owner!.update())
  await act(() => keydown(button(), 'ArrowDown', true))
  equal(changes.length, 2)

  // On the last column it stops at midnight.
  shift = { ...shift, day: 1, duration: 480 }
  await act(() => owner!.update())
  equal($('[data-continues="night"]'), null)
  equal(button().getAttribute('aria-label'), 'Night shift, Tuesday, 22:15–24:00')
})
