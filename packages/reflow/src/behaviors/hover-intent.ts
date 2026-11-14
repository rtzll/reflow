/**
 * The open and close timers behind every popup that opens on hover: Tooltip,
 * HoverCard and Dropdown's `openOnHover`.
 *
 * Resting on the trigger opens after a delay, so a pointer passing over does
 * not flash the popup. Leaving closes after a delay, so the pointer can cross
 * the gap into the popup, where `stay()` keeps it open. Each call cancels the
 * timer the previous one set, and the timers stop when `signal` aborts.
 *
 * It only keeps time. Which events count as entering or leaving, and what
 * opening and closing do, stay with the component.
 *
 * Remix UI has no hover-triggered popup. Replace this once it has one.
 */
export interface HoverIntent {
  /** The pointer arrived: drop a pending close and open after `delay` ms. */
  enter(delay: number): void
  /** The pointer left: drop a pending open and close after `delay` ms. */
  leave(delay: number): void
  /** The pointer reached the popup: drop a pending close and keep it open. */
  stay(): void
  /** Drop both timers. */
  cancel(): void
}

export function hoverIntent(
  signal: AbortSignal,
  { open, close }: { open: () => void; close: () => void },
): HoverIntent {
  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  const cancel = () => {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
  }
  signal.addEventListener('abort', cancel, { once: true })
  return {
    enter(delay) {
      cancel()
      openTimer = setTimeout(open, Math.max(0, delay))
    },
    leave(delay) {
      cancel()
      closeTimer = setTimeout(close, Math.max(0, delay))
    },
    stay() {
      clearTimeout(closeTimer)
    },
    cancel,
  }
}
