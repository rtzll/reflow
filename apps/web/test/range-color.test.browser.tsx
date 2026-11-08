import {
  Checkbox,
  CheckboxGroup,
  ColorPicker,
  Field,
  Input,
  RadioGroup,
  Slider,
  Switch,
} from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { on } from 'remix/component'
import type { Handle } from 'remix/component'
import { it } from 'remix/test'

function press(node: Element, key: string) {
  node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

function edit(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new InputEvent('input', { bubbles: true }))
}

it('links field descriptions and uses native form controls for choices', async (t) => {
  const { $, act, cleanup } = render(
    <form>
      <Field label="Email" description="Used for receipts" error="Enter a valid email">
        {(control) => <Input {...control} name="email" type="email" />}
      </Field>
      <Checkbox label="Accept" name="accept" defaultChecked />
      <Switch label="Notifications" name="notifications" />
    </form>,
  )
  t.after(cleanup)

  const form = $('form')
  const email = $('input[name=email]')
  const checkbox = $('input[name=accept]')
  const toggle = $('input[role=switch]')
  ok(form instanceof HTMLFormElement)
  ok(email instanceof HTMLInputElement)
  ok(checkbox instanceof HTMLInputElement)
  ok(toggle instanceof HTMLInputElement)
  equal(email.labels?.[0]?.textContent, 'Email')
  equal(email.getAttribute('aria-invalid'), 'true')
  const descriptions = email
    .getAttribute('aria-describedby')
    ?.split(' ')
    .map((id) => document.getElementById(id)?.textContent)
  deepEqual(descriptions, ['Used for receipts', 'Enter a valid email'])
  equal(new FormData(form).get('accept'), 'on')
  equal(new FormData(form).get('notifications'), null)

  await act(() => {
    checkbox.click()
    toggle.click()
  })
  equal(new FormData(form).get('accept'), null)
  equal(new FormData(form).get('notifications'), 'on')
})

it('preserves native choice values across unrelated renders and resets to the defaults', async (t) => {
  const options = [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
  ]
  function Example(handle: Handle) {
    let version = 0
    return () => (
      <form>
        <CheckboxGroup label="Topics" name="topics" options={options} defaultValue={['one']} />
        <RadioGroup label="Digest" name="digest" options={options} defaultValue="one" />
        <Switch label="Enabled" name="enabled" checked={undefined} defaultChecked />
        <button
          type="button"
          mix={on('click', () => {
            version++
            handle.update()
          })}
        >
          Refresh {version}
        </button>
      </form>
    )
  }
  const { $, act, cleanup } = render(<Example />)
  t.after(cleanup)
  const form = $('form') as HTMLFormElement
  const refresh = $('button') as HTMLButtonElement
  const values = () => Array.from(new FormData(form).entries())
  const defaults = [
    ['topics', 'one'],
    ['digest', 'one'],
    ['enabled', 'on'],
  ]

  await act(() => refresh.click())
  deepEqual(values(), defaults)
  await act(() => {
    for (const selector of [
      '[name=topics][value=two]',
      '[name=digest][value=two]',
      '[name=enabled]',
    ]) {
      const input = $(selector) as HTMLInputElement
      input.click()
    }
    refresh.click()
  })
  deepEqual(values(), [
    ['topics', 'one'],
    ['topics', 'two'],
    ['digest', 'two'],
  ])
  await act(() => form.reset())
  deepEqual(values(), defaults)
})

it('moves range thumbs through discrete steps, constrains the readout, and resets form values', async (t) => {
  const { $, act, cleanup } = render(
    <form>
      <Slider label="Budget" name={['min', 'max']} steps={[5, 10, 18, 30]} defaultValue={[5, 18]} />
    </form>,
  )
  t.after(cleanup)
  const form = $('form')
  const min = $('input[name=min]')
  const readout = $('input[aria-label="Edit budget minimum"]')
  ok(form instanceof HTMLFormElement)
  ok(min instanceof HTMLInputElement)
  ok(readout instanceof HTMLInputElement)

  equal(new FormData(form).get('min'), '5')
  equal(new FormData(form).get('max'), '18')
  min.focus()
  await act(() => press(min, 'ArrowRight'))
  equal(new FormData(form).get('min'), '10')
  equal(new FormData(form).get('max'), '18')

  readout.focus()
  await act(() => edit(readout, '30'))
  await act(() => press(readout, 'Enter'))
  equal(new FormData(form).get('min'), '18')
  equal(readout.value, '18')

  await act(() => form.reset())
  equal(new FormData(form).get('min'), '5')
  equal(new FormData(form).get('max'), '18')
})

function commit(input: HTMLInputElement, value: string) {
  input.focus()
  edit(input, value)
  input.blur()
}

it('edits hex, opacity and the saturation square, and resets with the form', async (t) => {
  let emitted = ''
  const { $, act, cleanup } = render(
    <form>
      <ColorPicker
        name="color"
        defaultValue="#FF0000"
        hideEyedropper
        onValueChange={(value) => {
          emitted = value
        }}
      />
    </form>,
  )
  t.after(cleanup)
  const form = $('form')
  const hex = $('input[aria-label="Hex value"]')
  const alpha = $('input[aria-label=Alpha][inputmode=numeric]')
  const slider = $('input[aria-label=Alpha][type=range]')
  const square = $('[role=application]')
  ok(form instanceof HTMLFormElement)
  ok(hex instanceof HTMLInputElement)
  ok(alpha instanceof HTMLInputElement)
  ok(slider instanceof HTMLInputElement)
  ok(square instanceof HTMLElement)

  await act(() => commit(hex, '0080FF'))
  equal(new FormData(form).get('color'), '#0080FF')
  equal(emitted, '#0080ff')

  await act(() => commit(alpha, '50'))
  equal(new FormData(form).get('color'), '#0080FF80')
  equal(slider.value, '50')

  await act(() => press(square, 'ArrowLeft'))
  ok(new FormData(form).get('color') !== '#0080FF80')
  equal(slider.value, '50')

  await act(() => form.reset())
  equal(new FormData(form).get('color'), '#FF0000')
  equal(hex.value, 'FF0000')
})

it('shows channel fields for the selected format and keeps opacity', async (t) => {
  let emitted = ''
  const { $, act, cleanup } = render(
    <form>
      <ColorPicker
        name="color"
        defaultValue="#FF000080"
        defaultFormat="rgb"
        hideEyedropper
        onValueChange={(value) => {
          emitted = value
        }}
      />
    </form>,
  )
  t.after(cleanup)
  const form = $('form') as HTMLFormElement
  const green = $('input[aria-label=Green]') as HTMLInputElement
  equal(($('input[aria-label=Red]') as HTMLInputElement).value, '255')
  equal(($('input[aria-label=Alpha][inputmode=numeric]') as HTMLInputElement).value, '50%')
  await act(() => commit(green, '128'))
  equal(new FormData(form).get('color'), '#FF800080')
  equal(emitted, 'rgba(255, 128, 0, 0.502)')
})

it('converts OKLCH edits to submitted sRGB while retaining opacity', async (t) => {
  const { $, act, cleanup } = render(
    <form>
      <ColorPicker name="color" defaultValue="#FF000080" defaultFormat="oklch" hideEyedropper />
    </form>,
  )
  t.after(cleanup)
  const form = $('form') as HTMLFormElement
  const lightness = $('input[aria-label=Lightness]') as HTMLInputElement
  equal(lightness.value, '63')
  await act(() => commit(lightness, '50'))
  const submitted = String(new FormData(form).get('color'))
  ok(submitted.startsWith('#') && submitted.endsWith('80'))
})
