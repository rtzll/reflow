import { on, type Handle, type RemixNode } from 'remix/component'

export interface ResizableProps {
  label: string
  first: RemixNode
  second: RemixNode
  /** Horizontal puts the panes side by side. */
  orientation?: 'horizontal' | 'vertical'
  /** Size of the first pane, as a percentage of the available space. */
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number) => void
  onValueCommit?: (value: number) => void
  class?: string
}

export function Resizable(handle: Handle<ResizableProps>) {
  let size = handle.props.defaultValue ?? 50
  let drag:
    | { id: number; start: number; size: number; span: number; axis: 'x' | 'y'; direction: number }
    | undefined
  const panelId = handle.id + '-first'

  function limits() {
    const min = Number.isFinite(handle.props.min)
      ? Math.max(0, Math.min(100, handle.props.min!))
      : 15
    const max = Number.isFinite(handle.props.max)
      ? Math.max(min, Math.min(100, handle.props.max!))
      : Math.max(min, 85)
    return { min, max }
  }

  function bound(value: number) {
    const { min, max } = limits()
    return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 50))
  }

  function current() {
    return bound(handle.props.value ?? size)
  }

  function change(value: number, commit = false) {
    const next = bound(value)
    if (next === current()) return
    size = next
    handle.props.onValueChange?.(next)
    if (commit) handle.props.onValueCommit?.(next)
    void handle.update()
  }

  function position(event: PointerEvent, axis: 'x' | 'y') {
    return axis === 'x' ? event.clientX : event.clientY
  }

  return () => {
    const props = handle.props
    const vertical = props.orientation === 'vertical'
    const { min, max } = limits()
    const step = props.step && Number.isFinite(props.step) && props.step > 0 ? props.step : 5
    return (
      <div
        class={['rf-resizable', props.class].filter(Boolean).join(' ')}
        data-orientation={vertical ? 'vertical' : 'horizontal'}
        data-resizing={Boolean(drag) || undefined}
        style={{
          '--rf-resizable-first': `${current()}fr`,
          '--rf-resizable-second': `${100 - current()}fr`,
        }}
      >
        <div class="rf-resizable-pane" id={panelId} inert={current() === 0 || undefined}>
          {props.first}
        </div>
        <div
          class="rf-resizable-grip"
          role="separator"
          tabIndex={0}
          aria-label={props.label}
          aria-controls={panelId}
          aria-orientation={vertical ? 'horizontal' : 'vertical'}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={Math.round(current() * 10) / 10}
          mix={[
            on<HTMLDivElement, 'pointerdown'>('pointerdown', (event) => {
              if (!event.isPrimary || event.button !== 0) return
              const grip = event.currentTarget
              const root = grip.parentElement!
              const span = vertical
                ? root.clientHeight - grip.offsetHeight
                : root.clientWidth - grip.offsetWidth
              if (span <= 0) return
              event.preventDefault()
              grip.focus({ preventScroll: true })
              const axis = vertical ? 'y' : 'x'
              const direction = !vertical && getComputedStyle(root).direction === 'rtl' ? -1 : 1
              drag = {
                id: event.pointerId,
                start: position(event, axis),
                size: current(),
                span,
                axis,
                direction,
              }
              grip.setPointerCapture(event.pointerId)
              void handle.update()
            }),
            on<HTMLDivElement, 'pointermove'>('pointermove', (event) => {
              if (!drag || drag.id !== event.pointerId) return
              const delta =
                ((position(event, drag.axis) - drag.start) / drag.span) * 100 * drag.direction
              change(drag.size + delta)
            }),
            on<HTMLDivElement, 'pointerup'>('pointerup', (event) => {
              if (!drag || drag.id !== event.pointerId || drag.size === current()) return
              handle.props.onValueCommit?.(current())
            }),
            on<HTMLDivElement, 'lostpointercapture'>('lostpointercapture', (event) => {
              if (drag?.id !== event.pointerId) return
              drag = undefined
              void handle.update()
            }),
            on<HTMLDivElement, 'keydown'>('keydown', (event) => {
              const rtl = !vertical && getComputedStyle(event.currentTarget).direction === 'rtl'
              const increase = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
              const decrease = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
              if (event.key === increase) change(current() + step, true)
              else if (event.key === decrease) change(current() - step, true)
              else if (event.key === 'Home') change(min, true)
              else if (event.key === 'End') change(max, true)
              else return
              event.preventDefault()
            }),
          ]}
        />
        <div class="rf-resizable-pane" inert={current() === 100 || undefined}>
          {props.second}
        </div>
      </div>
    )
  }
}
