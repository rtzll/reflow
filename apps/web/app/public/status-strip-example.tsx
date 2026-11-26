import { StatusStrip, type StatusStripItem } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const sampleRuns: readonly StatusStripItem[] = [
  {
    id: '4569',
    status: 'passed',
    label: 'Run #4569 · passed',
    value: 224_000,
    detail: 'a84c1bb · v0.16.1 · 3m 44s',
  },
  {
    id: '4570',
    status: 'passed',
    label: 'Run #4570 · passed',
    value: 232_000,
    detail: 'bd975aa · main · 3m 52s',
  },
  {
    id: '4571',
    status: 'passed',
    label: 'Run #4571 · passed',
    value: 218_000,
    detail: '7e08207 · main · 3m 38s',
  },
  {
    id: '4572',
    status: 'failed',
    label: 'Run #4572 · failed',
    value: 256_000,
    detail: '8e2f022 · main · 4m 16s',
  },
  {
    id: '4573',
    status: 'cancelled',
    label: 'Run #4573 · cancelled',
    value: 42_000,
    detail: '8e2f022 · main · 42s',
  },
  {
    id: '4574',
    status: 'failed',
    label: 'Run #4574 · failed',
    value: 243_000,
    detail: '3bb2c29 · main · 4m 03s',
  },
  {
    id: '4575',
    status: 'passed',
    label: 'Run #4575 · passed',
    value: 238_000,
    detail: '6303436 · main · 3m 58s',
  },
  {
    id: '4576',
    status: 'passed',
    label: 'Run #4576 · passed',
    value: 229_000,
    detail: '205a1d9 · main · 3m 49s',
  },
  {
    id: '4577',
    status: 'passed',
    label: 'Run #4577 · passed',
    value: 215_000,
    detail: '243b873 · main · 3m 35s',
  },
  {
    id: '4578',
    status: 'passed',
    label: 'Run #4578 · passed',
    value: 342_000,
    detail: '8b55f19 · v0.17.0 · 5m 42s',
  },
]

/** The StatusStrip example: compact duration-scaled run history with hover/selection readout. */
export function StatusStripExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    scaleHeight?: boolean
    showReadout?: boolean
  }>,
) {
  let selected = '4578'

  return () => (
    <StatusStrip
      label="Recent release runs"
      items={sampleRuns}
      value={selected}
      onValueChange={(id) => {
        selected = id
        void handle.update()
      }}
      scaleHeight={handle.props.scaleHeight ?? true}
      showReadout={handle.props.showReadout ?? true}
      size={handle.props.size ?? 'default'}
    />
  )
}
