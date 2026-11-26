import { on, ref, type Handle } from 'remix/component'
import { Icon } from './icon.tsx'
import { Spinner } from './spinner.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type PipelineJobStatus = 'queued' | 'running' | 'passed' | 'failed' | 'skipped' | 'cancelled'

export interface PipelineJob {
  id: string
  name: string
  /** Optional stage column label. Inferred from dependency depth when omitted. */
  stage?: string
  /** IDs of upstream jobs this job depends on. */
  needs?: readonly string[]
  status: PipelineJobStatus
  /** Optional duration string (e.g. `'42s'`, `'2m 14s'`). */
  duration?: string
  /** Optional secondary metadata (e.g. `'ubuntu-latest'`, `'chromium'`). */
  meta?: string
  /** Optional matrix job count badge (e.g. `3`). */
  matrixCount?: number
}

export interface PipelineGraphProps {
  /** Accessible name for the pipeline graph. */
  label: string
  /** Jobs and their upstream `needs` dependencies. */
  jobs: readonly PipelineJob[]
  /** Controlled selected job ID. */
  value?: string | null
  /** Initial selected job ID when uncontrolled. */
  defaultValue?: string
  /** Called when a job node is selected. */
  onValueChange?: (id: string) => void
  /** Explicit stage ordering when jobs specify `stage` labels. */
  stages?: readonly string[]
  /** Controls node padding and font scale. */
  size?: ControlSize
  class?: string
}

interface StageColumn {
  key: string
  label: string
  jobs: PipelineJob[]
}

interface EdgePath {
  key: string
  from: string
  to: string
  d: string
  status: PipelineJobStatus
}

function computeColumns(
  jobs: readonly PipelineJob[],
  explicitStages?: readonly string[],
): StageColumn[] {
  const byId = new Map(jobs.map((job) => [job.id, job]))
  const depthCache = new Map<string, number>()

  function getDepth(id: string, visiting = new Set<string>()): number {
    const cached = depthCache.get(id)
    if (cached !== undefined) return cached
    if (visiting.has(id)) return 0
    visiting.add(id)
    const job = byId.get(id)
    if (!job?.needs?.length) {
      depthCache.set(id, 0)
      return 0
    }
    let maxUpstream = -1
    for (const dep of job.needs) {
      if (byId.has(dep)) {
        maxUpstream = Math.max(maxUpstream, getDepth(dep, visiting))
      }
    }
    const depth = maxUpstream + 1
    depthCache.set(id, depth)
    return depth
  }

  for (const job of jobs) getDepth(job.id)

  const hasExplicitStage = jobs.some((job) => Boolean(job.stage))
  if (hasExplicitStage) {
    const stageOrder: string[] = explicitStages ? [...explicitStages] : []
    const byStage = new Map<string, PipelineJob[]>()
    for (const job of jobs) {
      const name = job.stage ?? `Stage ${getDepth(job.id) + 1}`
      if (!stageOrder.includes(name)) stageOrder.push(name)
      const list = byStage.get(name) ?? []
      list.push(job)
      byStage.set(name, list)
    }
    return stageOrder
      .filter((name) => (byStage.get(name)?.length ?? 0) > 0)
      .map((name) => ({ key: name, label: name, jobs: byStage.get(name)! }))
  }

  const maxDepth = Math.max(0, ...jobs.map((job) => depthCache.get(job.id) ?? 0))
  const columns: StageColumn[] = []
  for (let d = 0; d <= maxDepth; d += 1) {
    const stageJobs = jobs.filter((job) => (depthCache.get(job.id) ?? 0) === d)
    if (stageJobs.length > 0) {
      columns.push({ key: `stage-${d}`, label: `Stage ${d + 1}`, jobs: stageJobs })
    }
  }
  return columns
}

