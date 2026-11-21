import type { ExampleApp } from '../types.ts'

export const calendarApp: ExampleApp = {
  slug: 'calendar',
  name: 'Team calendar',
  description: 'Plan a week, move an event, and adjust its duration.',
  components: [
    { slug: 'calendar', name: 'Calendar' },
    { slug: 'date-picker', name: 'DatePicker' },
    { slug: 'popover', name: 'Popover' },
  ],
}
