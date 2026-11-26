export interface PipelineDagJob {
  id: string
  stage?: string
  needs?: readonly string[]
}

export interface PipelineStageColumn<T extends PipelineDagJob> {
  key: string
  label: string
  jobs: T[]
}

/**
 * Groups pipeline jobs into topological stage columns, safely breaking any
 * cycles without infinite recursion.
 */
export function computePipelineColumns<T extends PipelineDagJob>(
  jobs: readonly T[],
  explicitStages?: readonly string[],
): PipelineStageColumn<T>[] {
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
    visiting.delete(id)
    const depth = maxUpstream + 1
    depthCache.set(id, depth)
    return depth
  }

  for (const job of jobs) getDepth(job.id)

  const hasExplicitStage = jobs.some((job) => Boolean(job.stage))
  if (hasExplicitStage) {
    const stageOrder: string[] = explicitStages ? [...explicitStages] : []
    const byStage = new Map<string, T[]>()
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
  const columns: PipelineStageColumn<T>[] = []
  for (let d = 0; d <= maxDepth; d += 1) {
    const stageJobs = jobs.filter((job) => (depthCache.get(job.id) ?? 0) === d)
    if (stageJobs.length > 0) {
      columns.push({ key: `stage-${d}`, label: `Stage ${d + 1}`, jobs: stageJobs })
    }
  }
  return columns
}

/**
 * Returns the set of job IDs containing `anchorId` plus all transitive
 * upstream dependencies and downstream dependents.
 */
export function relatedPipelineJobIds<T extends PipelineDagJob>(
  jobs: readonly T[],
  anchorId: string | null,
): Set<string> {
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
