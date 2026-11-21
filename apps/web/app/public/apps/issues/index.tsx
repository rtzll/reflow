import type { ExampleApp } from '../types.ts'

export const issuesApp: ExampleApp = {
  slug: 'issues',
  name: 'Issue tracker',
  description: 'Organize issues by status and move a selection together.',
  components: [
    { slug: 'context-menu', name: 'ContextMenu' },
    { slug: 'toolbar', name: 'Toolbar' },
    { slug: 'combobox', name: 'Combobox' },
  ],
}
