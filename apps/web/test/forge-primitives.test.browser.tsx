import {
  Badge,
  CopyChip,
  DiffStat,
  InlineEdit,
  MetadataList,
  ProportionBar,
  SplitButton,
} from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('SplitButton triggers primary action and opens attached dropdown menu', async (t) => {
  let primaryClicks = 0
  let selected = ''
  const { $, act, cleanup } = render(
    <SplitButton
      label="Squash and merge"
      onClick={() => {
        primaryClicks++
      }}
      items={[
        { value: 'merge', label: 'Create a merge commit' },
        { value: 'rebase', label: 'Rebase and merge' },
      ]}
      onSelect={(val) => {
        selected = val
      }}
    />,
  )
  t.after(cleanup)

  await act(() => {
    ;($('.rf-split-button-primary') as HTMLButtonElement).click()
  })
  equal(primaryClicks, 1)

  await act(() => {
    ;($('.rf-split-button-menu .rf-dropdown-trigger') as HTMLButtonElement).click()
  })
  const rebaseItem = Array.from(document.querySelectorAll('[role="menuitem"]')).find((el) =>
    el.textContent?.includes('Rebase'),
  ) as HTMLButtonElement | undefined
  ok(rebaseItem, 'dropdown opens with secondary merge options')
  await act(() => {
    rebaseItem.click()
  })
  equal(selected, 'rebase')
})

it('DiffStat renders proportional blocks and accessible addition/deletion label', (t) => {
  const { $, $$, cleanup } = render(<DiffStat added={48} removed={12} blocks={5} />)
  t.after(cleanup)

  equal($('.rf-diff-stat')?.getAttribute('aria-label'), '48 additions, 12 deletions')
  equal($$('.rf-diff-stat-block[data-kind="added"]').length, 4)
  equal($$('.rf-diff-stat-block[data-kind="removed"]').length, 1)
})

it('ProportionBar renders proportional widths and legend items', (t) => {
  const { $$, cleanup } = render(
    <ProportionBar
      label="Repository languages"
      segments={[
        { id: 'ts', label: 'TypeScript', value: 78, tone: 'accent' },
        { id: 'css', label: 'CSS', value: 22, tone: 'info' },
      ]}
    />,
  )
  t.after(cleanup)

  const segments = Array.from($$('.rf-proportion-segment')) as HTMLElement[]
  equal(segments.length, 2)
  equal(segments[0]!.style.width, '78%')
  equal(segments[1]!.style.width, '22%')
  equal($$('.rf-proportion-legend-item').length, 2)
})

it('MetadataList renders semantic dl/dt/dd rows with action slots and CopyChip renders ref pill', (t) => {
  const { $, $$, cleanup } = render(
    <MetadataList
      label="PR details"
      items={[
        {
          id: 'sha',
          label: 'Commit',
          value: <CopyChip value="3c1c414abcdef" display="3c1c414" />,
        },
        {
          id: 'label',
          label: 'Labels',
          value: <Badge size="compact">ssr</Badge>,
          action: <button type="button">Edit</button>,
        },
      ]}
    />,
  )
  t.after(cleanup)

  equal($$('.rf-metadata-row').length, 2)
  equal($('.rf-copy-chip-text')?.textContent, '3c1c414')
  equal($('.rf-copy-chip')?.getAttribute('aria-label'), 'Copy 3c1c414abcdef')
})

it('InlineEdit enters edit mode, commits on Enter, and cancels on Escape', async (t) => {
  let committed = ''
  const { $, act, cleanup } = render(
    <InlineEdit
      label="Pull request title"
      defaultValue="Fix worker peer isolation"
      onCommit={(val) => {
        committed = val
      }}
    />,
  )
  t.after(cleanup)

  await act(() => {
    ;($('.rf-inline-edit-trigger') as HTMLButtonElement).click()
  })
  const input = $('.rf-inline-edit-input') as HTMLInputElement
  ok(input)

  await act(() => {
    input.value = 'Enforce worker peer isolation'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
  equal(committed, 'Enforce worker peer isolation')
  equal($('.rf-inline-edit-text')?.textContent, 'Enforce worker peer isolation')

  // Escape discards draft changes.
  await act(() => {
    ;($('.rf-inline-edit-trigger') as HTMLButtonElement).click()
  })
  const input2 = $('.rf-inline-edit-input') as HTMLInputElement
  await act(() => {
    input2.value = 'Discarded edit'
    input2.dispatchEvent(new Event('input', { bubbles: true }))
    input2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  equal($('.rf-inline-edit-text')?.textContent, 'Enforce worker peer isolation')
})
