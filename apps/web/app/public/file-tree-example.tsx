import { Badge } from '@rtzll/reflow'
import { FileTree, type FileTreeRowDecoration, type GitStatusEntry } from '@rtzll/reflow/trees'
import type { Handle } from 'remix/component'

const samplePaths = [
  'packages/reflow/src/diffs-ssr.ts',
  'packages/reflow/src/diffs.tsx',
  'packages/reflow/src/trees.tsx',
  'packages/reflow/src/diagrams.tsx',
  'apps/web/test/app-review.test.e2e.ts',
]

const sampleGitStatus: readonly GitStatusEntry[] = [
  { path: 'packages/reflow/src/diffs-ssr.ts', status: 'modified' },
  { path: 'packages/reflow/src/trees.tsx', status: 'added' },
  { path: 'packages/reflow/src/diagrams.tsx', status: 'added' },
  { path: 'apps/web/test/app-review.test.e2e.ts', status: 'modified' },
]

const sampleDecorations: Readonly<Record<string, FileTreeRowDecoration>> = {
  'packages/reflow/src/diffs-ssr.ts': {
    text: '+29',
    parts: [{ text: '+29', color: 'var(--rf-success)' }],
  },
  'packages/reflow/src/diffs.tsx': {
    text: '+12 −5',
    parts: [
      { text: '+12', color: 'var(--rf-success)' },
      { text: ' ' },
      { text: '−5', color: 'var(--rf-danger)' },
    ],
  },
  'packages/reflow/src/trees.tsx': {
    text: '+184',
    parts: [{ text: '+184', color: 'var(--rf-success)' }],
  },
  'packages/reflow/src/diagrams.tsx': {
    text: '+148',
    parts: [{ text: '+148', color: 'var(--rf-success)' }],
  },
  'apps/web/test/app-review.test.e2e.ts': {
    text: '+42 −8',
    parts: [
      { text: '+42', color: 'var(--rf-success)' },
      { text: ' ' },
      { text: '−8', color: 'var(--rf-danger)' },
    ],
  },
}

/** The FileTree example: a virtualized repository tree with folder compaction, git status, and diff counts. */
export function FileTreeExample(handle: Handle) {
  let selected = samplePaths[1]

  return () => (
    <div style={{ width: 'min(100%, 420px)', display: 'grid', gap: '10px' }}>
      <div
        style={{
          padding: '6px',
          border: '1px solid var(--rf-border)',
          borderRadius: 'var(--rf-panel-radius)',
          background: 'var(--rf-surface-2)',
        }}
      >
        <FileTree
          label="Repository files"
          paths={samplePaths}
          gitStatus={sampleGitStatus}
          rowDecorations={sampleDecorations}
          value={selected}
          onValueChange={(next) => {
            if (samplePaths.includes(next)) {
              selected = next
              void handle.update()
            }
          }}
          size="compact"
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
        <span style={{ color: 'var(--rf-muted)' }}>Selected</span>
        <Badge size="compact">{selected}</Badge>
      </div>
    </div>
  )
}
