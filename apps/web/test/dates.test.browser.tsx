import { Calendar, DatePicker } from '../../../packages/reflow/dist/dates.js'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

function press(node: Element, key: string, shiftKey = false) {
  node.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      shiftKey,
      bubbles: true,
      cancelable: true,
    }),
  )
}

async function waitFor(check: () => boolean) {
  for (let i = 0; i < 60; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected calendar state did not settle')
}

describe('Reflow dates', () => {
  it('clamps keyboard paging through a leap month and the following year', async (t) => {
    const { $, act, cleanup } = render(<Calendar defaultValue="2028-01-31" />)
    t.after(cleanup)
    const january = $('[data-rf-day="2028-01-31"]')
    ok(january instanceof HTMLButtonElement)
    january.focus()
    await act(() => press(january, 'PageDown'))
    await waitFor(() => document.activeElement?.getAttribute('data-rf-day') === '2028-02-29')

    const leapDay = $('[data-rf-day="2028-02-29"]')
    ok(leapDay instanceof HTMLButtonElement)
    await act(() => press(leapDay, 'PageDown', true))
    await waitFor(() => document.activeElement?.getAttribute('data-rf-day') === '2029-02-28')
  })

  it('orders a range across a year boundary and excludes out-of-bounds days', async (t) => {
    const { $, act, cleanup } = render(
      <form>
        <Calendar
          mode="range"
          name="stay"
          defaultMonth="2027-01-01"
          min="2026-12-31"
          max="2027-01-05"
        />
      </form>,
    )
    t.after(cleanup)
    const form = $('form')
    const january = $('[data-rf-day="2027-01-01"]')
    const outOfBounds = $('[data-rf-day="2027-01-06"]')
    ok(form instanceof HTMLFormElement)
    ok(january instanceof HTMLButtonElement)
    ok(outOfBounds instanceof HTMLButtonElement)
    equal(outOfBounds.getAttribute('aria-disabled'), 'true')
    await act(() => outOfBounds.click())
    equal(new FormData(form).get('stay.start'), '')

    january.focus()
    await act(() => january.click())
    await act(() => press(january, 'ArrowLeft'))
    await waitFor(() => document.activeElement?.getAttribute('data-rf-day') === '2026-12-31')
    await waitFor(() => !!$('[data-rf-selection-layer][data-visible]'))
    const december = $('[data-rf-day="2026-12-31"]')
    ok(december instanceof HTMLButtonElement)
    await act(() => december.click())
    await waitFor(() => !$('[data-rf-selection-layer][data-visible]'))
    equal(new FormData(form).get('stay.start'), '2026-12-31')
    equal(new FormData(form).get('stay.end'), '2027-01-01')
  })

  it('commits a date from the picker and restores trigger focus', async (t) => {
    const { $, act, cleanup } = render(
      <form>
        <DatePicker label="Departure" defaultMonth="2028-02-15" name="departure" />
      </form>,
    )
    t.after(cleanup)
    const trigger = $('button[aria-haspopup="dialog"]')
    const form = $('form')
    ok(trigger instanceof HTMLButtonElement)
    ok(form instanceof HTMLFormElement)
    await act(() => trigger.click())
    await waitFor(() => document.activeElement?.getAttribute('data-rf-day') === '2028-02-15')
    const leapDay = $('[data-rf-day="2028-02-29"]')
    ok(leapDay instanceof HTMLButtonElement)
    await act(() => leapDay.click())
    await waitFor(
      () => trigger.getAttribute('aria-expanded') === 'false' && document.activeElement === trigger,
    )
    equal(new FormData(form).get('departure'), '2028-02-29')
  })
})

it('preserves date and time fields through presets, editing, and form reset', async (t) => {
  const { $, act, cleanup } = render(
    <form>
      <DatePicker
        label="Meeting"
        name="meeting"
        time
        defaultValue="2028-02-28"
        defaultTime="09:30"
        presets={[{ label: 'Leap day', value: '2028-02-29' }]}
      />
    </form>,
  )
  t.after(cleanup)
  const form = $('form') as HTMLFormElement
  const trigger = $('button[aria-haspopup="dialog"]') as HTMLButtonElement
  await act(() => trigger.click())
  await act(() => ($('.rf-date-presets button') as HTMLButtonElement).click())
  equal(new FormData(form).get('meeting'), '2028-02-29')
  equal(trigger.getAttribute('aria-expanded'), 'true')
  const time = $('input[role=combobox]') as HTMLInputElement
  await act(() => {
    time.value = '14:15'
    time.dispatchEvent(new Event('input', { bubbles: true }))
    press(time, 'Enter')
  })
  equal(new FormData(form).get('meeting.time'), '14:15')
  await act(() => form.reset())
  await waitFor(() => new FormData(form).get('meeting') === '2028-02-28')
  equal(new FormData(form).get('meeting.time'), '09:30')
})

it('rejects booked dates and ranges that cross them, and restores a canceled range', async (t) => {
  const { $, act, cleanup } = render(
    <form>
      <Calendar
        mode="range"
        name="stay"
        defaultMonth="2028-02-01"
        defaultValue={{ start: '2028-02-01', end: '2028-02-03' }}
        booked={['2028-02-10']}
      />
    </form>,
  )
  t.after(cleanup)
  const form = $('form') as HTMLFormElement
  const day = (date: string) => $(`[data-rf-day="${date}"]`) as HTMLButtonElement
  equal(day('2028-02-10').getAttribute('aria-disabled'), 'true')
  await act(() => day('2028-02-08').click())
  await act(() => press(day('2028-02-08'), 'Escape'))
  equal(new FormData(form).get('stay.start'), '2028-02-01')
  equal(new FormData(form).get('stay.end'), '2028-02-03')
  await act(() => day('2028-02-08').click())
  await act(() => day('2028-02-12').click())
  equal(new FormData(form).get('stay.start'), '2028-02-12')
  equal(new FormData(form).get('stay.end'), '')
})

it('parses typed times, preserves duration, and cancels drafts without changing form values', async (t) => {
  const { $, act, cleanup } = render(
    <form>
      <DatePicker name="meeting" timeRange defaultTime="11:00" defaultEndTime="12:45" />
    </form>,
  )
  t.after(cleanup)
  const form = $('form') as HTMLFormElement
  const start = $('input[aria-label="Start time"]') as HTMLInputElement
  const end = $('input[aria-label="End time"]') as HTMLInputElement
  async function type(field: HTMLInputElement, text: string, key = 'Enter') {
    await act(() => {
      field.focus()
      field.value = text
      field.dispatchEvent(new Event('input', { bubbles: true }))
      press(field, key)
    })
  }
  await type(start, '12pm')
  equal(new FormData(form).get('meeting.time'), '12:00')
  equal(new FormData(form).get('meeting.endTime'), '13:45')
  await type(start, '1130')
  equal(new FormData(form).get('meeting.time'), '11:30')
  equal(new FormData(form).get('meeting.endTime'), '13:15')
  await type(start, '10am', 'Escape')
  equal(new FormData(form).get('meeting.time'), '11:30')
  await type(end, '10am')
  equal(new FormData(form).get('meeting.endTime'), '13:15')
  await type(start, '23:30')
  equal(new FormData(form).get('meeting.endTime'), '23:59')
  await act(() => form.reset())
  await waitFor(() => new FormData(form).get('meeting.time') === '11:00')
  equal(new FormData(form).get('meeting.endTime'), '12:45')
})
