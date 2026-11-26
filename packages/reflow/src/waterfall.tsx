import { on, ref, type Handle } from 'remix/component'
import { Icon } from './icon.tsx'
import { Spinner } from './spinner.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type WaterfallStatus = 'passed' | 'running' | 'failed' | 'queued' | 'cached' | 'skipped'

export interface WaterfallSpan {
  id: string
  label: string
  /** Optional secondary tag (such as runner name, cache hit, or exit status). */
  meta?: string
  /** Start offset in milliseconds from the trace or pipeline start. */
  startMs: number
  /** Duration in milliseconds. */
  durationMs: number
  /** Semantic execution status. Default `'passed'`. */
  status?: WaterfallStatus
  /** Highlights this span as part of the critical path. */
  critical?: boolean
  /** Nested child spans (e.g. steps inside a job, or sub-spans in a trace). */
  children?: readonly WaterfallSpan[]
}

export interface WaterfallProps {
  /** Accessible name for the timing waterfall. */
  label: string
  /** Top-level spans (jobs, stages, or root trace spans). */
  spans: readonly WaterfallSpan[]
  /** Optional total timeline duration in ms; defaults to the latest span end. */
  totalMs?: number
  /** Controlled selected span ID. */
  value?: string | null
  /** Initial selected span ID when uncontrolled. */
  defaultValue?: string
  /** Called when a span row or timing bar is selected. */
  onValueChange?: (id: string) => void
  /** Controlled expanded parent span IDs. */
  expanded?: readonly string[]
  /** Initial expanded parent span IDs. Defaults to all parent spans expanded. */
  defaultExpanded?: readonly string[]
  /** Called when expanded parent span IDs change. */
  onExpandedChange?: (ids: string[]) => void
  /** Emphasizes spans marked `critical: true`. Default `true`. */
  highlightCriticalPath?: boolean
  /** Controls row spacing and font scale. */
  size?: ControlSize
  class?: string
}

interface FlatSpan {
  span: WaterfallSpan
  depth: number
  parentId?: string
  hasChildren: boolean
}

function collectParentIds(spans: readonly WaterfallSpan[], out: string[] = []): string[] {
  for (const span of spans) {
    if (span.children?.length) {
      out.push(span.id)
      collectParentIds(span.children, out)
    }
  }
  return out
}

function maxEndMs(spans: readonly WaterfallSpan[]): number {
  let max = 0
  for (const span of spans) {
    max = Math.max(max, span.startMs + span.durationMs)
    if (span.children?.length) {
      max = Math.max(max, maxEndMs(span.children))
    }
  }
  return max
}

export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const rem = Math.round(seconds % 60)
  return rem === 0 ? `${minutes}m` : `${minutes}m ${rem}s`
}

function statusBadgeIcon(status: WaterfallStatus) {
  if (status === 'running') return <Spinner size="11px" label="Running" />
  if (status === 'passed' || status === 'cached') return <Icon name="check" size={11} />
  if (status === 'failed') return <Icon name="x" size={11} />
  return <Icon name="circle" size={9} />
}

/**
 * Hierarchical Gantt / span timing waterfall for CI pipelines, build step
 * profiling, distributed traces, and multi-tool agent runs.
 */
