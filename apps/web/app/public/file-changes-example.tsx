import { Button, FileChanges } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const files = [
  { path: 'src/issues/winter/cover.ts', added: 48, removed: 6, href: '#cover' },
  { path: 'src/issues/winter/captions.ts', added: 12, removed: 9, href: '#captions' },
  { path: 'src/layout/spread.ts', added: 5, removed: 1, href: '#spread' },
  { path: 'src/layout/masthead.css', added: 3, removed: 3 },
  { path: 'docs/proofing.md', added: 21, removed: 0 },
]

/** The FileChanges example: an edit of five files with its actions. */
export function FileChangesExample(_handle: Handle) {
  return () => (
    <div style={{ width: 'min(100%, 480px)' }}>
      <FileChanges
        files={files}
        actions={
          <>
            <Button size="compact" variant="ghost">
              Undo
            </Button>
            <Button size="compact" variant="secondary">
              View changes
            </Button>
          </>
        }
      />
    </div>
  )
}
