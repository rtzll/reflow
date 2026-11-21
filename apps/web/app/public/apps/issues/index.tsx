import type { ExampleApp } from '../types.ts'
import { issues } from './fixtures.ts'
import { IssueTracker } from './issue-tracker.tsx'

export const issuesApp: ExampleApp = {
  slug: 'issues',
  name: 'Issue tracker',
  description: 'Organize issues by status and move a selection together.',
  render: () => <IssueTracker initialIssues={issues} />,
}
