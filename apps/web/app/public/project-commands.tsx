import { CommandMenu, Icon, Kbd, Select, type CommandItem } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'

export const projectCommands: readonly CommandItem[] = [
  {
    value: 'docs:tree',
    label: 'Open Tree docs',
    group: 'Docs',
    icon: <Icon name="folder" />,
    description: 'Browse the project file tree',
    keywords: ['files', 'navigation'],
  },
  {
    value: 'copy-link',
    label: 'Copy page link',
    group: 'Actions',
    icon: <Icon name="link" />,
    description: 'Copy this URL to the clipboard',
    keywords: ['share', 'clipboard'],
  },
  {
    value: 'theme',
    label: 'Toggle dark mode',
    group: 'Actions',
    icon: <Icon name="moon" />,
    description: 'Switch between light and dark',
    keywords: ['appearance', 'theme'],
  },
]

type Theme = 'light' | 'dark'
export async function runProjectCommand(
  value: string,
  setTheme = (theme: Theme) => {
    document.documentElement.dataset.theme = theme
  },
) {
  if (value.startsWith('docs:')) {
    window.location.assign('/docs/' + encodeURIComponent(value.slice(5)))
  } else if (value === 'copy-link') {
    try {
      await navigator.clipboard.writeText(window.location.href)
      return 'Page link copied'
    } catch {
      return 'Could not copy the page link'
    }
  } else if (value === 'theme') {
    const theme = document.documentElement.dataset.theme
    const dark =
      theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
    setTheme(dark ? 'light' : 'dark')
    return dark ? 'Light mode enabled' : 'Dark mode enabled'
  }
}

interface CommandOptions {
  modal?: boolean
  filters?: boolean
  descriptions?: boolean
  setTheme?: (theme: Theme) => void
}

export function ProjectCommands(handle: Handle<CommandOptions>) {
  let feedback = ''
  return () => (
    <div class="doc-command-palette">
      <CommandMenu
        label="Project commands"
        placeholder="Search project commands…"
        footer
        items={
          handle.props.descriptions === false
            ? projectCommands.map(({ description, ...item }) => item)
            : projectCommands
        }
        filters={handle.props.filters ? ['Docs', 'Actions'] : undefined}
        trigger={handle.props.modal ? 'Open command menu' : undefined}
        shortcut={false}
        onSelect={async (value) => {
          feedback = (await runProjectCommand(value, handle.props.setTheme)) ?? ''
          if (!handle.signal.aborted) void handle.update()
        }}
      />
      <span class="example-note" role="status">
        {feedback}
      </span>
    </div>
  )
}

// The detailed examples also include a longer directory for filtering and scrolling.
const paletteGroups = ['Actions', 'Docs'] as const
const paletteSuggestions = ['docs:tree', 'copy-link', 'theme'] as const
const paletteCommands: readonly CommandItem[] = [
  ...projectCommands,
  {
    value: 'export',
    label: 'Export as PDF',
    description: 'Unavailable in this demo',
    group: 'Actions',
    icon: <Icon name="file" />,
    disabled: true,
  },
  ...[
    'Accordion',
    'Button',
    'Calendar',
    'Combobox',
    'Dialog',
    'Drawer',
    'Dropdown',
    'Pagination',
    'Popover',
    'Sidebar',
    'Tabs',
    'Toolbar',
  ].map((name) => ({
    value: 'docs:' + name.toLowerCase(),
    label: name + ' docs',
    group: 'Docs',
    icon: <Icon name="book" />,
  })),
]

export function CommandVariants(
  handle: Handle<{ variant: string; setTheme?: (theme: Theme) => void }>,
) {
  let paletteType = 'all'
  let paletteSort = 'default'
  let feedback = ''
  function say(message: string) {
    if (handle.signal.aborted) return
    feedback = message
    void handle.update()
  }
  return () => {
    const { variant } = handle.props
    const plain = variant === 'basic'
    const rows =
      variant === 'controls'
        ? paletteCommands
            .filter((item) => paletteType === 'all' || item.group === paletteType)
            .toSorted((a, b) => (paletteSort === 'az' ? a.label.localeCompare(b.label) : 0))
        : plain
          ? paletteCommands.map(({ description, shortcut, ...item }) => item)
          : variant === 'descriptions'
            ? paletteCommands.map((item) =>
                item.value === 'copy-link' ? { ...item, shortcut: 'alt+shift+c' } : item,
              )
            : paletteCommands
    return (
      <div
        class="doc-command-palette"
        data-dialog={variant === 'dialog' || undefined}
        mix={on('keydown', (event) => {
          if (
            variant === 'descriptions' &&
            event.altKey &&
            event.shiftKey &&
            !event.metaKey &&
            !event.ctrlKey &&
            event.code === 'KeyC'
          ) {
            event.preventDefault()
            void runProjectCommand('copy-link').then((message) => say(message ?? ''))
          }
        })}
      >
        <CommandMenu
          items={rows}
          suggestions={
            ['dialog', 'groups', 'footer'].includes(variant) ? paletteSuggestions : undefined
          }
          suggestionsLabel={variant === 'groups' ? 'Recent' : undefined}
          footer={variant === 'footer' ? true : undefined}
          renderItem={
            variant === 'custom'
              ? (item) => (
                  <>
                    <span>{item.label}</span>
                    <span>{item.group}</span>
                  </>
                )
              : undefined
          }
          filters={['filters', 'footer'].includes(variant) ? paletteGroups : undefined}
          controls={
            variant === 'controls' ? (
              <>
                <Select
                  variant="ghost"
                  size="compact"
                  label="Type"
                  value={paletteType}
                  options={[
                    { value: 'all', label: 'All types' },
                    ...paletteGroups.map((group) => ({ value: group, label: group })),
                  ]}
                  onValueChange={(value) => {
                    paletteType = value ?? 'all'
                    handle.update()
                  }}
                />
                <Select
                  variant="ghost"
                  size="compact"
                  label="Sort"
                  value={paletteSort}
                  options={[
                    { value: 'default', label: 'Default order' },
                    { value: 'az', label: 'A to Z' },
                  ]}
                  onValueChange={(value) => {
                    paletteSort = value ?? 'default'
                    handle.update()
                  }}
                />
              </>
            ) : undefined
          }
          trigger={
            variant === 'dialog' ? (
              <>
                Open <Kbd keys="mod+p" />
              </>
            ) : undefined
          }
          shortcut={variant === 'dialog' ? 'mod+p' : false}
          onSelect={async (value) =>
            say((await runProjectCommand(value, handle.props.setTheme)) ?? '')
          }
        />
        <span class="example-note" role="status">
          {feedback}
        </span>
      </div>
    )
  }
}
