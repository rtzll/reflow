import { Combobox, Select } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { on, type Handle } from 'remix/component'
import { it } from 'remix/test'

function press(node: Element, key: string) {
  node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

async function waitFor(check: () => boolean) {
  for (let i = 0; i < 90; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected choice state did not settle')
}

const options = [
  { value: 'react-router', label: 'React Router' },
  { value: 'removed', label: 'Removed', disabled: true },
  { value: 'remix', label: 'Remix' },
]

it('selects an enabled option, preserves form submission, and resets to the default', async (t) => {
  let value: string | null = null
  const { $, act, cleanup } = render(
    <form>
      <Select
        label="Framework"
        name="framework"
        options={options}
        defaultValue="react-router"
        onValueChange={(next) => {
          value = next
        }}
      />
    </form>,
  )
  t.after(cleanup)
  const form = $('form')
  const trigger = $('button')
  const list = $('[role="listbox"]')
  ok(form instanceof HTMLFormElement)
  ok(trigger instanceof HTMLButtonElement)
  ok(list instanceof HTMLElement)
  equal(new FormData(form).get('framework'), 'react-router')
  await act(() => trigger.click())
  await waitFor(() => document.activeElement === list)
  await act(() => press(list, 'ArrowDown'))
  await act(() => press(list, 'Enter'))
  await waitFor(() => value === 'remix' && document.activeElement === trigger)
  equal(new FormData(form).get('framework'), 'remix')
  await act(() => form.reset())
  await waitFor(() => new FormData(form).get('framework') === 'react-router')
})

it('navigates grouped select options without treating headings as choices', async (t) => {
  let value: string | null = null
  const { $, act, cleanup } = render(
    <Select
      label="Settings"
      defaultValue="profile"
      options={[
        { value: 'profile', label: 'Profile', group: 'Account' },
        { value: 'email', label: 'Email', group: 'Account', disabled: true },
        { value: 'privacy', label: 'Privacy', group: 'Preferences' },
      ]}
      onValueChange={(next) => {
        value = next
      }}
    />,
  )
  t.after(cleanup)
  const trigger = $('button')
  const list = $('[role="listbox"]')
  ok(trigger instanceof HTMLButtonElement)
  ok(list instanceof HTMLElement)
  equal(list.querySelectorAll('[role="option"]').length, 3)
  await act(() => trigger.click())
  await waitFor(() => document.activeElement === list)
  await act(() => press(list, 'ArrowDown'))
  await act(() => press(list, 'Enter'))
  await waitFor(() => value === 'privacy')
})

it('filters an editable combobox and submits only the committed option', async (t) => {
  let value: string | null = null
  const { $, act, cleanup } = render(
    <form>
      <Combobox
        label="Framework"
        name="framework"
        options={options}
        defaultValue="react-router"
        onValueChange={(next) => {
          value = next
        }}
      />
    </form>,
  )
  t.after(cleanup)
  const form = $('form')
  const input = $('input[role="combobox"]')
  const toggle = $('button[aria-haspopup="listbox"]')
  ok(form instanceof HTMLFormElement)
  ok(input instanceof HTMLInputElement)
  ok(toggle instanceof HTMLButtonElement)
  await waitFor(() => input.value === 'React Router')
  equal(new FormData(form).get('framework'), 'react-router')

  await act(() => toggle.click())
  await waitFor(() => input.getAttribute('aria-expanded') === 'true')
  equal(document.activeElement, input)
  await act(() => toggle.click())
  await waitFor(() => input.getAttribute('aria-expanded') === 'false')

  input.focus()
  await act(() => {
    input.value = 'rem'
    input.dispatchEvent(new InputEvent('input', { bubbles: true }))
  })
  equal(new FormData(form).get('framework'), '')
  equal($('[role="option"]:not([hidden]):not([aria-disabled="true"])')?.textContent, 'Remix')
  await act(() => press(input, 'ArrowDown'))
  await act(() => press(input, 'Enter'))
  await waitFor(() => value === 'remix' && input.value === 'Remix')
  equal(new FormData(form).get('framework'), 'remix')
  equal(document.activeElement, input)
})

it('keeps multiple selections when filtering, removes chips, creates options, and resets forms', async (t) => {
  const { $, act, cleanup } = render(
    <form>
      <Combobox
        label="Tags"
        name="tags"
        multiple
        creatable
        options={options}
        defaultValues={['remix']}
      />
    </form>,
  )
  t.after(cleanup)
  const form = $('form') as HTMLFormElement
  const input = $('input[role="combobox"]') as HTMLInputElement
  equal(new FormData(form).getAll('tags').join(','), 'remix')
  await act(() => {
    input.value = 'new tag'
    input.dispatchEvent(new InputEvent('input', { bubbles: true }))
  })
  equal(new FormData(form).getAll('tags').join(','), 'remix')
  await act(() => press(input, 'ArrowDown'))
  await act(() => press(input, 'Enter'))
  equal(new FormData(form).getAll('tags').join(','), 'remix,new tag')
  equal(input.value, '')
  equal(input.getAttribute('aria-expanded'), 'true')
  await act(() => press(input, 'ArrowLeft'))
  const lastChip = $('button[aria-label="Remove new tag"]')
  equal(document.activeElement, lastChip)
  ok(lastChip instanceof HTMLButtonElement)
  await act(() => press(lastChip, 'ArrowLeft'))
  const firstChip = $('button[aria-label="Remove Remix"]')
  equal(document.activeElement, firstChip)
  ok(firstChip instanceof HTMLButtonElement)
  await act(() => press(firstChip, 'Delete'))
  equal(document.activeElement, input)
  equal(new FormData(form).getAll('tags').join(','), 'new tag')
  await act(() => form.reset())
  await waitFor(() => new FormData(form).getAll('tags').join() === 'remix')
})

it('synchronizes controlled select changes with its label and form value', async (t) => {
  function Example(handle: Handle) {
    let value = 'react-router'
    return () => (
      <form>
        <Select
          label="Framework"
          name="framework"
          options={options}
          value={value}
          onValueChange={(next) => {
            value = next ?? ''
            handle.update()
          }}
        />
        <button
          type="button"
          mix={on('click', () => {
            value = 'remix'
            handle.update()
          })}
        >
          Set Remix
        </button>
      </form>
    )
  }
  const { $, act, cleanup } = render(<Example />)
  t.after(cleanup)
  const form = $('form') as HTMLFormElement
  equal(new FormData(form).get('framework'), 'react-router')
  await act(() => ($('form > button') as HTMLButtonElement).click())
  equal(new FormData(form).get('framework'), 'remix')
  equal($('.rf-picker-label')?.textContent, 'Remix')
})
