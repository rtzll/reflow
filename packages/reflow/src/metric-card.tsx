import type { Handle, RemixNode } from 'remix/component'
import { Sparkline, type SparklineProps } from './sparkline.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type MetricDeltaTone = 'positive' | 'negative' | 'neutral'

export interface MetricCardProps {
  /** Short metric label (e.g. `'CPU'`, `'p95 latency'`, `'Cache'`). */
  label: string
  /** Primary metric value (e.g. `'94% peak'`, `'4.8 / 16 GB'`). */
  value: RemixNode
  /** Optional secondary detail line below the value. */
  detail?: RemixNode
  /** Optional trend delta text (e.g. `'−31% vs p50'`, `'+9% vs p50'`). */
  delta?: string
  /** Semantic tone for the trend delta. Default `'neutral'`. */
  deltaTone?: MetricDeltaTone
  /** Optional trailing header slot (such as a `Badge`). */
  badge?: RemixNode
  /** Optional inline `Sparkline` rendered beside the KPI values. */
  sparkline?: Omit<SparklineProps, 'class'>
  /** Controls card padding and font scale. */
  size?: ControlSize
  class?: string
}

/**
 * Compact telemetry and KPI card combining a label, tabular value, optional
 * trend delta, status badge, and inline `Sparkline`.
 */
export function MetricCard(handle: Handle<MetricCardProps>) {
  return () => {
    const props = handle.props
    const hasSpark = Boolean(props.sparkline && props.sparkline.values.length > 0)

    return (
      <div
        class={classList('rf-metric-card', props.class)}
        data-size={props.size}
        data-sparkline={hasSpark ? 'true' : undefined}
      >
        <div class="rf-metric-body">
          <div class="rf-metric-head">
            <span class="rf-metric-label">{props.label}</span>
            {props.badge && <span class="rf-metric-badge">{props.badge}</span>}
          </div>
          <strong class="rf-metric-value">{props.value}</strong>
          {(props.detail || props.delta) && (
            <div class="rf-metric-meta">
              {props.detail && <span class="rf-metric-detail">{props.detail}</span>}
              {props.delta && (
                <span class="rf-metric-delta" data-tone={props.deltaTone ?? 'neutral'}>
                  {props.delta}
                </span>
              )}
            </div>
          )}
        </div>
        {hasSpark && props.sparkline && <Sparkline {...props.sparkline} />}
      </div>
    )
  }
}
