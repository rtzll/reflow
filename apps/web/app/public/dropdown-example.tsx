import type { Handle } from 'remix/component'
import { Dropdown, Icon, type DropdownItem, type IconName } from '@rtzll/reflow'

/** Demo content mirrors the Fluid Functionalism dropdown page. */
const icon = (name: IconName) => <Icon name={name} />

export const spaceRows = [
  ['Teamspaces', 'square-library'],
  ['Recents', 'clock'],
  ['Favorites', 'star'],
  ['Shared', 'users'],
  ['Private', 'lock'],
] as const

export const settingsRows = [
  ['Email', 'mail', 'Account'],
  ['Notifications', 'bell', 'Account'],
  ['Privacy', 'shield', 'Account'],
  ['General', 'settings', 'Appearance'],
  ['Theme', 'palette', 'Appearance'],
  ['Display', 'monitor', 'Appearance'],
] as const

export const themeRows = [
  ['Light', 'sun'],
  ['Dark', 'moon'],
  ['System', 'monitor'],
] as const

const folders = ['Inbox', 'Design', 'Engineering', 'Marketing', 'Archive']
const statuses = ['Open', 'In progress', 'In review', 'Blocked', 'Done', 'Archived']
const labelNames = [
  'Bug',
  'Feature',
  'Docs',
  'Design',
  'Performance',
  'Accessibility',
  'Refactor',
  'Testing',
  'Infrastructure',
  'Security',
  'Good first issue',
  'Help wanted',
]
const componentNames = [
  'Accordion',
  'Badge',
  'Button',
  'Card',
  'CheckboxGroup',
  'ColorPicker',
  'Combobox',
  'Dialog',
  'Dropdown',
  'InputGroup',
  'RadioGroup',
  'Select',
  'Sidebar',
  'Slider',
  'Switch',
  'Table',
  'Tabs',
]
const languages = [
  'Auto detect',
  'Albanian (Albania)',
  'Arabic',
  'Bengali',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'Czech',
  'Danish',
  'Dutch',
  'English (UK)',
  'English (US)',
  'Finnish',
  'French',
  'German',
  'Greek',
  'Hebrew',
  'Hindi',
  'Hungarian',
  'Indonesian',
  'Italian',
  'Japanese',
  'Korean',
  'Norwegian',
  'Polish',
  'Portuguese (Brazil)',
  'Portuguese (Portugal)',
  'Romanian',
  'Russian',
  'Spanish',
  'Swedish',
  'Thai',
  'Turkish',
  'Ukrainian',
  'Vietnamese',
]

export interface DropdownDemoProps {
  variant: string
}

/** The Dropdown docs demos: every row is a real Reflow Dropdown. */
export function DropdownDemo(handle: Handle<DropdownDemoProps>) {
  let space: string | null = 'Teamspaces'
  let language = 'Auto detect'
  let status = ['Open', 'In progress', 'In review']
  let labels = ['Bug', 'Design']
  let components = componentNames
  let used = ['Button', 'Combobox']
  let created = ''
  const flip = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

  return () => {
    const { variant } = handle.props
    const radio = (
      names: readonly string[],
      current: string | null,
      icons?: readonly IconName[],
    ): DropdownItem[] =>
      names.map((name, index) => ({
        value: name,
        label: name,
        type: 'radio',
        checked: current === name,
        icon: icons ? icon(icons[index]) : undefined,
      }))
    const checks = (names: readonly string[], current: readonly string[]): DropdownItem[] =>
      names.map((name) => ({
        value: name,
        label: name,
        type: 'checkbox',
        checked: current.includes(name),
      }))

    switch (variant) {
      case 'inline':
        return (
          <Dropdown
            inline
            label="Library"
            items={radio(
              spaceRows.map(([name]) => name),
              space,
              spaceRows.map(([, name]) => name),
            )}
            onSelect={(value) => {
              space = space === value ? null : value
              handle.update()
            }}
          />
        )
      case 'groups':
        return (
          <Dropdown
            inline
            label="Settings"
            items={settingsRows.map(([name, glyph, group], index) => ({
              value: name,
              label: name,
              group,
              icon: icon(glyph),
              separatorBefore: index === 3,
            }))}
          />
        )
      case 'triggered':
        return (
          <Dropdown
            label="Open menu"
            variant="ghost"
            chevron={false}
            items={radio(
              spaceRows.map(([name]) => name),
              space ?? 'Teamspaces',
              spaceRows.map(([, name]) => name),
            )}
            onSelect={(value) => {
              space = value
              handle.update()
            }}
          />
        )
      case 'submenus':
        return (
          <Dropdown
            label="Q3 report.pdf"
            variant="ghost"
            chevron={false}
            items={[
              {
                value: 'move',
                label: 'Move to',
                icon: icon('folder'),
                children: folders.map((name) => ({ value: name, label: name })),
              },
              {
                value: 'share',
                label: 'Share',
                icon: icon('link'),
                children: [
                  { value: 'copy', label: 'Copy link', icon: icon('link') },
                  { value: 'email', label: 'Email', icon: icon('mail') },
                ],
              },
              { value: 'rename', label: 'Rename', icon: icon('pencil') },
            ]}
          />
        )
      case 'multiple':
        return (
          <Dropdown
            label="Status"
            variant="ghost"
            chevron={false}
            items={checks(statuses, status)}
            onSelect={(value) => {
              status = flip(status, value)
              handle.update()
            }}
          />
        )
      case 'search':
        return (
          <Dropdown
            label={language}
            variant="ghost"
            searchable
            searchPlaceholder="Search languages"
            emptyMessage="No languages found"
            items={radio(languages, language)}
            onSelect={(value) => {
              language = value
              handle.update()
            }}
          />
        )
      case 'search-multiple':
        return (
          <Dropdown
            label={`Labels · ${labels.length}`}
            variant="ghost"
            chevron={false}
            searchable
            searchPlaceholder="Search labels"
            emptyMessage="No labels found"
            items={checks(labelNames, labels)}
            onSelect={(value) => {
              labels = flip(labels, value)
              handle.update()
            }}
          />
        )
      case 'create':
        return (
          <Dropdown
            label={`Components · ${used.length}`}
            variant="ghost"
            chevron={false}
            creatable
            searchPlaceholder="Search components"
            emptyMessage="No components found"
            items={checks(components, used)}
            onCreate={(value) => {
              components = [...components, value]
              used = [...used, value]
              created = value
              handle.update()
            }}
            onSelect={(value) => {
              if (value === created) {
                created = ''
                return
              }
              used = flip(used, value)
              handle.update()
            }}
          />
        )
    }
    return null
  }
}

