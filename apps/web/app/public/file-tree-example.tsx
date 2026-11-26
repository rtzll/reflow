import { Badge } from '@rtzll/reflow'
import { FileTree, type FileTreeSsrPayload } from '@rtzll/reflow/trees'
import type { Handle } from 'remix/component'
import {
  sampleFileTreeDecorations,
  sampleFileTreeGitStatus,
  sampleFileTreePaths,
} from './file-tree-sample.ts'

/** The FileTree example: a virtualized repository tree with folder compaction, git status, and diff counts. */
export function FileTreeExample(
  handle: Handle<{
    prerendered?: FileTreeSsrPayload
    size?: 'default' | 'compact'
    flattenEmptyDirectories?: boolean
    search?: boolean
  }>,
) {
  let selected = sampleFileTreePaths[1]

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
          paths={sampleFileTreePaths}
          gitStatus={sampleFileTreeGitStatus}
          rowDecorations={sampleFileTreeDecorations}
          prerendered={handle.props.prerendered}
          flattenEmptyDirectories={handle.props.flattenEmptyDirectories}
          search={handle.props.search}
          value={selected}
          onValueChange={(next) => {
            if (sampleFileTreePaths.includes(next)) {
              selected = next
              void handle.update()
            }
          }}
          size={handle.props.size ?? 'compact'}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
        <span style={{ color: 'var(--rf-muted)' }}>Selected</span>
        <Badge size="compact">{selected}</Badge>
      </div>
    </div>
  )
}
