import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { Button } from './basic.tsx'
import { Icon } from './icon.tsx'
import { matchesShortcut, parseShortcut } from './shortcut.ts'
import { statusIcon } from './status-icon.tsx'

export type ToastStatus = 'default' | 'info' | 'success' | 'warning' | 'error' | 'loading'

export type ToasterPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface ToastAction {
  label: string
  /** Runs on click. The toast then closes, unless the handler calls `event.preventDefault()`. */
  onClick: (event: MouseEvent) => void
}

export interface ToastOptions {
  /** Reuse an id to update a toast in place instead of adding another. */
  id?: string
  description?: RemixNode
  /** Milliseconds before it closes on its own. `Infinity` keeps it until dismissed. Defaults to the Toaster's duration. */
  duration?: number
  action?: ToastAction
  /** Whether a swipe, Escape or the close button can close it. Default true. */
  dismissible?: boolean
  /** Replaces the status icon. */
  icon?: RemixNode
  /** Called when the toast is closed by a swipe, Escape, the close button, an action or `toast.dismiss`. */
  onDismiss?: (toast: Toast) => void
  /** Called when the toast closes on its own after its duration. */
  onAutoClose?: (toast: Toast) => void
}

export interface Toast extends ToastOptions {
  id: string
  title: RemixNode
  status: ToastStatus
}

export interface ToastPromiseMessages<T> {
  loading: RemixNode
  success: RemixNode | ((value: T) => RemixNode)
  error: RemixNode | ((error: unknown) => RemixNode)
  description?: RemixNode
}

interface Entry extends Toast {
  dismissed: boolean
  // Bumped on every update, so the close timer starts over.
  version: number
}

// The module-level store behind toast(). Toasters subscribe; nothing renders
// on the server, where no toast is ever raised.
let entries: Entry[] = []
let counter = 0
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function upsert(title: RemixNode, status: ToastStatus, options: ToastOptions = {}) {
  const id = options.id ?? `rf-toast-${++counter}`
  const index = entries.findIndex((entry) => entry.id === id && !entry.dismissed)
  const previous = index >= 0 ? entries[index] : undefined
  const entry: Entry = {
    ...previous,
    ...options,
    id,
    title,
    status,
    dismissed: false,
    version: (previous?.version ?? 0) + 1,
  }
  if (previous) entries = entries.with(index, entry)
  else entries = [entry, ...entries.filter((item) => item.id !== id)]
  emit()
  return id
}

function close(id: string | undefined, reason: 'dismiss' | 'auto') {
  const closing = entries.filter(
    (entry) => !entry.dismissed && (id === undefined || entry.id === id),
  )
  if (!closing.length) return
  entries = entries.map((entry) =>
    closing.includes(entry) ? { ...entry, dismissed: true } : entry,
  )
  // Without a Toaster to play the exit, a closed toast leaves at once.
  if (!listeners.size) entries = entries.filter((entry) => !entry.dismissed)
  emit()
  for (const entry of closing) {
    if (reason === 'auto') entry.onAutoClose?.(entry)
    else entry.onDismiss?.(entry)
  }
}

function remove(id: string) {
  const next = entries.filter((entry) => !(entry.id === id && entry.dismissed))
  if (next.length === entries.length) return
  entries = next
  emit()
}

function resolveMessage<T>(message: RemixNode | ((value: T) => RemixNode), value: T): RemixNode {
  return typeof message === 'function' ? (message as (value: T) => RemixNode)(value) : message
}

/**
 * Raises a toast in the app's `<Toaster>` and returns its id. `toast.success`,
 * `toast.info`, `toast.warning`, `toast.error` and `toast.loading` set its
 * status; `toast.promise` follows a promise from loading to its outcome;
 * `toast.dismiss` closes one toast, or all of them.
 */
