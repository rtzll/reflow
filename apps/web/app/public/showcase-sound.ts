import { play, setEnabled, setVolume, unlock } from 'cuelume'
import { readSettingCookies, settingCookie, soundPreferenceKey } from './site-settings.ts'

function saveSoundCookie(value: 'on' | 'off') {
  try {
    document.cookie = settingCookie(soundPreferenceKey, value)
  } catch {
    // The in-page setting and local storage still work when cookies are blocked.
  }
}

function readSoundEnabled() {
  try {
    const value = readSettingCookies(document.cookie).get(soundPreferenceKey)
    if (value === 'on' || value === 'off') return value === 'on'
  } catch {
    // Fall back to the browser's local storage.
  }
  try {
    const value = localStorage.getItem(soundPreferenceKey)
    if (value === 'on' || value === 'off') {
      saveSoundCookie(value)
      return value === 'on'
    }
  } catch {
    // Use the default when storage is unavailable.
  }
  return true
}

export function playCopyError() {
  play('error', { emphasis: 'subtle' })
}

export function playCopySuccess() {
  play('success', { emphasis: 'subtle' })
}

const toastCues = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'attention',
  default: 'attention',
} as const

function playToast(toast: Element) {
  const status = toast.getAttribute('data-status')
  if (status && status in toastCues)
    play(toastCues[status as keyof typeof toastCues], { emphasis: 'subtle' })
}

// A cue for each toast as it arrives, and for a loading toast as it settles.
function bindToastSounds() {
  const region = document.querySelector('.rf-toaster-region')
  if (!region) return
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'childList') {
        for (const node of record.addedNodes)
          if (node instanceof Element && node.matches('.rf-toast')) playToast(node)
      } else if (
        record.target instanceof Element &&
        record.target.matches('.rf-toast:not([data-removed])') &&
        record.oldValue !== record.target.getAttribute('data-status')
      ) {
        playToast(record.target)
      }
    }
  })
  observer.observe(region, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-status'],
    attributeOldValue: true,
  })
}

function bindInputCopyErrors() {
  const main = document.querySelector('#main')
  if (!main) return
  // InputCopy exposes the outcome on its root after the clipboard request settles.
  const observer = new MutationObserver((records) => {
    for (const { target, oldValue } of records) {
      if (
        oldValue !== 'error' &&
        target instanceof Element &&
        target.matches('[data-slot="input-copy"][data-state="error"]')
      ) {
        playCopyError()
      }
    }
  })
  observer.observe(main, {
    subtree: true,
    attributes: true,
    attributeFilter: ['data-state'],
    attributeOldValue: true,
  })
}

const sliderKeys = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
])

function sliderCue(slider: Element | null | undefined) {
  if (!slider) return
  const thumbs = [...slider.querySelectorAll<HTMLInputElement>('input[type="range"]:enabled')]
  if (!thumbs.length) return
  const initialValues = thumbs.map((thumb) => thumb.valueAsNumber)
  return () => {
    // The slider renders its new range values after handling the gesture.
    requestAnimationFrame(() => {
      if (!slider.isConnected) return
      const changed = thumbs.findIndex(
        (thumb, index) => thumb.valueAsNumber !== initialValues[index],
      )
      if (changed === -1) return
      play('select', {
        emphasis: 'subtle',
        volume: 0.35,
        direction: thumbs[changed].valueAsNumber > initialValues[changed] ? 'forward' : 'back',
      })
    })
  }
}

function bindSliderSounds() {
  let drag: { id: number; slider: Element; finish: () => void } | undefined
  const keyAdjustments = new Map<string, { input: Element; finish: () => void }>()
  const edits = new WeakMap<Element, () => void>()

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary || event.button !== 0 || !(event.target instanceof Element)) return
      const track = event.target.closest('.site-preview-stage .rf-slider-track')
      const slider = track?.closest('.rf-slider')
      const finish = sliderCue(slider)
      if (slider && finish) drag = { id: event.pointerId, slider, finish }
    },
    { capture: true },
  )
  document.addEventListener('pointerup', (event) => {
    if (drag?.id !== event.pointerId) return
    drag.finish()
    drag = undefined
  })
  document.addEventListener('pointercancel', (event) => {
    if (drag?.id === event.pointerId) drag = undefined
  })
  document.addEventListener(
    'keydown',
    (event) => {
      const input = event.target
      if (!(input instanceof HTMLInputElement) || !sliderKeys.has(event.key) || event.repeat) return
      if (event.altKey || event.ctrlKey || event.metaKey || input.type !== 'range') return
      const finish = sliderCue(input.closest('.site-preview-stage .rf-slider'))
      if (finish) keyAdjustments.set(event.key, { input, finish })
    },
    { capture: true },
  )
  document.addEventListener('keyup', (event) => {
    const adjustment = keyAdjustments.get(event.key)
    keyAdjustments.delete(event.key)
    if (adjustment?.input === event.target) adjustment.finish()
  })
  document.addEventListener('input', (event) => {
    const input = event.target
    if (!(input instanceof HTMLInputElement) || input.type !== 'number' || edits.has(input)) return
    const finish = sliderCue(input.closest('.site-preview-stage .rf-slider'))
    if (finish) edits.set(input, finish)
  })
  document.addEventListener('focusout', (event) => {
    const input = event.target
    if (!(input instanceof HTMLInputElement)) return
    if (input.closest('.rf-slider') !== drag?.slider) edits.get(input)?.()
    edits.delete(input)
  })
}

