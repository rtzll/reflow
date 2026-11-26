import { LineChart, type LineChartSeries } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const labels = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']

const baseSeries: readonly LineChartSeries[] = [
  {
    id: 'p95',
    label: 'p95 latency',
    values: [142, 136, 158, 194, 176, 148, 139, 132],
    area: true,
  },
  {
    id: 'p50',
    label: 'p50 baseline',
    values: [68, 64, 72, 81, 75, 66, 62, 61],
    dashed: true,
  },
]

/** The LineChart example: multi-series time-series telemetry with area fill, dashed baseline, and crosshair scrubbing. */
export function LineChartExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    showGrid?: boolean
    showLegend?: boolean
  }>,
) {
  return () => (
    <div style={{ width: 'min(100%, 660px)' }}>
      <LineChart
        label="Edge Worker response latency"
        labels={labels}
        series={baseSeries}
        height={176}
        showGrid={handle.props.showGrid ?? true}
        showLegend={handle.props.showLegend ?? true}
        formatValue={(v) => `${Math.round(v)}ms`}
        size={handle.props.size ?? 'default'}
      />
    </div>
  )
}
