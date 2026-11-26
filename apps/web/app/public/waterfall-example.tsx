import { Badge, Waterfall, type WaterfallSpan } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const sampleSpans: readonly WaterfallSpan[] = [
  {
    id: 'check',
    label: 'lint & typecheck',
    meta: 'cached',
    status: 'cached',
    startMs: 0,
    durationMs: 4200,
  },
  {
    id: 'verify',
    label: 'verify / e2e',
    meta: 'chromium',
    status: 'passed',
    startMs: 4200,
    durationMs: 48000,
    critical: true,
    children: [
      {
        id: 'build-web',
        label: 'build showcase & worker',
        status: 'passed',
        startMs: 4200,
        durationMs: 9500,
        critical: true,
      },
      {
        id: 'worker-smoke',
        label: 'test local deployment (82 routes)',
        status: 'passed',
        startMs: 13700,
        durationMs: 7400,
      },
      {
        id: 'e2e-suite',
        label: 'pnpm test:run (291 tests)',
        status: 'passed',
        startMs: 13700,
        durationMs: 38500,
        critical: true,
      },
    ],
  },
  {
    id: 'pack',
    label: 'pack & starter isolation',
    status: 'passed',
    startMs: 52200,
    durationMs: 11800,
    critical: true,
  },
  {
    id: 'publish',
    label: 'publish npm & GitHub release',
    status: 'running',
    startMs: 64000,
    durationMs: 9000,
    critical: true,
  },
]

/** The Waterfall example: hierarchical CI job and step durations along a shared time axis. */
export function WaterfallExample(handle: Handle) {
  let selected = 'e2e-suite'

  return () => (
    <div style={{ width: 'min(100%, 760px)', display: 'grid', gap: '10px' }}>
      <Waterfall
        label="Release 0.17.0 timing waterfall"
        spans={sampleSpans}
        value={selected}
        onValueChange={(id) => {
          selected = id
          void handle.update()
        }}
        size="compact"
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
        <span style={{ color: 'var(--rf-muted)' }}>Inspecting span</span>
        <Badge size="compact">{selected}</Badge>
      </div>
    </div>
  )
}
