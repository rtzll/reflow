import { Button, Dropdown, Icon, ScrollArea, Textarea } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'

const roles = [
  {
    label: 'Workspace owner',
    description: 'Can change workspace settings and invite new members',
    icon: 'settings',
  },
  {
    label: 'Member',
    description: 'Can work in the workspace and view shared content',
    icon: 'check',
  },
  {
    label: 'Restricted member',
    description: 'Can only see and edit content they created',
    icon: 'lock',
  },
] as const

export function SurfaceInvite(handle: Handle<{ flat?: boolean }>) {
  let open = true
  let expanded = true
  let role = 'Member'
  let email = ''
  let notice = ''
  function close() {
    open = false
    handle.update()
  }

  return () => (
    <div class="system-invite-stage" data-flat={handle.props.flat || undefined}>
      {!open ? (
        <div class="system-invite-closed">
          <Button
            mix={on('click', () => {
              open = true
              notice = ''
              handle.update()
            })}
          >
            Invite people
          </Button>
          <p role="status">{notice}</p>
        </div>
      ) : (
        <div class="system-invite-panel">
          <header>
            <span aria-hidden="true">M</span>
            <strong>Invite to your workspace</strong>
            {!handle.props.flat && (
              <Button
                variant="ghost"
                size="icon-compact"
                aria-label="Close invite example"
                mix={on('click', close)}
              >
                ×
              </Button>
            )}
          </header>
          <label>
            Email
            <Textarea
              placeholder="email@gmail.com, email2@gmail.com…"
              rows={2}
              readOnly={handle.props.flat}
              mix={on<HTMLTextAreaElement, 'input'>('input', (event) => {
                email = event.currentTarget.value
                handle.update()
              })}
            />
          </label>
          <div class="system-invite-role">
            <span>Select role</span>
            {handle.props.flat ? (
              <div class="system-invite-static-trigger">
                Member <span aria-hidden="true">⌃</span>
              </div>
            ) : (
              <Button
                variant="tertiary"
                aria-expanded={expanded}
                mix={on('click', () => {
                  expanded = !expanded
                  handle.update()
                })}
              >
                {role} <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
              </Button>
            )}
            {handle.props.flat ? (
              <ul class="system-invite-flat-menu">
                {roles.map(({ label, description, icon }) => (
                  <li key={label} data-selected={label === role || undefined}>
                    <Icon name={icon} />
                    <div>
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </div>
                    {label === role && <span aria-hidden="true">✓</span>}
                  </li>
                ))}
              </ul>
            ) : (
              expanded && (
                <Dropdown
                  inline
                  label="Workspace roles"
                  onSelect={(next) => {
                    role = next
                    handle.update()
                  }}
                  items={roles.map(({ label, icon }) => ({
                    value: label,
                    label,
                    icon: <Icon name={icon} />,
                    type: 'radio',
                    checked: label === role,
                  }))}
                />
              )
            )}
          </div>
          <footer>
            {handle.props.flat ? (
              <span>Cancel</span>
            ) : (
              <Button variant="ghost" mix={on('click', close)}>
                Cancel
              </Button>
            )}
            <Button
              disabled={!email.trim()}
              mix={on('click', () => {
                notice = 'Invites prepared for this example.'
                close()
              })}
            >
              Send invites
            </Button>
          </footer>
        </div>
      )}
      {handle.props.flat && (
        <div class="system-invite-annotation">
          <code>surface-5 → surface-5</code>
          <p>The role menu uses the same fill as the dialog, so its boundary nearly disappears.</p>
        </div>
      )}
    </div>
  )
}

export function SurfaceTokens() {
  return () => (
    <div class="system-surface-token-preview">
      {['Dark', 'Light'].map((theme) => (
        <div key={theme} style={{ colorScheme: theme.toLowerCase() }}>
          <strong>{theme}</strong>
          <ScrollArea label={`${theme} surface tokens`} orientation="horizontal" fade>
            <div class="system-surfaces">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index}>
                  <span style={{ background: `var(--rf-surface-${index + 1})` }}>{index + 1}</span>
                  <code>surface-{index + 1}</code>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  )
}
