import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { Icon } from './icon.tsx'
import { Spinner } from './spinner.tsx'

export interface ToolCall {
  id: string
  label: string
  /** Default `done`. */
  status?: 'running' | 'done' | 'failed'
  /** Shown under the call while the line is open, such as a command and its output. */
  detail?: RemixNode
}

export interface ToolCallsProps {
  calls: readonly ToolCall[]
  /** Replaces the closed line's text, such as "Read 2 files, ran a command". */
  summary?: string
  /** When the work started, in milliseconds. Times the running line and, with `endedAt`, the summary. */
  startedAt?: number
  endedAt?: number
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/** `72000` → "1m 12s"; under a minute, "12s". */
function formatDuration(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(seconds / 60)
  return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`
}

/**
 * Folds an assistant's tool calls into one line that opens to the calls,
 * and while one runs, says which and for how long. See docs/tool-calls.md.
 */
export function ToolCalls(handle: Handle<ToolCallsProps>) {
  let localOpen = handle.props.defaultOpen ?? false
  // The elapsed time is the browser's to count, so the server and the first
  // render agree.
  let mounted = false
  let timer: ReturnType<typeof setInterval> | undefined
  handle.signal.addEventListener('abort', () => clearInterval(timer), { once: true })
  const mount = ref(() => {
    mounted = true
    handle.update()
  })

  function setOpen(next: boolean) {
    if (handle.props.open === undefined) localOpen = next
    handle.props.onOpenChange?.(next)
    handle.update()
  }

  return () => {
    const { calls, summary, startedAt, endedAt } = handle.props
    const open = handle.props.open ?? localOpen
    const running = calls.find((call) => call.status === 'running')
    // Count each second only while something runs and there is a start.
    if (running && startedAt !== undefined && mounted) {
      timer ??= setInterval(() => handle.update(), 1000)
    } else {
      clearInterval(timer)
      timer = undefined
    }
    const elapsed =
      running && startedAt !== undefined && mounted ? formatDuration(Date.now() - startedAt) : ''
    const text = running
      ? running.label
      : (summary ??
        (startedAt !== undefined && endedAt !== undefined
          ? `Worked for ${formatDuration(endedAt - startedAt)}`
          : `${calls.length} ${calls.length === 1 ? 'step' : 'steps'}`))
    const listId = `${handle.id}-calls`
    return (
      <div class="rf-tool-calls" data-open={open || undefined} mix={mount}>
        <button
          type="button"
          class="rf-tool-calls-line"
          aria-expanded={open}
          aria-controls={listId}
          mix={on('click', () => setOpen(!open))}
        >
          <span class="rf-tool-calls-summary">
            {running && <Spinner size="14px" />}
            <span>{text}</span>
            {elapsed && <span class="rf-tool-calls-time">{elapsed}</span>}
          </span>
          <Icon name="chevron-right" class="rf-tool-calls-chevron" />
        </button>
        {/* Live regions inside a button are read unreliably; announce beside it. */}
        <span class="rf-basic-sr-only" role="status">
          {running?.label ?? ''}
        </span>
        <div class="rf-tool-calls-region" inert={!open}>
          <ol id={listId} class="rf-tool-calls-list">
            {calls.map((call) => {
              const status = call.status ?? 'done'
              return (
                <li key={call.id} data-status={status}>
                  <span class="rf-tool-calls-mark">
                    {status === 'running' ? (
                      <Spinner size="12px" />
                    ) : status === 'failed' ? (
                      <>
                        <Icon name="x" />
                        <span class="rf-basic-sr-only">Failed: </span>
                      </>
                    ) : (
                      <Icon name="check" />
                    )}
                  </span>
                  <span class="rf-tool-calls-label">{call.label}</span>
                  {call.detail != null && <div class="rf-tool-calls-detail">{call.detail}</div>}
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    )
  }
}
