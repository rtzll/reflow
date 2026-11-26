import { LogViewer, type LogGroup, type LogLineRange } from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

const groups: LogGroup[] = [
  {
    id: 'install',
    title: 'Install dependencies',
    status: 'passed',
    duration: '1.2s',
    entries: [
      { text: '\x1b[32m✓\x1b[0m Lockfile up to date', timestamp: '+00:00.4' },
      { text: 'Deprecated subdependency warning', level: 'warn', timestamp: '+00:01.1' },
    ],
  },
  {
    id: 'test',
    title: 'Run pnpm test:run',
    status: 'failed',
    duration: '14.6s',
    entries: [
      { text: 'Running 42 tests…', timestamp: '+00:02.0' },
      {
        text: '\x1b[31m✗\x1b[0m AssertionError: expected 200',
        level: 'error',
        timestamp: '+00:14.5',
      },
    ],
  },
]

it('auto-expands failed groups, filters by severity and query, and supports Shift+click line ranges', async (t) => {
  const ranges: (LogLineRange | null)[] = []
  const { $, $$, act, cleanup } = render(
    <LogViewer
      title="verify"
      status="failed"
      duration="15.8s"
      groups={groups}
      onSelectedLinesChange={(range) => ranges.push(range)}
    />,
  )
  t.after(cleanup)

  // Failed group opens automatically; passed group starts collapsed.
  equal($('[data-log-group="test"]')?.getAttribute('data-open'), 'true')
  equal($('[data-log-group="install"]')?.getAttribute('data-open'), 'false')

  // Severity filter shows only error lines.
  const errorPill = $('.rf-log-pill[data-level="error"]') as HTMLButtonElement
  await act(() => errorPill.click())
  equal($$('.rf-log-line').length, 1)
  ok($('.rf-log-line')?.textContent?.includes('AssertionError'))

  // Clear filter and select a line range with Shift+click.
  await act(() => errorPill.click())
  await act(() =>
    ($('[data-log-group="install"] .rf-log-group-header') as HTMLButtonElement).click(),
  )
  equal($$('.rf-log-line').length, 4)

  const line2 = $('[data-log-line="2"] .rf-log-gutter') as HTMLButtonElement
  const line4 = $('[data-log-line="4"] .rf-log-gutter') as HTMLButtonElement
  await act(() => line2.click())
  await act(() => line4.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true })))
  deepEqual(ranges.at(-1), { start: 2, end: 4 })
  equal($$('.rf-log-line[data-selected="true"]').length, 3)

  // Search narrows matching lines across groups.
  const search = $('.rf-log-search') as HTMLInputElement
  await act(() => {
    search.value = 'Lockfile'
    search.dispatchEvent(new Event('input', { bubbles: true }))
  })
  equal($$('.rf-log-line').length, 1)
  ok($('.rf-log-line')?.textContent?.includes('Lockfile up to date'))
})
