import {
  AlertDialog,
  Avatar,
  Badge,
  Banner,
  BannerDescription,
  BannerTitle,
  Button,
  CheckboxGroup,
  CommandMenu,
  CopyChip,
  Dialog,
  EmptyState,
  Field,
  FieldSet,
  FilterBar,
  Icon,
  InlineEdit,
  Input,
  InputCopy,
  Kbd,
  MetadataList,
  MetricCard,
  ObjectInspector,
  RelativeTime,
  SegmentedControl,
  Select,
  Switch,
  Tabs,
  Timeline,
  Toaster,
  parseFacetQuery,
  toast,
  type BadgeColor,
} from '@rtzll/reflow'
import { clientEntry, on, type Handle } from 'remix/component'
import { playCopyError, playCopySuccess } from '../../showcase-sound.ts'
import {
  PINNED_NOW,
  maskSecret,
  requestVolumeLabels,
  requestVolumeSeries,
  type ApiKeyRecord,
  type AuditEvent,
  type AuditOutcome,
  type KeyEnv,
  type MemberRole,
  type TeamMember,
  type WorkspaceSettings,
} from './fixtures.ts'

export interface AdminWorkspaceProps {
  initialSettings: WorkspaceSettings
  initialKeys: ApiKeyRecord[]
  initialMembers: TeamMember[]
  initialAudit: AuditEvent[]
}

const availableScopes = [
  { value: 'read:repos', label: 'read:repos', description: 'Read repositories and metadata' },
  {
    value: 'write:deployments',
    label: 'write:deployments',
    description: 'Trigger and promote deployments',
  },
  { value: 'admin:audit', label: 'admin:audit', description: 'Stream and export audit logs' },
] as const

const roleOptions = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'developer', label: 'Developer' },
  { value: 'viewer', label: 'Viewer' },
] as const

const regionOptions = [
  { value: 'eu-central', label: 'EU Central (Frankfurt)' },
  { value: 'us-east', label: 'US East (Virginia)' },
  { value: 'ap-south', label: 'AP South (Singapore)' },
] as const

const expiryOptions = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: '1 year' },
  { value: 'never', label: 'No expiration' },
] as const

function outcomeColor(outcome: AuditOutcome): BadgeColor {
  if (outcome === 'denied') return 'red'
  if (outcome === 'warning') return 'amber'
  return 'green'
}

function roleColor(role: MemberRole): BadgeColor {
  if (role === 'owner') return 'violet'
  if (role === 'admin') return 'blue'
  if (role === 'developer') return 'green'
  return 'gray'
}

