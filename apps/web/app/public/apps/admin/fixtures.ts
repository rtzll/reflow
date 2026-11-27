export type KeyEnv = 'live' | 'test'
export type KeyStatus = 'active' | 'revoked'
export type MemberRole = 'owner' | 'admin' | 'developer' | 'viewer'
export type AuditOutcome = 'success' | 'warning' | 'denied'

export type AuditValue =
  | string
  | number
  | boolean
  | null
  | AuditValue[]
  | { [key: string]: AuditValue }

export interface ApiKeyRecord {
  id: string
  name: string
  env: KeyEnv
  prefix: string
  secret: string
  scopes: string[]
  status: KeyStatus
  createdAt: string
  lastUsedAt: string | null
  expiresLabel: string
  requests24h: number
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: MemberRole
  mfaEnabled: boolean
  lastActiveAt: string
}

export interface AuditEvent {
  id: string
  requestId: string
  timestamp: string
  actor: string
  actorEmail: string
  action: string
  category: 'api_key' | 'settings' | 'member' | 'auth'
  resource: string
  outcome: AuditOutcome
  ip: string
  payload: { [key: string]: AuditValue }
}

export interface WorkspaceSettings {
  name: string
  slug: string
  region: string
  supportEmail: string
  enforceSso: boolean
  requireMfa: boolean
  ipAllowlist: boolean
  siemStream: boolean
  webhookSecret: string
}

export const PINNED_NOW = '2026-11-27T13:30:00Z'

export const initialSettings: WorkspaceSettings = {
  name: 'Northstar Cloud',
  slug: 'northstar-cloud',
  region: 'eu-central',
  supportEmail: 'security@northstar.example',
  enforceSso: true,
  requireMfa: true,
  ipAllowlist: false,
  siemStream: true,
  webhookSecret: 'whsec_7f9c41a8e20b3d559a1e4c80f6b2d914',
}

export const initialApiKeys: ApiKeyRecord[] = [
  {
    id: 'key-prod-deploy',
    name: 'CI Production Deployer',
    env: 'live',
    prefix: 'rf_live_98d4',
    secret: 'rf_live_98d4c1f7e2a0b6c39f2c',
    scopes: ['read:repos', 'write:deployments'],
    status: 'active',
    createdAt: '2026-09-12T08:15:00Z',
    lastUsedAt: '2026-11-27T13:24:00Z',
    expiresLabel: 'Expires in 64d',
    requests24h: 14_820,
  },
  {
    id: 'key-siem-export',
    name: 'Datadog Audit Forwarder',
    env: 'live',
    prefix: 'rf_live_4b2e',
    secret: 'rf_live_4b2e88a1c07d3f91a50b',
    scopes: ['admin:audit'],
    status: 'active',
    createdAt: '2026-10-01T14:40:00Z',
    lastUsedAt: '2026-11-27T13:29:00Z',
    expiresLabel: 'No expiration',
    requests24h: 42_190,
  },
  {
    id: 'key-staging-preview',
    name: 'Staging Preview Worker',
    env: 'test',
    prefix: 'rf_test_1a7c',
    secret: 'rf_test_1a7c5e30d89b4412e6f1',
    scopes: ['read:repos', 'write:deployments'],
    status: 'active',
    createdAt: '2026-11-04T11:05:00Z',
    lastUsedAt: '2026-11-27T11:10:00Z',
    expiresLabel: 'Expires in 18d',
    requests24h: 3_410,
  },
  {
    id: 'key-legacy-cli',
    name: 'Legacy Release CLI',
    env: 'live',
    prefix: 'rf_live_0c5a',
    secret: 'rf_live_0c5a992f1e4b8d10c3e7',
    scopes: ['read:repos'],
    status: 'revoked',
    createdAt: '2026-04-18T09:00:00Z',
    lastUsedAt: '2026-10-29T16:45:00Z',
    expiresLabel: 'Revoked',
    requests24h: 0,
  },
]

