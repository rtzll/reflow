import {
  EstimatePill,
  LabelChip,
  LabelPicker,
  PriorityIndicator,
  SavedViewTabs,
  StatusIcon,
} from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('PriorityIndicator and StatusIcon render accessible semantic glyphs and optional labels', (t) => {
  const { container, cleanup } = render(
    <div>
      <PriorityIndicator priority="urgent" />
      <PriorityIndicator priority="high" showLabel />
      <StatusIcon status="in-progress" />
      <StatusIcon status="done" showLabel />
    </div>,
  )
  t.after(cleanup)

  ok(container.querySelector('[aria-label="Priority: Urgent"]'))
  ok(container.textContent?.includes('High'))
  ok(container.querySelector('[aria-label="Status: In progress"]'))
  ok(container.textContent?.includes('Done'))
})

it('LabelChip removes cleanly and LabelPicker toggles options in dropdown', async (t) => {
  let latest: string[] = ['ui']
  const { container, act, cleanup } = render(
    <div>
      <LabelChip label="Bug" color="red" />
      <LabelPicker
        value={['ui']}
        options={[
          { id: 'ui', label: 'UI', color: 'blue' },
          { id: 'perf', label: 'Perf', color: 'amber' },
        ]}
        onChange={(next) => {
          latest = next
        }}
      />
    </div>,
  )
  t.after(cleanup)

  const removeBtn = container.querySelector<HTMLButtonElement>('.rf-label-chip-remove')!
  await act(() => {
    removeBtn.click()
  })
  deepEqual(latest, [])

  const trigger = container.querySelector<HTMLButtonElement>('.rf-label-picker-trigger')!
  await act(() => {
    trigger.click()
  })
  const perfItem = Array.from(
    document.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]'),
  ).find((el) => el.textContent?.includes('Perf'))!
  await act(() => {
    perfItem.click()
  })
  deepEqual(latest, ['ui', 'perf'])
})

it('EstimatePill selects points from dropdown and supports clear', async (t) => {
  let estimate: string | number | null = 3
  const { container, act, cleanup } = render(
    <EstimatePill
      value={3}
      onChange={(next) => {
        estimate = next
      }}
    />,
  )
  t.after(cleanup)

  ok(container.textContent?.includes('3 pts'))
  const trigger = container.querySelector<HTMLButtonElement>('.rf-estimate-pill-trigger')!
  await act(() => {
    trigger.click()
  })
  const fivePts = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')).find(
    (el) => el.textContent?.includes('5 pts'),
  )!
  await act(() => {
    fivePts.click()
  })
  equal(estimate, 5)
})

it('SavedViewTabs navigates with arrows and triggers Save on dirty active view', async (t) => {
  let active = 'active'
  let saved = ''
  const { container, act, cleanup } = render(
    <SavedViewTabs
      activeId="active"
      views={[
        { id: 'all', label: 'All issues', count: 24 },
        { id: 'active', label: 'Active cycle', count: 12, dirty: true },
        { id: 'backlog', label: 'Backlog', count: 12 },
      ]}
      onSelect={(id) => {
        active = id
      }}
      onSave={(id) => {
        saved = id
      }}
    />,
  )
  t.after(cleanup)

  const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
  equal(tabs.length, 3)
  tabs[1]!.focus()
  await act(() => {
    tabs[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  })
  equal(active, 'backlog')

  const saveBtn = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
    (btn) => btn.textContent?.trim() === 'Save',
  )!
  await act(() => {
    saveBtn.click()
  })
  equal(saved, 'active')
})
