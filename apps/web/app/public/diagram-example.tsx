import { SegmentedControl } from '@rtzll/reflow'
import { Diagram } from '@rtzll/reflow/diagrams'
import type { Handle } from 'remix/component'
import { sampleDiagrams } from './diagram-sample.ts'

type DiagramKey = keyof typeof sampleDiagrams

/** The Diagram example: Pele-rendered Mermaid diagrams that follow Reflow's live theme tokens. */
export function DiagramExample(
  handle: Handle<{
    prerendered?: Record<string, string>
    size?: 'default' | 'compact'
    copyable?: boolean
    showSourceToggle?: boolean
  }>,
) {
  let active: DiagramKey = 'pipeline'

  return () => {
    const current = sampleDiagrams[active]
    return (
      <div style={{ width: 'min(100%, 720px)', display: 'grid', gap: '12px' }}>
        <div>
          <SegmentedControl
            label="Diagram type"
            size="compact"
            value={active}
            options={[
              { value: 'pipeline', label: 'Flowchart' },
              { value: 'sequence', label: 'Sequence' },
            ]}
            onValueChange={(next) => {
              active = next === 'sequence' ? 'sequence' : 'pipeline'
              void handle.update()
            }}
          />
        </div>
        <Diagram
          title={current.title}
          code={current.code}
          prerenderedSVG={handle.props.prerendered?.[current.code.trim()]}
          copyable={handle.props.copyable ?? true}
          showSourceToggle={handle.props.showSourceToggle ?? true}
          size={handle.props.size ?? 'compact'}
        />
      </div>
    )
  }
}
