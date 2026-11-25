import { Field, TimeField } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('parses flexible typed times, submits canonical HH:mm, and resets with its form', async (t) => {
  const seen: string[] = []
  const { $, act, cleanup } = render(
    <form>
      <TimeField
        label="Start time"
        name="start"
        defaultValue="09:30"
        onValueChange={(value) => seen.push(value)}
      />
    </form>,
  )
  t.after(cleanup)

  const form = $('form') as HTMLFormElement
  const input = $('input[role="combobox"]') as HTMLInputElement
  equal(input.value, '9:30 AM')
  equal(new FormData(form).get('start'), '09:30')

  await act(() => {
    input.value = '2:45p'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
  equal(seen.at(-1), '14:45')
  equal(input.value, '2:45 PM')
  equal(new FormData(form).get('start'), '14:45')

  // Escape discards an uncommitted draft and keeps the previous time.
  await act(() => {
    input.value = '11:00'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  equal(input.value, '2:45 PM')

  await act(() => form.reset())
  equal(input.value, '9:30 AM')
  equal(new FormData(form).get('start'), '09:30')
})

it('filters slots after a lower bound, shows durations, and supports 24-hour display', async (t) => {
  const seen: string[] = []
  const { $, $$, act, cleanup } = render(
    <TimeField
      label="End time"
      after="22:30"
      step={30}
      hourCycle={24}
      defaultValue="23:00"
      onValueChange={(value) => seen.push(value)}
    />,
  )
  t.after(cleanup)

  const input = $('input[role="combobox"]') as HTMLInputElement
  equal(input.value, '23:00')

  await act(() => input.click())
  const options = [...$$('[role="option"]')].map((el) => el.textContent?.trim())
  equal(options.length, 2)
  ok(options[0]?.includes('23:00') && options[0]?.includes('30min'))
  ok(options[1]?.includes('23:30') && options[1]?.includes('1h'))

  // Typing a time before `after` is ignored on commit.
  await act(() => {
    input.value = '21:00'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
  equal(seen.length, 0)
  equal(input.value, '23:00')
})

it('wires Field id, description, and invalid state onto the combobox input', (t) => {
  const { $, cleanup } = render(
    <Field label="Quiet hours start" description="Local time." error="Choose a valid time.">
      {(control) => <TimeField {...control} label="Quiet hours start" defaultValue="22:00" />}
    </Field>,
  )
  t.after(cleanup)

  const input = $('input[role="combobox"]') as HTMLInputElement
  ok(input.id.length > 0)
  equal(input.getAttribute('aria-invalid'), 'true')
  ok(Boolean(input.getAttribute('aria-describedby')))
})
