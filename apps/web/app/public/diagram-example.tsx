import { SegmentedControl } from '@rtzll/reflow'
import { Diagram } from '@rtzll/reflow/diagrams'
import type { Handle } from 'remix/component'

const diagrams = {
  pipeline: {
    title: 'Zero-flash SSR pipeline',
    code: `flowchart LR
  Build[Build step] --> SSR[prerenderDiff / prerenderFileTree]
  SSR --> DSD[Declarative Shadow DOM]
  DSD --> Paint[First paint · 0ms flash]
  Paint --> Hydrate[Client hydrate]`,
  },
  sequence: {
    title: 'Review thread lifecycle',
    code: `sequenceDiagram
  participant R as Reviewer
  participant A as Author
  participant CI as CI Runner
  R->>A: Inline suggestion + Mermaid diagram
  A->>CI: Apply suggestion & push
  CI-->>R: Checks passed (4.8s)
  R->>A: Approve & merge`,
  },
} as const

type DiagramKey = keyof typeof diagrams

/** The Diagram example: Pele-rendered Mermaid diagrams that follow Reflow's live theme tokens. */
export function DiagramExample(handle: Handle) {
  let active: DiagramKey = 'pipeline'

  return () => {
    const current = diagrams[active]
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
          copyable
          showSourceToggle
          size="compact"
        />
      </div>
    )
  }
}