function relatedJobIds(jobs: readonly PipelineJob[], anchorId: string | null): Set<string> {
  if (!anchorId) return new Set()
  const related = new Set<string>([anchorId])
  const byId = new Map(jobs.map((job) => [job.id, job]))
  const downstream = new Map<string, string[]>()
  for (const job of jobs) {
    for (const dep of job.needs ?? []) {
      const list = downstream.get(dep) ?? []
      list.push(job.id)
      downstream.set(dep, list)
    }
  }

  const upQueue = [anchorId]
  while (upQueue.length > 0) {
    const current = upQueue.pop()!
    for (const dep of byId.get(current)?.needs ?? []) {
      if (!related.has(dep) && byId.has(dep)) {
        related.add(dep)
        upQueue.push(dep)
      }
    }
  }

  const downQueue = [anchorId]
  while (downQueue.length > 0) {
    const current = downQueue.pop()!
    for (const next of downstream.get(current) ?? []) {
      if (!related.has(next)) {
        related.add(next)
        downQueue.push(next)
      }
    }
  }

  return related
}

function jobStatusIcon(status: PipelineJobStatus) {
  if (status === 'running') return <Spinner size="12px" label="Running" />
  if (status === 'passed') return <Icon name="check" size={12} />
  if (status === 'failed' || status === 'cancelled') return <Icon name="x" size={12} />
  return <Icon name="circle" size={10} />
}

/**
 * Interactive CI pipeline job dependency graph (DAG) with stage columns,
 * measured cubic-Bezier connectors, dependency-chain hover highlighting,
 * and keyboard navigation.
 */
