# PipelineGraph

CI runs are directed acyclic graphs: lint and typecheck fan into build, build fans out into verification shards, and release waits on all upstream gates. `PipelineGraph` arranges jobs into topological stage columns connected by measured SVG cubic Bezier edges, highlighting upstream ancestors and downstream dependents on hover or selection.

## API

```tsx
import { PipelineGraph } from '@rtzll/reflow'

<PipelineGraph
  label="Release pipeline"
  jobs={[
    { id: 'lint', name: 'Lint & format', stage: 'Check', status: 'passed', duration: '3s' },
    { id: 'build', name: 'Build workspace', stage: 'Build', needs: ['lint'], status: 'passed', duration: '11s' },
  ]}
  value={activeJobId}
  onValueChange={setActiveJobId}
  size="compact"
/>
```

- `jobs` defines nodes with `id`, `name`, `status`, optional `stage`, `needs` dependencies, `duration`, `meta`, and `matrixCount` badges.
- Topological layering places each job into the appropriate stage column automatically while respecting explicit `stage` labels.
- `ResizeObserver` re-measures node anchor points and redraws smooth SVG cubic Bezier paths whenever the container resizes.
- Hovering or focusing a job dims unrelated nodes and emphasizes its full upstream/downstream dependency chain.

## Verification

Browser tests (`pipeline-graph.test.browser.tsx`) verify stage grouping, edge rendering, dependency chain highlighting, and selection; `/apps/ci` E2E tests verify selecting jobs updates runner telemetry and logs.
