import { NumberField } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('steps a labeled number, submits it, and resets with its form', async (t) => {
  const changes: (number | null)[] = []
  const { $, act, cleanup } = render(
    <form>
      <NumberField
        label="Quantity"
        name="quantity"
        min={0}
        max={3}
        step={0.5}
        defaultValue={2}
        required
        onValueChange={(value) => changes.push(value)}
      />
    </form>,
  )
  t.after(cleanup)
  const form = $('form') as HTMLFormElement
  const input = $('input') as HTMLInputElement
  const increase = $('button[aria-label="Increase"]') as HTMLButtonElement
  equal(input.labels?.[0]?.textContent, 'Quantity')
  await act(() => increase.click())
  equal(new FormData(form).get('quantity'), '2.5')
  equal(changes[0], 2.5)
  await act(() => increase.click())
  await act(() => increase.click())
  equal(new FormData(form).get('quantity'), '3')
  await act(() => {
    input.value = ''
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  equal(changes.at(-1), null)
  ok(input.validity.valueMissing)
  await act(() => form.reset())
  equal(new FormData(form).get('quantity'), '2')
})

it('keeps a controlled value when its owner declines an edit', async (t) => {
  const { $, act, cleanup } = render(<NumberField label="Seats" value={4} />)
  t.after(cleanup)
  const input = $('input') as HTMLInputElement
  const increase = $('button[aria-label="Increase"]') as HTMLButtonElement
  await act(() => increase.click())
  equal(input.value, '4')
})
