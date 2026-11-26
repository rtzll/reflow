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
      {
        text: '\x1b[32m✓\x1b[0m Lockfile up to date',
        source: 'pnpm',
        timestamp: '+00:00.4',
        fields: { cache: 'hit', packages: 142 },
      },
      {
        text: 'Deprecated subdependency warning',
        level: 'warn',
        source: 'pnpm',
        timestamp: '+00:01.1',
      },
    ],
  },
  {
    id: 'test',
    title: 'Run pnpm test:run',
    status: 'failed',
    duration: '14.6s',
    entries: [
      { text: 'Running 42 tests…', source: 'chromium', timestamp: '+00:02.0' },
      {
        text: '\x1b[31m✗\x1b[0m AssertionError: expected 200',
        level: 'error',
        source: 'chromium',
        timestamp: '+00:14.5',
        fields: { suite: 'apps.test.e2e.ts', exit_code: 1 },
      },
    ],
  },
]

it('auto-expands failed groups, filters by severity/regex/facets, highlights matches, inspects fields, and supports Shift+click line ranges', async (t) => {
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

  // Failed group opens automatically; histogram renders density buckets.
  equal($('[data-log-group="test"]')?.getAttribute('data-open'), 'true')
  equal($('[data-log-group="install"]')?.getAttribute('data-open'), 'false')
  equal($$('.rf-log-hist-bucket').length, 2)

  // Expand structured attributes drawer on error line and click a facet value to filter.
  const fieldsToggle = $('[data-log-line="4"] .rf-log-fields-toggle') as HTMLButtonElement
  await act(() => fieldsToggle.click())
  ok($('[data-log-fields="4"]'))
  const facetChip = [...$$('[data-log-fields="4"] .rf-log-field-chip')].find(
    (el) => el.textContent === 'apps.test.e2e.ts',
  ) as HTMLButtonElement
  await act(() => facetChip.click())
  equal($$('.rf-log-line').length, 1)

  // Clear query, verify regex mode + inline match highlighting.
  const search = $('.rf-log-search') as HTMLInputElement
  const regexBtn = $('[aria-label="Regular expression search"]') as HTMLButtonElement
  await act(() => regexBtn.click())
  await act(() => {
    search.value = 'expected \\d+'
    search.dispatchEvent(new Event('input', { bubbles: true }))
  })
  equal($$('.rf-log-line').length, 1)
  equal($('.rf-log-match')?.textContent, 'expected 200')

  // Reset search & regex, expand all groups, and select a Shift+click range.
  await act(() => regexBtn.click())
  await act(() => {
    search.value = ''
    search.dispatchEvent(new Event('input', { bubbles: true }))
  })
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
})

it('shows removable facet chips and windows large logs with Show more controls', async (t) => {
  const manyEntries = Array.from({ length: 12 }, (_, idx) => ({
    text: `Step output line ${idx + 1}`,
    source: idx % 2 === 0 ? 'worker' : 'chromium',
  }))
  const { $, $$, act, cleanup } = render(
    <LogViewer title="large-run" entries={manyEntries} maxVisibleLines={5} />,
  )
  t.after(cleanup)

  equal($$('.rf-log-line').length, 5)
  ok($('.rf-log-load-more')?.textContent?.includes('7 hidden'))

  const showAll = [...$$('.rf-log-load-btn')].find(
    (btn) => btn.textContent === 'Show all',
  ) as HTMLButtonElement
  await act(() => showAll.click())
  equal($$('.rf-log-line').length, 12)

  // Click a source chip -> renders removable facet chip and filters to 6 entries.
  const sourceChip = $('.rf-log-source-chip') as HTMLButtonElement
  await act(() => sourceChip.click())
  equal($$('.rf-log-facet-chip').length, 1)
  equal($$('.rf-log-line').length, 6)

  // Click × on facet chip -> clears filter and restores all 12 entries.
  const removeFacet = $('.rf-log-facet-remove') as HTMLButtonElement
  await act(() => removeFacet.click())
  equal($$('.rf-log-facet-chip').length, 0)
  equal($$('.rf-log-line').length, 12)
})
