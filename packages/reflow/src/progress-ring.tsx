import type { Handle, RemixNode } from 'remix/component'
import { classList } from './systems/styling.ts'

export type ProgressRingTone = 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'neutral'

export interface ProgressRingSegment {
  id: string
  label: string
  value: number
  tone?: ProgressRingTone
  color?: string
}

export interface ProgressRingProps {
  /** Completion value when rendering a single-progress ring. */
  value?: number
  /** Maximum value for single-progress mode. Default `100`. */
  max?: number
  /** Optional multi-segment breakdown (overrides `value` / `max` when non-empty). */
  segments?: readonly ProgressRingSegment[]
  /** Semantic stroke color for single-progress mode. Default `'accent'`. */
  tone?: ProgressRingTone
  /** Outer diameter in pixels. Default `24`. */
  size?: number
  /** Ring stroke thickness in pixels. Defaults proportionally to `size`. */
  strokeWidth?: number
  /** Accessible description for the progress indicator. */
  label: string
  /** Optional center readout rendered inside larger rings (e.g. `"68%"`). */
  children?: RemixNode
  class?: string
}

function toneColor(tone: ProgressRingTone | undefined): string {
  switch (tone) {
    case 'success':
      return 'var(--rf-success)'
    case 'warning':
      return 'var(--rf-warning)'
    case 'danger':
      return 'var(--rf-danger)'
    case 'info':
      return 'var(--rf-info)'
    case 'neutral':
      return 'var(--rf-muted)'
    default:
      return 'var(--rf-accent)'
  }
}

/**
 * Radial SVG progress ring supporting both compact 16px inline completion
 * rings (cycles, projects, sub-issues) and multi-segment status donuts.
 */
export function ProgressRing(handle: Handle<ProgressRingProps>) {
  return () => {
    const props = handle.props
    const size = Math.max(12, props.size ?? 24)
    const strokeWidth =
      props.strokeWidth ?? (size <= 24 ? 2.5 : Math.max(4, Math.round(size * 0.1)))
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const center = size / 2

    const hasSegments = Boolean(props.segments && props.segments.length > 0)
    const max = props.max && props.max > 0 ? props.max : 100
    const rawValue = props.value ?? 0
    const ratio = Math.max(0, Math.min(1, Number.isFinite(rawValue) ? rawValue / max : 0))
    const pct = Math.round(ratio * 100)

    const segmentTotal = hasSegments
      ? props.segments!.reduce(
          (sum, s) => sum + Math.max(0, Number.isFinite(s.value) ? s.value : 0),
          0,
        )
      : 0

    let cumulative = 0

    return (
      <span
        class={classList('rf-progress-ring', props.class)}
        style={{ width: `${size}px`, height: `${size}px` }}
        role="progressbar"
        aria-label={props.label}
        aria-valuemin={0}
        aria-valuemax={hasSegments ? segmentTotal : max}
        aria-valuenow={
          hasSegments ? segmentTotal : Math.round(Math.max(0, Math.min(max, rawValue)))
        }
        aria-valuetext={hasSegments ? props.label : `${pct}%`}
      >
        <svg
          class="rf-progress-ring-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          <circle
            class="rf-progress-ring-track"
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke-width={strokeWidth}
          />
          {hasSegments && segmentTotal > 0 ? (
            props.segments!.map((seg) => {
              const val = Math.max(0, Number.isFinite(seg.value) ? seg.value : 0)
              if (val === 0) return null
              const frac = val / segmentTotal
              const length = frac * circumference
              const offset = -cumulative * circumference
              cumulative += frac
              return (
                <circle
                  key={seg.id}
                  class="rf-progress-ring-arc"
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={seg.color ?? toneColor(seg.tone)}
                  stroke-width={strokeWidth}
                  stroke-dasharray={`${length} ${circumference}`}
                  stroke-dashoffset={offset}
                  transform={`rotate(-90 ${center} ${center})`}
                />
              )
            })
          ) : (
            <circle
              class="rf-progress-ring-arc"
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={toneColor(props.tone)}
              stroke-width={strokeWidth}
              stroke-linecap="round"
              stroke-dasharray={`${ratio * circumference} ${circumference}`}
              transform={`rotate(-90 ${center} ${center})`}
            />
          )}
        </svg>
        {props.children != null && <span class="rf-progress-ring-center">{props.children}</span>}
      </span>
    )
  }
}
