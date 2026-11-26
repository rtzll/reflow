import { Terminal } from '@rtzll/reflow'
import type { Handle } from 'remix/component'
import { playCopyError, playCopySuccess } from './showcase-sound.ts'

const sampleLog = [
  '\x1b[2m$ pnpm --filter @rtzll/reflow build && pnpm test:browser\x1b[0m',
  '\x1b[36m▸\x1b[0m Building @rtzll/reflow (dist/diffs.js, dist/diffs-ssr.js, dist/styles.css)',
  '\x1b[32m✓\x1b[0m Built packages/reflow in 520ms',
  '\x1b[36m▸\x1b[0m Running server & browser tests for DiffView',
  '  \x1b[32m✓\x1b[0m prerenderDiff returns Declarative Shadow DOM HTML (164ms)',
  '  \x1b[32m✓\x1b[0m switches between unified and split views (28ms)',
  '  \x1b[32m✓\x1b[0m mounts slotted Remix annotations inside Shadow DOM (29ms)',
  '\x1b[1;32mPASS\x1b[0m  7 passed, 0 failed \x1b[2m(1.64s)\x1b[0m',
]

/** The Terminal example: a searchable CI output log with ANSI colors and copy sound. */
export function TerminalExample(_handle: Handle) {
  return () => (
    <div style={{ width: 'min(100%, 720px)' }}>
      <Terminal
        command="pnpm test:browser diff-view"
        status="passed"
        exitCode={0}
        output={sampleLog}
        searchable
        lineNumbers
        size="compact"
        onCopy={playCopySuccess}
        onCopyError={playCopyError}
      />
    </div>
  )
}
