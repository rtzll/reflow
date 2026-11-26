import { CommentThread, type CommentEntry } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

/** The CommentThread example: an inline code review thread with a suggestion, reply composer, and Resolve/Reopen. */
export function CommentThreadExample(handle: Handle) {
  let applied = false
  let resolved = false
  let comments: CommentEntry[] = [
    {
      id: 'c1',
      author: { name: 'Noah Park', role: 'Reviewer' },
      timestamp: '12m ago',
      body: 'Strip leading a/ and b/ prefixes here so the server summary matches DiffView’s header path.',
      suggestion: {
        removed: 'const filename = fileDiff.name || fileDiff.prevName',
        added: "const filename = (fileDiff.name || fileDiff.prevName)?.replace(/^[ab]\\//, '')",
      },
    },
    {
      id: 'c2',
      author: { name: 'Maya Chen', role: 'Author' },
      timestamp: '5m ago',
      body: 'Good catch — adding that cleanup and a server test for unified patch headers.',
    },
  ]

  return () => (
    <div style={{ width: 'min(100%, 560px)' }}>
      <CommentThread
        context="packages/reflow/src/diffs-ssr.ts:144"
        resolved={resolved}
        onResolvedChange={(next) => {
          resolved = next
          void handle.update()
        }}
        comments={comments.map((entry) =>
          entry.id === 'c1' && entry.suggestion
            ? {
                ...entry,
                suggestion: {
                  ...entry.suggestion,
                  applied,
                  onApply: () => {
                    applied = true
                    void handle.update()
                  },
                },
              }
            : entry,
        )}
        onReply={(body) => {
          comments = [
            ...comments,
            {
              id: `c-${comments.length + 1}`,
              author: { name: 'You' },
              timestamp: 'Just now',
              body,
            },
          ]
          void handle.update()
        }}
      />
    </div>
  )
}
