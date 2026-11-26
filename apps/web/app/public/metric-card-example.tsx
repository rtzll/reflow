import { Badge, MetricCard } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

/** The MetricCard example: telemetry KPI cards combining tabular figures, trend deltas, badges, and inline sparklines. */
export function MetricCardExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    showSparkline?: boolean
  }>,
) {
  return () => {
    const showSparkline = handle.props.showSparkline ?? true
    const size = handle.props.size ?? 'default'
    return (
      <div
        style={{
          width: 'min(100%, 620px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px',
        }}
      >
        <MetricCard
          label="p95 Build Time"
          value="3m 42s"
          delta="−18% vs 7d"
          deltaTone="positive"
          detail="linux-x64-8vcpu"
          badge={
            <Badge color="green" variant="dot" size="compact">
              Healthy
            </Badge>
          }
          sparkline={
            showSparkline
              ? {
                  values: [268, 255, 249, 244, 238, 232, 229, 222],
                  tone: 'success',
                  width: 84,
                  height: 28,
                }
              : undefined
          }
          size={size}
        />
        <MetricCard
          label="Runner CPU Peak"
          value="94%"
          delta="+11% vs p50"
          deltaTone="negative"
          detail="6.2 / 16 GB RAM"
          sparkline={
            showSparkline
              ? {
                  values: [24, 48, 62, 74, 88, 94, 71, 58],
                  tone: 'accent',
                  width: 84,
                  height: 28,
                }
              : undefined
          }
          size={size}
        />
      </div>
    )
  }
}
