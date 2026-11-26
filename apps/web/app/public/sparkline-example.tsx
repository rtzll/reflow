import { Sparkline, type SparklineTone } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const sampleSeries = [28, 34, 42, 39, 58, 64, 61, 79, 86, 72, 68, 74]
const sampleLabels = [
  '12:00',
  '12:05',
  '12:10',
  '12:15',
  '12:20',
  '12:25',
  '12:30',
  '12:35',
  '12:40',
  '12:45',
  '12:50',
  '12:55',
]

/** The Sparkline example: compact inline trend line with semantic tones and pointer/keyboard scrubbing. */
export function SparklineExample(
  handle: Handle<{
    tone?: SparklineTone
    fill?: boolean
    interactive?: boolean
  }>,
) {
  let active: number | null = null

  return () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <Sparkline
        label="Runner CPU utilization"
        values={sampleSeries}
        labels={sampleLabels}
        width={148}
        height={36}
        tone={handle.props.tone ?? 'accent'}
        fill={handle.props.fill ?? true}
        interactive={handle.props.interactive ?? true}
        onActiveIndexChange={(idx) => {
          active = idx
          void handle.update()
        }}
      />
      <span
        style={{
          fontSize: '12px',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--rf-muted)',
          minWidth: '110px',
        }}
      >
        {active !== null ? `${sampleLabels[active]} · ${sampleSeries[active]}%` : 'Hover or focus'}
      </span>
    </div>
  )
}
