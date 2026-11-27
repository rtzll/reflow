import type { ExampleApp } from '../types.ts'
import { initialApiKeys, initialAuditEvents, initialMembers, initialSettings } from './fixtures.ts'
import { AdminWorkspace } from './workspace.tsx'

export const adminApp: ExampleApp = {
  slug: 'admin',
  name: 'Admin Console',
  description:
    'Manage click-to-reveal API keys, workspace security policies, RBAC roles, and live audit logs.',
  render() {
    return (
      <AdminWorkspace
        initialSettings={initialSettings}
        initialKeys={initialApiKeys}
        initialMembers={initialMembers}
        initialAudit={initialAuditEvents}
      />
    )
  },
}
