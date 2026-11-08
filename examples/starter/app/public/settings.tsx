import { Badge, Button, CheckboxGroup, Dialog, Icon, Select, Sidebar, Switch } from '@rtzll/reflow'
import { clientEntry, type Handle } from 'remix/component'

export const themes = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export const notificationOptions = [
  { value: 'mentions', label: 'Mentions' },
  { value: 'replies', label: 'Replies' },
  { value: 'digest', label: 'Weekly digest' },
]

const navigation = [
  { label: 'Appearance', href: '#appearance', icon: 'palette' },
  { label: 'Notifications', href: '#notifications', icon: 'bell' },
] as const

export const Settings = clientEntry(
  import.meta.url,
  function Settings(
    handle: Handle<{ theme: string; compact: boolean; notifications: string[]; applied: boolean }>,
  ) {
    let { theme, compact } = handle.props
    let activeHref = '#appearance'

    return () => (
      <div class="starter" data-theme={theme} data-density={compact ? 'compact' : 'default'}>
        <Sidebar
          label="Workspace navigation"
          variant="inset"
          defaultWidth={216}
          header={
            <div class="starter-brand">
              <Icon name="square-library" /> Reflow Starter
            </div>
          }
          toolbar={<Badge>Local workspace</Badge>}
          activeHref={activeHref}
          sections={[
            {
              label: 'Settings',
              collapsible: false,
              items: navigation.map(({ label, href, icon }) => ({
                label,
                href,
                icon: <Icon name={icon} />,
                onClick() {
                  activeHref = href
                  handle.update()
                },
              })),
            },
          ]}
        >
          <main class="starter-content">
            <header>
              <h1>Workspace settings</h1>
              <p>Try a few Reflow components in a fresh Remix app.</p>
            </header>

            <section id="appearance" class="starter-section" aria-labelledby="appearance-heading">
              <h2 id="appearance-heading">Appearance</h2>
              <div class="starter-setting">
                <div>
                  <label for="theme">Theme</label>
                  <p>Follow your device or choose light or dark.</p>
                </div>
                <Select
                  id="theme"
                  label="Theme"
                  options={themes}
                  value={theme}
                  onValueChange={(value) => {
                    if (value === null) return
                    theme = value
                    handle.update()
                  }}
                />
              </div>
              <div class="starter-setting">
                <p>Use smaller controls and tighter spacing.</p>
                <Switch
                  label="Compact layout"
                  checked={compact}
                  onCheckedChange={(value) => {
                    compact = value
                    handle.update()
                  }}
                />
              </div>
            </section>

            <section
              id="notifications"
              class="starter-section"
              aria-labelledby="notifications-heading"
            >
              <h2 id="notifications-heading">Notifications</h2>
              <p>Apply your settings to keep them in this page’s URL.</p>
              <form action="/#notifications" method="get">
                <input type="hidden" name="preferences" value="1" />
                <input type="hidden" name="theme" value={theme} />
                <input type="hidden" name="density" value={compact ? 'compact' : 'default'} />
                <CheckboxGroup
                  label="Notification types"
                  hideLabel
                  name="notification"
                  options={notificationOptions}
                  defaultValue={handle.props.notifications}
                />
                {handle.props.applied && (
                  <p role="status">
                    {handle.props.notifications.length === 0
                      ? 'Notifications are off.'
                      : 'Notification settings applied.'}
                  </p>
                )}
                <div class="starter-actions">
                  <Button type="submit">Apply settings</Button>
                  <Button type="reset" variant="ghost">
                    Reset
                  </Button>
                </div>
              </form>
              <Dialog title="Notification preview" trigger="Preview alert">
                <p>You were mentioned in a workspace update.</p>
              </Dialog>
            </section>
          </main>
        </Sidebar>
      </div>
    )
  },
)
