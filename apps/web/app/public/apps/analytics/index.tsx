import type { ExampleApp } from '../types.ts'

export const analyticsApp: ExampleApp = {
  slug: 'analytics',
  name: 'Analytics explorer',
  description: 'Find a spike in activity and inspect the events behind it.',
  components: [
    { slug: 'data-table', name: 'DataTable' },
    { slug: 'date-picker', name: 'DatePicker' },
    { slug: 'tooltip', name: 'Tooltip' },
  ],
}
