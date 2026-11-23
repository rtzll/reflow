import { TaskList } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

const tasks = [
  { id: 'a', label: 'Outline the story', status: 'done' as const },
  { id: 'b', label: 'Draft the opening', status: 'active' as const },
  { id: 'c', label: 'Proof the captions' },
]

it('marks each step and writes its status', async (t) => {
  const { $, cleanup } = render(<TaskList tasks={tasks} />)
  t.after(cleanup)
  const list = $('ol') as HTMLElement
  equal(list.getAttribute('aria-label'), 'Tasks')
  const rows = [...list.querySelectorAll('li')] as HTMLElement[]
  equal(rows.map((row) => row.dataset.status).join(','), 'done,active,pending')
  equal(rows[0].textContent, 'Outline the story (done)')
  equal(rows[1].textContent, 'Draft the opening (in progress)')
  equal(rows[2].textContent, 'Proof the captions (not started)')
  ok(rows[1].querySelector('.rf-spinner'))
  ok(rows[0].querySelector('.rf-task-list-check'))
  equal($('[role="status"]')?.textContent, 'Now: Draft the opening')
  equal($('.rf-task-list-progress'), null)
})

it('counts finished steps and names the list', async (t) => {
  const { $, act, cleanup } = render(<TaskList tasks={tasks} label="Plan" progress />)
  t.after(cleanup)
  await act(() => {})
  equal($('ol')?.getAttribute('aria-label'), 'Plan')
  equal($('.rf-task-list-progress')?.textContent, '1 of 3 done')
})
