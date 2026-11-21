import { on } from 'remix/component'

/**
 * Keeps the Escape that closes a popup from also closing the popups around it.
 * Fills a gap in `@remix-run/ui` 0.14.0: `popover.surface()` handles Escape
 * with `preventDefault()` but lets the key bubble, so a Select, picker or
 * Popover opened inside a Popover closed both at once. The menu primitive
 * already stops the key, which is why Dropdowns were not affected.
 *
 * Mix it into a popup surface next to `popover.surface()`. A popup whose focus
 * stays in its field, as in Combobox and TimeField, stops the key in the
 * field's own Escape handler instead.
 */
export function containEscape() {
  return on<HTMLElement, 'keydown'>('keydown', (event) => {
    if (event.key === 'Escape') event.stopPropagation()
  })
}
