import { routes } from '../routes.ts'
import { FontPicker } from './font-picker.tsx'
import { CommandMenu, Dialog, Icon } from '@rtzll/reflow'
import { clientEntry, ref, type Handle } from 'remix/component'
import { buildInstallPrompt, currentShareHref } from './install-prompt.tsx'
import { playCopyError } from './showcase-sound.ts'
import {
  accentCss,
  applySetting,
  resetSettings,
  settingLabel,
  settingRows,
} from './site-settings.ts'

interface SitePage {
  name: string
  slug: string
  description: string
  category?: string
}

function icon(path: string) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}

const palette =
  'M12 3a9 9 0 1 0 0 18c2 0 3-1 2-3s0-3 2-3h2c4 0 4-12-6-12ZM7 9h.01M10 6h.01M15 6h.01M18 9h.01'

const icons = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  docs: 'M3 3h18v18H3zM7 7v10m4-10v10m4-10 2 10',
  play: 'M6 4v16l14-8Z',
  page: 'M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8m-8 4h6',
  theme: 'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
  shape: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z',
  density: 'M3 7h18M3 17h18m-5-7 3 2-3 2M8 10l-3 2 3 2',
  fontWeight: 'M4 20 12 4l8 16M7 14h10',
  font: 'M4 20 12 4l8 16M7 14h10',
  hover: 'm4 3 15 9-7 1-3 7-5-17Z',
  accent: palette,
  icons: palette,
  panel: 'M3 4h18v16H3zM9 4v16',
  keyboard:
    'M2 5h20v14H2zM6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h.01M18 13h.01M7 16h10',
}

const componentIcons: Record<string, string> = {
  '': icons.home,
  docs: icons.docs,
  demo: icons.play,
  accordion: 'M4 4h16M4 12h16M4 20h16m5-13 3 3 3-3',
  button: 'M5 6h14v12H5zM9 12h6',
  calendar: 'M4 5h16v16H4zM8 3v4m8-4v4M4 10h16M8 14h2m4 0h2',
  checkbox: 'M3 3h18v18H3zM7 12l3 3 7-7',
  'color-picker': icons.accent,
  combobox: 'M3 5h18v14H3zM7 9h6m-6 4h4m5-4 2 2 2-2',
  'command-menu': icons.keyboard,
  dialog: 'M3 4h18v16H3zM7 8h10M7 12h6m-6 4h3',
  input: 'M3 6h18v12H3zM8 9v6',
  'input-message': 'M21 12a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z',
  sidebar: icons.panel,
  slider: 'M3 12h6m6 0h6M9 8h6v8H9z',
  switch: 'M8 6h8a6 6 0 0 1 0 12H8A6 6 0 0 1 8 6Zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  table: 'M3 4h18v16H3zM3 10h18M9 4v16M3 15h18',
  tabs: 'M3 6h5v5H3zM10 6h5v5h-5zM17 6h4v5h-4zM3 14h18v6H3z',
}

