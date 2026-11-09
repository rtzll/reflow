import { fontStylesheet, fontWeights } from './google-fonts.ts'

export const accents = {
  red: ['#E7000B', '#FF6467'],
  orange: ['#F54900', '#FF8904'],
  amber: ['#E17100', '#FFB900'],
  yellow: ['#D08700', '#FDC700'],
  lime: ['#5EA500', '#9AE600'],
  green: ['#00A63E', '#05DF72'],
  emerald: ['#009966', '#00D492'],
  teal: ['#009689', '#00D5BE'],
  cyan: ['#0092B8', '#00D3F2'],
  sky: ['#0084D1', '#00BCFF'],
  blue: ['#6B97FF', '#6B97FF'],
  indigo: ['#4F39F6', '#7C86FF'],
  violet: ['#7F22FE', '#A684FF'],
  purple: ['#9810FA', '#C27AFF'],
  fuchsia: ['#C800DE', '#ED6AFF'],
  pink: ['#E60076', '#FB64B6'],
  rose: ['#EC003F', '#FF637E'],
} as const

export const settingRows = [
  {
    key: 'theme',
    label: 'Theme',
    shortcut: 'T',
    options: ['system', 'light', 'dark'],
    defaultValue: 'system',
  },
  {
    key: 'accent',
    label: 'Accent',
    shortcut: 'A',
    options: Object.keys(accents),
    defaultValue: 'blue',
  },
  {
    key: 'font',
    label: 'Heading font',
    shortcut: 'F',
    options: ['inter', 'geist-serif'],
    defaultValue: 'inter',
  },
  {
    key: 'fontWeight',
    label: 'Heading weight',
    shortcut: '',
    options: ['auto', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000'],
    defaultValue: 'auto',
  },
  {
    key: 'shape',
    label: 'Radius',
    shortcut: 'R',
    options: ['sharp', 'rounded', 'pill'],
    defaultValue: 'sharp',
  },
  {
    key: 'density',
    label: 'Size',
    shortcut: 'S',
    options: ['default', 'compact'],
    defaultValue: 'default',
  },
  {
    key: 'icons',
    label: 'Icons',
    shortcut: 'I',
    options: ['lucide', 'tabler', 'phosphor', 'hugeicons'],
    defaultValue: 'lucide',
  },
  {
    key: 'hover',
    label: 'Hover',
    shortcut: 'H',
    options: ['fluid', 'standard'],
    defaultValue: 'fluid',
  },
] as const

export type SettingKey = (typeof settingRows)[number]['key']
export type Settings = Record<SettingKey, string> & { customFont?: string }

export function settingLabel(value: string) {
  if (value.startsWith('google:')) return value.slice(7)
  if (value === 'hugeicons') return 'HugeIcons'
  if (value === 'geist-serif') return 'Geist Serif'
  if (value.startsWith('#')) return value.toUpperCase()
  return value[0].toUpperCase() + value.slice(1)
}

export function validSetting(key: SettingKey, value: string) {
  return (
    settingRows.find((row) => row.key === key)?.options.some((option) => option === value) ||
    (key === 'accent' && /^#[a-fA-F0-9]{6}$/.test(value)) ||
    (key === 'font' && /^google:[A-Za-z0-9][A-Za-z0-9 .'-]{0,99}$/.test(value))
  )
}

export function readSettings(search: string, cookie = ''): Settings {
  const query = new URLSearchParams(search)
  const cookies = new Map(
    cookie.split(';').map((entry) => {
      const index = entry.indexOf('=')
      const name = entry.slice(0, index).trim()
      try {
        return [name, decodeURIComponent(entry.slice(index + 1))]
      } catch {
        return [name, '']
      }
    }),
  )
  const settings = Object.fromEntries(
    settingRows.map((row) => {
      const value = query.get(row.key) ?? cookies.get(`reflow_${row.key}`) ?? row.defaultValue
      return [row.key, validSetting(row.key, value) ? value : row.defaultValue]
    }),
  ) as Settings
  const customFont = settings.font.startsWith('google:')
    ? settings.font
    : cookies.get('reflow_custom_font')
  if (customFont && validSetting('font', customFont)) settings.customFont = customFont
  return settings
}

/** Cookies that keep each valid setting in `search`, as the browser writes them. */
export function settingCookies(search: string) {
  const query = new URLSearchParams(search)
  const cookies: string[] = []
  for (const row of settingRows) {
    const value = query.get(row.key)
    if (value === null || !validSetting(row.key, value)) continue
    cookies.push(settingCookie(`reflow_${row.key}`, value))
    if (row.key === 'font' && value.startsWith('google:'))
      cookies.push(settingCookie('reflow_custom_font', value))
  }
  return cookies
}

function settingCookie(name: string, value: string) {
  return `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`
}

/** Removes every setting from `search`, keeping other parameters. */
export function withoutSettings(search: string) {
  const query = new URLSearchParams(search)
  for (const row of settingRows) query.delete(row.key)
  const rest = query.toString()
  return rest ? `?${rest}` : ''
}

/** Whether every setting is at its default. */
export function atDefaults(settings: Partial<Record<SettingKey, string>>) {
  return settingRows.every((row) => (settings[row.key] ?? row.defaultValue) === row.defaultValue)
}

/** Returns every setting to its default, as if chosen in the panel. */
export function resetSettings() {
  for (const row of settingRows)
    if (document.documentElement.dataset[row.key] !== row.defaultValue)
      applySetting(row.key, row.defaultValue)
}

/** A link to `href` that carries the settings that differ from the defaults. */
export function sharedSettingsHref(href: string, settings: Partial<Record<SettingKey, string>>) {
  const url = new URL(href)
  url.hash = ''
  for (const row of settingRows) {
    const value = settings[row.key]
    if (value && value !== row.defaultValue && validSetting(row.key, value))
      url.searchParams.set(row.key, value)
  }
  return url.href
}

export function accentCss(value: string) {
  if (/^#[a-fA-F0-9]{6}$/.test(value)) return value
  const [light, dark] = accents[value as keyof typeof accents] ?? accents.blue
  return `light-dark(${light}, ${dark})`
}

export function applySetting(key: SettingKey, value: string) {
  if (!validSetting(key, value)) return
  document.documentElement.dataset[key] = value
  if (key === 'font') {
    const family = value.startsWith('google:') ? value.slice(7) : undefined
    if (family) {
      document.documentElement.style.setProperty('--rf-heading-font', JSON.stringify(family))
      document.documentElement.dataset.customFont = value
      document.cookie = settingCookie('reflow_custom_font', value)
      for (const choice of document.querySelectorAll<HTMLButtonElement>('[data-font-current]')) {
        choice.hidden = false
        choice.dataset.value = value
        const label = choice.querySelector('[data-font-name]')
        if (label) label.textContent = family
      }
    } else document.documentElement.style.removeProperty('--rf-heading-font')
    for (const row of document.querySelectorAll<HTMLElement>('[data-font-weight-row]'))
      row.hidden = !family
    document.getElementById('reflow-custom-font')?.remove()
    if (family)
      void import('./google-font-catalog.ts').then(({ fontCatalog }) => {
        if (document.documentElement.dataset.font !== value) return
        const font = fontCatalog.find((entry) => entry.n === family)
        if (!font) return
        const weights = fontWeights(font).map(String)
        document.documentElement.dataset.fontWeights = weights.join(',')
        for (const option of document.querySelectorAll<HTMLButtonElement>(
          '[data-setting="fontWeight"]',
        )) {
          option.hidden =
            option.dataset.value !== 'auto' && !weights.includes(option.dataset.value ?? '')
        }
        const link = document.createElement('link')
        link.id = 'reflow-custom-font'
        link.rel = 'stylesheet'
        link.href = fontStylesheet(font)
        document.head.append(link)
      })
  }
  if (key === 'fontWeight') {
    if (value === 'auto') document.documentElement.style.removeProperty('--rf-heading-weight')
    else document.documentElement.style.setProperty('--rf-heading-weight', value)
  }
  if (key === 'accent') document.documentElement.style.setProperty('--rf-accent', accentCss(value))
  document.cookie = settingCookie(`reflow_${key}`, value)
  const row = settingRows.find((row) => row.key === key)!
  for (const trigger of document.querySelectorAll<HTMLElement>(`[data-setting-trigger="${key}"]`)) {
    const label = trigger.querySelector('[data-setting-label]')
    if (label) label.textContent = settingLabel(value)
    trigger.setAttribute('aria-label', `${row.label}: ${settingLabel(value)}`)
    const icon = trigger.querySelector<HTMLElement>('[data-setting-icon]')
    if (icon) icon.dataset.value = value
  }
  for (const option of document.querySelectorAll<HTMLElement>(`[data-setting="${key}"]`)) {
    option.setAttribute('aria-checked', String(option.dataset.value === value))
  }
  window.dispatchEvent(new CustomEvent('reflow:settings-change', { detail: { key, value } }))
}
