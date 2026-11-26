import { play } from '../public/showcase-audio.ts'
import {
  applySetting,
  cycleSetting,
  settingRows,
  type SettingKey,
} from '../public/site-settings.ts'
import { enhanceShowcaseSound, playCopyError, syncSoundControls } from '../public/showcase-sound.ts'

const keyboardWidgets = [
  'textarea',
  'select',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="tablist"]',
  '[role="radiogroup"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="menubar"]',
  '[role="toolbar"]',
  '[role="tree"]',
  '.rf-bar-chart',
  '.rf-time-grid',
  '.site-accent-panel',
].join(', ')

// The settings rail has no scroll of its own: when it is taller than the
// window it sticks with its end in view instead of its top.
// Elements already wired. In-page navigations keep elements but re-apply
// the server's markup, so wiring happens once and attributes are re-applied
// after every navigation.
const wired = new WeakSet<Element>()

function wireOnce(element: Element) {
  if (wired.has(element)) return false
  wired.add(element)
  return true
}

function pinSettingsRail() {
  const rail = document.querySelector<HTMLElement>('.site-right')
  if (!rail) return
  const update = () =>
    rail.style.setProperty(
      '--site-right-top',
      `${Math.min(0, window.innerHeight - rail.offsetHeight)}px`,
    )
  if (wireOnce(rail)) {
    new ResizeObserver(update).observe(rail)
    window.addEventListener('resize', () => rail.isConnected && update())
  }
  update()
}

function enhanceMobileNavigation() {
  const disclosure = document.querySelector<HTMLDetailsElement>('.site-mobile')
  const drawer = disclosure?.querySelector('dialog')
  const trigger = disclosure?.querySelector('summary')
  if (!disclosure || !drawer || !trigger) return

  const mobile = matchMedia('(width < 1280px)')
  const openDrawer = () => {
    disclosure.open = true
    drawer.showModal()
    drawer.focus({ preventScroll: true })
  }

  const closeDrawer = () => {
    drawer.close()
    disclosure.open = false
    for (const menu of drawer.querySelectorAll<HTMLDetailsElement>(
      'details[data-setting-menu][open]',
    ))
      menu.open = false
    if (mobile.matches) trigger.focus({ preventScroll: true })
  }

  // Without enhancement the same markup is a native details disclosure.
  // An in-page navigation can re-apply the server's open attribute; a drawer
  // the reader has open as a modal keeps it.
  if (!drawer.matches(':modal')) drawer.removeAttribute('open')
  disclosure.dataset.enhanced = ''
  trigger.setAttribute('aria-haspopup', 'dialog')
  trigger.setAttribute('aria-keyshortcuts', '[')
  trigger.title = 'Open navigation ['
  if (!wireOnce(disclosure)) return
  if (disclosure.open && mobile.matches) openDrawer()
  trigger.addEventListener('click', (event) => {
    event.preventDefault()
    openDrawer()
  })
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer && event.clientX >= drawer.getBoundingClientRect().right)
      closeDrawer()
  })
  drawer.addEventListener('cancel', (event) => {
    event.preventDefault()
    closeDrawer()
  })
  mobile.addEventListener('change', () => {
    if (!mobile.matches && drawer.open) closeDrawer()
  })
}

const settingMenus = () =>
  Array.from(document.querySelectorAll<HTMLDetailsElement>('[data-setting-menu]'))

function setMenuOpen(menu: HTMLDetailsElement, open: boolean) {
  menu.open = open
  menu.querySelector('summary')?.setAttribute('aria-expanded', String(open))
}

