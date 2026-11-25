import { Kbd } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

/** The Kbd example: platform-aware chords, outline keycaps, and multi-key sequences. */
export function KbdExample(_handle: Handle) {
  return () => (
    <div class="example-stack">
      <div class="example-row">
        <Kbd keys="mod+k" />
        <Kbd keys="mod+shift+p" variant="outline" />
        <Kbd keys={['g', 'i']} separator="then" variant="outline" />
        <Kbd variant="outline">Esc</Kbd>
      </div>
      <div class="example-row">
        <Kbd keys="mod+s" platform="mac" size="compact" />
        <Kbd keys="mod+s" platform="other" size="compact" />
      </div>
    </div>
  )
}
