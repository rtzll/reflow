import {
  CodeBrowser,
  DiffMinimap,
  MergeReadiness,
  SplitButton,
  StackGraph,
  type CodeLineRange,
} from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('StackGraph renders linked nodes, highlights current, and navigates with arrow keys', async (t) => {
  let selectedId: string | undefined
  const { container, act, cleanup } = render(
    <StackGraph
      currentId="pr-2"
      onSelect={(node) => {
        selectedId = node.id
      }}
      nodes={[
        {
          id: 'pr-1',
          ref: '#401',
          title: 'Add virtualizer behavior',
          status: 'merged',
          checks: 'passed',
          review: 'approved',
          additions: 112,
          deletions: 4,
        },
        {
          id: 'pr-2',
          ref: '#402',
          title: 'Build CodeBrowser blame gutter',
          parentId: 'pr-1',
          status: 'open',
          checks: 'running',
          review: 'review-required',
          additions: 240,
          deletions: 18,
        },
        {
          id: 'pr-3',
          ref: '#403',
          title: 'Wire DiffMinimap jumps',
          parentId: 'pr-2',
          status: 'draft',
          checks: 'pending',
        },
      ]}
    />,
  )
  t.after(cleanup)

  const rows = Array.from(container.querySelectorAll<HTMLButtonElement>('.rf-stack-graph-row'))
  equal(rows.length, 3)
  equal(rows[1]?.getAttribute('aria-current'), 'true')

  rows[0]!.focus()
  await act(() => {
    rows[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
  })
  equal(document.activeElement, rows[1])

  await act(() => {
    rows[2]!.click()
  })
  equal(selectedId, 'pr-3')
})

it('MergeReadiness expands gate sub-items and renders trailing SplitButton', async (t) => {
  let merged = false
  const { container, act, cleanup } = render(
    <MergeReadiness
      status="ready"
      summary="2 approvals · 3/3 checks passed"
      action={
        <SplitButton
          label="Squash and merge"
          onClick={() => {
            merged = true
          }}
          items={[{ value: 'rebase', label: 'Rebase and merge' }]}
        />
      }
      gates={[
        {
          id: 'reviews',
          label: 'Code reviews',
          status: 'passed',
          required: true,
          detail: '2 of 2 approvals',
        },
        {
          id: 'checks',
          label: 'Required checks',
          status: 'passed',
          required: true,
          detail: '3/3 passed',
          items: [
            { id: 'lint', label: 'oxlint + oxfmt', status: 'passed', detail: '4s' },
            { id: 'typecheck', label: 'tsc --noEmit', status: 'passed', detail: '11s' },
            { id: 'e2e', label: 'Playwright suite', status: 'passed', detail: '42s' },
          ],
        },
      ]}
    />,
  )
  t.after(cleanup)

  equal(container.querySelectorAll('.rf-merge-readiness-subitem').length, 0)
  const toggle = container.querySelector<HTMLButtonElement>('.rf-merge-readiness-gate-btn')!
  equal(toggle.getAttribute('aria-expanded'), 'false')
  await act(() => {
    toggle.click()
  })
  equal(toggle.getAttribute('aria-expanded'), 'true')
  equal(container.querySelectorAll('.rf-merge-readiness-subitem').length, 3)

  const mergeBtn = container.querySelector<HTMLButtonElement>('.rf-split-button-primary')!
  await act(() => {
    mergeBtn.click()
  })
  equal(merged, true)
})

it('DiffMinimap reports viewed counts and jumps to next unviewed and next unresolved file', async (t) => {
  const jumped: string[] = []
  const { container, act, cleanup } = render(
    <DiffMinimap
      activeId="a"
      onSelect={(file) => {
        jumped.push(file.id)
      }}
      files={[
        { id: 'a', path: 'src/a.ts', additions: 10, deletions: 2, viewed: true },
        {
          id: 'b',
          path: 'src/b.ts',
          additions: 48,
          deletions: 12,
          viewed: false,
          unresolvedComments: 0,
        },
        {
          id: 'c',
          path: 'src/c.ts',
          additions: 14,
          deletions: 6,
          viewed: false,
          unresolvedComments: 2,
        },
      ]}
    />,
  )
  t.after(cleanup)

  ok(container.textContent?.includes('1 / 3 viewed'))
  const buttons = Array.from(
    container.querySelectorAll<HTMLButtonElement>('.rf-diff-minimap-jumps button'),
  )
  await act(() => {
    buttons[0]!.click()
    buttons[1]!.click()
  })
  deepEqual(jumped, ['b', 'c'])
})

it('CodeBrowser supports Shift+Click line ranges and toggles git blame gutter', async (t) => {
  const ranges: Array<CodeLineRange | null> = []
  const { container, act, cleanup } = render(
    <CodeBrowser
      filename="packages/reflow/src/button.tsx"
      refName="main"
      language="tsx"
      code={['const a = 1', 'const b = 2', 'const c = 3', 'export { a, b, c }'].join('\n')}
      onSelectRange={(range) => {
        ranges.push(range)
      }}
      blame={[
        {
          line: 1,
          sha: 'a1b2c3d4',
          author: 'Ada',
          date: new Date('2026-11-25T10:00:00Z'),
          heat: 0.9,
        },
        {
          line: 2,
          sha: 'a1b2c3d4',
          author: 'Ada',
          date: new Date('2026-11-25T10:00:00Z'),
          heat: 0.9,
        },
        {
          line: 3,
          sha: 'f9e8d7c6',
          author: 'Lin',
          date: new Date('2026-11-20T10:00:00Z'),
          heat: 0.3,
        },
      ]}
    />,
  )
  t.after(cleanup)

  const lineBtns = Array.from(container.querySelectorAll<HTMLButtonElement>('.rf-code-browser-ln'))
  equal(lineBtns.length, 4)

  await act(() => {
    lineBtns[1]!.click()
  })
  await act(() => {
    lineBtns[3]!.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))
  })
  deepEqual(ranges[ranges.length - 1], { start: 2, end: 4 })
  ok(container.textContent?.includes('#L2-L4'))

  equal(container.querySelectorAll('.rf-code-browser-blame').length, 0)
  const blameToggle = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
    (btn) => btn.textContent?.trim() === 'Blame',
  )!
  await act(() => {
    blameToggle.click()
  })
  equal(container.querySelectorAll('.rf-code-browser-blame').length, 4)
  ok(container.textContent?.includes('a1b2c3d'))
})
