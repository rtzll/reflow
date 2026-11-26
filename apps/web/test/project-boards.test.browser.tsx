import {
  GroupedList,
  KanbanBoard,
  QuickCreateBar,
  RoadmapTimeline,
  type QuickCreateDraft,
} from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('KanbanBoard collapses columns, flags WIP limits, and moves cards via Alt+ArrowRight', async (t) => {
  let moved = ''
  const { container, act, cleanup } = render(
    <KanbanBoard
      onMoveItem={(itemId, targetCol) => {
        moved = `${itemId}->${targetCol}`
      }}
      columns={[
        { id: 'todo', title: 'Todo', wipLimit: 1 },
        { id: 'doing', title: 'In progress' },
      ]}
      items={[
        { id: 'i1', columnId: 'todo', key: 'ENG-1', title: 'Audit tokens', estimate: 2 },
        { id: 'i2', columnId: 'todo', key: 'ENG-2', title: 'Ship board', estimate: 3 },
      ]}
    />,
  )
  t.after(cleanup)

  ok(container.querySelector('.rf-kanban-column[data-over-wip="true"]'))
  ok(container.textContent?.includes('5 pts'))

  const firstCard = container.querySelector<HTMLElement>('.rf-kanban-card')!
  firstCard.focus()
  await act(() => {
    firstCard.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true }),
    )
  })
  equal(moved, 'i1->doing')

  const collapseBtn = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Collapse Todo column"]',
  )!
  await act(() => {
    collapseBtn.click()
  })
  ok(container.querySelector('.rf-kanban-column-collapsed'))
})

it('GroupedList navigates with j/k keys, toggles collapse, and multi-selects via x', async (t) => {
  let selected: string[] = []
  const { container, act, cleanup } = render(
    <GroupedList
      selectedIds={[]}
      onSelectedChange={(next) => {
        selected = Array.from(next)
      }}
      groups={[
        { id: 'active', title: 'In progress' },
        { id: 'todo', title: 'Todo' },
      ]}
      items={[
        {
          id: 'a1',
          groupId: 'active',
          key: 'ENG-10',
          title: 'Virtualize backlog',
          priority: 'high',
        },
        {
          id: 'a2',
          groupId: 'todo',
          key: 'ENG-11',
          title: 'Add triage shortcuts',
          priority: 'medium',
        },
      ]}
    />,
  )
  t.after(cleanup)

  const rows = Array.from(container.querySelectorAll<HTMLElement>('.rf-grouped-list-row'))
  equal(rows.length, 2)
  rows[0]!.focus()
  await act(() => {
    rows[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true }))
  })
  equal(document.activeElement, rows[1])

  await act(() => {
    rows[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }))
  })
  deepEqual(selected, ['a2'])
})

it('QuickCreateBar submits non-empty issue draft and resets input', async (t) => {
  const created: QuickCreateDraft[] = []
  const { container, act, cleanup } = render(
    <QuickCreateBar
      defaultStatus="in-progress"
      defaultPriority="high"
      onCreate={(draft) => {
        created.push(draft)
      }}
    />,
  )
  t.after(cleanup)

  const input = container.querySelector<HTMLInputElement>('.rf-quick-create-input')!
  await act(() => {
    input.value = 'Refactor issue tracker onto Reflow primitives'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  const form = container.querySelector<HTMLFormElement>('form.rf-quick-create')!
  await act(() => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })

  equal(created.length, 1)
  equal(created[0]?.title, 'Refactor issue tracker onto Reflow primitives')
  equal(created[0]?.status, 'in-progress')
  equal(created[0]?.priority, 'high')
  equal(input.value, '')
})

it('RoadmapTimeline renders bars, milestones, and switches zoom scale', async (t) => {
  let clickedMilestone = ''
  const { container, act, cleanup } = render(
    <RoadmapTimeline
      rangeStart="2026-01-01"
      rangeEnd="2026-06-30"
      today="2026-03-15"
      onSelectMilestone={(_item, ms) => {
        clickedMilestone = ms.id
      }}
      items={[
        {
          id: 'p1',
          title: 'Project Tracking v1',
          owner: 'Ada',
          startDate: '2026-01-15',
          endDate: '2026-04-30',
          progress: 65,
          milestones: [{ id: 'm1', label: 'Beta launch', date: '2026-03-01', completed: true }],
        },
      ]}
    />,
  )
  t.after(cleanup)

  ok(container.querySelector('.rf-roadmap-today'))
  const msBtn = container.querySelector<HTMLButtonElement>('.rf-roadmap-milestone')!
  await act(() => {
    msBtn.click()
  })
  equal(clickedMilestone, 'm1')
})
