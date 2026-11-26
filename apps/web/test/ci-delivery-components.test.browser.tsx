import { ActivityHeatmap, MatrixGrid, MergeQueue, SizeDelta, TestReport } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('TestReport filters by status, expands failure details, and invokes inspect log', async (t) => {
  let inspected = ''
  const { container, act, cleanup } = render(
    <TestReport
      onInspectLog={(tc) => {
        inspected = tc.id
      }}
      cases={[
        { id: 't1', suite: 'auth', name: 'refreshes session', status: 'passed', durationMs: 42 },
        {
          id: 't2',
          suite: 'diff',
          name: 'preserves line anchors',
          status: 'failed',
          durationMs: 120,
          message: 'AssertionError: anchor mismatch',
          expected: '#L12-L18',
          actual: '#L12-L17',
          stack: 'at diff.test.ts:44:12',
        },
        {
          id: 't3',
          suite: 'e2e',
          name: 'opens shortcut sheet',
          status: 'flaky',
          durationMs: 850,
          flakyRate: 18,
        },
      ]}
    />,
  )
  t.after(cleanup)

  ok(container.textContent?.includes('1 / 3 passed'))
  ok(container.textContent?.includes('#L12-L18'))

  const inspectBtn = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
    (btn) => btn.textContent?.trim() === 'Inspect log',
  )!
  await act(() => {
    inspectBtn.click()
  })
  equal(inspected, 't2')

  const flakyBtn = Array.from(
    container.querySelectorAll<HTMLButtonElement>('.rf-test-report-filter'),
  ).find((btn) => btn.textContent?.includes('Flaky'))!
  await act(() => {
    flakyBtn.click()
  })
  equal(container.querySelectorAll('.rf-test-report-item').length, 1)
  ok(container.textContent?.includes('18% flaky'))
})

it('MatrixGrid renders 2D status cells and moves focus with arrow keys', async (t) => {
  let selected = ''
  const { container, act, cleanup } = render(
    <MatrixGrid
      rows={[
        { id: 'linux', label: 'Ubuntu' },
        { id: 'macos', label: 'macOS' },
      ]}
      columns={[
        { id: 'node22', label: 'Node 22' },
        { id: 'node24', label: 'Node 24' },
      ]}
      cells={[
        { rowId: 'linux', columnId: 'node22', status: 'passed', durationMs: 18_400 },
        { rowId: 'linux', columnId: 'node24', status: 'failed', durationMs: 9_200 },
        { rowId: 'macos', columnId: 'node22', status: 'running', durationMs: 4_100 },
      ]}
      onSelectCell={(cell) => {
        selected = `${cell.rowId}:${cell.columnId}`
      }}
    />,
  )
  t.after(cleanup)

  const cells = Array.from(container.querySelectorAll<HTMLButtonElement>('.rf-matrix-grid-cell'))
  equal(cells.length, 3)
  cells[0]!.focus()
  await act(() => {
    cells[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  })
  equal(document.activeElement, cells[1])

  await act(() => {
    cells[1]!.click()
  })
  equal(selected, 'linux:node24')
})

it('MergeQueue renders batch headers, check progress, and dequeue action', async (t) => {
  let removed = ''
  const { container, act, cleanup } = render(
    <MergeQueue
      onRemove={(entry) => {
        removed = entry.id
      }}
      entries={[
        {
          id: 'q1',
          ref: '#418',
          title: 'Ship Wave 16 primitives',
          author: 'Ada Lovelace',
          status: 'merging',
          batch: 'Batch A',
          checksPassed: 12,
          checksTotal: 12,
          eta: '~30s',
        },
        {
          id: 'q2',
          ref: '#419',
          title: 'Add blame heat gutter',
          author: 'Linus Torvalds',
          status: 'testing',
          batch: 'Batch A',
          checksPassed: 7,
          checksTotal: 12,
          eta: '~2m',
        },
      ]}
    />,
  )
  t.after(cleanup)

  equal(container.querySelectorAll('.rf-merge-queue-batch').length, 1)
  ok(container.textContent?.includes('2 PRs in train'))

  const removeBtn = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Remove #419 from queue"]',
  )!
  await act(() => {
    removeBtn.click()
  })
  equal(removed, 'q2')
})

it('SizeDelta computes formatted deltas, total row, and over-budget warning', (t) => {
  const { container, cleanup } = render(
    <SizeDelta
      items={[
        {
          id: 'core',
          name: 'dist/index.js',
          beforeBytes: 40_960,
          afterBytes: 49_152,
          budgetBytes: 45_000,
          encoding: 'gzip',
        },
        {
          id: 'css',
          name: 'dist/styles.css',
          beforeBytes: 20_480,
          afterBytes: 18_432,
          encoding: 'gzip',
        },
      ]}
    />,
  )
  t.after(cleanup)

  ok(container.textContent?.includes('Over 43.9 kB budget'))
  ok(container.textContent?.includes('Total'))
  const dangerRow = container.querySelector('.rf-size-delta-row[data-tone="danger"]')
  ok(dangerRow)
})

it('ActivityHeatmap scrubs cells with keyboard arrows and clears on Escape', async (t) => {
  let clickedDate = ''
  const { container, act, cleanup } = render(
    <ActivityHeatmap
      unit="commits"
      onSelectCell={(cell) => {
        clickedDate = cell.date
      }}
      cells={[
        { date: '2026-11-01', count: 0 },
        { date: '2026-11-02', count: 4 },
        { date: '2026-11-03', count: 12 },
      ]}
    />,
  )
  t.after(cleanup)

  ok(container.textContent?.includes('16 commits across 3 days'))
  const canvas = container.querySelector<HTMLDivElement>('.rf-activity-heatmap-canvas')!
  canvas.focus()
  await act(() => {
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
  })
  ok(container.textContent?.includes('4 commits on 2026-11-02'))

  await act(() => {
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
  equal(clickedDate, '2026-11-02')

  await act(() => {
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  ok(container.textContent?.includes('16 commits across 3 days'))
})
