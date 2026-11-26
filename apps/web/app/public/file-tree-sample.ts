import type { FileTreeRowDecoration, GitStatusEntry } from '@rtzll/reflow/trees'

export const sampleFileTreeId = 'docs-file-tree-example'

export const sampleFileTreePaths = [
  'packages/reflow/src/diffs-ssr.ts',
  'packages/reflow/src/diffs.tsx',
  'packages/reflow/src/trees.tsx',
  'packages/reflow/src/diagrams.tsx',
  'apps/web/test/app-review.test.e2e.ts',
]

export const sampleFileTreeGitStatus: readonly GitStatusEntry[] = [
  { path: 'packages/reflow/src/diffs-ssr.ts', status: 'modified' },
  { path: 'packages/reflow/src/trees.tsx', status: 'added' },
  { path: 'packages/reflow/src/diagrams.tsx', status: 'added' },
  { path: 'apps/web/test/app-review.test.e2e.ts', status: 'modified' },
]

export const sampleFileTreeDecorations: Readonly<Record<string, FileTreeRowDecoration>> = {
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
