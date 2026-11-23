import { ToolCalls } from '@rtzll/reflow'
import { equal, match, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

const calls = [
  { id: 'a', label: 'Read the style guide' },
  { id: 'b', label: 'Ran the checks', detail: <code>pnpm test</code> },
]

it('counts the calls, or says how long the work took', async (t) => {
  const { $, cleanup } = render(
    <div>
      <div class="counted">
        <ToolCalls calls={calls} />
      </div>
      <div class="timed">
        <ToolCalls calls={calls} startedAt={0} endedAt={72_000} />
      </div>
      <div class="custom">
        <ToolCalls calls={calls} summary="Read a file, ran a command" />
      </div>
    </div>,
  )
  t.after(cleanup)
  equal($('.counted .rf-tool-calls-summary')?.textContent, '2 steps')
  equal($('.timed .rf-tool-calls-summary')?.textContent, 'Worked for 1m 12s')
  equal($('.custom .rf-tool-calls-summary')?.textContent, 'Read a file, ran a command')
})

it('opens to the calls with a mark for each status', async (t) => {
  let changes: boolean[] = []
  const { $, act, cleanup } = render(
    <ToolCalls
      calls={[...calls, { id: 'c', label: 'Fetched the page', status: 'failed' }]}
      onOpenChange={(open) => changes.push(open)}
    />,
  )
  t.after(cleanup)
  const line = $('button.rf-tool-calls-line') as HTMLButtonElement
  const list = $('ol.rf-tool-calls-list') as HTMLElement
  equal(line.getAttribute('aria-expanded'), 'false')
  equal(line.getAttribute('aria-controls'), list.id)
  ok(($('.rf-tool-calls-region') as HTMLElement).inert, 'closed calls are out of reach')
  await act(() => line.click())
  equal(line.getAttribute('aria-expanded'), 'true')
  equal(($('.rf-tool-calls-region') as HTMLElement).inert, false)
  const rows = [...list.querySelectorAll('li')]
  equal(rows.length, 3)
  equal(rows[1].querySelector('.rf-tool-calls-detail')?.textContent, 'pnpm test')
  equal(rows[2].dataset.status, 'failed')
  match(rows[2].textContent ?? '', /Failed: Fetched the page/)
  await act(() => line.click())
  equal(changes.join(','), 'true,false')
})

it('shows the running call with a spinner and counts its time once mounted', async (t) => {
  const { $, act, cleanup } = render(
    <ToolCalls
      calls={[...calls, { id: 'c', label: 'Searching the notes', status: 'running' }]}
      startedAt={Date.now() - 65_000}
    />,
  )
  t.after(cleanup)
  await act(() => {})
  const summary = $('.rf-tool-calls-summary') as HTMLElement
  ok(summary.querySelector('.rf-spinner'))
  match(summary.textContent ?? '', /^Searching the notes1m 5s$/)
  equal($('[role="status"]')?.textContent, 'Searching the notes')
  ok($('li[data-status="running"] .rf-spinner'))
})