function enhanceSettingMenus() {
  const menus = settingMenus()
  for (const menu of menus) {
    const trigger = menu.querySelector('summary')!
    const accent = menu.querySelector<HTMLElement>('.site-accent-panel')
    trigger.setAttribute('aria-expanded', String(menu.open))
    if (accent) accent.dataset.anchored = ''
    if (!wireOnce(menu)) continue
    function placeAccent() {
      if (!accent || !menu.open) return
      const bounds = trigger.getBoundingClientRect()
      const rail = accent.closest('dialog')?.getBoundingClientRect()
      const leftEdge = (rail?.left ?? 0) + 8
      const rightEdge = (rail?.right ?? document.documentElement.clientWidth) - 8
      const width = Math.min(280, rightEdge - leftEdge)
      const above = bounds.top - 12
      const below = window.innerHeight - bounds.bottom - 12
      const placeAbove = below < 455 && above > below
      accent.style.width = width + 'px'
      accent.style.left = Math.max(leftEdge, Math.min(rightEdge, bounds.right) - width) + 'px'
      accent.style.maxHeight = Math.max(0, placeAbove ? above : below) + 'px'
      accent.style.top = placeAbove ? 'auto' : bounds.bottom + 4 + 'px'
      accent.style.bottom = placeAbove ? window.innerHeight - bounds.top + 4 + 'px' : 'auto'
    }
    if (accent) {
      window.addEventListener('resize', placeAccent)
      document.addEventListener('scroll', placeAccent, { capture: true })
    }
    const getOptions = () =>
      Array.from(
        menu.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"], [role="menuitem"]'),
      ).filter((option) => !option.hidden && !option.disabled)
    function openMenu(last = false) {
      for (const other of settingMenus())
        if (other !== menu && other.open) setMenuOpen(other, false)
      setMenuOpen(menu, true)
      if (accent) {
        placeAccent()
        accent.focus({ preventScroll: true })
        return
      }
      const options = getOptions()
      const firstOption = last ? options.at(-1) : options[0]
      firstOption?.focus()
    }
    function closeMenu() {
      setMenuOpen(menu, false)
      trigger.focus({ preventScroll: true })
    }
    menu.addEventListener('toggle', () => {
      trigger.setAttribute('aria-expanded', String(menu.open))
      placeAccent()
    })
    trigger.addEventListener('click', (event) => {
      event.preventDefault()
      if (menu.open) closeMenu()
      else openMenu()
    })
    menu.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return
      const option = event.target.closest<HTMLButtonElement>('[data-setting]')
      if (option) {
        applySetting(option.dataset.setting as SettingKey, option.dataset.value!)
        play('select')
        closeMenu()
      } else if (event.target.closest('[data-font-browse]')) closeMenu()
    })
    menu.addEventListener('focusout', (event) => {
      if (menu.open && event.relatedTarget instanceof Node && !menu.contains(event.relatedTarget)) {
        setMenuOpen(menu, false)
      }
    })
    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.open && !event.defaultPrevented) {
        event.preventDefault()
        event.stopPropagation()
        closeMenu()
        return
      }
      if (event.key === 'Tab' && menu.open) {
        if (!accent) closeMenu()
        return
      }
      if (
        event.defaultPrevented ||
        (accent && menu.open) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return
      const { key } = event
      if (!menu.open) {
        if (key !== 'ArrowDown' && key !== 'ArrowUp') return
        event.preventDefault()
        openMenu(key === 'ArrowUp')
        return
      }
      if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End') return
      event.preventDefault()
      const options = getOptions()
      const index = options.findIndex((option) => option === document.activeElement)
      if (key === 'Home' || (key === 'ArrowDown' && index < 0)) options[0]?.focus()
      else if (key === 'End' || (key === 'ArrowUp' && index < 0)) options.at(-1)?.focus()
      else
        options[(index + (key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus()
    })
  }
}

function enhanceCopyButtons() {
  for (let button of document.querySelectorAll<HTMLButtonElement>('[data-site-copy]')) {
    if (!navigator.clipboard) continue
    button.hidden = false
    if (!wireOnce(button)) continue
    button.addEventListener('click', async () => {
      let box = button.closest('.site-code, .site-copy-action')
      let code = button.dataset.siteCopyText ?? box?.querySelector('code')?.textContent
      let status = box?.querySelector('[data-site-copy-status]')
      if (!code || !status) return
      try {
        await navigator.clipboard.writeText(code)
        status.textContent = 'Code copied.'
        button.title = 'Copied'
        play('success')
      } catch {
        status.textContent = 'Copy failed.'
        playCopyError()
      }
    })
  }

  for (let shortcut of document.querySelectorAll<HTMLElement>('[data-site-shortcut]')) {
    shortcut.hidden = false
  }
}