export function PipelineGraph(handle: Handle<PipelineGraphProps>) {
  let internalSelected = handle.props.defaultValue ?? null
  let hoveredId: string | null = null
  let edges: EdgePath[] = []
  let canvasSize = { width: 0, height: 0 }
  let canvasNode: HTMLDivElement | undefined
  let lastJobKey = ''

  function measureEdges() {
    if (!canvasNode) return
    const rect = canvasNode.getBoundingClientRect()
    const width = Math.max(0, Math.round(canvasNode.scrollWidth))
    const height = Math.max(0, Math.round(canvasNode.scrollHeight))
    const boxes = new Map<string, { left: number; right: number; midY: number }>()
    for (const el of canvasNode.querySelectorAll<HTMLElement>('[data-pipeline-job]')) {
      const id = el.dataset.pipelineJob
      if (!id) continue
      const r = el.getBoundingClientRect()
      boxes.set(id, {
        left: r.left - rect.left + canvasNode.scrollLeft,
        right: r.right - rect.left + canvasNode.scrollLeft,
        midY: r.top - rect.top + canvasNode.scrollTop + r.height / 2,
      })
    }

    const byId = new Map(handle.props.jobs.map((job) => [job.id, job]))
    const nextEdges: EdgePath[] = []
    for (const job of handle.props.jobs) {
      const toBox = boxes.get(job.id)
      if (!toBox || !job.needs?.length) continue
      for (const dep of job.needs) {
        const fromBox = boxes.get(dep)
        if (!fromBox) continue
        const x1 = fromBox.right
        const y1 = fromBox.midY
        const x2 = toBox.left
        const y2 = toBox.midY
        const dx = Math.max(24, (x2 - x1) * 0.5)
        const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
        nextEdges.push({
          key: `${dep}->${job.id}`,
          from: dep,
          to: job.id,
          d,
          status: byId.get(dep)?.status ?? job.status,
        })
      }
    }

    const changed =
      width !== canvasSize.width ||
      height !== canvasSize.height ||
      nextEdges.length !== edges.length ||
      nextEdges.some((edge, idx) => edge.d !== edges[idx]?.d || edge.status !== edges[idx]?.status)
    if (changed) {
      canvasSize = { width, height }
      edges = nextEdges
      void handle.update()
    }
  }

  const mountCanvas = ref<HTMLDivElement>((node, signal) => {
    canvasNode = node
    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(() => measureEdges()) : undefined
    observer?.observe(node)
    handle.queueTask(() => measureEdges())
    signal.addEventListener(
      'abort',
      () => {
        observer?.disconnect()
        canvasNode = undefined
      },
      { once: true },
    )
  })

  function focusJob(id: string) {
    canvasNode?.querySelector<HTMLElement>(`[data-pipeline-job="${CSS.escape(id)}"]`)?.focus()
  }

  return () => {
    const props = handle.props
    const { label, jobs, value, stages, size, class: classProp } = props
    const columns = computeColumns(jobs, stages)
    const current = value !== undefined ? value : internalSelected
    const focusAnchor = hoveredId ?? current
    const related = relatedJobIds(jobs, focusAnchor)

    const jobKey = jobs.map((j) => `${j.id}:${j.status}:${(j.needs ?? []).join(',')}`).join('|')
    if (jobKey !== lastJobKey) {
      lastJobKey = jobKey
      if (canvasNode) handle.queueTask(() => measureEdges())
    }

    function selectJob(id: string) {
      if (value === undefined) internalSelected = id
      props.onValueChange?.(id)
      void handle.update()
    }

    function handleKey(event: KeyboardEvent, colIndex: number, rowIndex: number) {
      const col = columns[colIndex]
      if (!col) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const target = col.jobs[Math.min(col.jobs.length - 1, rowIndex + 1)]
        if (target) focusJob(target.id)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        const target = col.jobs[Math.max(0, rowIndex - 1)]
        if (target) focusJob(target.id)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        const nextCol = columns[Math.min(columns.length - 1, colIndex + 1)]
        const target = nextCol?.jobs[Math.min(rowIndex, (nextCol.jobs.length || 1) - 1)]
        if (target) focusJob(target.id)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        const prevCol = columns[Math.max(0, colIndex - 1)]
        const target = prevCol?.jobs[Math.min(rowIndex, (prevCol.jobs.length || 1) - 1)]
        if (target) focusJob(target.id)
      }
    }

    return (
      <div
        class={classList('rf-pipeline-graph', classProp)}
        role="region"
        aria-label={label}
        data-density={size === 'compact' ? 'compact' : undefined}
      >
        <div class="rf-pipeline-canvas" mix={mountCanvas}>
          {edges.length > 0 && canvasSize.width > 0 && canvasSize.height > 0 && (
            <svg
              class="rf-pipeline-edges"
              width={canvasSize.width}
              height={canvasSize.height}
              viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
              aria-hidden="true"
            >
              {edges.map((edge) => {
                const isActive =
                  focusAnchor !== null && related.has(edge.from) && related.has(edge.to)
                const isDimmed = focusAnchor !== null && !isActive
                return (
                  <path
                    key={edge.key}
                    d={edge.d}
                    class="rf-pipeline-edge"
                    data-status={edge.status}
                    data-active={isActive ? 'true' : undefined}
                    data-dimmed={isDimmed ? 'true' : undefined}
                  />
                )
              })}
            </svg>
          )}

          <div class="rf-pipeline-stages">
            {columns.map((column, colIndex) => (
              <div key={column.key} class="rf-pipeline-stage">
                <div class="rf-pipeline-stage-header">{column.label}</div>
                <div class="rf-pipeline-stage-jobs">
                  {column.jobs.map((job, rowIndex) => {
                    const isSelected = current === job.id
                    const isRelated = focusAnchor !== null && related.has(job.id)
                    const isDimmed = focusAnchor !== null && !isRelated
                    return (
                      <button
                        key={job.id}
                        type="button"
                        class="rf-pipeline-node"
                        data-pipeline-job={job.id}
                        data-status={job.status}
                        data-selected={isSelected ? 'true' : undefined}
                        data-related={isRelated ? 'true' : undefined}
                        data-dimmed={isDimmed ? 'true' : undefined}
                        aria-pressed={isSelected}
                        mix={[
                          on('click', () => selectJob(job.id)),
                          on('pointerenter', () => {
                            if (hoveredId !== job.id) {
                              hoveredId = job.id
                              void handle.update()
                            }
                          }),
                          on('pointerleave', () => {
                            if (hoveredId === job.id) {
                              hoveredId = null
                              void handle.update()
                            }
                          }),
                          on('keydown', (event) => handleKey(event, colIndex, rowIndex)),
                        ]}
                      >
                        <span
                          class="rf-pipeline-node-dot"
                          data-status={job.status}
                          aria-hidden="true"
                        >
                          {jobStatusIcon(job.status)}
                        </span>
                        <span class="rf-pipeline-node-body">
                          <span class="rf-pipeline-node-name">{job.name}</span>
                          {(job.meta || job.matrixCount) && (
                            <span class="rf-pipeline-node-meta">
                              {job.meta}
                              {job.meta && job.matrixCount ? ' · ' : ''}
                              {job.matrixCount ? `${job.matrixCount} matrix` : ''}
                            </span>
                          )}
                        </span>
                        {job.duration && (
                          <span class="rf-pipeline-node-duration">{job.duration}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
}
