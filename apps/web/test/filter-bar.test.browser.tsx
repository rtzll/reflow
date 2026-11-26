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

it('supports keyboard autocomplete, Escape dismissal, and disabled state', async (t) => {
  let latest = ''
  const { $, $$, act, cleanup } = render(
    <FilterBar
      suggestions={suggestions}
      presets={presets}
      onValueChange={(value) => {
        latest = value
      }}
    />,
  )
  t.after(cleanup)

  const input = $('.rf-filter-bar-input') as HTMLInputElement
  await act(() => {
    input.dispatchEvent(new Event('focus', { bubbles: true }))
  })
  ok($('.rf-filter-menu'), 'focusing opens suggestion listbox')
  equal(input.getAttribute('aria-expanded'), 'true')

  // ArrowDown to second key ("author:") and Enter to select key.
  await act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
  })
  await act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
  const readDraft = () => input.value
  equal(readDraft(), 'author:')

  // ArrowDown to second value ("noah") and Enter to commit chip.
  await act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
  })
  await act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
  equal(latest, 'author:noah')
  equal($$('.rf-filter-chip').length, 1)

  // Escape closes open suggestion listbox.
  await act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  equal($('.rf-filter-menu'), null)
  equal(input.getAttribute('aria-expanded'), 'false')
})

it('hides interactive controls when disabled', (t) => {
  const { $, $$, cleanup } = render(
    <FilterBar defaultValue="status:open" suggestions={suggestions} presets={presets} disabled />,
  )
  t.after(cleanup)

  equal(($('.rf-filter-bar-input') as HTMLInputElement).disabled, true)
  equal($('.rf-filter-chip-remove'), null)
  equal($('.rf-filter-bar-clear'), null)
  ok(Array.from($$('.rf-filter-preset')).every((btn) => (btn as HTMLButtonElement).disabled))
})