const navStorageKey = 'reflow_collapsed_nav_groups'

function readCollapsedNavGroups(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(navStorageKey) ?? '[]')
    return new Set(
      Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [],
    )
  } catch {
    return new Set()
  }
}

function writeCollapsedNavGroups(ids: ReadonlySet<string>) {
  try {
    localStorage.setItem(navStorageKey, JSON.stringify([...ids]))
  } catch {
    // Storage may be unavailable in private browsing.
  }
}

function restoreNavGroups() {
  const collapsed = readCollapsedNavGroups()
  for (const group of document.querySelectorAll<HTMLDetailsElement>('details[data-nav-group]')) {
    const id = group.dataset.navGroup
    if (!id) continue
    const hasCurrent = Boolean(group.querySelector('a[aria-current="page"]'))
    group.open = hasCurrent || !collapsed.has(id)
  }
}

function toggleNavGroup(event: MouseEvent) {
  if (event.defaultPrevented || !(event.target instanceof Element)) return
  const group = event.target.closest('details[data-nav-group] > summary')?.parentElement
  if (!(group instanceof HTMLDetailsElement) || !group.dataset.navGroup) return

  // Summary activation persists the choice. Opening an active page's group only affects this page.
  event.preventDefault()
  const id = group.dataset.navGroup
  const open = !group.open
  const collapsed = readCollapsedNavGroups()
  if (open) collapsed.delete(id)
  else collapsed.add(id)
  writeCollapsedNavGroups(collapsed)
  for (const copy of document.querySelectorAll<HTMLDetailsElement>(
    `details[data-nav-group="${CSS.escape(id)}"]`,
  )) {
    copy.open = open
  }
}

/**
 * Wires what is new on the page and re-applies what enhancement changed.
 * Runs at start and after every in-page navigation, which re-applies the
 * server's markup to the elements it keeps.
 */
export function refreshShowcase() {
  syncSoundControls()
  restoreNavGroups()
  enhanceMobileNavigation()
  pinSettingsRail()
  enhanceSettingMenus()
  enhanceCopyButtons()
}

let started = false

export function enhanceShowcase() {
  if (started) return refreshShowcase()
  started = true
  enhanceShowcaseSound()
  refreshShowcase()
  document.addEventListener('click', toggleNavGroup)
  document.addEventListener(
    'click',
    (event) => {
      if (!(event.target instanceof Node)) return
      for (const menu of settingMenus())
        if (menu.open && !menu.contains(event.target)) setMenuOpen(menu, false)
    },
    { capture: true },
  )
  const navigation = (window as Window & { navigation?: EventTarget }).navigation
  navigation?.addEventListener('navigatesuccess', () => refreshShowcase())

  window.addEventListener('keydown', (event) => {
    if (
      event.defaultPrevented ||
      document.querySelector('.site-app-workspace') ||
      event.isComposing ||
      event.altKey ||
      event.shiftKey ||
      event.metaKey ||
      event.ctrlKey
    )
      return
    const target = event.target
    if (target instanceof Element && target.closest(keyboardWidgets)) return
    if (target instanceof HTMLElement && target.isContentEditable) return

    if (target instanceof HTMLInputElement) return
    if (document.querySelector('dialog[open]:not(.site-mobile-panel)')) return
    const setting = settingRows.find(
      (row) => row.shortcut.toLowerCase() === event.key.toLowerCase(),
    )
    if (setting && !(setting.key === 'shape' && document.querySelector('.site-app-directory'))) {
      event.preventDefault()
      cycleSetting(setting.key)
      play('select')
    }
  })
}
