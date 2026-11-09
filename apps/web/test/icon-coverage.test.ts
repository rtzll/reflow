import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { defaultIcons } from '../../../packages/reflow/src/icon-data.ts'
import { showcaseIcons } from '../app/public/icon-data.ts'

// The showcase hides an icon's default drawing whenever another icon set is
// chosen, so an icon missing from a set renders as nothing there.
// chevrons-up-down keeps its default on purpose.
const keepsDefault = new Set(['chevrons-up-down'])

it('draws every icon in every alternate icon set', () => {
  for (const [family, icons] of Object.entries(showcaseIcons)) {
    const missing = Object.keys(defaultIcons).filter(
      (name) => !keepsDefault.has(name) && !(name in icons),
    )
    assert.deepEqual(missing, [], `${family} is missing icons`)
  }
})
