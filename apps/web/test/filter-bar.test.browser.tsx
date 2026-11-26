import { FilterBar, type FilterPreset, type FilterSuggestion } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

const suggestions: FilterSuggestion[] = [
  { key: 'status', description: 'Issue state', values: ['open', 'merged', 'closed'] },
  { key: 'author', description: 'Thread author', values: ['alex', 'noah', 'maya'] },
  { key: 'label', values: ['rfc', 'perf', 'a11y'] },
]

const presets: FilterPreset[] = [
  { id: 'open-rfcs', label: 'Open RFCs', query: 'status:open label:rfc' },
  { id: 'mine', label: 'By Alex', query: 'author:alex' },
]

it('parses key:value facets into removable chips, pops with Backspace, autocompletes, and applies presets', async (t) => {
  let latest = ''
  const { $, $$, act, cleanup } = render(
    <FilterBar
      defaultValue="status:open timeout"
      suggestions={suggestions}
      presets={presets}
      onValueChange={(value) => {
        latest = value
      }}
    />,
  )
  t.after(cleanup)

  equal($$('.rf-filter-chip').length, 1)
  ok($('.rf-filter-chip')?.textContent?.includes('status'))
  ok($('.rf-filter-chip')?.textContent?.includes('open'))

  const input = $('.rf-filter-bar-input') as HTMLInputElement
  equal(input.value, 'timeout')

  // Typing a completed facet + space turns it into a chip.
  await act(() => {
    input.value = 'author:noah '
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  equal($$('.rf-filter-chip').length, 2)
  equal(latest, 'status:open author:noah')

  // Backspace on empty input pops the last chip.
  await act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
  })
  equal($$('.rf-filter-chip').length, 1)
  equal(latest, 'status:open')

  // Clicking a preset replaces the query and marks it pressed.
  const rfcPreset = Array.from($$('.rf-filter-preset')).find((b) =>
    b.textContent?.includes('Open RFCs'),
  ) as HTMLButtonElement
  await act(() => {
    rfcPreset.click()
  })
  equal(latest, 'status:open label:rfc')
  equal(rfcPreset.getAttribute('aria-pressed'), 'true')
  equal($$('.rf-filter-chip').length, 2)

  // Clear button resets all chips and text.
  await act(() => {
    ;($('.rf-filter-bar-clear') as HTMLButtonElement).click()
  })
  equal(latest, '')
  equal($$('.rf-filter-chip').length, 0)
})