export const toast = Object.assign(
  (title: RemixNode, options?: ToastOptions) => upsert(title, 'default', options),
  {
    success: (title: RemixNode, options?: ToastOptions) => upsert(title, 'success', options),
    info: (title: RemixNode, options?: ToastOptions) => upsert(title, 'info', options),
    warning: (title: RemixNode, options?: ToastOptions) => upsert(title, 'warning', options),
    error: (title: RemixNode, options?: ToastOptions) => upsert(title, 'error', options),
    loading: (title: RemixNode, options?: ToastOptions) =>
      upsert(title, 'loading', { duration: Infinity, ...options }),
    promise<T>(
      promise: Promise<T> | (() => Promise<T>),
      messages: ToastPromiseMessages<T>,
      options: ToastOptions = {},
    ) {
      const id = upsert(messages.loading, 'loading', {
        description: messages.description,
        ...options,
        duration: Infinity,
      })
      const settle = (status: ToastStatus, title: RemixNode) => {
        // A toast closed while it waited stays closed.
        if (!entries.some((entry) => entry.id === id && !entry.dismissed)) return
        upsert(title, status, { ...options, id, description: options.description })
      }
      Promise.resolve()
        .then(() => (typeof promise === 'function' ? promise() : promise))
        .then(
          (value) => settle('success', resolveMessage(messages.success, value)),
          (error) => settle('error', resolveMessage(messages.error, error)),
        )
      return id
    },
    dismiss: (id?: string) => close(id, 'dismiss'),
  },
)

export interface ToasterProps {
  /** Where the stack sits. Default bottom-right. */
  position?: ToasterPosition
  /** Show the stack spread out instead of piled. Default false. */
  expand?: boolean
  /** How many toasts stay in view; older ones wait behind them. Default 3. */
  visibleToasts?: number
  /** Milliseconds each toast stays before closing on its own. Default 4000. */
  duration?: number
  /** Give every dismissible toast a close button. Default false. */
  closeButton?: boolean
  /** Moves focus to the newest toast. Default alt+t. */
  hotkey?: string
  /** Names the notifications region. Default "Notifications". */
  label?: string
  /** Distance from the viewport's edges in pixels. Default 24, or 16 on narrow screens. */
  offset?: number
  size?: 'default' | 'compact'
  class?: string
}

// Below these, a released swipe springs back.
const swipeDistance = 45
const swipeVelocity = 0.11
// How long a closed toast plays its exit before it leaves the DOM.
const exitDuration = 200
const interactive = 'button, a, input, select, textarea, [contenteditable]'

interface Timer {
  version: number
  remaining: number
  started: number
  timeout?: ReturnType<typeof setTimeout>
}

interface Swipe {
  id: string
  pointer: number
  x: number
  y: number
  time: number
  axis?: 'x' | 'y'
  dx: number
  dy: number
}

/**
 * Shows the toasts raised with `toast()`. Place one in the app, outside
 * anything that scrolls. The newest toast sits in front with up to two
 * peeking behind it, on QueuedStack's stacking values; pointing at or
 * focusing the stack spreads it out and pauses the timers. A swipe toward
 * the nearest edge, Escape, or the close button dismisses a toast, and the
 * hotkey moves focus to the newest one.
 */
