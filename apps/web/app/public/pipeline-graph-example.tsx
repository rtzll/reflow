import { Badge, PipelineGraph, type PipelineJob } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const sampleJobs: readonly PipelineJob[] = [
  {
    id: 'lint',
    name: 'Lint & format',
    stage: 'Check',
    status: 'passed',
    duration: '3s',
    meta: 'oxlint',
  },
  {
    id: 'typecheck',
    name: 'Typecheck',
    stage: 'Check',
    status: 'passed',
    duration: '6s',
    meta: 'tsc',
  },
  {
    id: 'build',
    name: 'Build packages',
    stage: 'Build',
    needs: ['lint', 'typecheck'],
    status: 'passed',
    duration: '9s',
  },
  {
    id: 'deploy-test',
    name: 'Worker smoke',
    stage: 'Verify',
    needs: ['build'],
    status: 'passed',
    duration: '12s',
    meta: '82 routes',
  },
  {
    id: 'e2e',
    name: 'E2E & browser',
    stage: 'Verify',
    needs: ['build'],
    status: 'passed',
    duration: '2m 08s',
    matrixCount: 3,
  },
  {
    id: 'pack',
    name: 'Pack & isolate',
    stage: 'Verify',
    needs: ['build'],
    status: 'passed',
    duration: '14s',
  },
  {
    id: 'publish',
    name: 'Publish release',
    stage: 'Release',
    needs: ['deploy-test', 'e2e', 'pack'],
    status: 'running',
    duration: '18s',
    meta: 'v0.17.0',
  },
]

/** The PipelineGraph example: interactive job dependency DAG with hover path highlighting. */
export function PipelineGraphExample(handle: Handle) {
  let selected = 'e2e'

  return () => (
    <div style={{ width: 'min(100%, 780px)', display: 'grid', gap: '10px' }}>
      <PipelineGraph
        label="Release workflow graph"
        jobs={sampleJobs}
        value={selected}
        onValueChange={(id) => {
          selected = id
          void handle.update()
        }}
        size="compact"
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
        <span style={{ color: 'var(--rf-muted)' }}>Selected job</span>
        <Badge size="compact">{selected}</Badge>
      </div>
    </div>
  )
}
