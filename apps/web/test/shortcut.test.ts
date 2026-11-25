import * as assert from 'remix/assert'
import { it } from 'remix/test'
import {
  ariaShortcut,
  formatShortcut,
  matchesShortcut,
  parseShortcut,
  shortcutKeys,
} from '../../../packages/reflow/src/behaviors/shortcut.ts'

it('formats shortcuts for aria-keyshortcuts across modifier aliases, glyphs, and named keys', () => {
  assert.equal(ariaShortcut('alt+t'), 'Alt+T')
  assert.equal(ariaShortcut('alt+shift+v'), 'Alt+Shift+V')
  assert.equal(ariaShortcut('mod+k'), 'Control+K')
  assert.equal(ariaShortcut('⌘K'), 'Control+K')
  assert.equal(ariaShortcut('cmd+opt+enter'), 'Meta+Alt+Enter')
  assert.equal(ariaShortcut('ctrl+space'), 'Control+Space')
  assert.equal(ariaShortcut('alt+up'), 'Alt+ArrowUp')
  assert.equal(ariaShortcut(''), '')
})

it('formats platform keycaps and splits glyph shortcuts including trailing plus', () => {
  assert.deepEqual(formatShortcut('mod+shift+f', true), ['⌘', '⇧', 'F'])
  assert.deepEqual(formatShortcut('mod+shift+f', false), ['Ctrl', 'Shift', 'F'])
  assert.deepEqual(shortcutKeys('⌘+'), ['⌘', '+'])
})

it('matches keyboard events by key or physical code while Alt is held', () => {
  const parsed = parseShortcut('alt+shift+v')
  assert.equal(
    matchesShortcut(
      { key: '◊', code: 'KeyV', metaKey: false, ctrlKey: false, altKey: true, shiftKey: true },
      parsed,
    ),
    true,
  )
  assert.equal(
    matchesShortcut(
      { key: 'v', code: 'KeyV', metaKey: false, ctrlKey: false, altKey: false, shiftKey: true },
      parsed,
    ),
    false,
  )
})
