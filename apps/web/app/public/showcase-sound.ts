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

function bindCopyErrors() {
  const main = document.querySelector('#main')
  if (!main) return
  // InputCopy and CodeBlock expose the outcome on their root after the clipboard request settles.
  const observer = new MutationObserver((records) => {
    for (const { target, oldValue } of records) {
      if (
        oldValue !== 'error' &&
        target instanceof Element &&
        target.matches(
          ':is([data-slot="input-copy"], [data-slot="code-block"])[data-state="error"]',
        )
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

function bindNumberSounds() {
  let pointer: { id: number; input: HTMLInputElement; value: number } | undefined
  let key: { input: HTMLInputElement; value: number } | undefined
  const initial = new WeakMap<HTMLInputElement, number>()
  function finish(input: HTMLInputElement, value: number) {
    requestAnimationFrame(() => {
      const next = input.valueAsNumber
      if (Number.isFinite(next) && Number.isFinite(value) && next !== value)
        play('select', {
          emphasis: 'subtle',
          volume: 0.35,
          direction: next > value ? 'forward' : 'back',
        })
      initial.set(input, next)
    })
  }
  document.addEventListener('focusin', (event) => {
    const input = event.target
    if (
      input instanceof HTMLInputElement &&
      input.type === 'number' &&
      input.closest('.site-preview-stage') &&
      !input.closest('.rf-slider')
    )
      initial.set(input, input.valueAsNumber)
  })
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary || event.button !== 0 || !(event.target instanceof Element)) return
      const target = event.target.closest(
        '.site-preview-stage .rf-number-scrub, .site-preview-stage [data-slot="input-number"] button',
      )
      const input = target
        ?.closest('.rf-field')
        ?.querySelector<HTMLInputElement>('input[type="number"]')
      if (input && !input.disabled && !input.readOnly)
        pointer = { id: event.pointerId, input, value: input.valueAsNumber }
    },
    { capture: true },
  )
  document.addEventListener('pointerup', (event) => {
    if (pointer?.id !== event.pointerId) return
    finish(pointer.input, pointer.value)
    pointer = undefined
  })
  document.addEventListener('pointercancel', () => {
    pointer = undefined
  })
  document.addEventListener(
    'keydown',
    (event) => {
      const input = event.target
      if (
        !(input instanceof HTMLInputElement) ||
        input.type !== 'number' ||
        !input.closest('.site-preview-stage') ||
        input.closest('.rf-slider') ||
        !['ArrowUp', 'ArrowDown'].includes(event.key) ||
        event.repeat
      )
        return
      key = { input, value: input.valueAsNumber }
    },
    { capture: true },
  )
  document.addEventListener('keyup', (event) => {
    if (!key || event.target !== key.input || !['ArrowUp', 'ArrowDown'].includes(event.key)) return
    finish(key.input, key.value)
    key = undefined
  })
  document.addEventListener('focusout', (event) => {
    const input = event.target
    if (!(input instanceof HTMLInputElement) || !initial.has(input)) return
    if (pointer?.input !== input && key?.input !== input) finish(input, initial.get(input)!)
    initial.delete(input)
  })
}

function bindColorSquareSounds() {
  let pointer: { id: number; square: Element; value: string | null } | undefined
  let key: { square: Element; value: string | null } | undefined
  function finish(square: Element, value: string | null) {
    requestAnimationFrame(() => {
      if (square.isConnected && square.getAttribute('aria-valuetext') !== value)
        play('select', { emphasis: 'subtle', volume: 0.35 })
    })
  }
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary || event.button !== 0 || !(event.target instanceof Element)) return
      const square = event.target.closest('.site-preview-stage .rf-color-square')
      if (square && square.getAttribute('tabindex') !== '-1')
        pointer = { id: event.pointerId, square, value: square.getAttribute('aria-valuetext') }
    },
    { capture: true },
  )
  document.addEventListener('pointerup', (event) => {
    if (pointer?.id !== event.pointerId) return
    finish(pointer.square, pointer.value)
    pointer = undefined
  })
  document.addEventListener('pointercancel', () => {
    pointer = undefined
  })
  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.repeat ||
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) ||
        !(event.target instanceof Element)
      )
        return
      const square = event.target.closest('.site-preview-stage .rf-color-square')
      if (square && square.getAttribute('tabindex') !== '-1')
        key = { square, value: square.getAttribute('aria-valuetext') }
    },
    { capture: true },
  )
  document.addEventListener('keyup', (event) => {
    if (
      !key ||
      event.target !== key.square ||
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
    )
      return
    finish(key.square, key.value)
    key = undefined
  })
}

