import type { ExampleApp } from '../types.ts'
import { WeekView } from './week-view.tsx'

export const calendarApp: ExampleApp = {
  slug: 'calendar',
  name: 'Team calendar',
  description: 'Plan a week, move an event, and adjust its duration.',
  render: () => <WeekView />,
}
