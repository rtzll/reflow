import type { ExampleApp } from '../types.ts'
import { pullRequest, reviewFiles, seedActivity, seedChecks, seedThreads } from './fixtures.ts'
import { ReviewWorkspace } from './workspace.tsx'

export const reviewApp: ExampleApp = {
  slug: 'review',
  name: 'Code review',
  description: 'Inspect multi-file diffs, expand context, discuss lines inline, and check CI logs.',
  render(_search, _soundEnabled, prerenderedDiffs) {
    return (
      <ReviewWorkspace
        pullRequest={pullRequest}
        files={[...reviewFiles]}
        initialThreads={seedThreads.map((thread) => ({
          ...thread,
          comments: [...thread.comments],
        }))}
        checks={[...seedChecks]}
        initialActivity={[...seedActivity]}
        prerenderedDiffs={prerenderedDiffs}
      />
    )
  },
}