let enabled = true
let soundStarted = false
const boundSoundControls = new WeakSet<Element>()
const silentDialogClose = new WeakSet<HTMLDialogElement>()

function changePreference(next: boolean) {
  enabled = next
  syncSoundControls()
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

/**
 * Wires any sound control not yet wired and shows the current preference on
 * all of them. In-page navigations re-apply the server's markup, which
 * disables the button again, so this runs after each one too.
 */
export function syncSoundControls() {
  if (!soundStarted) return
  setEnabled(enabled)
  for (const shortcut of document.querySelectorAll<HTMLButtonElement>('[data-site-sound]')) {
    if (!boundSoundControls.has(shortcut)) {
      boundSoundControls.add(shortcut)
      shortcut.addEventListener('click', () => changePreference(!enabled))
    }
    shortcut.disabled = false
    shortcut.setAttribute('aria-pressed', String(enabled))
    shortcut.title = enabled ? 'Mute showcase sound' : 'Enable showcase sound'
  }
  for (const control of document.querySelectorAll<HTMLInputElement>('[data-site-sound-switch]')) {
    if (!boundSoundControls.has(control)) {
      boundSoundControls.add(control)
      control.addEventListener('change', () => changePreference(control.checked))
    }
    control.disabled = false
    control.checked = enabled
  }
}

export function enhanceShowcaseSound() {
  if (soundStarted) return syncSoundControls()
  const shortcut = document.querySelector<HTMLButtonElement>('[data-site-sound]')
  const switches = document.querySelectorAll<HTMLInputElement>('[data-site-sound-switch]')
  if (!shortcut && !switches.length) return
  soundStarted = true
  enabled = readSoundEnabled()
  setVolume(0.35)
  syncSoundControls()

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

  // Carousel: the buttons and dots navigate; autoplay stays silent.
  document.addEventListener(
    'click',
    (event) => {
      const button =
        event.target instanceof Element
          ? event.target.closest('.site-preview-stage .rf-carousel-controls button')
          : null
      if (!button || button.matches('.rf-carousel-play, :disabled')) return
      const dots = [
        ...(button.closest('.rf-carousel-controls')?.querySelectorAll('.rf-carousel-dots button') ??
          []),
      ]
      const current = dots.findIndex((dot) => dot.getAttribute('aria-current') === 'true')
      const target = dots.indexOf(button)
      if (target === current) return
      const back =
        button.getAttribute('aria-label') === 'Previous slide' || (target >= 0 && target < current)
      play('navigate', { emphasis: 'subtle', direction: back ? 'back' : 'forward' })
    },
    { capture: true },
  )
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
  document.addEventListener('reflow:trigger-select', (event) => {
    if (event.target instanceof Element && event.target.closest('.site-preview-stage'))
      play('select', { emphasis: 'subtle' })
  })
  document.addEventListener('reflow:command-select', (event) => {
    if (!(event.target instanceof Element) || !event.target.closest('.site-preview-stage')) return
    const dialog = event.target.closest('dialog')
    if (dialog) silentDialogClose.add(dialog)
    play('select', { emphasis: 'subtle' })
  })
  document.addEventListener('reflow:carousel-navigation', (event) => {
    if (!(event.target instanceof Element) || !event.target.closest('.site-preview-stage')) return
    play('navigate', {
      emphasis: 'subtle',
      direction: (event as CustomEvent<string>).detail === 'back' ? 'back' : 'forward',
    })
  })
  document.addEventListener('reflow:question', (event) => {
    if (!(event.target instanceof Element) || !event.target.closest('.site-preview-stage')) return
    const cue = (event as CustomEvent<string>).detail
    if (cue === 'back') play('navigate', { emphasis: 'subtle', direction: 'back' })
    else if (
      cue === 'navigate' ||
      cue === 'select' ||
      cue === 'toggle' ||
      cue === 'success' ||
      cue === 'error'
    )
      play(cue, { emphasis: 'subtle' })
  })
  document.addEventListener('reflow:message-send', (event) => {
    if (event.target instanceof Element && event.target.closest('.site-preview-stage'))
      play('tap', { emphasis: 'subtle' })
  })
  document.addEventListener('reflow:message-error', (event) => {
    if (event.target instanceof Element && event.target.closest('.site-preview-stage'))
      play('error', { emphasis: 'subtle' })
  })
  document.addEventListener('reflow:queue-reorder', (event) => {
    if (event.target instanceof Element && event.target.closest('.site-preview-stage'))
      play('select', { emphasis: 'subtle' })
  })
  document.addEventListener(
    'click',
    (event) => {
      if (!(event.target instanceof Element)) return
      const button = event.target.closest<HTMLButtonElement>(
        '.site-preview-stage .rf-queue-wrap button',
      )
      if (!button || button.disabled) return
      const action = button.dataset.queueAction
      if (button.matches('.rf-queue-toggle'))
        play(button.getAttribute('aria-expanded') === 'true' ? 'close' : 'open', {
          emphasis: 'subtle',
        })
      else if (action === 'up' || action === 'down')
        play('select', { emphasis: 'subtle', direction: action === 'up' ? 'back' : 'forward' })
      else if (action === 'remove') play('close', { emphasis: 'subtle' })
      else if (action === 'send') play('tap', { emphasis: 'subtle' })
    },
    { capture: true },
  )
  document.addEventListener('click', (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest(
        '.site-preview-stage .rf-composer-send[aria-label="Stop response"]:not(:disabled)',
      )
    )
      play('close', { emphasis: 'subtle' })
  })
  document.addEventListener('reflow:files', (event) => {
    if (!(event.target instanceof Element) || !event.target.closest('.site-preview-stage')) return
    const cue = (event as CustomEvent<string>).detail
    if (cue === 'select' || cue === 'close' || cue === 'warning' || cue === 'error')
      play(cue, { emphasis: 'subtle' })
  })
  document.addEventListener('rmx:select-change', (event) => {
    if (event.target instanceof Element && event.target.closest('.site-preview-stage .rf-select'))
      play('select', { emphasis: 'subtle' })
  })
  document.addEventListener(
    'click',
    (event) => {
      if (!(event.target instanceof Element)) return
      const button = event.target.closest<HTMLButtonElement>(
        '.site-preview-stage .rf-calendar button, .site-preview-stage .rf-color-swatch, .site-preview-stage .rf-date-presets button, .site-preview-stage .rf-date-clear',
      )
      if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return
      if (button.matches('.rf-calendar-nav'))
        play('navigate', {
          emphasis: 'subtle',
          direction: button.dataset.direction === 'previous' ? 'back' : 'forward',
        })
      else if (button.matches('.rf-date-clear')) play('close', { emphasis: 'subtle' })
      else if (
        button.matches('.rf-calendar-day') ||
        (button.matches('.rf-date-presets button') &&
          button.getAttribute('aria-pressed') !== 'true') ||
        (button.matches('.rf-color-swatch') && button.getAttribute('aria-pressed') !== 'true')
      )
        play('select', { emphasis: 'subtle' })
    },
    { capture: true },
  )
  document.addEventListener('rmx:menu-select', (event) => {
    if (!(event.target instanceof Element) || !event.target.closest('.site-preview-stage')) return
    const { item } = event as Event & { item: { type: string; checked?: boolean } }
    play(item.type === 'checkbox' ? 'toggle' : 'select', {
      emphasis: 'subtle',
      direction: item.checked === false ? 'back' : 'forward',
    })
  })
  document.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('.site-preview-stage .rf-pagination a')
        : null
    if (!link || link.getAttribute('aria-current') === 'page') return
    const current = Number(
      link
        .closest('.rf-pagination')
        ?.querySelector('[aria-current="page"]')
        ?.getAttribute('aria-label')
        ?.match(/\d+/)?.[0],
    )
    const label = link.getAttribute('aria-label') ?? ''
    const target = Number(label.match(/\d+/)?.[0])
    play('navigate', {
      emphasis: 'subtle',
      direction: label === 'Previous page' || (target && target < current) ? 'back' : 'forward',
    })
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
      if (dialog instanceof HTMLDialogElement && dialog.matches('.rf-dialog, .rf-drawer')) {
        if (!dialog.open && silentDialogClose.delete(dialog)) return
        if (dialog.open) silentDialogClose.delete(dialog)
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
  bindNumberSounds()
  bindColorSquareSounds()
  bindCopyErrors()
  bindToastSounds()
}
