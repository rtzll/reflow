import { Icon } from './icon.tsx'
import { on } from 'remix/component'
import type { Handle, MixInput } from 'remix/component'
import { Tooltip } from './tooltip.tsx'
import { type ControlSize, classList, type StyledProps } from './systems/styling.ts'

export type InputCopyProps = Omit<StyledProps<'div'>, 'children'> & {
  value: string
  label?: string
  onCopy?: () => void
  disabled?: boolean
  variant?: 'icon' | 'button'
  align?: 'left' | 'right'
  size?: ControlSize
  /** Masks the displayed value (still copies the real `value`) and renders a reveal toggle. */
  masked?: boolean
  /** Controlled revealed state when `masked` is true. */
  revealed?: boolean
  /** Initial revealed state when `masked` is true and uncontrolled. */
  defaultRevealed?: boolean
  /** Called when the user toggles reveal/hide in `masked` mode. */
  onRevealChange?: (revealed: boolean) => void
  /** Custom formatter for the masked display value. */
  maskValue?: (value: string) => string
}

function defaultMaskValue(value: string): string {
  if (value.length >= 16) {
    return `${value.slice(0, 8)}${'•'.repeat(12)}${value.slice(-4)}`
  }
  if (value.length >= 8) {
    return `${value.slice(0, 2)}${'•'.repeat(8)}${value.slice(-2)}`
  }
  return '•'.repeat(Math.max(value.length, 6))
}

