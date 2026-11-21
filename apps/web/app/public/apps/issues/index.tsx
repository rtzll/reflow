import type { ExampleApp } from '../types.ts'
import { issues } from './fixtures.ts'
import { IssueTracker } from './issue-tracker.tsx'

export const issuesApp: ExampleApp = {
  slug: 'issues',
  name: 'Issue tracker',
  description: 'Track cycle progress and team workload, then manage issues on a board or list.',
  render: () => <IssueTracker initialIssues={issues} />,
}
