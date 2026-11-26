import type { ExampleApp } from '../types.ts'
import { ciHistoryRuns, seedCiRuns } from './fixtures.ts'
import { CiWorkspace } from './workspace.tsx'

export const ciApp: ExampleApp = {
  slug: 'ci',
  name: 'CI Pipelines',
  description: 'Inspect job DAGs, span waterfalls, grouped ANSI logs, test suites, and artifacts.',
  render() {
    return <CiWorkspace runs={seedCiRuns} history={[...ciHistoryRuns]} initialRunId="4577" />
  },
}