export const initialMembers: TeamMember[] = [
  {
    id: 'mem-1',
    name: 'Ada Lovelace',
    email: 'ada@northstar.example',
    role: 'owner',
    mfaEnabled: true,
    lastActiveAt: '2026-11-27T13:28:00Z',
  },
  {
    id: 'mem-2',
    name: 'Noah Kim',
    email: 'noah@northstar.example',
    role: 'admin',
    mfaEnabled: true,
    lastActiveAt: '2026-11-27T13:12:00Z',
  },
  {
    id: 'mem-3',
    name: 'Lin Chen',
    email: 'lin@northstar.example',
    role: 'developer',
    mfaEnabled: true,
    lastActiveAt: '2026-11-27T12:40:00Z',
  },
  {
    id: 'mem-4',
    name: 'Sam Reed',
    email: 'sam@northstar.example',
    role: 'developer',
    mfaEnabled: false,
    lastActiveAt: '2026-11-26T17:15:00Z',
  },
  {
    id: 'mem-5',
    name: 'Mina Ortiz',
    email: 'mina@northstar.example',
    role: 'viewer',
    mfaEnabled: true,
    lastActiveAt: '2026-11-25T10:05:00Z',
  },
]

export const initialAuditEvents: AuditEvent[] = [
  {
    id: 'evt-104',
    requestId: 'req_01JDR8K9M4X2',
    timestamp: '2026-11-27T13:24:00Z',
    actor: 'Ada Lovelace',
    actorEmail: 'ada@northstar.example',
    action: 'api_key.rotated',
    category: 'api_key',
    resource: 'CI Production Deployer (rf_live_98d4)',
    outcome: 'success',
    ip: '198.51.100.42',
    payload: {
      event: 'api_key.rotated',
      keyId: 'key-prod-deploy',
      previousPrefix: 'rf_live_71a9',
      newPrefix: 'rf_live_98d4',
      scopes: ['read:repos', 'write:deployments'],
      mfaVerified: true,
    },
  },
  {
    id: 'evt-103',
    requestId: 'req_01JDR7P2W8N1',
    timestamp: '2026-11-27T12:52:00Z',
    actor: 'Noah Kim',
    actorEmail: 'noah@northstar.example',
    action: 'settings.sso_enforced',
    category: 'settings',
    resource: 'Workspace security policy',
    outcome: 'success',
    ip: '203.0.113.19',
    payload: {
      event: 'settings.sso_enforced',
      diff: { enforceSso: { before: false, after: true } },
      provider: 'Okta SAML 2.0',
    },
  },
  {
    id: 'evt-102',
    requestId: 'req_01JDR6C7Q5T0',
    timestamp: '2026-11-27T11:30:00Z',
    actor: 'Sam Reed',
    actorEmail: 'sam@northstar.example',
    action: 'auth.mfa_challenge_denied',
    category: 'auth',
    resource: 'Production key access',
    outcome: 'denied',
    ip: '192.0.2.88',
    payload: {
      event: 'auth.mfa_challenge_denied',
      reason: 'hardware_key_not_enrolled',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_2)',
    },
  },
  {
    id: 'evt-101',
    requestId: 'req_01JDR4H1B9K3',
    timestamp: '2026-11-27T09:15:00Z',
    actor: 'Ada Lovelace',
    actorEmail: 'ada@northstar.example',
    action: 'api_key.revoked',
    category: 'api_key',
    resource: 'Legacy Release CLI (rf_live_0c5a)',
    outcome: 'warning',
    ip: '198.51.100.42',
    payload: {
      event: 'api_key.revoked',
      keyId: 'key-legacy-cli',
      reason: 'Unused for 30 days',
    },
  },
  {
    id: 'evt-100',
    requestId: 'req_01JDR2A8V6Y7',
    timestamp: '2026-11-26T16:20:00Z',
    actor: 'Noah Kim',
    actorEmail: 'noah@northstar.example',
    action: 'member.role_changed',
    category: 'member',
    resource: 'Lin Chen (viewer → developer)',
    outcome: 'success',
    ip: '203.0.113.19',
    payload: {
      event: 'member.role_changed',
      memberId: 'mem-3',
      diff: { role: { before: 'viewer', after: 'developer' } },
    },
  },
]

export const requestVolumeSeries = [38, 44, 49, 46, 54, 62, 58, 66, 61, 68, 60, 64]

export const requestVolumeLabels = [
  '02:00',
  '04:00',
  '06:00',
  '08:00',
  '10:00',
  '12:00',
  '14:00',
  '16:00',
  '18:00',
  '20:00',
  '22:00',
  '00:00',
]

export function maskSecret(secret: string): string {
  const prefix = secret.slice(0, 8)
  const suffix = secret.slice(-4)
  return `${prefix}••••••••••••${suffix}`
}
