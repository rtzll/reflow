import { ShortcutSheet } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

const sampleShortcuts = [
  { keys: 'j', label: 'Next file', group: 'Review' },
  { keys: 'k', label: 'Previous file', group: 'Review' },
  { keys: ['g', 'p'], label: 'Go to pull requests', group: 'Navigation' },
  { keys: ['g', 'c'], label: 'Go to CI runs', group: 'Navigation' },
]

it('opens on global ? hotkey, filters shortcuts, and ignores ? when typing inside an input', async (t) => {
  const { $, $$, act, cleanup } = render(
    <div>
      <input data-unrelated="" />
      <ShortcutSheet shortcuts={sampleShortcuts} />
    </div>,
  )
  t.after(cleanup)

  // Typing ? inside an input does NOT open the sheet.
  const input = $('[data-unrelated]') as HTMLInputElement
  const dialog = () => $('dialog') as HTMLDialogElement
  await act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true, bubbles: true }))
  })
  equal(dialog().open, false)

  // Pressing ? outside inputs opens the sheet.
  await act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: '?', shiftKey: true, bubbles: true }),
    )
  })
  equal(dialog().open, true)
  equal($$('.rf-shortcut-sheet-row').length, 4)

  // Filtering narrows the visible rows.
  const search = $('.rf-shortcut-sheet-search input') as HTMLInputElement
  await act(() => {
    search.value = 'pull'
    search.dispatchEvent(new Event('input', { bubbles: true }))
  })
  equal($$('.rf-shortcut-sheet-row').length, 1)
  ok($('.rf-shortcut-sheet-row')?.textContent?.includes('Go to pull requests'))
})