export function Waterfall(handle: Handle<WaterfallProps>) {
  let internalSelected = handle.props.defaultValue ?? null
  let internalExpanded = [...(handle.props.defaultExpanded ?? collectParentIds(handle.props.spans))]
  let rootNode: HTMLDivElement | undefined

  const mountRoot = ref<HTMLDivElement>((node, signal) => {
    rootNode = node
    signal.addEventListener(
      'abort',
      () => {
        rootNode = undefined
      },
      { once: true },
    )
  })

  function focusRow(id: string) {
    const row = rootNode?.querySelector<HTMLElement>(`[data-waterfall-id="${CSS.escape(id)}"]`)
    row?.focus()
  }

  return () => {
    const props = handle.props
    const {
      label,
      spans,
      totalMs: totalProp,
      value,
      expanded,
      highlightCriticalPath = true,
      size,
      class: classProp,
    } = props

    const current = value !== undefined ? value : internalSelected
    const open = new Set(expanded ?? internalExpanded)
    const total = Math.max(1, totalProp ?? maxEndMs(spans))

    const rows: FlatSpan[] = []
    function flatten(list: readonly WaterfallSpan[], depth: number, parentId?: string) {
      for (const span of list) {
        const hasChildren = Boolean(span.children?.length)
        rows.push({ span, depth, parentId, hasChildren })
        if (hasChildren && open.has(span.id)) {
          flatten(span.children!, depth + 1, span.id)
        }
      }
    }
    flatten(spans, 0)

    function toggleExpand(id: string) {
      const next = open.has(id) ? [...open].filter((item) => item !== id) : [...open, id]
      if (expanded === undefined) internalExpanded = next
      props.onExpandedChange?.(next)
      void handle.update()
    }

    function selectSpan(id: string) {
      if (value === undefined) internalSelected = id
      props.onValueChange?.(id)
      void handle.update()
    }

    function handleKeyDown(event: KeyboardEvent, index: number) {
      const entry = rows[index]
      if (!entry) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const next = rows[Math.min(rows.length - 1, index + 1)]
        if (next) focusRow(next.span.id)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        const prev = rows[Math.max(0, index - 1)]
        if (prev) focusRow(prev.span.id)
      } else if (event.key === 'ArrowRight') {
        if (entry.hasChildren && !open.has(entry.span.id)) {
          event.preventDefault()
          toggleExpand(entry.span.id)
        }
      } else if (event.key === 'ArrowLeft') {
        if (entry.hasChildren && open.has(entry.span.id)) {
          event.preventDefault()
          toggleExpand(entry.span.id)
        } else if (entry.parentId) {
          event.preventDefault()
          focusRow(entry.parentId)
        }
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        selectSpan(entry.span.id)
      }
    }

    const ticks = [0, 0.25, 0.5, 0.75, 1]

    return (
      <div
        class={classList('rf-waterfall', classProp)}
        role="treegrid"
        aria-label={label}
        data-density={size === 'compact' ? 'compact' : undefined}
        mix={mountRoot}
      >
        <div class="rf-waterfall-ruler" role="row">
          <div class="rf-waterfall-ruler-label" role="columnheader">
            Stage / Span
          </div>
          <div class="rf-waterfall-ruler-axis" role="columnheader">
            {ticks.map((ratio) => (
              <span
                key={ratio}
                class="rf-waterfall-tick"
                style={{ insetInlineStart: `${ratio * 100}%` }}
                data-end={ratio === 1 ? 'true' : undefined}
              >
                {formatDurationMs(total * ratio)}
              </span>
            ))}
          </div>
        </div>

        <div class="rf-waterfall-rows">
          {rows.map((entry, index) => {
            const { span, depth, hasChildren } = entry
            const status = span.status ?? 'passed'
            const isSelected = current === span.id
            const isExpanded = hasChildren && open.has(span.id)
            const leftPct = Math.min(100, Math.max(0, (span.startMs / total) * 100))
            const widthPct = Math.min(100 - leftPct, Math.max(0.6, (span.durationMs / total) * 100))
            const labelInsideRight = leftPct + widthPct > 84
            const tabIndex =
              current && rows.some((r) => r.span.id === current)
                ? isSelected
                  ? 0
                  : -1
                : index === 0
                  ? 0
                  : -1

            return (
              <div
                key={span.id}
                role="row"
                aria-level={depth + 1}
                aria-expanded={hasChildren ? isExpanded : undefined}
                aria-selected={isSelected}
                tabIndex={tabIndex}
                class="rf-waterfall-row"
                data-waterfall-id={span.id}
                data-selected={isSelected ? 'true' : undefined}
                data-status={status}
                mix={[
                  on('click', () => selectSpan(span.id)),
                  on('keydown', (event) => handleKeyDown(event, index)),
                ]}
              >
                <div
                  class="rf-waterfall-name-cell"
                  role="gridcell"
                  style={{ paddingInlineStart: `${10 + depth * 16}px` }}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      class="rf-waterfall-toggle"
                      tabIndex={-1}
                      aria-label={isExpanded ? `Collapse ${span.label}` : `Expand ${span.label}`}
                      mix={on('click', (event) => {
                        event.stopPropagation()
                        toggleExpand(span.id)
                      })}
                    >
                      <Icon name="chevron-right" size={12} />
                    </button>
                  ) : (
                    <span class="rf-waterfall-spacer" aria-hidden="true" />
                  )}
                  <span class="rf-waterfall-dot" data-status={status} aria-hidden="true">
                    {statusBadgeIcon(status)}
                  </span>
                  <span class="rf-waterfall-label" title={span.label}>
                    {span.label}
                  </span>
                  {span.meta && <span class="rf-waterfall-meta">{span.meta}</span>}
                </div>

                <div class="rf-waterfall-track-cell" role="gridcell">
                  <div class="rf-waterfall-gridlines" aria-hidden="true">
                    {ticks.slice(1, -1).map((ratio) => (
                      <span
                        key={ratio}
                        class="rf-waterfall-gridline"
                        style={{ insetInlineStart: `${ratio * 100}%` }}
                      />
                    ))}
                  </div>
                  <div
                    class="rf-waterfall-bar-wrap"
                    style={{
                      insetInlineStart: `${leftPct}%`,
                      inlineSize: `${widthPct}%`,
                    }}
                  >
                    <span
                      class="rf-waterfall-bar"
                      data-status={status}
                      data-critical={highlightCriticalPath && span.critical ? 'true' : undefined}
                    />
                    <span
                      class="rf-waterfall-bar-duration"
                      data-side={labelInsideRight ? 'left' : 'right'}
                    >
                      {formatDurationMs(span.durationMs)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}
