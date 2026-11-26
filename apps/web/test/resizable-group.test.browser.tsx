import { ResizableGroup } from '@rtzll/reflow'
import { equal } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('resizes 3 panes via keyboard and collapses/restores collapsible side rails with Enter', async (t) => {
  let latestSizes: readonly number[] = []
  let latestCollapsed: readonly string[] = []
  const { $, $$, act, cleanup } = render(
    <ResizableGroup
      label="Review workspace"
      panes={[
        {
          id: 'files',
          label: 'Files',
          defaultSize: 20,
          collapsible: true,
          content: <div>Files</div>,
        },
        { id: 'diff', label: 'Diff', defaultSize: 55, content: <div>Diff</div> },
        {
          id: 'checks',
          label: 'Checks',
          defaultSize: 25,
          collapsible: true,
          content: <div>Checks</div>,
        },
      ]}
      onValuesChange={(vals) => {
        latestSizes = vals
      }}
      onCollapsedChange={(ids) => {
        latestCollapsed = ids
      }}
    />,
  )
  t.after(cleanup)

  const separators = Array.from($$('[role="separator"]')) as HTMLElement[]
  equal(separators.length, 2)

  // Nudge first separator right by default step (5%).
  await act(() => {
    separators[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  })
  equal(latestSizes[0], 25)
  equal(latestSizes[1], 50)

  // Press Enter on first separator -> collapses Files pane to 0% and hands width to Diff.
  await act(() => {
    separators[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
  equal(latestCollapsed.includes('files'), true)
  equal($('[data-pane="files"]')?.getAttribute('data-collapsed'), 'true')
  equal(latestSizes[0], 0)

  // Press Enter again -> restores Files pane to saved width (25%).
  await act(() => {
    separators[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
  equal(latestCollapsed.includes('files'), false)
  equal(latestSizes[0], 25)
})
