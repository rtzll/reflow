import { cardBanner } from './component-example-data.ts'
import { SidebarComparison } from './sidebar-comparison.tsx'
import { on, ref, type Handle, type RemixNode } from 'remix/component'
import {
  Button,
  Dropdown,
  Icon,
  Sidebar,
  SidebarCalloutStack,
  Tooltip,
  type IconName,
  type SidebarItem,
  type SidebarSection,
} from '@rtzll/reflow'
import { SettingsDialogExample } from './settings-dialog-example.tsx'
import type { PlaygroundValues } from './doc-playground.tsx'

const navigation: readonly {
  label: string
  icon: IconName
  children: readonly { label: string; icon?: IconName; badge?: string }[]
}[] = [
  {
    label: 'Chat',
    icon: 'message-circle',
    children: [
      { label: 'Q3 board deck', badge: '12' },
      { label: 'Postgres 16 plan', badge: '4' },
      { label: 'Onboarding emails' },
    ],
  },
  {
    label: 'Agents',
    icon: 'cpu',
    children: [
      { label: 'Support triage', badge: '18' },
      { label: 'Release notes' },
      { label: 'SQL analyst' },
    ],
  },
  { label: 'Knowledge', icon: 'book', children: [{ label: 'Changelog' }, { label: 'Runbooks' }] },
  { label: 'Runs', icon: 'play', children: [{ label: 'Nightly eval' }, { label: 'Backfill' }] },
  { label: 'Evals', icon: 'check', children: [{ label: 'Retrieval' }, { label: 'Tone' }] },
]

const threads: readonly { label: string; status: 'active' | 'unread' | 'idle'; badge: string }[] = [
  { label: 'Summarise the Q3 board deck', status: 'active', badge: '12' },
  { label: 'Migration plan for Postgres 16', status: 'unread', badge: '4' },
  { label: 'Why does retrieval miss the changelog?', status: 'idle', badge: '6' },
  { label: 'Rewrite the onboarding emails', status: 'idle', badge: '8' },
  { label: 'Debug the eval harness timeout', status: 'unread', badge: '9' },
  { label: 'Draft the launch announcement', status: 'idle', badge: '5' },
  { label: 'Compare embedding models', status: 'idle', badge: '3' },
]

const wiki: readonly {
  label: string
  open?: boolean
  branches: readonly {
    label: string
    icon: IconName
    open?: boolean
    pages: readonly { label: string; icon: IconName }[]
  }[]
}[] = [
  {
    label: 'Private',
    open: false,
    branches: [
      {
        label: 'Drafts',
        icon: 'pencil',
        pages: [
          { label: 'Onboarding revamp', icon: 'star' },
          { label: 'Competitor teardown', icon: 'search' },
        ],
      },
      {
        label: 'Weekly notes',
        icon: 'calendar',
        pages: [
          { label: 'Week 35 — planning', icon: 'clock' },
          { label: 'Week 34 — retro', icon: 'mail' },
        ],
      },
    ],
  },
  {
    label: 'Shared',
    branches: [
      {
        label: 'Engineering',
        icon: 'brain',
        pages: [
          { label: 'API guidelines', icon: 'link' },
          { label: 'Release process', icon: 'play' },
        ],
      },
      {
        label: 'Product hub',
        icon: 'globe',
        pages: [
          { label: 'Customer interviews', icon: 'message-circle' },
          { label: 'Roadmap', icon: 'star' },
        ],
      },
    ],
  },
  {
    label: 'Recent',
    branches: [
      {
        label: 'Today',
        icon: 'clock',
        open: true,
        pages: [
          { label: 'Onboarding revamp', icon: 'star' },
          { label: 'API guidelines', icon: 'link' },
        ],
      },
      {
        label: 'Yesterday',
        icon: 'calendar',
        open: true,
        pages: [
          { label: 'Customer interviews', icon: 'message-circle' },
          { label: 'Release process', icon: 'play' },
        ],
      },
    ],
  },
]

function tintBanner(strength: number) {
  return cardBanner.replace(
    /(stop-opacity='|fill-opacity=')([0-9.]+)/g,
    (_, prefix, value) => prefix + Number((Number(value) * strength).toFixed(3)),
  )
}

