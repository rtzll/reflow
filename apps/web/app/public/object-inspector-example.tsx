import { ObjectInspector } from '@rtzll/reflow'
import type { Handle } from 'remix/component'
import { playCopyError, playCopySuccess } from './showcase-sound.ts'

const sampleEvent = {
  id: 'evt_01J9X4K8R2',
  type: 'workflow_run.completed',
  conclusion: 'success',
  durationMs: 222_000,
  cached: true,
  error: null,
  runner: {
    arch: 'x64',
    cores: 8,
    region: 'fra',
    tags: ['self-hosted', 'nvme', 'warm-cache'],
  },
  artifacts: [
    { name: 'reflow-0.18.0.tgz', bytes: 84_120 },
    { name: 'worker-bundle.js', bytes: 192_400 },
  ],
}

/** The ObjectInspector example: collapsible structured JSON/event tree with type coloring and one-click copy. */
export function ObjectInspectorExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    expandLevel?: number
    sortKeys?: boolean
    copyable?: boolean
  }>,
) {
  return () => (
    <div style={{ width: 'min(100%, 560px)' }}>
      <ObjectInspector
        name="webhook"
        data={sampleEvent}
        expandLevel={handle.props.expandLevel ?? 1}
        sortKeys={Boolean(handle.props.sortKeys)}
        copyable={handle.props.copyable ?? true}
        size={handle.props.size ?? 'default'}
        onCopy={playCopySuccess}
        onCopyError={playCopyError}
      />
    </div>
  )
}
