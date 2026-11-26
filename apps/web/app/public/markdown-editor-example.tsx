import { Badge, type TriggerMenuTrigger } from '@rtzll/reflow'
import { Diagram } from '@rtzll/reflow/diagrams'
import { MarkdownEditor, type MarkdownEditorMode } from '@rtzll/reflow/markdown'
import type { Handle } from 'remix/component'

const initialDraft = `Switched the worker bundle check to fail on any optional peer import.

\`\`\`mermaid
flowchart LR
  Core["@rtzll/reflow"] --> Worker[Cloudflare Worker]
  Diffs["@rtzll/reflow/diffs"] -. optional .-> Browser[Client Entry]
\`\`\`

CC @maya — ready for a quick pass.`

const mentionTriggers: readonly TriggerMenuTrigger[] = [
  {
    character: '@',
    label: 'Mention reviewer',
    items: [
      { value: '@maya', label: '@maya', description: 'Maintainer' },
      { value: '@noah', label: '@noah', description: 'Runtime' },
      { value: '@sara', label: '@sara', description: 'Design systems' },
    ],
  },
]

/** The MarkdownEditor example: Write/Preview/Split composer with formatting toolbar, @mentions, and live Mermaid preview. */
export function MarkdownEditorExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    defaultMode?: MarkdownEditorMode
    allowSplit?: boolean
    toolbar?: boolean
  }>,
) {
  let value = initialDraft
  let posted = 0

  return () => (
    <div style={{ width: 'min(100%, 680px)', display: 'grid', gap: '8px' }}>
      <MarkdownEditor
        label="Discussion reply"
        value={value}
        defaultMode={handle.props.defaultMode ?? 'write'}
        allowSplit={handle.props.allowSplit ?? true}
        toolbar={handle.props.toolbar ?? true}
        triggers={mentionTriggers}
        size={handle.props.size ?? 'default'}
        renderCodeBlock={({ code, language }) =>
          language === 'mermaid' ? <Diagram code={code} size="compact" /> : undefined
        }
        onValueChange={(next) => {
          value = next
          void handle.update()
        }}
        onSubmit={() => {
          posted++
          void handle.update()
        }}
      />
      {posted > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <Badge color="green" variant="dot" size="compact">
            Submitted {posted} {posted === 1 ? 'reply' : 'replies'}
          </Badge>
        </div>
      )}
    </div>
  )
}
