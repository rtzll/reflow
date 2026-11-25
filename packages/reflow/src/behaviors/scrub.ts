// Horizontal pointer-drag scrubbing with pointer lock and a wrapping virtual cursor.
// Fills a gap in `@remix-run/ui` 0.14.0, which has no numeric scrub interaction.
// Shared by ColorPicker and NumberField.
import { on } from 'remix/component'

// Stand-in for the OS cursor while a scrub holds the pointer lock: a black ↔ arrow
// with a white stroke and drop shadow, legible on any surface. It lives in the top
// layer so it also shows over popovers.
function scrubCursor(doc: Document) {
  let cursor = doc.querySelector<HTMLElement>(':scope > body > .rf-scrub-cursor')
  if (cursor) return cursor
  cursor = doc.createElement('div')
  cursor.className = 'rf-scrub-cursor'
  cursor.setAttribute('popover', 'manual')
  cursor.setAttribute('aria-hidden', 'true')
  cursor.innerHTML =
    '<svg width="24" height="14" viewBox="0 0 24 14" fill="#000" stroke="#fff" stroke-width="1"><path d="M0.5 7l5-5v3.5h13V2l5 5-5 5V8.5h-13V12l-5-5z"/></svg>'
  doc.body.append(cursor)
  return cursor
}

interface ActiveScrub<State> {
  id: number
  state: State
  /** Where the press landed, which the virtual cursor travels from. */
  x: number
  y: number
  lastX: number
  travel: number
  moved: boolean
  mouse: boolean
  /** Whether the previous move came under the pointer lock. */
  locked: boolean
  lock?: AbortController
}

export interface ScrubOptions<State> {
  /** Return initial scrub state if the primary press should begin scrubbing, or undefined to ignore. */
  start: (event: PointerEvent) => State | undefined
  /** Called with accumulated horizontal pixel travel once past `threshold`. */
  move: (travel: number, state: State, event: PointerEvent) => void
  /** Called on pointer release with whether travel crossed `threshold`. */
  end?: (moved: boolean, state: State, event: PointerEvent) => void
  /** Pixels of horizontal travel before scrubbing starts. Default 2. */
  threshold?: number
  /** Prevent the synthetic click that follows a drag (useful on label elements). */
  suppressClick?: boolean
}

export function scrub<State>(options: ScrubOptions<State>) {
  let active: ActiveScrub<State> | undefined
  let suppressNextClick = false

  // Drag travel is unbounded under the pointer lock; the drawn cursor wraps
  // at the viewport edges instead of stopping.
  function placeCursor(current: ActiveScrub<State>, element: HTMLElement) {
    const doc = element.ownerDocument
    const cursor = scrubCursor(doc)
    const width = doc.documentElement.clientWidth
    const x = (((current.x + current.travel) % width) + width) % width
    cursor.style.left = `${x - 12}px`
    cursor.style.top = `${current.y - 7}px`
  }

  function lockPointer(current: ActiveScrub<State>, element: HTMLElement) {
    const doc = element.ownerDocument
    if (current.lock || !current.mouse || !element.requestPointerLock) return
    current.lock = new AbortController()
    doc.addEventListener(
      'pointerlockchange',
      () => {
        const cursor = scrubCursor(doc)
        if (doc.pointerLockElement === element && active === current) {
          placeCursor(current, element)
          cursor.showPopover?.()
        } else {
          cursor.hidePopover?.()
          current.lock?.abort()
        }
      },
      { signal: current.lock.signal },
    )
    // Without the lock (refused, or unsupported) the scrub carries on with the OS cursor.
    void Promise.resolve(element.requestPointerLock()).catch(() => current.lock?.abort())
  }

  function release(element: HTMLElement) {
    const doc = element.ownerDocument
    if (doc.pointerLockElement === element) doc.exitPointerLock()
    doc.querySelector<HTMLElement>(':scope > body > .rf-scrub-cursor')?.hidePopover?.()
  }

  return [
    on<HTMLElement, 'pointerdown'>('pointerdown', (event) => {
      suppressNextClick = false
      if (!event.isPrimary || event.button !== 0) return
      const state = options.start(event)
      if (state === undefined) return
      active = {
        id: event.pointerId,
        state,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        travel: 0,
        moved: false,
        mouse: event.pointerType === 'mouse',
        locked: false,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    }),
    on<HTMLElement, 'pointermove'>('pointermove', (event) => {
      const current = active
      if (!current || current.id !== event.pointerId) return
      const element = event.currentTarget
      // Under the pointer lock clientX stands still; movementX carries the travel.
      const locked = element.ownerDocument.pointerLockElement === element
      // The move that crosses into or out of the lock is not travel:
      // granting the lock can warp the cursor, and leaving it lets
      // clientX jump back to where the cursor really is.
      if (locked === current.locked) {
        current.travel += locked ? event.movementX : event.clientX - current.lastX
      }
      current.locked = locked
      current.lastX = event.clientX
      if (!current.moved && Math.abs(current.travel) < (options.threshold ?? 2)) return
      current.moved = true
      if (options.suppressClick) suppressNextClick = true
      lockPointer(current, element)
      if (locked) placeCursor(current, element)
      options.move(current.travel, current.state, event)
    }),
    on<HTMLElement, 'pointerup'>('pointerup', (event) => {
      const current = active
      if (!current || current.id !== event.pointerId) return
      active = undefined
      release(event.currentTarget)
      options.end?.(current.moved, current.state, event)
    }),
    on<HTMLElement, 'pointercancel'>('pointercancel', (event) => {
      if (!active || active.id !== event.pointerId) return
      active = undefined
      release(event.currentTarget)
    }),
    on<HTMLElement, 'click'>('click', (event) => {
      if (options.suppressClick && suppressNextClick) event.preventDefault()
      suppressNextClick = false
    }),
  ]
}
