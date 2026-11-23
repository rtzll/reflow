import { Button, ToolCalls, type ToolCall } from '@rtzll/reflow'
import { on, ref, type Handle } from 'remix/component'

const steps = ['Read the style guide', 'Searched the notes', 'Ran the checks']

/**
 * The ToolCalls example: a finished line, and one that works through three
 * calls a second or so apart and can run again.
 */
export function ToolCallsExample(handle: Handle) {
  let done = 0
  let startedAt: number | undefined
  let endedAt: number | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  handle.signal.addEventListener('abort', () => clearTimeout(timer), { once: true })

  function run() {
    clearTimeout(timer)
    done = 0
    startedAt = Date.now()
    endedAt = undefined
    const advance = () => {
      done++
      if (done < steps.length) timer = setTimeout(advance, 1400)
      else endedAt = Date.now()
      handle.update()
    }
    timer = setTimeout(advance, 1400)
    handle.update()
  }
  const start = ref(() => run())

  return () => {
    const live: ToolCall[] = steps.slice(0, done + 1).map((label, index) => ({
      id: String(index),
      label,
      status: index < done ? 'done' : 'running',
    }))
    return (
      <div
        class="example-stack"
        style={{ width: 'min(100%, 384px)', alignItems: 'start' }}
        mix={start}
      >
        <ToolCalls
          calls={[
            { id: 'a', label: 'Read the brief' },
            { id: 'b', label: 'Ran a command', detail: <code>pnpm test</code> },
          ]}
          startedAt={0}
          endedAt={12_000}
        />
        <ToolCalls
          calls={endedAt ? live.map((call) => ({ ...call, status: 'done' })) : live}
          startedAt={startedAt}
          endedAt={endedAt}
        />
        <Button size="compact" variant="secondary" disabled={!endedAt} mix={on('click', run)}>
          Run again
        </Button>
      </div>
    )
  }
}
