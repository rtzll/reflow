import { on, type Handle, type RemixNode } from 'remix/component'
import { Icon } from './icon.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface CopyChipProps {
  /** Exact text copied to the clipboard on click. */
  value: string
  /** Optional display text (e.g. short commit SHA `3c1c414` while `value` is the full hash). */
  display?: RemixNode
  /** Optional leading icon or glyph. */
  prefix?: RemixNode
  /** Accessible name for the copy button; defaults to `"Copy <value>"`. */
  label?: string
  /** Called after the value is copied. */
  onCopy?: () => void
  /** Called if clipboard access fails. */
  onCopyError?: () => void
  /** Controls padding and font scale. */
  size?: ControlSize
  class?: string
}

/**
 * Compact inline copyable pill for commit SHAs, branch refs, and PR identifiers
 * with in-place clipboard feedback and zero layout shift.
 */
export function CopyChip(handle: Handle<CopyChipProps>) {
  let state: 'idle' | 'copied' | 'error' = 'idle'
  let timer: ReturnType<typeof setTimeout> | undefined

  handle.signal.addEventListener('abort', () => clearTimeout(timer), { once: true })

  return () => {
    const props = handle.props

    async function copy() {
      clearTimeout(timer)
      try {
        await navigator.clipboard.writeText(props.value)
        state = 'copied'
        props.onCopy?.()
      } catch {
        state = 'error'
        props.onCopyError?.()
      }
      void handle.update()
      timer = setTimeout(() => {
        state = 'idle'
        void handle.update()
      }, 1500)
    }

    return (
      <button
        type="button"
        class={classList('rf-copy-chip', props.class)}
        data-size={props.size}
        data-state={state === 'idle' ? undefined : state}
        aria-label={props.label ?? `Copy ${props.value}`}
        title={state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : props.value}
        mix={on('click', () => void copy())}
      >
        {props.prefix && (
          <span class="rf-copy-chip-prefix" aria-hidden="true">
            {props.prefix}
          </span>
        )}
        <span class="rf-copy-chip-text">{props.display ?? props.value}</span>
        <span class="rf-copy-chip-icon" aria-hidden="true">
          <Icon name={state === 'copied' ? 'check' : 'copy'} size={11} />
        </span>
      </button>
    )
  }
}
