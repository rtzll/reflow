import { CycleOverview, RelationList, SubIssueList, TriageQueue } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('CycleOverview computes completion percentage and invokes status/assignee filter handlers', async (t) => {
  let filtered = ''
  const { container, act, cleanup } = render(
    <CycleOverview
      title="Cycle 14"
      dateRange="Nov 18 – Dec 2"
      statuses={[
        { id: 'done', label: 'Done', count: 6, tone: 'success', completed: true },
        { id: 'in-progress', label: 'In progress', count: 2, tone: 'warning' },
        { id: 'todo', label: 'Todo', count: 2, tone: 'neutral' },
      ]}
      assignees={[
        { name: 'Ada', total: 5, completed: 3, inProgress: 1 },
        { name: 'Noah', total: 5, completed: 3, inProgress: 1 },
      ]}
      onFilterStatus={(id) => {
        filtered = `status:${id}`
      }}
      onFilterAssignee={(name) => {
        filtered = `assignee:${name}`
      }}
    />,
  )
  t.after(cleanup)

  ok(container.textContent?.includes('60%'))
  const statusBtn = container.querySelector<HTMLButtonElement>('.rf-cycle-overview-legend-row')!
  await act(() => {
    statusBtn.click()
  })
  equal(filtered, 'status:done')

  const assigneeBtn = container.querySelector<HTMLButtonElement>('.rf-cycle-overview-assignee')!
  await act(() => {
    assigneeBtn.click()
  })
  equal(filtered, 'assignee:Ada')
})

it('SubIssueList toggles status and adds new child issues inline', async (t) => {
  let toggled = ''
  let added = ''
  const { container, act, cleanup } = render(
    <SubIssueList
      items={[
        { id: 's1', key: 'ENG-41', title: 'Write unit tests', status: 'done' },
        { id: 's2', key: 'ENG-42', title: 'Wire showcase docs', status: 'todo' },
      ]}
      onToggleStatus={(item, next) => {
        toggled = `${item.id}:${next}`
      }}
      onAdd={(title) => {
        added = title
      }}
    />,
  )
  t.after(cleanup)

  ok(container.textContent?.includes('1/2'))
  const statusBtns = Array.from(
    container.querySelectorAll<HTMLButtonElement>('.rf-sub-issue-status-btn'),
  )
  await act(() => {
    statusBtns[1]!.click()
  })
  equal(toggled, 's2:done')

  const input = container.querySelector<HTMLInputElement>('.rf-sub-issue-add-input')!
  await act(() => {
    input.value = 'Verify dark mode'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  const form = container.querySelector<HTMLFormElement>('form.rf-sub-issue-add')!
  await act(() => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  equal(added, 'Verify dark mode')
})

it('RelationList groups blockers and pull requests and triggers unlink', async (t) => {
  let unlinked = ''
  const { container, act, cleanup } = render(
    <RelationList
      items={[
        { id: 'r1', kind: 'blocked-by', ref: 'ENG-310', title: 'Ship virtualizer', status: 'done' },
        {
          id: 'r2',
          kind: 'pull-request',
          ref: '#422',
          title: 'feat: Wave 17 boards',
          prState: 'open',
        },
      ]}
      onRemove={(item) => {
        unlinked = item.id
      }}
    />,
  )
  t.after(cleanup)

  ok(container.textContent?.includes('Blocked by'))
  ok(container.textContent?.includes('Pull requests'))
  const removeBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Unlink #422"]')!
  await act(() => {
    removeBtn.click()
  })
  equal(unlinked, 'r2')
})

it('TriageQueue navigates incoming items and runs keyboard decision actions', async (t) => {
  let decision = ''
  const { container, act, cleanup } = render(
    <TriageQueue
      now="2026-11-26T12:00:00Z"
      onDecision={(item, action) => {
        decision = `${item.id}:${action}`
      }}
      items={[
        {
          id: 'tr1',
          key: 'ENG-501',
          title: 'Safari focus outline clipped in drawer',
          description: 'Occurs when opening drawer from compact toolbar.',
          reporter: 'Ada Lovelace',
          createdAt: '2026-11-26T11:30:00Z',
          priority: 'high',
        },
        {
          id: 'tr2',
          key: 'ENG-502',
          title: 'Add keyboard shortcut for WIP column collapse',
          reporter: 'Noah Kim',
          createdAt: '2026-11-26T10:00:00Z',
          priority: 'medium',
        },
      ]}
    />,
  )
  t.after(cleanup)

  ok(container.textContent?.includes('Safari focus outline clipped in drawer'))
  const firstRow = container.querySelector<HTMLButtonElement>('.rf-triage-row')!
  firstRow.focus()
  await act(() => {
    firstRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
  })
  equal(decision, 'tr1:accept')
})