export function Toaster(handle: Handle<ToasterProps>) {
  let list: HTMLOListElement | null = null
  let hovered = false
  let focused = false
  let swipe: Swipe | undefined
  let returnFocus: HTMLElement | null = null
  const timers = new Map<string, Timer>()
  const leaving = new Map<string, ReturnType<typeof setTimeout>>()
  let resizeObserver: ResizeObserver | undefined

  const position = () => handle.props.position ?? 'bottom-right'
  const expanded = () => Boolean(handle.props.expand) || hovered || focused
  const paused = () => hovered || focused || Boolean(swipe) || document.visibilityState === 'hidden'

  const sync = () => void handle.update()
  listeners.add(sync)

  // Keeps each toast's close timer running, paused or cleared to match.
  function schedule() {
    const now = performance.now()
    const live = new Set<string>()
    for (const entry of entries) {
      if (entry.dismissed) continue
      const duration = entry.duration ?? handle.props.duration ?? 4000
      if (entry.status === 'loading' || !Number.isFinite(duration)) continue
      live.add(entry.id)
      let timer = timers.get(entry.id)
      if (!timer || timer.version !== entry.version) {
        if (timer) clearTimeout(timer.timeout)
        timer = { version: entry.version, remaining: Math.max(0, duration), started: now }
        timers.set(entry.id, timer)
      }
      if (paused()) {
        if (timer.timeout !== undefined) {
          clearTimeout(timer.timeout)
          timer.timeout = undefined
          timer.remaining -= now - timer.started
        }
      } else if (timer.timeout === undefined) {
        timer.started = now
        timer.timeout = setTimeout(() => {
          timers.delete(entry.id)
          close(entry.id, 'auto')
        }, timer.remaining)
      }
    }
    for (const [id, timer] of timers) {
      if (live.has(id)) continue
      clearTimeout(timer.timeout)
      timers.delete(id)
    }
  }

  // Hands focus on before a focused toast leaves.
  function handOff(item: HTMLElement) {
    if (!item.contains(document.activeElement)) return
    const next = list?.querySelector<HTMLElement>(
      ':scope > .rf-toast:not([data-removed], [data-hidden])',
    )
    if (next && next !== item) next.focus({ preventScroll: true })
    else if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
    else item.blur()
  }

  // Writes the stack's measurements: each toast's depth, its own height and
  // its offset once spread out, and the height of the toast in front.
  function layout() {
    if (!list) return
    const items = Array.from(
      list.querySelectorAll<HTMLElement>(':scope > .rf-toast:not([data-removed])'),
    )
    const style = getComputedStyle(list)
    const gap = parseFloat(style.getPropertyValue('--rf-stack-gap')) || 5
    const peek = parseFloat(style.getPropertyValue('--rf-stack-peek')) || 6
    const visible = Math.max(1, handle.props.visibleToasts ?? 3)
    let offset = 0
    let spread = 0
    for (const [depth, item] of items.entries()) {
      const height = item.querySelector<HTMLElement>('.rf-toast-inner')?.offsetHeight ?? 0
      item.style.setProperty('--rf-toast-depth', String(depth))
      item.style.setProperty('--rf-toast-height', `${height}px`)
      item.style.setProperty('--rf-toast-offset', `${offset}px`)
      item.toggleAttribute('data-front', depth === 0)
      item.toggleAttribute('data-hidden', depth >= visible)
      if (depth < visible) spread = offset + height
      offset += height + gap
    }
    const front = items[0]?.querySelector<HTMLElement>('.rf-toast-inner')?.offsetHeight ?? 0
    const shown = Math.min(items.length, visible)
    const edge = handle.props.offset
    if (edge === undefined) list.style.removeProperty('--rf-toaster-offset')
    else list.style.setProperty('--rf-toaster-offset', `${edge}px`)
    list.style.setProperty('--rf-toast-front-height', `${front}px`)
    list.style.setProperty(
      '--rf-toaster-piled-height',
      `${front + Math.max(0, shown - 1) * peek}px`,
    )
    list.style.setProperty('--rf-toaster-spread-height', `${spread}px`)
  }

  function afterRender() {
    if (!list) return
    for (const item of list.querySelectorAll<HTMLElement>(':scope > .rf-toast')) {
      const inner = item.querySelector('.rf-toast-inner')
      if (inner) resizeObserver?.observe(inner)
      const id = item.dataset.toastId!
      if (item.hasAttribute('data-removed') && !leaving.has(id)) {
        handOff(item)
        leaving.set(
          id,
          setTimeout(() => {
            leaving.delete(id)
            remove(id)
          }, exitDuration),
        )
      }
    }
    layout()
    schedule()
  }

  function endSwipe(event: PointerEvent, item: HTMLElement) {
    if (!swipe || swipe.pointer !== event.pointerId) return
    const current = swipe
    swipe = undefined
    item.removeAttribute('data-swiping')
    const [y, x] = position().split('-') as ['top' | 'bottom', 'left' | 'center' | 'right']
    const signY = y === 'bottom' ? 1 : -1
    const signX = x === 'right' ? 1 : x === 'left' ? -1 : 0
    const travel =
      current.axis === 'x' ? current.dx * signX : current.axis === 'y' ? current.dy * signY : 0
    const elapsed = Math.max(1, performance.now() - current.time)
    const entry = entries.find((item) => item.id === current.id)
    if (entry && travel > 0 && (travel >= swipeDistance || travel / elapsed > swipeVelocity)) {
      // Carry on in the swipe's direction as it leaves.
      const width = item.offsetWidth
      const height = item.offsetHeight
      item.dataset.swipeOut = current.axis
      if (current.axis === 'x') item.style.setProperty('--rf-swipe-x', `${signX * width}px`)
      else item.style.setProperty('--rf-swipe-y', `${signY * height}px`)
      close(entry.id, 'dismiss')
    } else {
      item.style.setProperty('--rf-swipe-x', '0px')
      item.style.setProperty('--rf-swipe-y', '0px')
      void handle.update()
    }
  }

  const listMix = ref((element, signal) => {
    if (!(element instanceof HTMLOListElement)) return
    list = element
    const options = { signal }
    resizeObserver = new ResizeObserver(() => layout())
    element.addEventListener(
      'pointerenter',
      (event) => {
        if (event.pointerType === 'touch') return
        hovered = true
        void handle.update()
      },
      options,
    )
    element.addEventListener(
      'pointerleave',
      () => {
        if (!hovered) return
        hovered = false
        void handle.update()
      },
      options,
    )
    element.addEventListener(
      'focusin',
      (event) => {
        const from = event.relatedTarget
        if (from instanceof HTMLElement && !element.contains(from)) returnFocus = from
        if (focused) return
        focused = true
        void handle.update()
      },
      options,
    )
    element.addEventListener(
      'focusout',
      (event) => {
        const next = event.relatedTarget
        if (next instanceof Node && element.contains(next)) return
        // A toast that leaves with focus inside hands it on in the same frame.
        queueMicrotask(() => {
          if (element.contains(document.activeElement)) return
          focused = false
          void handle.update()
        })
      },
      options,
    )
    element.ownerDocument.addEventListener(
      'keydown',
      (event) => {
        if (!matchesShortcut(event, parseShortcut(handle.props.hotkey ?? 'alt+t'))) return
        const front = element.querySelector<HTMLElement>(':scope > .rf-toast:not([data-removed])')
        if (!front) return
        event.preventDefault()
        const active = document.activeElement
        if (active instanceof HTMLElement && !element.contains(active)) returnFocus = active
        front.focus()
      },
      options,
    )
    element.ownerDocument.addEventListener('visibilitychange', () => schedule(), options)
    signal.addEventListener(
      'abort',
      () => {
        resizeObserver?.disconnect()
        if (list === element) list = null
      },
      { once: true },
    )
  })

  handle.signal.addEventListener(
    'abort',
    () => {
      listeners.delete(sync)
      // With no Toaster left to play their exit, closed toasts leave now.
      if (!listeners.size) entries = entries.filter((entry) => !entry.dismissed)
      for (const timer of timers.values()) clearTimeout(timer.timeout)
      for (const timeout of leaving.values()) clearTimeout(timeout)
    },
    { once: true },
  )

  function renderToast(entry: Entry) {
    const dismissible = entry.dismissible ?? true
    const icon =
      entry.icon ??
      (entry.status === 'loading' ? (
        <svg class="rf-toast-spinner" viewBox="0 0 16 16" fill="none">
          <g>
            <circle
              cx="8"
              cy="8"
              r="6.25"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              pathLength="100"
              transform="rotate(-90 8 8)"
            />
          </g>
        </svg>
      ) : entry.status === 'default' ? undefined : (
        statusIcon(entry.status)
      ))
    return (
      <li
        key={entry.id}
        class="rf-toast"
        tabIndex={0}
        data-toast-id={entry.id}
        data-status={entry.status}
        data-removed={entry.dismissed || undefined}
        data-dismissible={dismissible ? undefined : 'false'}
        aria-atomic="true"
        mix={[
          on('keydown', (event) => {
            if (event.key !== 'Escape' || !dismissible || entry.dismissed) return
            event.preventDefault()
            event.stopPropagation()
            close(entry.id, 'dismiss')
          }),
          on('pointerdown', (event) => {
            if (!dismissible || entry.dismissed || event.button !== 0) return
            if (event.target instanceof Element && event.target.closest(interactive)) return
            swipe = {
              id: entry.id,
              pointer: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              time: performance.now(),
              dx: 0,
              dy: 0,
            }
            try {
              event.currentTarget.setPointerCapture(event.pointerId)
            } catch {
              // Synthetic pointers have nothing to capture.
            }
            void handle.update()
          }),
          on('pointermove', (event) => {
            if (!swipe || swipe.pointer !== event.pointerId || swipe.id !== entry.id) return
            const item = event.currentTarget
            const dx = event.clientX - swipe.x
            const dy = event.clientY - swipe.y
            if (!swipe.axis) {
              if (Math.max(Math.abs(dx), Math.abs(dy)) < 2) return
              swipe.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
              item.setAttribute('data-swiping', '')
            }
            const [y, x] = position().split('-')
            const toward =
              swipe.axis === 'x'
                ? x === 'right'
                  ? 1
                  : x === 'left'
                    ? -1
                    : 0
                : y === 'bottom'
                  ? 1
                  : -1
            const delta = swipe.axis === 'x' ? dx : dy
            // Toward the edge it follows the pointer; away from it, it resists.
            const moved = Math.sign(delta) === toward ? delta : delta / (1 + Math.abs(delta) / 24)
            swipe.dx = swipe.axis === 'x' ? moved : 0
            swipe.dy = swipe.axis === 'y' ? moved : 0
            item.style.setProperty('--rf-swipe-x', `${Math.round(swipe.dx)}px`)
            item.style.setProperty('--rf-swipe-y', `${Math.round(swipe.dy)}px`)
          }),
          on('pointerup', (event) => endSwipe(event, event.currentTarget)),
          on('pointercancel', (event) => endSwipe(event, event.currentTarget)),
        ]}
      >
        <div class="rf-toast-inner">
          {icon && (
            <span class="rf-toast-icon" aria-hidden="true">
              {icon}
            </span>
          )}
          <div class="rf-toast-content">
            <div class="rf-toast-title">{entry.title}</div>
            {entry.description && <div class="rf-toast-description">{entry.description}</div>}
          </div>
          {entry.action && (
            <Button
              variant="secondary"
              size="compact"
              class="rf-toast-action"
              mix={on('click', (event) => {
                entry.action?.onClick(event)
                if (!event.defaultPrevented) close(entry.id, 'dismiss')
              })}
            >
              {entry.action.label}
            </Button>
          )}
          {handle.props.closeButton && dismissible && (
            <button
              type="button"
              class="rf-toast-close"
              aria-label="Close"
              mix={on('click', () => close(entry.id, 'dismiss'))}
            >
              <Icon name="x" />
            </button>
          )}
        </div>
      </li>
    )
  }

  return () => {
    handle.queueTask(afterRender)
    const { label = 'Notifications', size, hotkey = 'alt+t' } = handle.props
    return (
      <section
        class={handle.props.class ? `rf-toaster-region ${handle.props.class}` : 'rf-toaster-region'}
        aria-label={label}
        aria-keyshortcuts={ariaShortcut(hotkey)}
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
        tabIndex={-1}
        data-density={size}
      >
        <ol
          class="rf-toaster"
          data-position={position()}
          data-expanded={expanded() || undefined}
          mix={listMix}
        >
          {entries.map(renderToast)}
        </ol>
      </section>
    )
  }
}

// alt+t reads as Alt+T, the form aria-keyshortcuts expects.
function ariaShortcut(hotkey: string) {
  return hotkey
    .split('+')
    .map((part) => {
      const lower = part.trim().toLowerCase()
      if (lower === 'mod' || lower === 'ctrl' || lower === 'control') return 'Control'
      if (lower === 'cmd' || lower === 'meta') return 'Meta'
      if (lower === 'option' || lower === 'opt') return 'Alt'
      return lower.length === 1
        ? lower.toUpperCase()
        : lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join('+')
}
