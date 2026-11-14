import type { Handle } from 'remix/component'
import type { ControlSize } from './basic.tsx'

export interface ProgressProps {
  label: string
  /** Omit the value while the amount of work is unknown. */
  value?: number
  max?: number
  size?: ControlSize
  showValue?: boolean
}

export function Progress(handle: Handle<ProgressProps>) {
  return () => {
    const { label, value, max = 100, size, showValue } = handle.props
    const total = Number.isFinite(max) && max > 0 ? max : 100
    const current =
      value != null && Number.isFinite(value) ? Math.max(0, Math.min(total, value)) : undefined
    const percent = current === undefined ? undefined : (current / total) * 100

    return (
      <div
        class="rf-progress"
        data-size={size}
        data-indeterminate={current === undefined || undefined}
      >
        <div class="rf-progress-caption" aria-hidden="true">
          <span>{label}</span>
          {showValue && percent !== undefined && <span>{Math.round(percent)}%</span>}
        </div>
        <progress class="rf-basic-sr-only" aria-label={label} max={total} value={current} />
        <div class="rf-progress-track" aria-hidden="true">
          <div
            class="rf-progress-fill"
            style={percent === undefined ? undefined : { inlineSize: `${percent}%` }}
          />
        </div>
      </div>
    )
  }
}
