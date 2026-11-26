import type { Handle } from 'remix/component'
import { classList, type ControlSize } from './systems/styling.ts'

export type ProportionTone = 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'neutral'

export interface ProportionSegment {
  id: string
  label: string
  value: number
  /** Semantic color tone. */
  tone?: ProportionTone
  /** Optional explicit CSS color (e.g. language hex). */
  color?: string
}

export interface ProportionBarProps {
  /** Ordered segments whose relative values fill the bar. */
  segments: readonly ProportionSegment[]
  /** Accessible name for the distribution bar. */
  label: string
  /** Shows the compact swatch legend below the bar. Default `true`. */
  showLegend?: boolean
  /** Formats each segment's legend readout. Defaults to percentage (`78%`). */
  formatValue?: (value: number, percent: number) => string
  /** Bar thickness in pixels. Default `8`. */
  height?: number
  /** Controls spacing and typography scale. */
  size?: ControlSize
  class?: string
}

const TONE_COLOR: Record<ProportionTone, string> = {
  accent: 'var(--rf-accent)',
  info: 'var(--rf-info)',
  success: 'var(--rf-success)',
  warning: 'var(--rf-warning)',
  danger: 'var(--rf-danger)',
  neutral: 'var(--rf-neutral-fill)',
}

const DEFAULT_ORDER: readonly ProportionTone[] = [
  'accent',
  'info',
  'success',
  'warning',
  'danger',
  'neutral',
]

/**
 * Multi-segment horizontal proportion bar for repository languages, test pass/fail/flaky
 * ratios, PR file-viewed progress, and CI fleet utilization.
 */
export function ProportionBar(handle: Handle<ProportionBarProps>) {
  return () => {
    const props = handle.props
    const valid = props.segments.filter((s) => Number.isFinite(s.value) && s.value > 0)
    const total = valid.reduce((sum, s) => sum + s.value, 0)
    const height = props.height ?? 8
    const format = props.formatValue ?? ((_v, pct) => `${Math.round(pct)}%`)

    const resolved = valid.map((seg, idx) => {
      const pct = total > 0 ? (seg.value / total) * 100 : 0
      const color = seg.color ?? TONE_COLOR[seg.tone ?? DEFAULT_ORDER[idx % DEFAULT_ORDER.length]!]
      return { ...seg, pct, color }
    })

    return (
      <div
        class={classList('rf-proportion-bar', props.class)}
        data-size={props.size}
        role="group"
        aria-label={props.label}
      >
        <div class="rf-proportion-track" style={{ height: `${height}px` }}>
          {resolved.map((seg) => (
            <span
              key={seg.id}
              class="rf-proportion-segment"
              title={`${seg.label}: ${format(seg.value, seg.pct)}`}
              style={{
                width: `${seg.pct}%`,
                background: seg.color,
              }}
            />
          ))}
        </div>

        {(props.showLegend ?? true) && resolved.length > 0 && (
          <ul class="rf-proportion-legend">
            {resolved.map((seg) => (
              <li key={seg.id} class="rf-proportion-legend-item">
                <span
                  class="rf-proportion-swatch"
                  style={{ background: seg.color }}
                  aria-hidden="true"
                />
                <span class="rf-proportion-name">{seg.label}</span>
                <span class="rf-proportion-val">{format(seg.value, seg.pct)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
}
