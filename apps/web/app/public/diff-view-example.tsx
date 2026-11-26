import { Button, Icon } from '@rtzll/reflow'
import { DiffView } from '@rtzll/reflow/diffs'
import { on, type Handle } from 'remix/component'
import { sampleDiff } from './diff-view-sample.ts'
import { playCopyError, playCopySuccess } from './showcase-sound.ts'

/** The DiffView example: a unified diff with a Unified/Split toggle and copyable patch. */
export function DiffViewExample(handle: Handle<{ prerenderedHTML?: string }>) {
  let state: 'idle' | 'copied' | 'error' = 'idle'
  let timer: ReturnType<typeof setTimeout> | undefined
  handle.signal.addEventListener('abort', () => clearTimeout(timer), { once: true })

  async function copyPatch() {
    clearTimeout(timer)
    try {
      await navigator.clipboard.writeText(sampleDiff)
      state = 'copied'
      playCopySuccess()
    } catch {
      state = 'error'
      playCopyError()
    }
    void handle.update()
    timer = setTimeout(() => {
      state = 'idle'
      void handle.update()
    }, 1600)
  }

  return () => (
    <div style={{ width: 'min(100%, 760px)' }}>
      <DiffView
        diff={sampleDiff}
        prerenderedHTML={handle.props.prerenderedHTML}
        viewToggle
        wrap
        size="compact"
        actions={
          <Button
            size="compact"
            variant="ghost"
            leadingIcon={<Icon name={state === 'copied' ? 'check' : 'copy'} size={14} />}
            mix={on('click', () => void copyPatch())}
          >
            {state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : 'Copy patch'}
          </Button>
        }
      />
    </div>
  )
}
