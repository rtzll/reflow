import { Kbd } from '@rtzll/reflow'
import { deepEqual, equal } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('formats chords for mac and non-mac platforms and renders semantic kbd elements', (t) => {
  const { $$, cleanup } = render(
    <div>
      <div data-mac>
        <Kbd keys="mod+shift+p" platform="mac" />
      </div>
      <div data-other>
        <Kbd keys="mod+shift+p" platform="other" />
      </div>
    </div>,
  )
  t.after(cleanup)

  deepEqual(
    [...$$('[data-mac] kbd')].map((el) => el.textContent),
    ['⌘', '⇧', 'P'],
  )
  deepEqual(
    [...$$('[data-other] kbd')].map((el) => el.textContent),
    ['Ctrl', 'Shift', 'P'],
  )
})

it('renders sequences with hidden separators and single children keycaps', (t) => {
  const { $, $$, cleanup } = render(
    <div>
      <Kbd keys={['g', 'i']} separator="then" variant="outline" size="compact" />
      <Kbd variant="outline">Esc</Kbd>
    </div>,
  )
  t.after(cleanup)

  const group = $('.rf-kbd-group')!
  equal(group.getAttribute('data-variant'), 'outline')
  equal(group.getAttribute('data-size'), 'compact')
  deepEqual(
    [...$$('.rf-kbd-group kbd')].map((el) => el.textContent),
    ['G', 'I'],
  )
  const sep = $('.rf-kbd-sep')!
  equal(sep.textContent, 'then')
  equal(sep.getAttribute('aria-hidden'), 'true')
  equal($(':scope > div > kbd.rf-kbd')?.textContent, 'Esc')
})
