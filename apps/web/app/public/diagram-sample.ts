export const sampleDiagrams = {
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
