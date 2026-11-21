import { BarChart } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const stages = [
  { id: 'compile', label: 'Compile', value: 18, detail: 'Checked the workspace types.' },
  { id: 'test', label: 'Test', value: 48, detail: 'Ran 142 browser tests.' },
  { id: 'bundle', label: 'Bundle', value: 12, detail: 'Bundled the client and server.' },
  { id: 'pack', label: 'Pack', value: 6, detail: 'Packed the release artifacts.' },
]

export function BuildTimings(handle: Handle<{ showAxes?: boolean }>) {
  let selected = stages[1]
  return () => (
    <section class="build-timings" aria-label="Latest build">
      <header>
        <strong>Build duration</strong>
        <span>{stages.reduce((total, stage) => total + stage.value, 0)} seconds total</span>
      </header>
      <BarChart
        label="Seconds by build stage"
        items={stages}
        formatValue={(value) => value + ' seconds'}
        range={{ start: selected.id, end: selected.id }}
        showAxes={handle.props.showAxes}
        onSelect={(stage) => {
          selected = stage
          void handle.update()
        }}
      />
      <p role="status">
        <strong>
          {selected.label} · {selected.value}s
        </strong>{' '}
        {selected.detail}
      </p>
    </section>
  )
}
