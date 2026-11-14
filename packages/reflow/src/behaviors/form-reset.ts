import { ref } from 'remix/component'

/**
 * Calls `reset` after the surrounding form resets, for controls whose value
 * lives in component state rather than in a native input. It runs once the
 * browser has restored the native inputs, and not when the reset was
 * cancelled. Remix UI's primitives do not follow form resets.
 */
export function onFormReset(reset: () => void) {
  return ref((node, signal) => {
    node.closest('form')?.addEventListener(
      'reset',
      (event) => {
        queueMicrotask(() => {
          if (!signal.aborted && !event.defaultPrevented) reset()
        })
      },
      { signal },
    )
  })
}
