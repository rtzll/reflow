import { Icon, SegmentedControl } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { type Handle } from 'remix/component'
import { describe, it } from 'remix/test'

const views = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'board', label: 'Board' },
]

function radio(root: ParentNode, value: string) {
  const input = root.querySelector<HTMLInputElement>(`input[type="radio"][value="${value}"]`)
  ok(input, `missing ${value}`)
  return input
}

describe('SegmentedControl', () => {
  it('is a named radio group that is never empty and submits its value', async (t) => {
    const { $, cleanup } = render(
      <form>
        <SegmentedControl
          label="View"
          name="view"
          options={[{ value: 'off', label: 'Off', disabled: true }, ...views]}
        />
      </form>,
    )
    t.after(cleanup)
    const form = $('form') as HTMLFormElement
    const fieldset = $('fieldset') as HTMLFieldSetElement
    equal(fieldset.querySelector('legend')?.textContent, 'View')
    equal(fieldset.querySelectorAll('input[type="radio"][name="view"]').length, 4)
    // Without a value or default, the first enabled option is selected.
    ok(radio(fieldset, 'list').checked)
    ok(radio(fieldset, 'off').disabled)
    equal(new FormData(form).get('view'), 'list')
  })

  it('starts at its default, reports changes and resets to the default', async (t) => {
    const changes: string[] = []
    const { $, act, cleanup } = render(
      <form>
        <SegmentedControl
          label="View"
          name="view"
          options={views}
          defaultValue="grid"
          onValueChange={(value) => changes.push(value)}
        />
      </form>,
    )
    t.after(cleanup)
    const form = $('form') as HTMLFormElement
    ok(radio(form, 'grid').checked)
    await act(() => radio(form, 'board').click())
    equal(new FormData(form).get('view'), 'board')
    equal(changes.join(), 'board')
    await act(() => form.reset())
    equal(new FormData(form).get('view'), 'grid')
  })

  it('follows a controlled value', async (t) => {
    let current = 'list'
    function Controlled(handle: Handle) {
      return () => (
        <SegmentedControl
          label="View"
          options={views}
          value={current}
          onValueChange={(value) => {
            current = value
            void handle.update()
          }}
        />
      )
    }
    const { $, act, cleanup } = render(<Controlled />)
    t.after(cleanup)
    const root = $('fieldset') as HTMLFieldSetElement
    ok(radio(root, 'list').checked)
    await act(() => radio(root, 'board').click())
    equal(current, 'board')
    ok(radio(root, 'board').checked)
    ok(!radio(root, 'list').checked)
  })

  it('keeps the name of an icon-only segment and disables the whole control', async (t) => {
    const { $, cleanup } = render(
      <SegmentedControl
        label="Layout"
        disabled
        options={[
          { value: 'list', label: 'List', icon: <Icon name="menu" />, iconOnly: true },
          { value: 'grid', label: 'Grid', icon: <Icon name="square" />, iconOnly: true },
        ]}
      />,
    )
    t.after(cleanup)
    const fieldset = $('fieldset') as HTMLFieldSetElement
    ok(fieldset.disabled)
    const input = radio(fieldset, 'grid')
    equal(input.labels?.[0]?.textContent?.trim(), 'Grid')
  })
})
