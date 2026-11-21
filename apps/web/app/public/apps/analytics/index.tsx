import { routes } from '../../../routes.ts'
import { AnalyticsExplorer } from './explorer.tsx'
import type { ExampleApp } from '../types.ts'

export const analyticsApp: ExampleApp = {
  slug: 'analytics',
  name: 'Analytics explorer',
  description: 'Find a spike in activity and inspect the events behind it.',
  render: (search) => (
    <AnalyticsExplorer path={routes.app.href({ slug: 'analytics' })} search={search} />
  ),
}
