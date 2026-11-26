import {
  Button,
  FloatingActionBar,
  InlinePropertyPicker,
  ProgressRing,
  ViewOptionsPopover,
} from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('FloatingActionBar renders when count > 0, hides at 0, and clears on Escape or click', async (t) => {
  let cleared = 0
  const { container, act, cleanup } = render(
    <FloatingActionBar
      count={3}
      position="inline"
      actions={<Button size="compact">Set status</Button>}
      onClear={() => {
        cleared++
      }}
    />,
  )
  t.after(cleanup)

  ok(container.textContent?.includes('3'))
  const bar = container.querySelector<HTMLElement>('.rf-floating-action-bar')!
  await act(() => {
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  equal(cleared, 1)

  const clearBtn = container.querySelector<HTMLButtonElement>('button[aria-label*="Clear"]')!
  await act(() => {
    clearBtn.click()
  })
  equal(cleared, 2)
})

it('ViewOptionsPopover opens display controls and toggles property pills', async (t) => {
  let toggled = ''
  const { container, act, cleanup } = render(
    <ViewOptionsPopover
      layout="board"
      layouts={[
        { value: 'list', label: 'List' },
        { value: 'board', label: 'Board' },
      ]}
      properties={[
        { id: 'priority', label: 'Priority', visible: true },
        { id: 'labels', label: 'Labels', visible: false },
      ]}
      onToggleProperty={(id, visible) => {
        toggled = `${id}:${visible}`
      }}
    />,
  )
  t.after(cleanup)

  const trigger = container.querySelector<HTMLButtonElement>('button')!
  await act(() => {
    trigger.click()
  })

  const labelsPill = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.rf-view-options-pill'),
  ).find((btn) => btn.textContent?.trim() === 'Labels')!
  ok(labelsPill)
  await act(() => {
    labelsPill.click()
  })
  equal(toggled, 'labels:true')
})

it('InlinePropertyPicker renders current option and selects a new value from dropdown', async (t) => {
  let picked = ''
  const { container, act, cleanup } = render(
    <InlinePropertyPicker
      label="Priority"
      value="medium"
      options={[
        { value: 'urgent', label: 'Urgent' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
      ]}
      onChange={(next) => {
        picked = next
      }}
    />,
  )
  t.after(cleanup)

  ok(container.textContent?.includes('Medium'))
  const trigger = container.querySelector<HTMLButtonElement>('.rf-inline-property-trigger')!
  await act(() => {
    trigger.click()
  })
  const urgentOption = Array.from(
    document.querySelectorAll<HTMLElement>('[role="menuitemradio"]'),
  ).find((el) => el.textContent?.includes('Urgent'))
  ok(urgentOption)
  await act(() => {
    urgentOption!.click()
  })
  equal(picked, 'urgent')
})

it('ProgressRing renders single progress and multi-segment donut arcs', (t) => {
  const { container, cleanup } = render(
    <div>
      <ProgressRing label="Sprint completion" value={7} max={10} size={32}>
        70%
      </ProgressRing>
      <ProgressRing
        label="Status breakdown"
        size={48}
        segments={[
          { id: 'done', label: 'Done', value: 6, tone: 'success' },
          { id: 'active', label: 'In progress', value: 3, tone: 'accent' },
          { id: 'todo', label: 'Todo', value: 1, tone: 'neutral' },
        ]}
      />
    </div>,
  )
  t.after(cleanup)

  const rings = container.querySelectorAll('[role="progressbar"]')
  equal(rings.length, 2)
  equal(rings[0]?.getAttribute('aria-valuetext'), '70%')
  equal(rings[1]?.querySelectorAll('.rf-progress-ring-arc').length, 3)
})
