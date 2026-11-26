// Scoped keyboard shortcut and multi-key chord router (e.g. `j`, `mod+k`, `['g', 'p']`).
// Remix UI has no keymap/chord primitive.

import { matchesShortcut, parseShortcut, type ParsedShortcut } from './shortcut.ts'

export interface KeymapBinding {
  /** Single shortcut (`'j'`, `'mod+k'`, `'?'`) or ordered chord sequence (`['g', 'p']`). */
  keys: string | readonly string[]
  /** Human-readable action name for ShortcutSheet display. */
  label: string
  /** Optional section heading in ShortcutSheet. */
  group?: string
  /** Optional supporting description. */
  description?: string
  /** Allow firing while focus is inside an input, textarea, select, or contenteditable element. */
  allowInInput?: boolean
  /** Callback invoked when the shortcut or chord matches. */
  handler: (event: KeyboardEvent) => void
}

export interface KeymapOptions {
  /** Maximum milliseconds between keys in a multi-key chord. Default `900`. */
  chordTimeoutMs?: number
}

export interface KeymapEventLike {
  key: string
  code: string
  metaKey: boolean
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  defaultPrevented?: boolean
  target?: EventTarget | null
  preventDefault?: () => void
}

export function isEditableTarget(target: EventTarget | null | undefined): boolean {
  if (!target || typeof target !== 'object') return false
  const el = target as { tagName?: string; isContentEditable?: boolean }
  if (el.isContentEditable) return true
  const tag = el.tagName?.toUpperCase()
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

interface CompiledBinding {
  binding: KeymapBinding
  steps: readonly ParsedShortcut[]
  usesModifier: boolean
}

function compileBinding(binding: KeymapBinding): CompiledBinding | null {
  const rawSteps = typeof binding.keys === 'string' ? [binding.keys] : [...binding.keys]
  const steps = rawSteps.map((step) => parseShortcut(step)).filter((parsed) => parsed.key !== '')
  if (steps.length === 0) return null
  const first = steps[0]!
  const usesModifier = first.mod || first.meta || first.ctrl || first.alt
  return { binding, steps, usesModifier }
}

/**
 * Creates a stateful shortcut and chord matcher suitable for document or
 * region-scoped `keydown` listeners, with automatic input suppression and
 * chord timeout reset.
 */
export function createKeymap(bindings: readonly KeymapBinding[], options: KeymapOptions = {}) {
  const chordTimeoutMs = options.chordTimeoutMs ?? 900
  const compiled = bindings
    .map(compileBinding)
    .filter((entry): entry is CompiledBinding => entry !== null)

  let pendingKeys: KeymapEventLike[] = []
  let lastKeyAt = 0

  function reset() {
    pendingKeys = []
    lastKeyAt = 0
  }

  function handleKeyDown(event: KeymapEventLike, now = Date.now()): boolean {
    if (event.defaultPrevented) return false
    const editable = isEditableTarget(event.target)

    if (pendingKeys.length > 0 && now - lastKeyAt > chordTimeoutMs) {
      reset()
    }

    const candidateSequence = [...pendingKeys, event]

    // 1. Check exact chord / single-key matches (longest sequence first so chords win over prefixes).
    const sorted = [...compiled].sort((a, b) => b.steps.length - a.steps.length)
    for (const item of sorted) {
      if (editable && !item.binding.allowInInput && !item.usesModifier) continue
      if (item.steps.length === candidateSequence.length) {
        const allMatch = item.steps.every((step, idx) =>
          matchesShortcut(candidateSequence[idx]!, step),
        )
        if (allMatch) {
          reset()
          event.preventDefault?.()
          item.binding.handler(event as KeyboardEvent)
          return true
        }
      }
    }

    // 2. Check if the current sequence is a valid prefix of any longer chord.
    const isPrefix = compiled.some((item) => {
      if (editable && !item.binding.allowInInput && !item.usesModifier) return false
      if (item.steps.length <= candidateSequence.length) return false
      return candidateSequence.every((ev, idx) => matchesShortcut(ev, item.steps[idx]!))
    })

    if (isPrefix) {
      pendingKeys = candidateSequence
      lastKeyAt = now
      return false
    }

    // 3. If a chord failed mid-way, retry this single event from a fresh state.
    if (pendingKeys.length > 0) {
      reset()
      return handleKeyDown(event, now)
    }

    return false
  }

  return { handleKeyDown, reset }
}

/** Attaches a keymap to `target` (typically `document`) and cleans up via `signal`. */
export function attachKeymap(
  target: EventTarget,
  bindings: readonly KeymapBinding[],
  signal: AbortSignal,
  options?: KeymapOptions,
) {
  const keymap = createKeymap(bindings, options)
  const listener = (event: Event) => {
    keymap.handleKeyDown(event as KeyboardEvent)
  }
  target.addEventListener('keydown', listener, { signal })
  return keymap
}