export const SiteControls = clientEntry(
  import.meta.url,
  function SiteControls(handle: Handle<{ pages: readonly SitePage[] }>) {
    let searchOpen = false
    let helpOpen = false
    let invoker: HTMLElement | null = null
    let recent: string[] = []
    let notice = ''
    let noticeTimer: ReturnType<typeof setTimeout> | undefined
    let mac = true

    function setOpen(kind: 'search' | 'help', open: boolean) {
      if (open) {
        const active = document.activeElement
        invoker =
          active?.closest('[data-setting-menu][open]')?.querySelector('summary') ??
          (active instanceof HTMLElement ? active : null)
        for (const menu of document.querySelectorAll<HTMLDetailsElement>(
          '[data-setting-menu][open]',
        ))
          menu.open = false
        try {
          const stored: unknown = JSON.parse(localStorage.getItem('reflow_recent_pages') ?? '[]')
          recent = Array.isArray(stored)
            ? stored.filter((entry): entry is string => typeof entry === 'string').slice(0, 3)
            : []
        } catch {
          recent = []
        }
      }
      if (kind === 'search') searchOpen = open
      else helpOpen = open
      void handle.update()
      if (!open) handle.queueTask(() => invoker?.focus({ preventScroll: true }))
    }

    const mount = ref((_node, signal) => {
      mac = /Mac|iPhone|iPad/.test(navigator.platform)
      void handle.update()
      for (const cap of document.querySelectorAll('[data-platform-key]'))
        cap.textContent = mac ? '⌘' : 'Ctrl'
      document.addEventListener(
        'click',
        (event) => {
          const target = event.target instanceof Element ? event.target : null
          if (target?.closest('[data-site-search-trigger]')) {
            event.preventDefault()
            setOpen('search', true)
          }
          if (target?.closest('[data-site-shortcuts]')) {
            event.preventDefault()
            setOpen('help', true)
          }
          const reopen = target?.closest<HTMLElement>('[data-site-reopen]')
          if (reopen)
            document.documentElement.removeAttribute(`data-${reopen.dataset.siteReopen}-collapsed`)
        },
        { signal },
      )
      window.addEventListener(
        'keydown',
        (event) => {
          if (event.isComposing || event.repeat || event.altKey) return
          if (
            (event.metaKey || event.ctrlKey) &&
            !event.shiftKey &&
            event.key.toLowerCase() === 'k'
          ) {
            // Let the focused Sidebar playground handle search inside its rail.
            if (
              event.target instanceof Element &&
              !event.target.closest('[role="menu"]') &&
              event.target
                .closest('.example-sidebar-playground .rf-sidebar-inner')
                ?.querySelector('.rf-sidebar-input')
            )
              return
            event.preventDefault()
            event.stopImmediatePropagation()
            if (helpOpen) setOpen('help', false)
            setOpen('search', !searchOpen)
            return
          }
          if (event.metaKey || event.ctrlKey || event.defaultPrevented) return
          if (
            event.target instanceof Element &&
            event.target.closest(
              'input, textarea, select, [contenteditable], [role="slider"], [role="tablist"], [role="radiogroup"], [role="listbox"], [role="menu"]',
            )
          )
            return
          if (document.querySelector('dialog[open]:not(.site-mobile-panel)')) return
          if (event.key === '?') {
            event.preventDefault()
            setOpen('help', true)
          }
          if (event.key === '[' || event.key === ']') {
            // A Sidebar holding focus answers its own toggle key.
            if (
              event.target instanceof Element &&
              event.target.closest('.rf-sidebar-layout:not([data-fixed])')
            )
              return
            if (document.querySelector('.site-mobile-panel:modal')) return
            const side = event.key === '[' ? 'left' : 'right'
            if (matchMedia('(width < 1280px)').matches) {
              const trigger =
                side === 'left' &&
                document.querySelector<HTMLElement>('.site-mobile[data-enhanced] > summary')
              if (trigger) {
                event.preventDefault()
                trigger.click()
              }
              return
            }
            const rail = document.querySelector(`.site-${side}`)
            if (!rail) return
            event.preventDefault()
            document.documentElement.toggleAttribute(`data-${side}-collapsed`)
          }
        },
        { capture: true, signal },
      )
      window.addEventListener(
        'reflow:settings-change',
        (event) => {
          const { key, value } = (event as CustomEvent<{ key: string; value: string }>).detail
          const setting = settingRows.find((row) => row.key === key)
          notice = `${setting?.label ?? key} · ${settingLabel(value)}`
          clearTimeout(noticeTimer)
          noticeTimer = setTimeout(() => {
            notice = ''
            void handle.update()
          }, 1600)
          void handle.update()
        },
        { signal },
      )
      signal.addEventListener('abort', () => clearTimeout(noticeTimer), { once: true })
    })

    function select(value: string) {
      if (value.startsWith('setting:')) {
        const [, key, settingValue] = value.split(':')
        const row = settingRows.find((row) => row.key === key)
        if (row) applySetting(row.key, settingValue)
        setOpen('search', false)
        return
      }
      if (value === 'action:shortcuts') {
        setOpen('search', false)
        setOpen('help', true)
        return
      }
      if (value === 'action:reset') {
        resetSettings()
        notice = 'Settings reset to defaults'
        setOpen('search', false)
        void handle.update()
        return
      }
      if (value === 'action:copy' || value === 'action:share') {
        const share = value === 'action:share'
        void navigator.clipboard.writeText(share ? currentShareHref() : buildInstallPrompt()).then(
          () => {
            notice = share ? 'Link copied' : 'Install prompt copied'
            void handle.update()
          },
          () => {
            notice = 'Copy failed. Check clipboard access.'
            playCopyError()
            void handle.update()
          },
        )
        setOpen('search', false)
        return
      }
      const href = value.slice(5)
      const url = new URL(href, location.href)
      try {
        localStorage.setItem(
          'reflow_recent_pages',
          JSON.stringify([href, ...recent.filter((entry) => entry !== href)].slice(0, 3)),
        )
      } catch {
        /* Navigation also works when browser storage is unavailable. */
      }
      location.assign(url)
    }

    return () => {
      const pages = [
        {
          name: 'Showcase',
          slug: '',
          description: 'Browse every component',
          href: routes.gallery.href(),
        },
        {
          name: 'Introduction',
          slug: 'docs',
          description: 'Getting started with Reflow',
          href: routes.docs.href(),
        },
        {
          name: 'Demo',
          slug: 'demo',
          description: 'Explore interactive slides',
          href: routes.demo.href(),
        },
      ]
      const docs = handle.props.pages.map((page) => ({
        ...page,
        href: routes.component.href({ slug: page.slug }),
      }))
      const byRecent = <T extends { href: string }>(items: T[]) =>
        items.sort((a, b) => {
          const aIndex = recent.indexOf(a.href)
          const bIndex = recent.indexOf(b.href)
          return (aIndex < 0 ? Infinity : aIndex) - (bIndex < 0 ? Infinity : bIndex)
        })
      const pageCommands = (items: typeof docs, group: string) =>
        byRecent(items).map((page) => ({
          value: `page:${page.href}`,
          label: page.name,
          action: `Open ${page.name}`,
          description: recent.includes(page.href) ? 'Recently visited' : undefined,
          group,
          filter: 'Pages',
          keywords: [page.description, page.slug],
        }))
      const commands = [
        ...byRecent(pages).map((page) => ({
          value: `page:${page.href}`,
          label: page.name,
          action: `Open ${page.name}`,
          description: recent.includes(page.href) ? 'Recently visited' : undefined,
          group: 'Pages',
          keywords: [page.description, page.slug],
          icon: icon(componentIcons[page.slug] ?? icons.page),
        })),
        ...pageCommands(
          docs.filter((page) => page.category === 'system'),
          'System',
        ),
        ...pageCommands(
          docs.filter((page) => page.category !== 'system'),
          'Components',
        ),
        ...settingRows.flatMap((row) =>
          row.options
            .filter(
              (value) =>
                row.key !== 'fontWeight' ||
                (typeof document !== 'undefined' &&
                  document.documentElement.dataset.font?.startsWith('google:') &&
                  (value === 'auto' ||
                    document.documentElement.dataset.fontWeights?.split(',').includes(value))),
            )
            .map((value) => ({
              value: `setting:${row.key}:${value}`,
              label: `${row.label}: ${settingLabel(value)}`,
              group: 'Settings',
              action: `Set ${row.label.toLowerCase()} to ${settingLabel(value)}`,
              icon:
                row.key === 'icons' ? (
                  <Icon name="square" />
                ) : row.key === 'accent' ? (
                  <span
                    class="site-accent-swatch"
                    style={{ background: accentCss(value) }}
                    aria-hidden="true"
                  />
                ) : (
                  icon(icons[row.key])
                ),
            })),
        ),
        {
          value: 'action:shortcuts',
          label: 'Keyboard shortcuts',
          group: 'Actions',
          shortcut: '?',
          icon: icon(icons.keyboard),
        },
        {
          value: 'action:copy',
          label: 'Copy install prompt',
          group: 'Actions',
          icon: <Icon name="copy" />,
        },
        {
          value: 'action:share',
          label: 'Copy link with these settings',
          group: 'Actions',
          keywords: ['share', 'url', 'preferences'],
          icon: <Icon name="link" />,
        },
        {
          value: 'action:reset',
          label: 'Reset settings',
          group: 'Actions',
          keywords: ['defaults', 'preferences', 'clear'],
          icon: <Icon name="rotate-ccw" />,
        },
      ]
      return (
        <div class="site-global-controls" mix={mount}>
          <FontPicker />
          <div class="rf-command-dialog">
            <Dialog
              title="Search Reflow"
              open={searchOpen}
              size="lg"
              position="top"
              showCloseButton={false}
              onOpenChange={(open) => setOpen('search', open)}
            >
              {searchOpen ? (
                <CommandMenu
                  footer
                  items={commands}
                  label="Search Reflow"
                  placeholder="Go to a page, change a setting…"
                  inDialog
                  filters={['Pages', 'Settings', 'Actions']}
                  onSelect={select}
                />
              ) : null}
            </Dialog>
          </div>
          <Dialog
            title="Keyboard shortcuts"
            description="Use these keys while you are not typing in a field."
            open={helpOpen}
            onOpenChange={(open) => setOpen('help', open)}
          >
            <div class="site-shortcut-list">
              <div>
                <Icon name="search" />
                <span>Search</span>
                <span class="site-keycaps">
                  <kbd class="site-keycap">{mac ? '⌘' : 'Ctrl'}</kbd>
                  <kbd class="site-keycap">K</kbd>
                </span>
              </div>
              {settingRows
                .filter((row) => row.shortcut)
                .map((row) => (
                  <div key={row.key}>
                    {row.key === 'icons' ? <Icon name="square" /> : icon(icons[row.key])}
                    <span>Cycle {row.label.toLowerCase()}</span>
                    <kbd class="site-keycap">{row.shortcut}</kbd>
                  </div>
                ))}
              <div>
                <Icon name="panel-left" />
                <span>Toggle navigation</span>
                <kbd class="site-keycap">[</kbd>
              </div>
              <div>
                <Icon name="panel-left" />
                <span>Toggle properties</span>
                <kbd class="site-keycap">]</kbd>
              </div>
              <div>
                <Icon name="arrow-right" />
                <span>Previous / next demo slide</span>
                <span class="site-keycaps">
                  <kbd class="site-keycap">←</kbd>
                  <kbd class="site-keycap">→</kbd>
                </span>
              </div>
              <div>
                {icon(icons.keyboard)}
                <span>Show shortcuts</span>
                <kbd class="site-keycap">?</kbd>
              </div>
            </div>
          </Dialog>
          <div class="site-setting-toast" role="status" aria-live="polite" hidden={!notice}>
            {notice}
          </div>
        </div>
      )
    }
  },
)
