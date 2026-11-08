import { ColorPicker } from '@rtzll/reflow'
import { clientEntry, ref, type Handle } from 'remix/component'
import { accents, applySetting, settingLabel } from './site-settings.ts'

function accentHex(value: string, dark: boolean) {
  if (value.startsWith('#')) return value
  return (accents[value as keyof typeof accents] ?? accents.blue)[dark ? 1 : 0]
}

export const AccentPicker = clientEntry(
  import.meta.url,
  function AccentPicker(handle: Handle<{ accent: string; theme: string }>) {
    let accent = handle.props.accent
    let dark = handle.props.theme === 'dark'
    let value: string = accentHex(accent, dark)
    const mount = ref((_node, signal) => {
      const scheme = matchMedia('(prefers-color-scheme: dark)')
      const synchronize = (event?: Event) => {
        const key = (event as CustomEvent<{ key?: string }> | undefined)?.detail?.key
        if (key && key !== 'accent' && key !== 'theme') return
        const root = document.documentElement.dataset
        const nextAccent = root.accent ?? handle.props.accent
        const nextDark = root.theme === 'dark' || (root.theme === 'system' && scheme.matches)
        if (nextAccent === accent && nextDark === dark) return
        accent = nextAccent
        dark = nextDark
        value = accentHex(accent, dark)
        handle.update()
      }
      synchronize()
      scheme.addEventListener('change', synchronize, { signal })
      window.addEventListener('reflow:settings-change', synchronize, { signal })
    })
    return () => (
      <div mix={mount}>
        <ColorPicker
          label="Accent color"
          value={value}
          swatches={Object.entries(accents).map(([key, shades]) => ({
            color: shades[dark ? 1 : 0],
            label: settingLabel(key),
          }))}
          onValueChange={(_formatted, parsed) => {
            const opaque = parsed.hex.slice(0, 7).toUpperCase()
            accent =
              Object.entries(accents).find(
                ([, shades]) => shades[dark ? 1 : 0].toUpperCase() === opaque,
              )?.[0] ?? opaque
            value = parsed.hex
            if (document.documentElement.dataset.accent !== accent) applySetting('accent', accent)
            handle.update()
          }}
        />
      </div>
    )
  },
)
