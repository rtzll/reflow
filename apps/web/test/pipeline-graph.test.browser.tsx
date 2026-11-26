import { PipelineGraph, type PipelineJob } from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'
import { waitFor } from './browser-helpers.ts'

const jobs: PipelineJob[] = [
  { id: 'lint', name: 'Lint & format', stage: 'Check', status: 'passed', duration: '3s' },
  { id: 'typecheck', name: 'Typecheck', stage: 'Check', status: 'passed', duration: '6s' },
  {
    id: 'build',
    name: 'Build packages',
    stage: 'Build',
    needs: ['lint', 'typecheck'],
    status: 'passed',
    duration: '12s',
  },
  {
    id: 'e2e',
    name: 'E2E tests',
    stage: 'Test',
    needs: ['build'],
    status: 'failed',
    duration: '1m 42s',
    matrixCount: 3,
  },
  {
    id: 'publish',
    name: 'Publish npm',
    stage: 'Release',
    needs: ['e2e'],
    status: 'skipped',
  },
]

it('groups jobs into stage columns, measures SVG edges, highlights dependencies, and selects jobs', async (t) => {
  const selected: string[] = []
  const { $, $$, act, cleanup } = render(
    <PipelineGraph
      label="Release pipeline"
      jobs={jobs}
      defaultValue="e2e"
      onValueChange={(id) => selected.push(id)}
    />,
  )
  t.after(cleanup)

  equal($$('.rf-pipeline-stage').length, 4)
  equal($$('.rf-pipeline-node').length, 5)
  await waitFor(() => $$('.rf-pipeline-edge').length === 4, {
    message: 'Expected 4 measured dependency edges',
  })

  // Click build node -> updates selection and highlights connected edges.
  const buildNode = $('[data-pipeline-job="build"]') as HTMLButtonElement
  await act(() => buildNode.click())
  deepEqual(selected, ['build'])
  equal(buildNode.getAttribute('aria-pressed'), 'true')
  ok($$('.rf-pipeline-edge[data-active="true"]').length === 4)
})
