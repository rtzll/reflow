import { ObjectInspector } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('expands and collapses nested nodes, colors primitives, and handles circular objects safely', async (t) => {
  const runner: Record<string, unknown> = {
    arch: 'x64',
    cores: 8,
  }
  const shared = { tag: 'edge' }
  const payload: Record<string, unknown> = {
    event: 'workflow_run.completed',
    durationMs: 222_000,
    cached: true,
    error: null,
    runner,
    primary: shared,
    secondary: shared,
  }
  payload.self = payload
  runner.parent = payload

  const { $, $$, act, cleanup } = render(
    <ObjectInspector name="webhook" data={payload} expandLevel={1} />,
  )
  t.after(cleanup)

  // Root is expanded at expandLevel=1, nested runner object starts collapsed.
  ok($('.rf-obj-val[data-type="string"]')?.textContent?.includes('workflow_run.completed'))
  ok($('.rf-obj-val[data-type="number"]')?.textContent === '222000')
  ok($('.rf-obj-val[data-type="boolean"]')?.textContent === 'true')
  ok($('.rf-obj-val[data-type="null"]')?.textContent === 'null')
  equal($$('.rf-obj-val[data-type="circular"]').length, 1, 'direct self-cycle is flagged once')

  const runnerToggle = Array.from($$('.rf-obj-toggle')).find((btn) =>
    btn.textContent?.includes('runner'),
  ) as HTMLButtonElement
  equal(runnerToggle.closest('.rf-obj-branch')?.getAttribute('aria-expanded'), 'false')

  await act(() => {
    runnerToggle.click()
  })
  equal(runnerToggle.closest('.rf-obj-branch')?.getAttribute('aria-expanded'), 'true')
  ok(
    Array.from($$('.rf-obj-key')).some((node) => node.textContent === 'cores'),
    'expanding nested object reveals child keys',
  )
  equal(
    $$('.rf-obj-val[data-type="circular"]').length,
    2,
    '2-level grandparent cycle runner.parent -> payload is caught safely',
  )
})