export function sidebarCallouts() {
  return [
    {
      id: 'aurora',
      title: 'Aurora 2 is here',
      description: 'A smarter way to work',
      icon: <Icon name="brain" />,
      image: tintBanner(1),
      tint: 1,
      href: '#aurora',
    },
    {
      id: 'shortcuts',
      title: 'Keyboard shortcuts',
      description: 'Move faster through your day',
      icon: <Icon name="lightbulb" />,
      image: tintBanner(0.4),
      tint: 0.4,
      href: '#shortcuts',
    },
    {
      id: 'motion',
      title: 'Motion guidelines',
      description: 'Three spring tiers, one page',
      icon: <Icon name="play" />,
      image: tintBanner(0.66),
      tint: 0.66,
      href: '#motion',
    },
  ]
}

const workspaces = ['Aurora AI', 'Northwind', 'Contoso'].map((label) => ({ value: label, label }))

export function WorkspaceHeader(
  handle: Handle<{ name?: string; options?: readonly string[]; onSelect?: (name: string) => void }>,
) {
  const name = () => handle.props.name ?? 'Aurora AI'
  return () => (
    <Dropdown
      label="Switch workspace"
      variant="bare"
      triggerClass="rf-sidebar-row"
      onSelect={handle.props.onSelect}
      items={
        handle.props.options?.map((label) => ({
          value: label,
          label,
          type: 'radio',
          checked: label === name(),
        })) ?? workspaces
      }
      triggerContent={
        <>
          <span class="rf-sidebar-tile" aria-hidden="true">
            {name()[0]}
          </span>
          <span class="rf-sidebar-row-name">{name()}</span>
          <Icon name="chevron-down" />
        </>
      }
    />
  )
}

export function UserFooter(
  handle: Handle<{ avatar: string; signedIn?: boolean; onSelect?: (action: string) => void }>,
) {
  const signedIn = () => handle.props.signedIn !== false
  return () => (
    <Dropdown
      label="Open user menu"
      variant="bare"
      triggerClass="rf-sidebar-row"
      side="top"
      onSelect={handle.props.onSelect}
      items={
        signedIn()
          ? [
              { value: 'profile', label: 'Profile', icon: <Icon name="users" /> },
              { value: 'settings', label: 'Settings', icon: <Icon name="settings" /> },
              { value: 'logout', label: 'Log out', icon: <Icon name="chevron-left" /> },
            ]
          : [{ value: 'login', label: 'Sign in', icon: <Icon name="users" /> }]
      }
      triggerContent={
        <>
          {signedIn() ? (
            <img
              class="rf-sidebar-avatar"
              src={handle.props.avatar}
              width="20"
              height="20"
              alt=""
            />
          ) : (
            <span class="rf-sidebar-avatar">
              <Icon name="users" />
            </span>
          )}
          <span class="rf-sidebar-row-name rf-sidebar-row-plain">
            {signedIn() ? 'Alex Morgan' : 'Signed out'}
          </span>
          <span class="rf-sidebar-row-trailing" aria-hidden="true">
            <Icon name="chevrons-up-down" />
          </span>
        </>
      }
    />
  )
}

export function SidebarFrame(
  handle: Handle<{ children: RemixNode; caption?: string; guides?: boolean }>,
) {
  let axes: number[] = []
  const measure = ref((node, signal) => {
    if (!handle.props.guides) return
    const observer = new ResizeObserver(() => {
      const bounds = node.getBoundingClientRect()
      const next = [
        ...new Set(
          [
            ...node.querySelectorAll(
              '.rf-sidebar-header svg, .rf-sidebar-footer svg, .rf-sidebar-item-actions svg',
            ),
          ].map((icon) => {
            const box = icon.getBoundingClientRect()
            return Math.round(box.left + box.width / 2 - bounds.left)
          }),
        ),
      ].filter((x) => x > 0)
      if (JSON.stringify(axes) !== JSON.stringify(next)) {
        axes = next
        handle.update()
      }
    })
    observer.observe(node)
    signal.addEventListener('abort', () => observer.disconnect(), { once: true })
  })
  return () => (
    <figure class="doc-sidebar-figure">
      <div class="doc-sidebar-frame" mix={measure}>
        {handle.props.children}
        {handle.props.guides &&
          axes.map((axis) => (
            <span key={axis} class="doc-sidebar-guide" style={{ left: `${axis}px` }} />
          ))}
      </div>
      {handle.props.caption && <figcaption>{handle.props.caption}</figcaption>}
    </figure>
  )
}

