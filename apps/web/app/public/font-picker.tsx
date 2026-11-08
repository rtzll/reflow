import { Dialog, Input, Select } from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { applySetting } from './site-settings.ts'
import { fontCategories, fontWeights, popularFonts, type GoogleFont } from './google-fonts.ts'

export const FontPicker = clientEntry(import.meta.url, function FontPicker(handle: Handle) {
  let open = false
  let selected = ''
  let invoker: HTMLElement | null = null
  function browse(trigger: Element) {
    invoker = trigger.closest('[data-setting-menu]')?.querySelector('summary') ?? null
    selected = document.documentElement.dataset.font?.slice(7) ?? ''
    open = true
    handle.update()
  }
  const listen = ref((_element, signal) => {
    document.addEventListener(
      'click',
      (event) => {
        const trigger =
          event.target instanceof Element ? event.target.closest('[data-font-browse]') : null
        if (!trigger) return
        browse(trigger)
      },
      { signal },
    )
  })
  function close() {
    open = false
    handle.update()
    handle.queueTask(() => invoker?.focus({ preventScroll: true }))
  }
  function choose(font: GoogleFont) {
    applySetting('font', `google:${font.n}`)
    const current = document.documentElement.dataset.fontWeight
    const available = fontWeights(font)
    if (current && current !== 'auto') {
      const closest = available.reduce((best, weight) =>
        Math.abs(weight - Number(current)) < Math.abs(best - Number(current)) ? weight : best,
      )
      applySetting('fontWeight', String(closest))
    }
    close()
  }
  return () => (
    <div class="site-font-picker" mix={listen}>
      <FontPickerDialog open={open} selected={selected} onClose={close} onChoose={choose} />
    </div>
  )
})

export function FontPickerDialog(
  handle: Handle<{
    open: boolean
    selected: string
    onClose: () => void
    onChoose: (font: GoogleFont) => void
  }>,
) {
  let fonts: GoogleFont[] = []
  let query = ''
  let category = 'all'
  let limit = 60
  let failure = false
  const loadCatalog = ref(async () => {
    if (fonts.length) return
    failure = false
    try {
      fonts = (await import('./google-font-catalog.ts')).fontCatalog
    } catch {
      failure = true
    }
    if (!handle.signal.aborted) handle.update()
  })
  return () => {
    const { open, selected, onClose, onChoose } = handle.props
    const matches = fonts.filter(
      (font) =>
        font.n.toLowerCase().includes(query.toLowerCase()) &&
        (category === 'all' || font.c === category),
    )
    if (!query && category === 'all')
      matches.sort((a, b) => {
        const rank = (name: string) =>
          popularFonts.includes(name) ? popularFonts.indexOf(name) : Infinity
        return rank(a.n) - rank(b.n)
      })
    return (
      <Dialog
        title="Heading fonts"
        description="Choose a Google Fonts family. The selected font loads from Google Fonts; Inter and Geist Serif are bundled locally."
        size="lg"
        open={open}
        onOpenChange={(value) => {
          if (!value) onClose()
        }}
      >
        {open && (
          <>
            <div class="site-font-filters" mix={loadCatalog}>
              <Input
                type="search"
                aria-label="Search font families"
                placeholder="Search Google Fonts…"
                value={query}
                mix={on<HTMLInputElement, 'input'>('input', (event) => {
                  query = event.currentTarget.value
                  limit = 60
                  handle.update()
                })}
              />
              <Select
                label="Font category"
                value={category}
                options={[
                  { value: 'all', label: 'All styles' },
                  ...Object.entries(fontCategories).map(([value, label]) => ({ value, label })),
                ]}
                onValueChange={(value) => {
                  category = value ?? 'all'
                  limit = 60
                  handle.update()
                }}
              />
            </div>
            <div class="site-font-results rf-scroll-area" role="list" aria-label="Font families">
              {matches.slice(0, limit).map((font) => (
                <div role="listitem" key={font.n}>
                  <button
                    type="button"
                    aria-pressed={font.n === selected}
                    mix={on('click', () => onChoose(font))}
                  >
                    <span
                      style={{
                        fontFamily: font.n === selected ? JSON.stringify(font.n) : undefined,
                      }}
                    >
                      {font.n}
                    </span>
                    <small>{font.c ? fontCategories[font.c] : 'Font family'}</small>
                    <span aria-hidden="true">{font.n === selected ? '✓' : '↗'}</span>
                  </button>
                </div>
              ))}
              {matches.length > limit && (
                <button
                  class="site-button site-button-tertiary"
                  type="button"
                  mix={on('click', () => {
                    limit += 60
                    handle.update()
                  })}
                >
                  Show more fonts
                </button>
              )}
              {!fonts.length && (
                <p role="status">
                  {failure ? 'The font catalog could not load.' : 'Loading font catalog…'}
                </p>
              )}
              {fonts.length > 0 && matches.length === 0 && (
                <p role="status">No matching font families.</p>
              )}
            </div>
            <p class="site-font-count" role="status">
              {matches.length} families
            </p>
          </>
        )}
      </Dialog>
    )
  }
}