export const AdminWorkspace = clientEntry(
  import.meta.url,
  function AdminWorkspace(handle: Handle<AdminWorkspaceProps>) {
    let activeTab: 'keys' | 'settings' | 'team' | 'audit' = 'keys'
    let settings: WorkspaceSettings = { ...handle.props.initialSettings }
    let savedSettings: WorkspaceSettings = { ...handle.props.initialSettings }
    let keys: ApiKeyRecord[] = [...handle.props.initialKeys]
    let members: TeamMember[] = [...handle.props.initialMembers]
    let audit: AuditEvent[] = [...handle.props.initialAudit]

    let revealedKeys = new Set<string>()
    let freshSecret: { name: string; secret: string; action: 'created' | 'rotated' } | null = null

    let keyQuery = ''
    let teamQuery = ''
    let auditQuery = ''
    let selectedAuditId = audit[0]?.id ?? ''

    // Create key dialog state
    let createKeyOpen = false
    let newKeyName = ''
    let newKeyEnv: KeyEnv = 'live'
    let newKeyScopes: string[] = ['read:repos', 'write:deployments']
    let newKeyExpiry = '90d'
    let newKeyError = ''

    // Invite member dialog state
    let inviteOpen = false
    let inviteName = ''
    let inviteEmail = ''
    let inviteRole: MemberRole = 'developer'
    let inviteError = ''

    let sequence = 105

    function recordAudit(
      entry: Omit<AuditEvent, 'id' | 'requestId' | 'timestamp' | 'actor' | 'actorEmail' | 'ip'>,
    ) {
      const id = `evt-${sequence++}`
      const next: AuditEvent = {
        id,
        requestId: `req_01JDR${sequence}Z8Q`,
        timestamp: PINNED_NOW,
        actor: 'Ada Lovelace',
        actorEmail: 'ada@northstar.example',
        ip: '198.51.100.42',
        ...entry,
      }
      audit = [next, ...audit]
      selectedAuditId = id
    }

    function mintSecret(env: KeyEnv): { prefix: string; secret: string } {
      const hex = `${sequence.toString(16).padStart(4, '0')}a7f3e19c4d2b${((sequence * 17) % 9999)
        .toString(16)
        .padStart(4, '0')}`
      const secret = `rf_${env}_${hex}`
      return { prefix: secret.slice(0, 12), secret }
    }

    function toggleRevealKey(record: ApiKeyRecord) {
      if (record.status === 'revoked') return
      const next = new Set(revealedKeys)
      if (next.has(record.id)) {
        next.delete(record.id)
      } else {
        next.add(record.id)
        recordAudit({
          action: 'api_key.revealed',
          category: 'api_key',
          resource: `${record.name} (${record.prefix})`,
          outcome: 'warning',
          payload: {
            event: 'api_key.revealed',
            keyId: record.id,
            prefix: record.prefix,
            mfaVerified: true,
          },
        })
      }
      revealedKeys = next
      void handle.update()
    }

    function rotateKey(record: ApiKeyRecord) {
      const { prefix, secret } = mintSecret(record.env)
      const previousPrefix = record.prefix
      keys = keys.map((item) =>
        item.id === record.id ? { ...item, prefix, secret, lastUsedAt: PINNED_NOW } : item,
      )
      revealedKeys = new Set([...revealedKeys, record.id])
      freshSecret = { name: record.name, secret, action: 'rotated' }
      recordAudit({
        action: 'api_key.rotated',
        category: 'api_key',
        resource: `${record.name} (${prefix})`,
        outcome: 'success',
        payload: {
          event: 'api_key.rotated',
          keyId: record.id,
          previousPrefix,
          newPrefix: prefix,
        },
      })
      toast.success(`Rotated ${record.name}`, {
        description: 'Copy the new secret before leaving this page.',
      })
      void handle.update()
    }

    function revokeKey(record: ApiKeyRecord) {
      keys = keys.map((item) =>
        item.id === record.id
          ? { ...item, status: 'revoked', expiresLabel: 'Revoked', requests24h: 0 }
          : item,
      )
      if (revealedKeys.has(record.id)) {
        const next = new Set(revealedKeys)
        next.delete(record.id)
        revealedKeys = next
      }
      recordAudit({
        action: 'api_key.revoked',
        category: 'api_key',
        resource: `${record.name} (${record.prefix})`,
        outcome: 'warning',
        payload: {
          event: 'api_key.revoked',
          keyId: record.id,
          prefix: record.prefix,
        },
      })
      toast.warning(`Revoked ${record.name}`, {
        description: 'Requests signed with this key are now rejected.',
      })
      void handle.update()
    }

    function submitCreateKey(event: SubmitEvent) {
      event.preventDefault()
      const trimmed = newKeyName.trim()
      if (!trimmed) {
        newKeyError = 'Give the API key a descriptive name.'
        void handle.update()
        return
      }
      const { prefix, secret } = mintSecret(newKeyEnv)
      const expiresLabel =
        newKeyExpiry === 'never'
          ? 'No expiration'
          : `Expires in ${newKeyExpiry === '1y' ? '365d' : newKeyExpiry}`
      const created: ApiKeyRecord = {
        id: `key-${sequence}`,
        name: trimmed,
        env: newKeyEnv,
        prefix,
        secret,
        scopes: newKeyScopes.length > 0 ? [...newKeyScopes] : ['read:repos'],
        status: 'active',
        createdAt: PINNED_NOW,
        lastUsedAt: null,
        expiresLabel,
        requests24h: 0,
      }
      keys = [created, ...keys]
      revealedKeys = new Set([...revealedKeys, created.id])
      freshSecret = { name: created.name, secret, action: 'created' }
      recordAudit({
        action: 'api_key.created',
        category: 'api_key',
        resource: `${created.name} (${prefix})`,
        outcome: 'success',
        payload: {
          event: 'api_key.created',
          keyId: created.id,
          env: created.env,
          scopes: created.scopes,
          expires: newKeyExpiry,
        },
      })
      createKeyOpen = false
      newKeyName = ''
      newKeyError = ''
      activeTab = 'keys'
      toast.success(`Created ${created.name}`, {
        description: 'Key is active immediately and logged to the audit stream.',
      })
      void handle.update()
    }

    function submitInvite(event: SubmitEvent) {
      event.preventDefault()
      const name = inviteName.trim()
      const email = inviteEmail.trim().toLowerCase()
      if (!name || !email.includes('@')) {
        inviteError = 'Enter a full name and valid email address.'
        void handle.update()
        return
      }
      const member: TeamMember = {
        id: `mem-${sequence}`,
        name,
        email,
        role: inviteRole,
        mfaEnabled: false,
        lastActiveAt: PINNED_NOW,
      }
      members = [member, ...members]
      recordAudit({
        action: 'member.invited',
        category: 'member',
        resource: `${member.name} (${member.role})`,
        outcome: 'success',
        payload: {
          event: 'member.invited',
          email: member.email,
          role: member.role,
        },
      })
      inviteOpen = false
      inviteName = ''
      inviteEmail = ''
      inviteError = ''
      toast.success(`Invited ${member.name}`, { description: `${member.email} · ${member.role}` })
      void handle.update()
    }

    function updateMemberRole(member: TeamMember, nextRole: MemberRole) {
      if (member.role === nextRole) return
      const previousRole = member.role
      members = members.map((item) => (item.id === member.id ? { ...item, role: nextRole } : item))
      recordAudit({
        action: 'member.role_changed',
        category: 'member',
        resource: `${member.name} (${previousRole} → ${nextRole})`,
        outcome: 'success',
        payload: {
          event: 'member.role_changed',
          memberId: member.id,
          diff: { role: { before: previousRole, after: nextRole } },
        },
      })
      toast.success(`Updated ${member.name} to ${nextRole}`)
      void handle.update()
    }

    function saveWorkspaceSettings(event: SubmitEvent) {
      event.preventDefault()
      const diff: { [key: string]: { before: string | boolean; after: string | boolean } } = {}
      for (const field of [
        'name',
        'slug',
        'region',
        'supportEmail',
        'enforceSso',
        'requireMfa',
        'ipAllowlist',
        'siemStream',
      ] as const) {
        if (settings[field] !== savedSettings[field]) {
          diff[field] = { before: savedSettings[field], after: settings[field] }
        }
      }
      savedSettings = { ...settings }
      recordAudit({
        action: 'workspace.settings_updated',
        category: 'settings',
        resource: settings.name,
        outcome: 'success',
        payload: { event: 'workspace.settings_updated', diff },
      })
      toast.success('Workspace settings saved', {
        description: 'Changes recorded in the audit log.',
      })
      void handle.update()
    }

    return () => {
      const settingsDirty =
        settings.name !== savedSettings.name ||
        settings.slug !== savedSettings.slug ||
        settings.region !== savedSettings.region ||
        settings.supportEmail !== savedSettings.supportEmail ||
        settings.enforceSso !== savedSettings.enforceSso ||
        settings.requireMfa !== savedSettings.requireMfa ||
        settings.ipAllowlist !== savedSettings.ipAllowlist ||
        settings.siemStream !== savedSettings.siemStream

      const activeKeyCount = keys.filter((k) => k.status === 'active').length
      const totalRequests = keys.reduce((sum, k) => sum + k.requests24h, 0)
      const mfaCount = members.filter((m) => m.mfaEnabled).length
      const mfaPct = members.length ? Math.round((mfaCount / members.length) * 100) : 100

      // Filtered API keys
      const parsedKeys = parseFacetQuery(keyQuery)
      const visibleKeys = keys.filter((record) => {
        for (const token of parsedKeys.facets) {
          if (token.key === 'status' && record.status !== token.value) return false
          if (token.key === 'env' && record.env !== token.value) return false
          if (token.key === 'scope' && !record.scopes.some((s) => s.includes(token.value)))
            return false
        }
        if (parsedKeys.freeText) {
          const hay =
            `${record.name} ${record.prefix} ${record.scopes.join(' ')} ${record.env}`.toLowerCase()
          if (!hay.includes(parsedKeys.freeText.toLowerCase())) return false
        }
        return true
      })

      // Filtered Team members
      const parsedTeam = parseFacetQuery(teamQuery)
      const visibleMembers = members.filter((member) => {
        for (const token of parsedTeam.facets) {
          if (token.key === 'role' && member.role !== token.value) return false
          if (token.key === 'mfa') {
            const want = token.value === 'on' || token.value === 'true'
            if (member.mfaEnabled !== want) return false
          }
        }
        if (parsedTeam.freeText) {
          const hay = `${member.name} ${member.email} ${member.role}`.toLowerCase()
          if (!hay.includes(parsedTeam.freeText.toLowerCase())) return false
        }
        return true
      })

      // Filtered Audit log
      const parsedAudit = parseFacetQuery(auditQuery)
      const visibleAudit = audit.filter((item) => {
        for (const token of parsedAudit.facets) {
          if (token.key === 'category' && item.category !== token.value) return false
          if (token.key === 'outcome' && item.outcome !== token.value) return false
          if (token.key === 'actor' && !item.actor.toLowerCase().includes(token.value)) return false
        }
        if (parsedAudit.freeText) {
          const hay =
            `${item.action} ${item.actor} ${item.resource} ${item.requestId}`.toLowerCase()
          if (!hay.includes(parsedAudit.freeText.toLowerCase())) return false
        }
        return true
      })
      const selectedAudit =
        visibleAudit.find((entry) => entry.id === selectedAuditId) ?? visibleAudit[0]

      const commandItems = [
        {
          value: 'action:create-key',
          label: 'Create API key',
          group: 'Actions',
          icon: <Icon name="plus" size={14} />,
        },
        {
          value: 'action:invite',
          label: 'Invite team member',
          group: 'Actions',
          icon: <Icon name="users" size={14} />,
        },
        { value: 'tab:keys', label: 'Go to API keys', group: 'Sections' },
        { value: 'tab:settings', label: 'Go to Workspace settings', group: 'Sections' },
        { value: 'tab:team', label: 'Go to Team & access', group: 'Sections' },
        { value: 'tab:audit', label: 'Go to Audit log', group: 'Sections' },
      ]

      const keysPanel = (
        <div class="admin-panel-stack">
          {freshSecret && (
            <Banner
              status="warning"
              dismissible
              onDismiss={() => {
                freshSecret = null
                void handle.update()
              }}
            >
              <BannerTitle>{`Secret ${freshSecret.action} for ${freshSecret.name}`}</BannerTitle>
              <BannerDescription>
                Store this secret in your password manager or CI secrets now.
              </BannerDescription>
              <div class="admin-fresh-secret">
                <InputCopy
                  aria-label="Newly generated API secret"
                  value={freshSecret.secret}
                  size="compact"
                  onCopy={playCopySuccess}
                />
              </div>
            </Banner>
          )}

          <div class="admin-toolbar-row">
            <FilterBar
              label="Filter API keys"
              size="compact"
              placeholder="Filter keys (e.g. status:active env:live)…"
              value={keyQuery}
              onValueChange={(next) => {
                keyQuery = next
                void handle.update()
              }}
              suggestions={[
                { key: 'status', values: ['active', 'revoked'] },
                { key: 'env', values: ['live', 'test'] },
                { key: 'scope', values: ['read:repos', 'write:deployments', 'admin:audit'] },
              ]}
              presets={[
                { id: 'active', label: 'Active', query: 'status:active' },
                { id: 'live', label: 'Production', query: 'env:live status:active' },
                { id: 'revoked', label: 'Revoked', query: 'status:revoked' },
              ]}
            />
            <Button
              size="compact"
              mix={on('click', () => {
                createKeyOpen = true
                void handle.update()
              })}
            >
              <Icon name="plus" size={14} />
              Create API key
            </Button>
          </div>

          {visibleKeys.length === 0 ? (
            <EmptyState
              title="No API keys match this filter"
              description="Clear the search filter or create a new API key."
              actions={
                <Button
                  size="compact"
                  variant="secondary"
                  mix={on('click', () => {
                    keyQuery = ''
                    void handle.update()
                  })}
                >
                  Clear filter
                </Button>
              }
            />
          ) : (
            <ul class="admin-key-list" aria-label="API keys">
              {visibleKeys.map((record) => {
                const isRevealed = revealedKeys.has(record.id) && record.status === 'active'
                const displayedSecret = isRevealed ? record.secret : maskSecret(record.secret)
                return (
                  <li
                    key={record.id}
                    class="admin-key-card"
                    data-key-id={record.id}
                    data-status={record.status}
                  >
                    <div class="admin-key-main">
                      <div class="admin-key-title-row">
                        <strong>{record.name}</strong>
                        <Badge size="compact" color={record.env === 'live' ? 'blue' : 'amber'}>
                          {record.env === 'live' ? 'Production' : 'Staging'}
                        </Badge>
                        <Badge
                          size="compact"
                          variant="dot"
                          color={record.status === 'active' ? 'green' : 'gray'}
                        >
                          {record.status === 'active' ? 'Active' : 'Revoked'}
                        </Badge>
                      </div>
                      <div class="admin-key-secret-row">
                        <code
                          class="admin-secret-value"
                          data-revealed={isRevealed ? 'true' : 'false'}
                        >
                          {displayedSecret}
                        </code>
                        {record.status === 'active' && (
                          <>
                            <Button
                              size="compact"
                              variant="ghost"
                              aria-pressed={isRevealed}
                              aria-label={
                                isRevealed
                                  ? `Hide secret for ${record.name}`
                                  : `Reveal secret for ${record.name}`
                              }
                              mix={on('click', () => toggleRevealKey(record))}
                            >
                              <Icon name={isRevealed ? 'lock' : 'shield'} size={14} />
                              {isRevealed ? 'Hide' : 'Reveal'}
                            </Button>
                            <CopyChip
                              value={record.secret}
                              display="Copy secret"
                              size="compact"
                              onCopy={playCopySuccess}
                              onCopyError={playCopyError}
                            />
                          </>
                        )}
                      </div>
                      <div class="admin-key-meta">
                        <span class="admin-key-scopes">
                          {record.scopes.map((scope) => (
                            <Badge key={scope} size="compact" color="gray">
                              {scope}
                            </Badge>
                          ))}
                        </span>
                        <span class="admin-meta-sep">·</span>
                        <span>
                          Last used{' '}
                          {record.lastUsedAt ? (
                            <RelativeTime date={record.lastUsedAt} now={PINNED_NOW} />
                          ) : (
                            'never'
                          )}
                        </span>
                        <span class="admin-meta-sep">·</span>
                        <span>{record.expiresLabel}</span>
                        {record.status === 'active' && (
                          <>
                            <span class="admin-meta-sep">·</span>
                            <span>{record.requests24h.toLocaleString('en-US')} req / 24h</span>
                          </>
                        )}
                      </div>
                    </div>
                    {record.status === 'active' && (
                      <div class="admin-key-actions">
                        <AlertDialog
                          trigger="Rotate"
                          triggerVariant="secondary"
                          triggerSize="compact"
                          title={`Rotate ${record.name}?`}
                          description="A new secret will be generated immediately. Existing callers using the old token will fail until updated."
                          confirmLabel="Rotate key"
                          confirmVariant="primary"
                          onConfirm={() => rotateKey(record)}
                        />
                        <AlertDialog
                          trigger="Revoke"
                          triggerVariant="ghost"
                          triggerSize="compact"
                          title={`Revoke ${record.name}?`}
                          description="This permanently invalidates the token. Any CI workflow or service using it will lose access immediately."
                          confirmLabel="Revoke key"
                          confirmVariant="destructive"
                          onConfirm={() => revokeKey(record)}
                        />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )

      const settingsPanel = (
        <form
          class="admin-settings-form"
          mix={on<HTMLFormElement, 'submit'>('submit', saveWorkspaceSettings)}
        >
          {settingsDirty && (
            <Banner status="info">
              <BannerTitle>Unsaved workspace changes</BannerTitle>
              <BannerDescription>
                Review your security and residency settings before saving.
              </BannerDescription>
            </Banner>
          )}
          <div class="admin-settings-grid">
            <section class="admin-card-section" aria-labelledby="admin-general-heading">
              <h2 id="admin-general-heading">General & residency</h2>
              <FieldSet>
                <Field label="Workspace name" description="Shown in SSO prompts and audit exports.">
                  {(control) => (
                    <Input
                      {...control}
                      name="workspaceName"
                      value={settings.name}
                      mix={on<HTMLInputElement, 'input'>('input', (event) => {
                        settings = { ...settings, name: event.currentTarget.value }
                        void handle.update()
                      })}
                    />
                  )}
                </Field>
                <Field label="Workspace slug">
                  {(control) => (
                    <Input
                      {...control}
                      name="workspaceSlug"
                      value={settings.slug}
                      mix={on<HTMLInputElement, 'input'>('input', (event) => {
                        settings = { ...settings, slug: event.currentTarget.value }
                        void handle.update()
                      })}
                    />
                  )}
                </Field>
                <Field label="Primary data region">
                  {(control) => (
                    <Select
                      {...control}
                      name="region"
                      label="Primary data region"
                      value={settings.region}
                      options={[...regionOptions]}
                      onValueChange={(value) => {
                        if (value) {
                          settings = { ...settings, region: value }
                          void handle.update()
                        }
                      }}
                    />
                  )}
                </Field>
                <Field label="Security contact email">
                  {(control) => (
                    <Input
                      {...control}
                      name="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      mix={on<HTMLInputElement, 'input'>('input', (event) => {
                        settings = { ...settings, supportEmail: event.currentTarget.value }
                        void handle.update()
                      })}
                    />
                  )}
                </Field>
              </FieldSet>
            </section>

            <section class="admin-card-section" aria-labelledby="admin-security-heading">
              <h2 id="admin-security-heading">Authentication & webhooks</h2>
              <div class="admin-switch-list">
                <Switch
                  name="enforceSso"
                  label="Enforce SAML SSO for all members"
                  checked={settings.enforceSso}
                  onCheckedChange={(checked) => {
                    settings = { ...settings, enforceSso: checked }
                    void handle.update()
                  }}
                />
                <Switch
                  name="requireMfa"
                  label="Require hardware or TOTP MFA"
                  checked={settings.requireMfa}
                  onCheckedChange={(checked) => {
                    settings = { ...settings, requireMfa: checked }
                    void handle.update()
                  }}
                />
                <Switch
                  name="ipAllowlist"
                  label="Restrict API keys to corporate IP allowlist"
                  checked={settings.ipAllowlist}
                  onCheckedChange={(checked) => {
                    settings = { ...settings, ipAllowlist: checked }
                    void handle.update()
                  }}
                />
                <Switch
                  name="siemStream"
                  label="Stream audit events to SIEM webhook"
                  checked={settings.siemStream}
                  onCheckedChange={(checked) => {
                    settings = { ...settings, siemStream: checked }
                    void handle.update()
                  }}
                />
              </div>

              <div class="admin-webhook-secret">
                <InputCopy
                  label="Webhook signing secret"
                  value={settings.webhookSecret}
                  masked
                  size="compact"
                  onCopy={playCopySuccess}
                />
              </div>
            </section>
          </div>

          <div class="admin-form-actions">
            <Button
              type="button"
              variant="secondary"
              disabled={!settingsDirty}
              mix={on('click', () => {
                settings = { ...savedSettings }
                void handle.update()
              })}
            >
              Reset
            </Button>
            <Button type="submit" disabled={!settingsDirty}>
              Save changes
            </Button>
          </div>
        </form>
      )

      const teamPanel = (
        <div class="admin-panel-stack">
          <div class="admin-toolbar-row">
            <FilterBar
              label="Filter team members"
              size="compact"
              placeholder="Filter members (e.g. role:admin mfa:off)…"
              value={teamQuery}
              onValueChange={(next) => {
                teamQuery = next
                void handle.update()
              }}
              suggestions={[
                { key: 'role', values: ['owner', 'admin', 'developer', 'viewer'] },
                { key: 'mfa', values: ['on', 'off'] },
              ]}
              presets={[
                { id: 'admins', label: 'Admins', query: 'role:admin' },
                { id: 'no-mfa', label: 'Missing MFA', query: 'mfa:off' },
              ]}
            />
            <Button
              size="compact"
              mix={on('click', () => {
                inviteOpen = true
                void handle.update()
              })}
            >
              <Icon name="plus" size={14} />
              Invite member
            </Button>
          </div>

          {visibleMembers.length === 0 ? (
            <EmptyState
              title="No members match this filter"
              description="Try clearing the role or MFA filter."
              actions={
                <Button
                  size="compact"
                  variant="secondary"
                  mix={on('click', () => {
                    teamQuery = ''
                    void handle.update()
                  })}
                >
                  Clear filter
                </Button>
              }
            />
          ) : (
            <ul class="admin-member-list" aria-label="Workspace members">
              {visibleMembers.map((member) => (
                <li key={member.id} class="admin-member-row" data-member-id={member.id}>
                  <div class="admin-member-identity">
                    <Avatar name={member.name} size={30} />
                    <div>
                      <strong>{member.name}</strong>
                      <div class="admin-member-email">{member.email}</div>
                    </div>
                  </div>
                  <div class="admin-member-controls">
                    <Badge
                      size="compact"
                      variant="dot"
                      color={member.mfaEnabled ? 'green' : 'amber'}
                    >
                      {member.mfaEnabled ? 'MFA verified' : 'MFA pending'}
                    </Badge>
                    <Badge size="compact" color={roleColor(member.role)}>
                      {member.role}
                    </Badge>
                    <span class="admin-member-seen">
                      <RelativeTime date={member.lastActiveAt} now={PINNED_NOW} />
                    </span>
                    <Select
                      label={`Role for ${member.name}`}
                      size="compact"
                      value={member.role}
                      options={[...roleOptions]}
                      onValueChange={(value) => {
                        if (
                          value === 'owner' ||
                          value === 'admin' ||
                          value === 'developer' ||
                          value === 'viewer'
                        ) {
                          updateMemberRole(member, value)
                        }
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )

      const auditPanel = (
        <div class="admin-panel-stack">
          <FilterBar
            label="Filter audit log"
            size="compact"
            placeholder="Filter audit events (e.g. category:api_key outcome:denied)…"
            value={auditQuery}
            onValueChange={(next) => {
              auditQuery = next
              void handle.update()
            }}
            suggestions={[
              { key: 'category', values: ['api_key', 'settings', 'member', 'auth'] },
              { key: 'outcome', values: ['success', 'warning', 'denied'] },
              { key: 'actor', values: ['ada', 'noah', 'sam'] },
            ]}
            presets={[
              { id: 'keys', label: 'Key events', query: 'category:api_key' },
              { id: 'denied', label: 'Denied', query: 'outcome:denied' },
              { id: 'warnings', label: 'Warnings', query: 'outcome:warning' },
            ]}
          />

          {visibleAudit.length === 0 ? (
            <EmptyState
              title="No matching audit events"
              description="Adjust your query to inspect earlier workspace activity."
              actions={
                <Button
                  size="compact"
                  variant="secondary"
                  mix={on('click', () => {
                    auditQuery = ''
                    void handle.update()
                  })}
                >
                  Clear filter
                </Button>
              }
            />
          ) : (
            <div class="admin-audit-split">
              <ul class="admin-audit-list" aria-label="Audit events">
                {visibleAudit.map((entry) => {
                  const active = selectedAudit?.id === entry.id
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        class="admin-audit-item"
                        aria-current={active ? 'true' : undefined}
                        mix={on('click', () => {
                          selectedAuditId = entry.id
                          void handle.update()
                        })}
                      >
                        <div class="admin-audit-item-top">
                          <code>{entry.action}</code>
                          <Badge size="compact" color={outcomeColor(entry.outcome)}>
                            {entry.outcome}
                          </Badge>
                        </div>
                        <div class="admin-audit-item-resource">{entry.resource}</div>
                        <div class="admin-audit-item-meta">
                          <span>{entry.actor}</span>
                          <span>·</span>
                          <RelativeTime date={entry.timestamp} now={PINNED_NOW} />
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {selectedAudit && (
                <aside class="admin-audit-detail" aria-label="Selected audit event details">
                  <div class="admin-audit-detail-head">
                    <h3>{selectedAudit.action}</h3>
                    <Badge color={outcomeColor(selectedAudit.outcome)} size="compact">
                      {selectedAudit.outcome}
                    </Badge>
                  </div>
                  <MetadataList
                    orientation="inline"
                    size="compact"
                    items={[
                      {
                        id: 'req',
                        label: 'Request ID',
                        value: (
                          <CopyChip
                            value={selectedAudit.requestId}
                            size="compact"
                            onCopy={playCopySuccess}
                            onCopyError={playCopyError}
                          />
                        ),
                      },
                      { id: 'actor', label: 'Actor', value: selectedAudit.actorEmail },
                      { id: 'ip', label: 'Source IP', value: <code>{selectedAudit.ip}</code> },
                    ]}
                  />
                  <ObjectInspector
                    name="payload"
                    data={selectedAudit.payload}
                    expandLevel={2}
                    size="compact"
                  />
                  <div class="admin-audit-timeline">
                    <h4>Recent security timeline</h4>
                    <Timeline
                      size="compact"
                      items={audit.slice(0, 4).map((entry) => ({
                        id: entry.id,
                        title: entry.action,
                        description: entry.resource,
                        timestamp: entry.actor,
                        tone:
                          entry.outcome === 'denied'
                            ? 'danger'
                            : entry.outcome === 'warning'
                              ? 'warning'
                              : 'success',
                      }))}
                    />
                  </div>
                </aside>
              )}
            </div>
          )}
        </div>
      )

      return (
        <div class="admin-console" data-admin-ready="">
          <header class="admin-header">
            <div class="admin-header-title">
              <div class="admin-title-row">
                <InlineEdit
                  label="Workspace name"
                  value={settings.name}
                  onCommit={(next) => {
                    const trimmed = next.trim()
                    if (!trimmed || trimmed === settings.name) return
                    const previous = settings.name
                    settings = { ...settings, name: trimmed }
                    savedSettings = { ...savedSettings, name: trimmed }
                    recordAudit({
                      action: 'workspace.renamed',
                      category: 'settings',
                      resource: `${previous} → ${trimmed}`,
                      outcome: 'success',
                      payload: {
                        event: 'workspace.renamed',
                        diff: { name: { before: previous, after: trimmed } },
                      },
                    })
                    toast.success(`Renamed workspace to ${trimmed}`)
                    void handle.update()
                  }}
                />
                <Badge color="blue" size="compact">
                  Enterprise
                </Badge>
              </div>
              <p class="admin-subtitle">
                Manage API secrets, workspace security policies, RBAC roles, and live audit events.
              </p>
            </div>
            <div class="admin-header-actions">
              <CommandMenu
                label="Admin quick actions"
                placeholder="Jump to section or run an action…"
                shortcut="mod+k"
                items={commandItems}
                triggerSize="compact"
                trigger={
                  <span class="admin-cmd-trigger">
                    <span>Quick jump</span>
                    <Kbd size="compact" variant="outline" keys="mod+k" />
                  </span>
                }
                onSelect={(value) => {
                  if (value === 'action:create-key') createKeyOpen = true
                  else if (value === 'action:invite') inviteOpen = true
                  else if (value.startsWith('tab:')) {
                    const tab = value.slice(4)
                    if (tab === 'keys' || tab === 'settings' || tab === 'team' || tab === 'audit') {
                      activeTab = tab
                    }
                  }
                  void handle.update()
                }}
              />
            </div>
          </header>

          <section class="admin-metrics" aria-label="Security overview">
            <MetricCard
              label="Active API keys"
              value={String(activeKeyCount)}
              detail={`${keys.length - activeKeyCount} revoked`}
              size="compact"
            />
            <MetricCard
              label="API requests (24h)"
              value={totalRequests.toLocaleString('en-US')}
              delta="+8.4% vs 7d"
              deltaTone="positive"
              size="compact"
              sparkline={{
                values: requestVolumeSeries,
                labels: requestVolumeLabels,
                tone: 'accent',
                width: 80,
                height: 24,
                interactive: true,
              }}
            />
            <MetricCard
              label="MFA adoption"
              value={`${mfaPct}%`}
              detail={`${mfaCount} of ${members.length} verified`}
              deltaTone={mfaPct === 100 ? 'positive' : 'neutral'}
              size="compact"
            />
            <MetricCard
              label="Audit events"
              value={String(audit.length)}
              detail={`${audit.filter((e) => e.outcome === 'denied').length} denied`}
              size="compact"
            />
          </section>

          <Tabs
            label="Admin console sections"
            value={activeTab}
            onValueChange={(value) => {
              if (
                value === 'keys' ||
                value === 'settings' ||
                value === 'team' ||
                value === 'audit'
              ) {
                activeTab = value
                void handle.update()
              }
            }}
            items={[
              { value: 'keys', label: `API keys (${activeKeyCount})`, panel: keysPanel },
              { value: 'settings', label: 'Settings', panel: settingsPanel },
              { value: 'team', label: `Team & access (${members.length})`, panel: teamPanel },
              { value: 'audit', label: `Audit log (${audit.length})`, panel: auditPanel },
            ]}
          />

          <Dialog
            title="Create API key"
            description="Secrets are scoped to least-privilege permissions and logged immediately."
            open={createKeyOpen}
            onOpenChange={(open) => {
              createKeyOpen = open
              if (!open) newKeyError = ''
              void handle.update()
            }}
          >
            <form
              class="admin-dialog-form"
              noValidate
              mix={on<HTMLFormElement, 'submit'>('submit', submitCreateKey)}
            >
              <Field label="Key name" error={newKeyError || undefined}>
                {(control) => (
                  <Input
                    {...control}
                    name="keyName"
                    placeholder="e.g. Preview Worker"
                    value={newKeyName}
                    mix={on<HTMLInputElement, 'input'>('input', (event) => {
                      newKeyName = event.currentTarget.value
                      if (newKeyError) newKeyError = ''
                      void handle.update()
                    })}
                  />
                )}
              </Field>
              <Field label="Environment">
                <SegmentedControl
                  label="Key environment"
                  size="compact"
                  value={newKeyEnv}
                  options={[
                    { value: 'live', label: 'Production' },
                    { value: 'test', label: 'Staging' },
                  ]}
                  onValueChange={(value) => {
                    newKeyEnv = value === 'test' ? 'test' : 'live'
                    void handle.update()
                  }}
                />
              </Field>
              <CheckboxGroup
                label="Scopes"
                name="scopes"
                value={newKeyScopes}
                options={[...availableScopes]}
                onValueChange={(next) => {
                  newKeyScopes = [...next]
                  void handle.update()
                }}
              />
              <Field label="Expiration">
                {(control) => (
                  <Select
                    {...control}
                    label="Expiration"
                    name="expiry"
                    value={newKeyExpiry}
                    options={[...expiryOptions]}
                    onValueChange={(value) => {
                      if (value) {
                        newKeyExpiry = value
                        void handle.update()
                      }
                    }}
                  />
                )}
              </Field>
              <div class="admin-dialog-actions">
                <Button
                  type="button"
                  variant="secondary"
                  mix={on('click', () => {
                    createKeyOpen = false
                    newKeyError = ''
                    void handle.update()
                  })}
                >
                  Cancel
                </Button>
                <Button type="submit">Generate secret</Button>
              </div>
            </form>
          </Dialog>

          <Dialog
            title="Invite team member"
            description="New members receive an SSO link and inherit your workspace MFA policy."
            open={inviteOpen}
            onOpenChange={(open) => {
              inviteOpen = open
              if (!open) inviteError = ''
              void handle.update()
            }}
          >
            <form
              class="admin-dialog-form"
              noValidate
              mix={on<HTMLFormElement, 'submit'>('submit', submitInvite)}
            >
              <Field label="Full name">
                {(control) => (
                  <Input
                    {...control}
                    name="inviteName"
                    placeholder="Grace Hopper"
                    value={inviteName}
                    mix={on<HTMLInputElement, 'input'>('input', (event) => {
                      inviteName = event.currentTarget.value
                      if (inviteError) inviteError = ''
                      void handle.update()
                    })}
                  />
                )}
              </Field>
              <Field label="Work email" error={inviteError || undefined}>
                {(control) => (
                  <Input
                    {...control}
                    name="inviteEmail"
                    type="email"
                    placeholder="grace@northstar.example"
                    value={inviteEmail}
                    mix={on<HTMLInputElement, 'input'>('input', (event) => {
                      inviteEmail = event.currentTarget.value
                      if (inviteError) inviteError = ''
                      void handle.update()
                    })}
                  />
                )}
              </Field>
              <Field label="Role">
                {(control) => (
                  <Select
                    {...control}
                    label="Member role"
                    name="inviteRole"
                    value={inviteRole}
                    options={[...roleOptions]}
                    onValueChange={(value) => {
                      if (
                        value === 'owner' ||
                        value === 'admin' ||
                        value === 'developer' ||
                        value === 'viewer'
                      ) {
                        inviteRole = value
                        void handle.update()
                      }
                    }}
                  />
                )}
              </Field>
              <div class="admin-dialog-actions">
                <Button
                  type="button"
                  variant="secondary"
                  mix={on('click', () => {
                    inviteOpen = false
                    inviteError = ''
                    void handle.update()
                  })}
                >
                  Cancel
                </Button>
                <Button type="submit">Send invite</Button>
              </div>
            </form>
          </Dialog>

          <Toaster position="bottom-right" />
        </div>
      )
    }
  },
)
