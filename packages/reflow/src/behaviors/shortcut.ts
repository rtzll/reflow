// Parse, format and match keyboard shortcuts written as `⌘K` or `Alt+T`.
// Remix UI has no shortcut handling; Dropdown, CommandMenu and Toaster share this.

/** Split modifier symbols and named keys while retaining a trailing plus key. */
export function shortcutKeys(shortcut: string) {
  return shortcut.match(/[⌘⌥⇧⌃]|[^⌘⌥⇧⌃+\s]+|\+(?=$)/g) ?? []
}

const modifiers: Record<string, string> = {
  mod: 'mod',
  cmd: 'meta',
  command: 'meta',
  meta: 'meta',
  win: 'meta',
  super: 'meta',
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  shift: 'shift',
}
const keyAliases: Record<string, string> = {
  esc: 'escape',
  return: 'enter',
  space: ' ',
  spacebar: ' ',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  del: 'delete',
  plus: '+',
}
const capLabels: Record<string, [mac: string, other: string]> = {
  mod: ['⌘', 'Ctrl'],
  meta: ['⌘', 'Win'],
  ctrl: ['⌃', 'Ctrl'],
  alt: ['⌥', 'Alt'],
  shift: ['⇧', 'Shift'],
  enter: ['↵', 'Enter'],
  escape: ['Esc', 'Esc'],
  backspace: ['⌫', 'Backspace'],
  delete: ['⌦', 'Del'],
  tab: ['⇥', 'Tab'],
  ' ': ['Space', 'Space'],
  arrowup: ['↑', '↑'],
  arrowdown: ['↓', '↓'],
  arrowleft: ['←', '←'],
  arrowright: ['→', '→'],
}
const preformatted = /^[⌘⌃⌥⇧↵⌫⌦⇥↑↓←→]+[A-Za-z0-9]?$/

function tokens(shortcut: string) {
  const parts = shortcut
    .trim()
    .split('+')
    .map((part) => part.trim())
  const out: string[] = []
  for (let index = 0; index < parts.length; index++) {
    if (parts[index] === '' && index > 0) {
      if (out[out.length - 1] !== '+') out.push('+')
      continue
    }
    if (parts[index] !== '') out.push(parts[index])
  }
  return out
}

/** The caps a combo displays: `mod+shift+f` is ⌘ ⇧ F on a Mac and Ctrl Shift F elsewhere. Pre-formatted glyphs pass through. */
export function formatShortcut(shortcut: string, mac: boolean) {
  const caps: string[] = []
  for (const token of tokens(shortcut)) {
    if (preformatted.test(token)) {
      caps.push(...Array.from(token))
      continue
    }
    const lower = token.toLowerCase()
    const name = modifiers[lower] ?? keyAliases[lower] ?? lower
    const label = capLabels[name]
    if (label) caps.push(mac ? label[0] : label[1])
    else if (name.length === 1) caps.push(name.toUpperCase())
    else caps.push(name.charAt(0).toUpperCase() + name.slice(1))
  }
  return caps
}

export interface ParsedShortcut {
  mod: boolean
  meta: boolean
  ctrl: boolean
  alt: boolean
  shift: boolean
  key: string
}

// Glyphs as hints write them. ⌘ is Command on a Mac and Ctrl elsewhere, like `mod`,
// so one hint serves every platform.
const glyphs: Record<string, string> = {
  '⌘': 'mod',
  '⌥': 'alt',
  '⇧': 'shift',
  '⌃': 'ctrl',
  '↵': 'enter',
  '⌫': 'backspace',
  '⌦': 'delete',
  '⇥': 'tab',
  '↑': 'up',
  '↓': 'down',
  '←': 'left',
  '→': 'right',
}

export function parseShortcut(shortcut: string): ParsedShortcut {
  const parsed: ParsedShortcut = {
    mod: false,
    meta: false,
    ctrl: false,
    alt: false,
    shift: false,
    key: '',
  }
  const expanded = tokens(shortcut).flatMap((token) =>
    preformatted.test(token) ? Array.from(token, (char) => glyphs[char] ?? char) : [token],
  )
  for (const token of expanded) {
    const lower = token.toLowerCase()
    const modifier = modifiers[lower]
    if (modifier) parsed[modifier as 'mod' | 'meta' | 'ctrl' | 'alt' | 'shift'] = true
    else parsed.key = keyAliases[lower] ?? lower
  }
  return parsed
}

/** Whether a keydown is the combo. The physical key stands in on non-Latin layouts or while Alt is held. */
export function matchesShortcut(
  event: Pick<KeyboardEvent, 'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>,
  parsed: ParsedShortcut,
) {
  if (parsed.key === '') return false
  const byCode =
    parsed.key.length === 1 &&
    /[a-z0-9]/.test(parsed.key) &&
    (event.altKey || !/^[a-z0-9]$/i.test(event.key)) &&
    event.code.toLowerCase() ===
      (/[a-z]/.test(parsed.key) ? `key${parsed.key}` : `digit${parsed.key}`)
  if (event.key.toLowerCase() !== parsed.key && !byCode) return false
  if (parsed.mod) {
    if (!event.metaKey && !event.ctrlKey) return false
  } else if (event.metaKey !== parsed.meta || event.ctrlKey !== parsed.ctrl) return false
  if (event.altKey !== parsed.alt) return false
  if (parsed.shift && !event.shiftKey) return false
  return true
}

export function isMacPlatform() {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  return /mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform ?? nav.platform ?? '')
}

const ariaKeyNames: Record<string, string> = {
  ' ': 'Space',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
}

/** Format a shortcut as `aria-keyshortcuts` expects, such as `Alt+Shift+V` or `Control+K`. */
export function ariaShortcut(shortcut: string) {
  const { mod, meta, ctrl, alt, shift, key } = parseShortcut(shortcut)
  if (!key) return ''
  const keyName =
    ariaKeyNames[key] ??
    (key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1))
  return [(mod || ctrl) && 'Control', meta && 'Meta', alt && 'Alt', shift && 'Shift', keyName]
    .filter(Boolean)
    .join('+')
}