export interface DropdownPlaygroundProps {
  mode: string
  selection: string
  search: boolean
  icons: boolean
  groups: boolean
  disabledRow: boolean
  creatable: boolean
  submenu: boolean
}

/** The playground sandbox: popup or inline panel, radio / checkbox / action rows, search, groups, submenu. */
export function DropdownPlayground(handle: Handle<DropdownPlaygroundProps>) {
  let selected: string | null = 'Email'
  let picked = ['Email', 'Notifications']
  let theme = 'System'
  let rows: (readonly [string, IconName, string])[] = [...settingsRows]
  let created = ''
  const flip = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

  return () => {
    const p = handle.props
    const menu = p.mode !== 'inline'
    const single = p.selection === 'single'
    const multiple = p.selection === 'multiple'
    const search = menu && p.search
    const groups = !search && p.groups
    const creatable = search && p.creatable
    const submenu = menu && p.submenu
    const items: DropdownItem[] = rows.map(([name, glyph, group], index) => {
      const base = {
        value: name,
        label: name,
        icon: p.icons ? icon(glyph) : undefined,
        disabled: p.disabledRow && name === 'Privacy',
        group: groups ? group : undefined,
        separatorBefore: groups && index > 0 && group !== rows[index - 1][2],
      }
      if (submenu && name === 'Theme')
        return {
          ...base,
          children: themeRows.map(([label, themeIcon]) => ({
            value: `theme:${label}`,
            label,
            icon: p.icons ? icon(themeIcon) : undefined,
            type: 'radio' as const,
            checked: theme === label,
          })),
        }
      return {
        ...base,
        type: single ? 'radio' : multiple ? 'checkbox' : undefined,
        checked: single ? selected === name : multiple ? picked.includes(name) : undefined,
      }
    })
    const label = single
      ? (selected ?? 'Choose')
      : multiple
        ? `Filters · ${picked.length}`
        : 'Open menu'
    return (
      <Dropdown
        label={label}
        variant="ghost"
        inline={!menu}
        searchable={search}
        creatable={creatable}
        searchPlaceholder="Search…"
        emptyMessage="No results"
        items={items}
        onCreate={(value) => {
          rows = [...rows, [value, 'plus', 'Appearance']]
          if (single) selected = value
          else if (multiple) picked = [...picked, value]
          created = value
          handle.update()
        }}
        onSelect={(value) => {
          if (value === created) {
            created = ''
            return
          }
          if (value.startsWith('theme:')) theme = value.slice(6)
          else if (single) selected = value
          else if (multiple) picked = flip(picked, value)
          handle.update()
        }}
      />
    )
  }
}