/** The Sidebar documentation previews, one per reference section. */
export function SidebarDemo(handle: Handle<{ variant: string; avatar: string }>) {
  const restock = { inline: 0, banner: 0 }
  function restockCallouts(kind: keyof typeof restock) {
    const cancel = () => clearTimeout(timer)
    const timer = setTimeout(() => {
      handle.signal.removeEventListener('abort', cancel)
      restock[kind]++
      handle.update()
    }, 1600)
    handle.signal.addEventListener('abort', cancel, { once: true })
  }
  let active = '#chat'
  const pick = (href: string) => (event: MouseEvent) => {
    event.preventDefault()
    active = href
    handle.update()
  }
  const flat = (): SidebarSection => ({
    label: 'Workspace',
    items: navigation.map((item) => ({
      label: item.label,
      href: `#${item.label.toLowerCase()}`,
      icon: <Icon name={item.icon} />,
      onClick: pick(`#${item.label.toLowerCase()}`),
    })),
  })

  return () => {
    const { variant } = handle.props
    if (variant === 'layouts') {
      return (
        <div class="doc-sidebar-stack">
          {(['default', 'floating', 'inset'] as const).map((layout) => (
            <SidebarFrame
              key={layout}
              caption={{ default: 'Sidebar', floating: 'Floating', inset: 'Inset' }[layout]}
            >
              <Sidebar
                variant={layout}
                label="Aurora workspace"
                activeHref={active}
                searchable
                header={<WorkspaceHeader />}
                footer={<UserFooter avatar={handle.props.avatar} />}
                sections={[flat()]}
              >
                {null}
              </Sidebar>
            </SidebarFrame>
          ))}
        </div>
      )
    }
    if (variant === 'nesting') {
      const sections: SidebarSection[] = wiki.map((group) => ({
        label: group.label,
        defaultCollapsed: group.open === false,
        items: group.branches.map(
          (branch): SidebarItem => ({
            label: branch.label,
            icon: <Icon name={branch.icon} />,
            defaultExpanded: branch.open ?? false,
            children: branch.pages.map((page) => ({
              label: page.label,
              href: `#${page.label.toLowerCase().replaceAll(' ', '-')}`,
              icon: <Icon name={page.icon} />,
              onClick: pick(`#${page.label.toLowerCase().replaceAll(' ', '-')}`),
            })),
          }),
        ),
      }))
      return (
        <SidebarFrame>
          <Sidebar
            label="Wiki"
            activeHref={active}
            searchable
            header={<WorkspaceHeader />}
            sections={sections}
          >
            {null}
          </Sidebar>
        </SidebarFrame>
      )
    }
    if (variant === 'badges') {
      return (
        <SidebarFrame>
          <Sidebar
            label="Threads"
            searchable
            header={<WorkspaceHeader />}
            footer={<UserFooter avatar={handle.props.avatar} />}
            activeHref={active}
            sections={[
              {
                label: 'Threads',
                items: threads.map((thread) => ({
                  label: thread.label,
                  href: `#${thread.label.toLowerCase().replaceAll(/\W+/g, '-')}`,
                  status: thread.status,
                  badge: thread.badge,
                  onClick: pick(`#${thread.label.toLowerCase().replaceAll(/\W+/g, '-')}`),
                  actionCount: 3,
                  actions: (
                    <>
                      <button type="button" class="rf-sidebar-action" aria-label="Branch thread">
                        <Icon name="corner-down-right" />
                      </button>
                      <button type="button" class="rf-sidebar-action" aria-label="Share thread">
                        <Icon name="link" />
                      </button>
                      <Dropdown
                        label={`More options for ${thread.label}`}
                        variant="bare"
                        triggerClass="rf-sidebar-action"
                        chevron={false}
                        triggerContent={<Icon name="more-vertical" />}
                        items={[
                          { value: 'rename', label: 'Rename' },
                          { value: 'delete', label: 'Delete' },
                        ]}
                      />
                    </>
                  ),
                })),
              },
            ]}
          >
            {null}
          </Sidebar>
        </SidebarFrame>
      )
    }
    if (variant === 'header' || variant === 'alignment') {
      return (
        <div class="doc-sidebar-stack">
          {(variant === 'alignment' ? ['horizontal'] : ['vertical', 'horizontal']).map((stack) => (
            <SidebarFrame
              key={stack}
              caption={
                variant === 'alignment'
                  ? 'Measured icon axes'
                  : `${stack === 'vertical' ? 'Vertical' : 'Horizontal'} stacking`
              }
              guides={variant === 'alignment'}
            >
              <Sidebar
                label="Threads"
                searchable={stack === 'vertical'}
                activeHref={active}
                header={
                  stack === 'vertical' ? (
                    <>
                      <WorkspaceHeader />
                      <Button variant="ghost" leadingIcon={<Icon name="plus" />}>
                        New thread
                      </Button>
                    </>
                  ) : (
                    <div class="doc-sidebar-inline">
                      <WorkspaceHeader />
                      <Button variant="ghost" size="icon-compact" aria-label="Search">
                        <Icon name="search" />
                      </Button>
                      <Button variant="ghost" size="icon-compact" aria-label="New thread">
                        <Icon name="plus" />
                      </Button>
                    </div>
                  )
                }
                footer={
                  stack === 'vertical' ? (
                    <>
                      <a class="rf-sidebar-row" href="#settings">
                        <span class="rf-sidebar-icon">
                          <Icon name="settings" />
                        </span>
                        Settings
                      </a>
                      <a class="rf-sidebar-row" href="#whats-new">
                        <span class="rf-sidebar-icon">
                          <Icon name="lightbulb" />
                        </span>
                        What's new
                      </a>
                      <UserFooter avatar={handle.props.avatar} />
                    </>
                  ) : (
                    <div class="doc-sidebar-inline">
                      <UserFooter avatar={handle.props.avatar} />
                      <Button variant="ghost" size="icon-compact" aria-label="Settings">
                        <Icon name="settings" />
                      </Button>
                    </div>
                  )
                }
                sections={[
                  {
                    label: 'Threads',
                    items: threads.slice(0, 3).map((thread) => ({
                      label: thread.label,
                      href: `#${thread.status}-${thread.badge}`,
                      status: thread.status,
                      onClick: pick(`#${thread.status}-${thread.badge}`),
                      actions:
                        variant === 'alignment' ? (
                          <>
                            <button
                              type="button"
                              class="rf-sidebar-action"
                              aria-label="Branch thread"
                            >
                              <Icon name="corner-down-right" />
                            </button>
                            <button
                              type="button"
                              class="rf-sidebar-action"
                              aria-label="Share thread"
                            >
                              <Icon name="link" />
                            </button>
                          </>
                        ) : undefined,
                      actionCount: 2,
                    })),
                  },
                ]}
              >
                {null}
              </Sidebar>
            </SidebarFrame>
          ))}
        </div>
      )
    }
    if (variant === 'callout') {
      return (
        <div class="doc-sidebar-stack">
          {(['inline', 'banner'] as const).map((kind) => (
            <SidebarFrame
              key={kind}
              caption={kind === 'inline' ? 'Stacked inlines' : 'Stacked banners'}
            >
              <Sidebar
                label="Threads"
                activeHref={active}
                header={<WorkspaceHeader />}
                footer={<UserFooter avatar={handle.props.avatar} />}
                callout={
                  <SidebarCalloutStack
                    key={restock[kind]}
                    variant={kind}
                    onEmpty={() => restockCallouts(kind)}
                    items={sidebarCallouts()}
                  />
                }
                sections={[
                  {
                    label: 'Threads',
                    items: threads.slice(0, 3).map((thread) => ({
                      label: thread.label,
                      href: `#${thread.status}-${thread.badge}`,
                      status: thread.status,
                      badge: thread.badge,
                      onClick: pick(`#${thread.status}-${thread.badge}`),
                    })),
                  },
                ]}
              >
                {null}
              </Sidebar>
            </SidebarFrame>
          ))}
        </div>
      )
    }
    if (variant === 'comparison') return <SidebarComparison />
    if (variant === 'resize') {
      return (
        <div class="doc-sidebar-stack">
          {(['hover', 'click'] as const).map((peek) => (
            <SidebarFrame key={peek} caption={`On ${peek}`}>
              <Sidebar
                variant="inset"
                searchable
                peek={peek}
                defaultCollapsed={peek === 'click'}
                label="Threads"
                activeHref={active}
                header={<WorkspaceHeader />}
                sections={[
                  {
                    label: 'Threads',
                    items: threads.slice(0, 5).map((thread) => ({
                      label: thread.label,
                      href: `#${thread.status}-${thread.badge}`,
                      status: thread.status,
                      badge: thread.badge,
                      onClick: pick(`#${thread.status}-${thread.badge}`),
                    })),
                  },
                ]}
              >
                {null}
              </Sidebar>
            </SidebarFrame>
          ))}
        </div>
      )
    }
    return null
  }
}

