import type { Handle, RemixNode } from 'remix/component'
import {
  Button,
  Dialog,
  Sidebar,
  Icon,
  Select,
  Switch,
  InputGroup,
  InputField,
} from '@rtzll/reflow'

function SettingRow(handle: Handle<{ label: string; description: string; children: RemixNode }>) {
  return () => (
    <div class="doc-setting-row">
      <div>
        <div>{handle.props.label}</div>
        <p>{handle.props.description}</p>
      </div>
      <div class="doc-setting-control">{handle.props.children}</div>
    </div>
  )
}

/** Shared settings composition used by the Dialog and Sidebar examples. */
export function SettingsDialogExample(
  handle: Handle<{ open?: boolean; onOpenChange?: (open: boolean) => void }>,
) {
  let selection = 'general'
  const select = (value: string) => {
    selection = value
    handle.update()
  }
  return () => (
    <Dialog
      size="xl"
      title="Settings"
      trigger={handle.props.open === undefined ? 'Open settings' : undefined}
      open={handle.props.open}
      onOpenChange={handle.props.onOpenChange}
      flush
    >
      <Sidebar
        fixed
        style={{ height: 'min(640px, calc(100dvh - 32px))' }}
        header={<span class="doc-settings-title">Settings</span>}
        defaultWidth={208}
        activeHref={'#' + selection}
        sections={[
          {
            label: 'Workspace',
            items: (
              [
                ['General', 'settings'],
                ['Notifications', 'bell'],
                ['Appearance', 'palette'],
                ['Security', 'shield'],
                ['Members', 'users'],
              ] as const
            ).map(([label, icon]) => ({
              label,
              href: '#' + label.toLowerCase(),
              icon: <Icon name={icon} />,
              onClick: (event: MouseEvent) => {
                event.preventDefault()
                select(label.toLowerCase())
              },
            })),
          },
        ]}
      >
        <div class="doc-settings-panel doc-demo-padding">
          <div class="doc-settings-mobile">
            <Select
              label="Section"
              value={selection}
              options={['General', 'Notifications', 'Appearance', 'Security', 'Members'].map(
                (label) => ({
                  label,
                  value: label.toLowerCase(),
                }),
              )}
              onValueChange={(value) => value && select(value)}
            />
          </div>
          {selection === 'notifications' ? (
            <>
              <h3>Notifications</h3>
              <p>What reaches your inbox and when.</p>
              <div>
                <SettingRow
                  label="Daily digest"
                  description="One email each morning with what changed."
                >
                  <Switch aria-label="Daily digest" defaultChecked />
                </SettingRow>
                <SettingRow label="Mentions" description="When someone @-mentions you.">
                  <Switch aria-label="Mentions" defaultChecked />
                </SettingRow>
                <SettingRow
                  label="Product updates"
                  description="New features, once a month at most."
                >
                  <Switch aria-label="Product updates" />
                </SettingRow>
              </div>
            </>
          ) : selection === 'appearance' ? (
            <>
              <h3>Appearance</h3>
              <p>Theme and density for this device.</p>
              <div>
                <SettingRow label="Theme" description="Follows the system unless you pick one.">
                  <Select
                    label="Theme"
                    defaultValue="system"
                    options={['System', 'Light', 'Dark'].map((label) => ({
                      label,
                      value: label.toLowerCase(),
                    }))}
                  />
                </SettingRow>
                <SettingRow label="Density" description="Row height across lists and tables.">
                  <Select
                    label="Density"
                    defaultValue="default"
                    options={['Default', 'Compact'].map((label) => ({
                      label,
                      value: label.toLowerCase(),
                    }))}
                  />
                </SettingRow>
              </div>
            </>
          ) : selection === 'security' ? (
            <>
              <h3>Security</h3>
              <p>Sign-in protection and active sessions.</p>
              <div>
                <SettingRow
                  label="Two-factor authentication"
                  description="A code from your authenticator app at sign-in."
                >
                  <Switch aria-label="Two-factor authentication" defaultChecked />
                </SettingRow>
                <SettingRow
                  label="New sign-in alerts"
                  description="Email when a new device signs in."
                >
                  <Switch aria-label="New sign-in alerts" defaultChecked />
                </SettingRow>
                <SettingRow
                  label="Active sessions"
                  description="3 devices are signed in right now."
                >
                  <Button variant="secondary" size="compact">
                    Sign out everywhere
                  </Button>
                </SettingRow>
              </div>
            </>
          ) : selection === 'members' ? (
            <>
              <h3>Members</h3>
              <p>Who can access this workspace.</p>
              <div>
                {(
                  [
                    ['Jane Doe', 'jane@acme.com', 'owner'],
                    ['Sam Park', 'sam@acme.com', 'admin'],
                    ['Ravi Patel', 'ravi@acme.com', 'member'],
                  ] as const
                ).map(([name, email, role]) => (
                  <SettingRow key={email} label={name} description={email}>
                    <Select
                      label={`${name} role`}
                      defaultValue={role}
                      options={['Owner', 'Admin', 'Member'].map((label) => ({
                        label,
                        value: label.toLowerCase(),
                      }))}
                    />
                  </SettingRow>
                ))}
                <Button variant="secondary" size="compact">
                  Invite people
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3>General</h3>
              <p>Workspace name, language, and region.</p>
              <InputGroup style={{ width: '100%' }}>
                <InputField label="Workspace name" defaultValue="Acme Inc" />
              </InputGroup>
              <div>
                <SettingRow label="Language" description="Used for the interface and emails.">
                  <Select
                    label="Language"
                    defaultValue="en"
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'fr', label: 'Français' },
                      { value: 'de', label: 'Deutsch' },
                      { value: 'ja', label: '日本語' },
                    ]}
                  />
                </SettingRow>
                <SettingRow label="Timezone" description="Dates and reminders follow it.">
                  <Select
                    label="Timezone"
                    defaultValue="utc+1"
                    options={[
                      { value: 'utc-8', label: '(UTC−8) Pacific' },
                      { value: 'utc-5', label: '(UTC−5) Eastern' },
                      { value: 'utc+0', label: '(UTC+0) London' },
                      { value: 'utc+1', label: '(UTC+1) Paris' },
                      { value: 'utc+9', label: '(UTC+9) Tokyo' },
                    ]}
                  />
                </SettingRow>
              </div>
            </>
          )}
        </div>
      </Sidebar>
    </Dialog>
  )
}
