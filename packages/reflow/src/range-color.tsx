import { on, ref } from 'remix/component'
import type { Handle } from 'remix/component'
import type { ControlSize } from './basic.tsx'

export type SliderValue = number | [number, number]
export type ValuePosition = 'left' | 'right' | 'top' | 'bottom' | 'tooltip'

export interface SliderProps {
  label?: string
  showLabel?: boolean
  name?: string | [string, string]
  value?: SliderValue
  defaultValue?: SliderValue
  onChange?: (value: SliderValue) => void
  min?: number
  max?: number
  step?: number
  steps?: number[]
  showSteps?: boolean
  showValue?: boolean
  valuePosition?: ValuePosition
  formatValue?: (value: number) => string
  size?: ControlSize
  variant?: 'pips' | 'scrubber'
  disabled?: boolean
  hideFill?: boolean
  thumbColor?: string
  thumbBorderColor?: string
  /** Extra CSS on the track line, for gradients behind the thumb. */
  trackStyle?: Record<string, string | number>
  className?: string
}

function clamp(number: number, min: number, max: number) {
  return Math.min(max, Math.max(min, number))
}

function boundedNumber(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) ? value : fallback
}

export function Slider(handle: Handle<SliderProps>) {
  let local = handle.props.defaultValue ?? handle.props.min ?? 0
  let pointer: { id: number; thumb: number } | undefined
  let hoverValue: number | undefined
  const editing = new Map<number, string>()

  return () => {
    const {
      label,
      showLabel = true,
      name,
      value,
      onChange,
      steps,
      showSteps = false,
      showValue = true,
      valuePosition = 'left',
      formatValue = String,
      size,
      variant = 'pips',
      disabled,
      hideFill,
      thumbColor,
      thumbBorderColor,
      trackStyle,
      className,
    } = handle.props
    const stops = steps
      ? Array.from(new Set(steps.filter(Number.isFinite))).sort((a, b) => a - b)
      : []
    const min = stops[0] ?? boundedNumber(handle.props.min, 0)
    const max = stops.at(-1) ?? Math.max(min, boundedNumber(handle.props.max, 100))
    const step = boundedNumber(handle.props.step, 1) > 0 ? boundedNumber(handle.props.step, 1) : 1
    const percent = (number: number) => (max === min ? 0 : ((number - min) / (max - min)) * 100)
    const clampValue = (number: number) => clamp(boundedNumber(number, min), min, max)
    function snap(number: number) {
      const constrained = clampValue(number)
      if (!stops.length) {
        if (constrained === max) return max
        // A decimal precision guard removes artifacts like 0.30000000000000004.
        return clampValue(
          Number((min + Math.round((constrained - min) / step) * step).toPrecision(12)),
        )
      }

      return stops.reduce((nearest, candidate) =>
        Math.abs(candidate - constrained) < Math.abs(nearest - constrained) ? candidate : nearest,
      )
    }

    const current = value ?? local
    const values = Array.isArray(current)
      ? current.map(snap).sort((a, b) => a - b)
      : [snap(current)]
    const isRange = values.length === 2
    const requiresCompact =
      isRange ||
      steps !== undefined ||
      handle.props.showSteps !== undefined ||
      handle.props.showValue !== undefined ||
      handle.props.valuePosition !== undefined ||
      hideFill !== undefined ||
      trackStyle !== undefined ||
      thumbColor !== undefined ||
      thumbBorderColor !== undefined
    const layout =
      requiresCompact || size === 'compact'
        ? 'compact'
        : size === 'default'
          ? 'comfortable'
          : undefined
    const accessibleLabel = label ?? 'Value'
    const visibleLabel = showLabel ? label : undefined
    const labels = isRange
      ? [accessibleLabel + ' minimum', accessibleLabel + ' maximum']
      : [accessibleLabel]
    const lower = isRange ? percent(values[0]) : 0
    const upper = percent(values.at(-1)!)
    const hovered = hoverValue === undefined ? undefined : snap(hoverValue)
    const nearest =
      hovered === undefined
        ? values[0]
        : values.reduce((closest, value) =>
            Math.abs(value - hovered) < Math.abs(closest - hovered) ? value : closest,
          )
    const previewStart = hovered === undefined ? 0 : Math.min(percent(nearest), percent(hovered))
    const previewEnd = hovered === undefined ? 0 : Math.max(percent(nearest), percent(hovered))
    const regularTickCount = Math.floor((max - min) / step) + 1
    const ticks =
      showSteps || (layout !== 'compact' && variant === 'pips')
        ? stops.length
          ? stops
          : regularTickCount <= 101
            ? Array.from({ length: regularTickCount }, (_, index) => snap(min + index * step))
            : []
        : []

    function update(index: number, number: number) {
      if (disabled) return
      const next = snap(number)
      const adjusted =
        values.length === 1
          ? next
          : index === 0
            ? Math.min(next, values[1])
            : Math.max(next, values[0])
      if (adjusted === values[index]) return
      const result: SliderValue =
        values.length === 1 ? adjusted : index === 0 ? [adjusted, values[1]] : [values[0], adjusted]
      if (value === undefined) local = result
      onChange?.(result)
      handle.update()
    }

    function pointerValue(host: HTMLDivElement, x: number) {
      const line = host.querySelector('.rf-slider-rail')!.getBoundingClientRect()
      return min + clamp((x - line.left) / (line.width || 1), 0, 1) * (max - min)
    }

    const readout = (
      <div class="rf-slider-values">
        {visibleLabel && (
          <span class="rf-slider-value-label" aria-hidden="true">
            {visibleLabel}:
          </span>
        )}
        {values.map((number, index) => (
          <div class="rf-slider-readout" key={index}>
            {index > 0 && <span aria-hidden="true">–</span>}
            <div class="rf-slider-value">
              <span class="rf-slider-number" aria-hidden="true">
                {formatValue(number)}
              </span>
              <span class="rf-slider-value-sizer" aria-hidden="true">
                {formatValue(min)}
              </span>
              <span class="rf-slider-value-sizer" aria-hidden="true">
                {formatValue(max)}
              </span>
              <input
                type="number"
                aria-label={'Edit ' + labels[index].toLowerCase()}
                value={editing.get(index) ?? String(number)}
                min={index === 1 ? values[0] : min}
                max={index === 0 && values.length === 2 ? values[1] : max}
                step={stops.length ? 'any' : step}
                disabled={disabled}
                mix={[
                  on<HTMLInputElement, 'input'>('input', (event) => {
                    editing.set(index, event.currentTarget.value)
                    handle.update()
                  }),
                  on<HTMLInputElement, 'blur'>('blur', (event) => {
                    if (!editing.delete(index)) return
                    const requested = event.currentTarget.valueAsNumber
                    if (Number.isFinite(requested)) update(index, requested)
                    handle.update()
                  }),
                  on<HTMLInputElement, 'keydown'>('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === 'Escape') {
                      event.preventDefault()
                      if (event.key === 'Escape') {
                        editing.delete(index)
                        handle.update()
                      }
                      event.currentTarget.blur()
                    }
                  }),
                ]}
              />
            </div>
          </div>
        ))}
      </div>
    )

    return (
      <div
        class={className ? 'rf-slider ' + className : 'rf-slider'}
        data-size={size}
        data-layout={layout}
        data-variant={variant}
        data-disabled={disabled || undefined}
        data-value-position={valuePosition}
        data-show-steps={showSteps || undefined}
        data-show-value={showValue || undefined}
        data-at-min={upper === 0 || undefined}
        style={{
          '--rf-slider-start': lower + '%',
          '--rf-slider-end': upper + '%',
          '--rf-slider-compact-start': isRange ? 9 - (16 * lower) / 100 + 'px' : '0px',
          '--rf-slider-compact-end': 9 - (16 * upper) / 100 + 'px',
          '--rf-slider-pips-end': 20 - (20 * upper) / 100 + 'px',
          '--rf-slider-thumb-color': thumbColor,
          '--rf-slider-thumb-border': thumbBorderColor,
          '--rf-slider-thumb-border-width': thumbBorderColor ? '1px' : undefined,
        }}
      >
        <div class="rf-slider-body">
          {visibleLabel && (
            <span class="rf-slider-label" aria-hidden="true">
              {visibleLabel}
            </span>
          )}
          {showValue && (valuePosition === 'top' || valuePosition === 'left') && readout}
          <div
            class="rf-slider-track"
            mix={[
              ref((element, signal) => {
                if (!(element instanceof HTMLDivElement)) return
                element.closest('form')?.addEventListener(
                  'reset',
                  (event) => {
                    queueMicrotask(() => {
                      if (event.defaultPrevented || signal.aborted) return
                      const current = handle.props
                      if (current.value === undefined)
                        local = current.defaultValue ?? current.min ?? 0
                      editing.clear()
                      handle.update()
                    })
                  },
                  { signal },
                )
              }),
              on<HTMLDivElement, 'pointerdown'>('pointerdown', (event) => {
                if (!event.isPrimary || event.button !== 0 || disabled) return
                const host = event.currentTarget
                const next = pointerValue(host, event.clientX)
                let thumb = 0
                if (values.length === 2) {
                  const lowDistance = Math.abs(next - values[0])
                  const highDistance = Math.abs(next - values[1])
                  if (
                    highDistance < lowDistance ||
                    (highDistance === lowDistance && next >= values[1])
                  )
                    thumb = 1
                }
                pointer = { id: event.pointerId, thumb }
                host.setAttribute('data-dragging', '')
                host.setPointerCapture(event.pointerId)
                host.querySelectorAll('input')[thumb]?.focus()
                update(thumb, next)
              }),
              on<HTMLDivElement, 'pointermove'>('pointermove', (event) => {
                if (pointer?.id === event.pointerId) {
                  update(pointer.thumb, pointerValue(event.currentTarget, event.clientX))
                } else if (!disabled && event.pointerType !== 'touch') {
                  const next = snap(pointerValue(event.currentTarget, event.clientX))
                  if (hoverValue !== next) {
                    hoverValue = next
                    handle.update()
                  }
                }
              }),
              on('pointerleave', () => {
                hoverValue = undefined
                handle.update()
              }),
              on('lostpointercapture', (event) => {
                pointer = undefined
                event.currentTarget.removeAttribute('data-dragging')
                handle.update()
              }),
            ]}
          >
            <div class="rf-slider-line" aria-hidden="true" style={trackStyle}>
              {!hideFill && <span class="rf-slider-fill" />}
              {hovered !== undefined && (
                <span
                  class="rf-slider-preview"
                  data-edge={hovered < nearest ? 'start' : undefined}
                  style={{
                    '--rf-slider-preview-start': previewStart + '%',
                    '--rf-slider-preview-end': previewEnd + '%',
                    '--rf-slider-preview-compact-start': 9 - (16 * previewStart) / 100 + 'px',
                    '--rf-slider-preview-compact-end': 9 - (16 * previewEnd) / 100 + 'px',
                  }}
                />
              )}
            </div>
            <div class="rf-slider-ticks" aria-hidden="true">
              {ticks.map((tick) => {
                const position = percent(tick)
                const behindFill = isRange
                  ? position >= lower && position <= upper
                  : upper > 0 && position <= upper
                return (
                  <i
                    key={tick}
                    class="rf-slider-tick"
                    data-behind-fill={behindFill || undefined}
                    data-current={position === upper || undefined}
                    style={{ left: position + '%' }}
                  />
                )
              })}
              {hovered !== undefined && valuePosition !== 'tooltip' && (
                <span class="rf-slider-hover-tooltip" style={{ left: percent(hovered) + '%' }}>
                  {formatValue(hovered)}
                </span>
              )}
            </div>
            {layout !== 'compact' && variant === 'pips' && (
              <div class="rf-slider-pips-mask" aria-hidden="true">
                {visibleLabel && <span>{visibleLabel}</span>}
                <span>{formatValue(values[0])}</span>
              </div>
            )}
            {values.map((number, index) => (
              <div class="rf-slider-rail" key={index}>
                <input
                  type="range"
                  name={Array.isArray(name) ? name[index] : name}
                  aria-label={labels[index]}
                  aria-valuetext={formatValue(number)}
                  aria-valuemin={index === 1 ? values[0] : min}
                  aria-valuemax={index === 0 && values.length === 2 ? values[1] : max}
                  min={min}
                  max={max}
                  step="any"
                  defaultValue={String(number)}
                  value={String(number)}
                  disabled={disabled}
                  mix={[
                    on<HTMLInputElement, 'input'>('input', (event) => {
                      update(index, event.currentTarget.valueAsNumber)
                    }),
                    on<HTMLInputElement, 'keydown'>('keydown', (event) => {
                      if (event.altKey || event.ctrlKey || event.metaKey) return
                      const backwards = event.key === 'ArrowLeft' || event.key === 'ArrowDown'
                      const forwards = event.key === 'ArrowRight' || event.key === 'ArrowUp'
                      let target: number
                      if (backwards || forwards) {
                        const direction = backwards ? -1 : 1
                        target = stops.length
                          ? stops[clamp(stops.indexOf(number) + direction, 0, stops.length - 1)]
                          : number + direction * step
                      } else if (event.key === 'Home' || event.key === 'End') {
                        target = event.key === 'Home' ? min : max
                      } else if (event.key === 'PageUp' || event.key === 'PageDown') {
                        target =
                          number +
                          (event.key === 'PageUp' ? 1 : -1) * Math.max(step, (max - min) / 10)
                      } else {
                        return
                      }
                      event.preventDefault()
                      update(index, target)
                    }),
                  ]}
                />
                <span
                  class="rf-slider-thumb"
                  style={{ '--rf-slider-thumb-position': percent(number) + '%' }}
                  aria-hidden="true"
                >
                  {showValue && valuePosition === 'tooltip' && (
                    <span class="rf-slider-tooltip">{formatValue(number)}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          {showValue && (valuePosition === 'right' || valuePosition === 'bottom') && readout}
        </div>
      </div>
    )
  }
}