export function enhanceShowcaseSound() {
  const shortcut = document.querySelector<HTMLButtonElement>('[data-site-sound]')
  const switches = document.querySelectorAll<HTMLInputElement>('[data-site-sound-switch]')
  if (!shortcut && !switches.length) return

  let enabled = readSoundEnabled()

  const applyPreference = () => {
    setEnabled(enabled)
    for (const control of switches) control.checked = enabled
    if (shortcut) {
      shortcut.setAttribute('aria-pressed', String(enabled))
      shortcut.title = enabled ? 'Mute showcase sound' : 'Enable showcase sound'
    }
  }

  function changePreference(next: boolean) {
    enabled = next
    applyPreference()
    const value = enabled ? 'on' : 'off'
    saveSoundCookie(value)
    try {
      localStorage.setItem(soundPreferenceKey, value)
    } catch {
      // Keep the current setting in memory.
    }
    if (enabled) {
      void unlock()
      play('toggle')
    }
  }

  setVolume(0.35)
  applyPreference()
  if (shortcut) {
    shortcut.addEventListener('click', () => changePreference(!enabled))
    shortcut.disabled = false
  }
  for (const control of switches) {
    control.addEventListener('change', () => changePreference(control.checked))
    control.disabled = false
  }

  // Some cues follow async work. Unlock audio while the first gesture is active.
  const activation = new AbortController()
  const unlockFromGesture = (event: Event) => {
    if (!enabled || !event.isTrusted || !(event.target instanceof Element)) return
    if (event.target.closest('[data-site-sound], .site-sound-setting')) return
    void unlock().then((ready) => {
      if (ready) activation.abort()
    })
  }
  const options = { capture: true, signal: activation.signal }
  document.addEventListener('click', unlockFromGesture, options)
  document.addEventListener('keydown', unlockFromGesture, options)

  document.addEventListener('change', (event) => {
    const input = event.target
    if (!(input instanceof Element) || !input.closest('.site-preview-stage')) return
    if (input.matches('[data-site-sound-switch]')) return
    if (input instanceof HTMLInputElement && input.type === 'checkbox') {
      play('toggle', { direction: input.checked ? 'forward' : 'back' })
    } else if (input.matches('select, input[type="radio"]')) {
      play('select')
    }
  })
  document.addEventListener('rmx:tabs-change', (event) => {
    if (event.target instanceof Element && event.target.closest('.site-preview-stage .rf-tabs'))
      play('select', { emphasis: 'subtle' })
  })
  document.addEventListener('rmx:accordion-change', (event) => {
    if (
      !(event.target instanceof Element) ||
      !event.target.closest('.site-preview-stage .rf-accordion')
    )
      return
    const { itemValue, value } = event as HTMLElementEventMap['rmx:accordion-change']
    const opening = Array.isArray(value) ? value.includes(itemValue) : value === itemValue
    play(opening ? 'open' : 'close', { emphasis: 'subtle' })
  })
  document.addEventListener(
    'toggle',
    (event) => {
      const dialog = event.target
      if (dialog instanceof HTMLDialogElement && dialog.matches('.rf-dialog')) {
        play(dialog.open ? 'open' : 'close')
      } else if (
        event instanceof ToggleEvent &&
        dialog instanceof HTMLElement &&
        // Hover card previews share the surface but stay silent.
        dialog.matches('.rf-popover-surface:not(.rf-hover-card)') &&
        dialog.closest('.site-preview-stage')
      ) {
        play(event.newState === 'open' ? 'open' : 'close', { emphasis: 'subtle' })
      }
    },
    { capture: true },
  )
  bindSliderSounds()
  bindInputCopyErrors()
  bindToastSounds()
}