export function InputCopy(handle: Handle<InputCopyProps>) {
  let state: 'idle' | 'copied' | 'error' = 'idle'
  let uncontrolledRevealed = Boolean(handle.props.defaultRevealed)
  // "idle" = normal tooltip behaviour, "copied" = forced open, "suppressed" = forced closed.
  let tooltipState: 'idle' | 'copied' | 'suppressed' = 'idle'
  let tooltipVisible = false
  let tooltipWasVisible = false
  // The glyph lags the state by one exit: the old one shrinks out, then the
  // new one grows in (a wait-mode swap on the fast tier).
  let glyph: 'idle' | 'copied' | 'error' = 'idle'
  let glyphKey = 0
  let phase: 'exit' | 'enter' | undefined
  let request = 0
  let reset: ReturnType<typeof setTimeout> | undefined
  let swapTimer: ReturnType<typeof setTimeout> | undefined
  handle.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(reset)
      clearTimeout(swapTimer)
    },
    { once: true },
  )

  function swap() {
    clearTimeout(swapTimer)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      glyph = state
      glyphKey++
      phase = undefined
      handle.update()
      return
    }
    phase = 'exit'
    handle.update()
    swapTimer = setTimeout(() => {
      glyph = state
      glyphKey++
      phase = 'enter'
      handle.update()
    }, 115)
  }

  async function copy() {
    const { value, disabled } = handle.props
    if (disabled) return

    const operation = ++request
    clearTimeout(reset)
    let copied = false
    try {
      await navigator.clipboard.writeText(value)
      copied = true
    } catch {
      // The value becomes selectable when browser clipboard access is unavailable.
    }

    if (handle.signal.aborted || operation !== request) return
    state = copied ? 'copied' : 'error'
    // The tooltip says "Copied" only if it was showing when the press began;
    // a click never summons a tooltip the user was not reading.
    tooltipState = tooltipWasVisible ? 'copied' : 'suppressed'
    swap()
    reset = setTimeout(() => {
      state = 'idle'
      // Stay closed until the pointer leaves and returns, so the tooltip does
      // not reopen as "Copy to clipboard" under a resting cursor.
      tooltipState = 'suppressed'
      swap()
    }, 2000)

    if (copied) handle.props.onCopy?.()
  }

  return () => {
    const {
      class: classProp,
      className,
      value,
      label,
      disabled,
      onCopy,
      size,
      variant = 'icon',
      align = 'right',
      masked,
      revealed: controlledRevealed,
      defaultRevealed: _defaultRevealed,
      onRevealChange,
      maskValue,
      ...props
    } = handle.props
    const isRevealed = masked ? (controlledRevealed ?? uncontrolledRevealed) : true
    const displayedValue =
      masked && !isRevealed ? (maskValue ? maskValue(value) : defaultMaskValue(value)) : value
    const valueId = handle.id + '-value'
    const buttonLabel = label ? 'Copy ' + label : 'Copy value'
    const revealLabel = isRevealed
      ? label
        ? 'Hide ' + label
        : 'Hide value'
      : label
        ? 'Reveal ' + label
        : 'Reveal value'
    const feedback = state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : 'Copy'

    function toggleReveal() {
      if (disabled || !masked) return
      const next = !isRevealed
      if (controlledRevealed === undefined) {
        uncontrolledRevealed = next
      }
      onRevealChange?.(next)
      handle.update()
    }
    const action = (
      <span class="rf-copy-action" aria-hidden="true">
        <span class="rf-copy-glyph" key={glyphKey} data-glyph={glyph} data-phase={phase}>
          {glyph === 'idle' ? (
            <Icon name="copy" size={14} />
          ) : (
            <svg viewBox="2 4 20 16" width="14" height="14" fill="none" data-result>
              <path
                d={glyph === 'copied' ? 'M6 12L10 16L18 8' : 'M9 9L15 15M15 9L9 15'}
                pathLength="1"
              />
            </svg>
          )}
          {variant === 'button' && (
            <span class="rf-copy-feedback">
              <span aria-hidden="true">Copied</span>
              <span>{glyph === 'error' ? 'Failed' : glyph === 'copied' ? 'Copied' : 'Copy'}</span>
            </span>
          )}
        </span>
      </span>
    )

    return (
      <div
        {...props}
        class={classList('rf-input-copy', classProp, className)}
        data-slot="input-copy"
        data-size={size}
        data-state={state}
        data-align={align}
        data-disabled={disabled || undefined}
        data-masked={masked || undefined}
        data-revealed={masked ? (isRevealed ? 'true' : 'false') : undefined}
      >
        {label && <span class="rf-copy-label">{label}</span>}
        <div class="rf-copy-line">
          {(() => {
            const row = (extra?: { 'aria-describedby': string; mix: MixInput }) => (
              <button
                type="button"
                class="rf-copy-row"
                aria-label={
                  state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : buttonLabel
                }
                aria-describedby={extra ? valueId + ' ' + extra['aria-describedby'] : valueId}
                disabled={disabled}
                mix={[
                  // Captured before the tooltip closes on press.
                  on('pointerdown', () => {
                    tooltipWasVisible = tooltipVisible
                  }),
                  on('pointerenter', () => {
                    if (tooltipState === 'suppressed') {
                      tooltipState = 'idle'
                      handle.update()
                    }
                  }),
                  on('pointerleave', () => {
                    if (tooltipState === 'copied') {
                      tooltipState = 'suppressed'
                      handle.update()
                    }
                  }),
                  on('click', copy),
                  ...(extra ? [extra.mix] : []),
                ]}
              >
                {align === 'left' && action}
                <span id={valueId} class="rf-copy-value">
                  <mark>{displayedValue}</mark>
                </span>
                {align === 'right' && action}
              </button>
            )
            return variant === 'icon' ? (
              <Tooltip
                content={
                  tooltipState === 'idle'
                    ? 'Copy to clipboard'
                    : state === 'error'
                      ? 'Copy failed'
                      : 'Copied'
                }
                open={
                  tooltipState === 'copied'
                    ? true
                    : tooltipState === 'suppressed'
                      ? false
                      : undefined
                }
                onOpenChange={(open) => {
                  tooltipVisible = open
                }}
                delayDuration={500}
                sideOffset={2}
                renderTrigger={row}
              />
            ) : (
              row()
            )
          })()}
          {masked && (
            <button
              type="button"
              class="rf-copy-reveal"
              aria-pressed={isRevealed}
              aria-label={revealLabel}
              disabled={disabled}
              mix={on('click', toggleReveal)}
            >
              <Icon name={isRevealed ? 'lock' : 'shield'} size={14} />
              <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
            </button>
          )}
        </div>
        <span class="rf-basic-sr-only" role="status">
          {state === 'idle' ? '' : feedback}
        </span>
      </div>
    )
  }
}