type SidebarOptions = PlaygroundValues
const playgroundWorkspaces = {
  'Acme Inc': [
    'Sidebar component height in demo',
    'Sidebar component creation',
    'Dark mode token audit',
    'Scrollbar fade regression',
    'Registry deploy pipeline',
  ],
  'Fluid Labs': threads.slice(0, 5).map((thread) => thread.label),
  Personal: [
    'Plan the next release',
    'Review design notes',
    'Organize references',
    'Refresh the home page',
    'Publish the portfolio',
  ],
}
const workspaceNames = Object.keys(playgroundWorkspaces) as (keyof typeof playgroundWorkspaces)[]
const threadStatuses = ['active', 'idle', 'unread', 'idle', 'unread'] as const
const headerActions = [
  ['plus', 'New'],
  ['users', 'Invite'],
] as const
const footerActions = [
  ['settings', 'Settings'],
  ['moon', 'Theme'],
] as const
const sectionActions = [
  ['plus', 'Add item'],
  ['settings', 'Section settings'],
  ['more-vertical', 'More options'],
] as const

export function SidebarPlaygroundExample(
  handle: Handle<{ values: SidebarOptions; avatar: string }>,
) {
  let workspace = workspaceNames[0]
  const selected = new Map<string, string>()
  const added = new Map<string, { group: number; label: string; href: string }[]>()
  let nextThread = 1
  let feedback = ''
  let signedIn = true
  let settingsOpen = false
  let theme: 'light' | 'dark' | undefined
  let mac = true
  const detectPlatform = ref(() => {
    mac = /Mac|iPhone|iPad/.test(navigator.platform)
    handle.update()
  })
  const say = (value: string) => {
    feedback = value
    handle.update()
  }
  const openSettings = (open: boolean) => {
    settingsOpen = open
    handle.update()
  }

  function addThread(group: number, section: string) {
    const label = `New thread ${nextThread++}`
    const href = `#${label.toLowerCase().replaceAll(' ', '-')}`
    added.set(workspace, [{ group, label, href }, ...(added.get(workspace) ?? [])])
    selected.set(workspace, href)
    say(`${label} · ${section}`)
  }

  return () => {
    const v = handle.props.values
    const menu = v.rowKind === 'menu'
    const nested = menu && v.nestedRows
    const groups = menu ? ['Platform', 'Workspace'] : ['fluid-functionalism', 'portfolio-site']
    const searchHint = mac ? '⌘K' : 'Ctrl+K'
    const newHint = mac ? '⇧⌘O' : 'Ctrl+Shift+O'
    const horizontalHeader = v.headerStack === 'horizontal'
    const horizontalFooter = v.footerStack === 'horizontal'

    function action(
      icon: IconName,
      label: string,
      run: (button: HTMLElement) => void,
      inline: boolean,
      shortcut?: string,
    ) {
      const click = on<HTMLElement, 'click'>('click', (event) => run(event.currentTarget))
      const shortcutLabel = shortcut === newHint ? 'Meta+Shift+O Control+Shift+O' : undefined
      if (!inline)
        return (
          <button
            key={label}
            type="button"
            class="rf-sidebar-row sidebar-playground-action"
            aria-keyshortcuts={shortcutLabel}
            mix={click}
          >
            <span class="rf-sidebar-icon">
              <Icon name={icon} />
            </span>
            {label}
            {shortcut && <kbd aria-hidden="true">{shortcut}</kbd>}
          </button>
        )
      return (
        <span key={label} class="sidebar-playground-action">
          <Tooltip
            content={
              shortcut ? (
                <>
                  {label} <kbd>{shortcut}</kbd>
                </>
              ) : (
                label
              )
            }
            side={shortcut ? 'bottom' : 'top'}
            renderTrigger={(trigger) => (
              <button
                {...trigger}
                type="button"
                class="rf-sidebar-action"
                aria-label={label}
                aria-keyshortcuts={shortcutLabel}
                mix={[trigger.mix, click]}
              >
                <Icon name={icon} />
              </button>
            )}
          />
        </span>
      )
    }

    function rowActions(label: string, group: number, count: number) {
      return (
        <>
          {count >= 3 &&
            action(
              'plus',
              `Add item in ${groups[group]}`,
              () => addThread(group, groups[group]),
              true,
            )}
          {count >= 2 && action('pencil', `Edit ${label}`, () => say(label), true)}
          <Dropdown
            label={`More options for ${label}`}
            variant="bare"
            triggerClass="rf-sidebar-action"
            triggerContent={<Icon name="more-vertical" />}
            items={[
              { value: 'rename', label: 'Rename', icon: <Icon name="pencil" /> },
              { value: 'share', label: 'Share', icon: <Icon name="link" /> },
              { value: 'delete', label: 'Delete', icon: <Icon name="x" /> },
            ]}
            onSelect={(value) => say(`${value[0].toUpperCase()}${value.slice(1)} · ${label}`)}
          />
        </>
      )
    }

    function pick(label: string, href: string, event: MouseEvent) {
      event.preventDefault()
      selected.set(workspace, href)
      say(label)
    }

    const row = (label: string, href: string, index: number, group: number): SidebarItem => ({
      label,
      href,
      icon: menu ? <Icon name={navigation[index]?.icon ?? 'message-circle'} /> : undefined,
      status: menu ? undefined : (threadStatuses[index] ?? 'idle'),
      badge: v.rowBadges ? threads[index]?.badge : undefined,
      onClick: (event) => pick(label, href, event),
      actions: Number(v.rowActions) ? rowActions(label, group, Number(v.rowActions)) : undefined,
      actionCount: Number(v.rowActions),
      children: nested
        ? ['Overview', 'Recent'].map((name, child) => ({
            label: name,
            href: `${href}-${child}`,
            icon: v.childIcons ? <Icon name={child ? 'clock' : 'folder'} /> : undefined,
            badge: v.childBadges ? String(child + 2) : undefined,
            actions: Number(v.childActions)
              ? rowActions(`${label} ${name}`, group, Number(v.childActions))
              : undefined,
            actionCount: Number(v.childActions),
            onClick: (event) => pick(`${label} · ${name}`, `${href}-${child}`, event),
          }))
        : undefined,
    })
    const entries = (
      menu ? navigation.map((item) => item.label) : playgroundWorkspaces[workspace]
    ).map((label, index) => row(label, `#thread-${index}`, index, index < 3 ? 0 : 1))
    const header =
      v.headerPrimary === 'dropdown' ? (
        <WorkspaceHeader
          name={workspace}
          options={workspaceNames}
          onSelect={(name) => {
            workspace = name as typeof workspace
            say('')
          }}
        />
      ) : v.headerPrimary === 'logo' ? (
        <div class="rf-sidebar-row">
          <span class="rf-sidebar-tile">{workspace[0]}</span>
          <span class="rf-sidebar-row-name">{workspace}</span>
        </div>
      ) : null
    const footer =
      v.footerPrimary === 'dropdown' ? (
        <UserFooter
          avatar={handle.props.avatar}
          signedIn={signedIn}
          onSelect={(value) => {
            if (value === 'settings') return openSettings(true)
            if (value === 'logout' || value === 'login') {
              signedIn = value === 'login'
              say(signedIn ? 'Signed in as Alex Morgan' : 'Signed out of the demo')
            } else say('Alex Morgan · Profile')
          }}
        />
      ) : null
    const headerButtons = headerActions
      .slice(0, Number(v.headerActions))
      .map(([icon, label]) =>
        label === 'New'
          ? action(icon, label, () => addThread(0, groups[0]), horizontalHeader, newHint)
          : action(icon, label, () => say('Invite to ' + workspace), horizontalHeader),
      )
    const footerButtons = footerActions.slice(0, Number(v.footerActions)).map(([icon, label]) =>
      label === 'Settings'
        ? action(icon, label, () => openSettings(true), horizontalFooter)
        : action(
            icon,
            label,
            (button) => {
              const scheme = getComputedStyle(button).colorScheme
              const dark =
                scheme === 'dark' ||
                (scheme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
              theme = dark ? 'light' : 'dark'
              handle.update()
            },
            horizontalFooter,
          ),
    )
    const callouts = sidebarCallouts().slice(0, v.stackedCallouts ? undefined : 1)

    return (
      <div
        class="example-sidebar-playground"
        data-theme={theme}
        mix={[
          detectPlatform,
          on<HTMLElement, 'keydown'>('keydown', (event) => {
            if (
              event.defaultPrevented ||
              event.isComposing ||
              event.repeat ||
              event.altKey ||
              !(event.metaKey || event.ctrlKey)
            )
              return
            if (!(event.target instanceof Element) || event.target.closest('[role="menu"]')) return
            const key = event.key.toLowerCase()
            if (key === 'k' && !event.shiftKey) {
              const search = event.target
                .closest('.rf-sidebar-inner')
                ?.querySelector<HTMLInputElement>('.rf-sidebar-input')
              if (!search) return
              event.preventDefault()
              event.stopPropagation()
              search.focus()
            } else if (
              key === 'o' &&
              event.shiftKey &&
              Number(v.headerActions) &&
              event.target.closest('.rf-sidebar-inner')
            ) {
              event.preventDefault()
              event.stopPropagation()
              addThread(0, groups[0])
            }
          }),
        ]}
      >
        <Sidebar
          key={String(v.defaultCollapsed)}
          label={workspace}
          variant={v.variant === 'inset' || v.variant === 'floating' ? v.variant : 'default'}
          searchable={Boolean(v.searchable)}
          searchShortcut={searchHint}
          defaultCollapsed={Boolean(v.defaultCollapsed)}
          peek={v.peek === 'hover' || v.peek === 'click' ? v.peek : 'none'}
          activeHref={selected.get(workspace) ?? '#thread-0'}
          header={
            horizontalHeader ? (
              <div class="doc-sidebar-inline">
                {header}
                {headerButtons}
              </div>
            ) : (
              header
            )
          }
          searchActions={!horizontalHeader && headerButtons.length > 0 ? headerButtons : undefined}
          footer={
            footer || footerButtons.length > 0 ? (
              <div class={horizontalFooter ? 'doc-sidebar-inline' : 'doc-sidebar-vertical'}>
                {horizontalFooter && footer}
                {footerButtons}
                {!horizontalFooter && footer}
              </div>
            ) : null
          }
          callout={
            v.callout !== 'none' && (
              <SidebarCalloutStack
                key={`${v.callout}-${v.stackedCallouts}`}
                variant={v.callout === 'banner' ? 'banner' : 'inline'}
                items={callouts}
              />
            )
          }
          sections={groups.map((label, index) => ({
            label,
            collapsible: Boolean(v.sectionsCollapsible),
            items: [
              ...(added.get(workspace) ?? [])
                .filter((item) => item.group === index)
                .map((item) => row(item.label, item.href, -1, index)),
              ...(index === 0 ? entries.slice(0, 3) : entries.slice(3)),
            ],
            actions: Number(v.sectionActions)
              ? sectionActions
                  .slice(0, Number(v.sectionActions))
                  .map(([icon, name]) =>
                    action(
                      icon,
                      `${name} · ${label}`,
                      () =>
                        name === 'Add item' ? addThread(index, label) : say(`${name} · ${label}`),
                      true,
                    ),
                  )
              : undefined,
          }))}
        >
          <p class="doc-demo-padding" role="status">
            {feedback}
          </p>
        </Sidebar>
        <SettingsDialogExample open={settingsOpen} onOpenChange={openSettings} />
      </div>
    )
  }
}
