import {
  Badge,
  Button,
  CommandMenu,
  DataTable,
  Icon,
  Kbd,
  LogViewer,
  PipelineGraph,
  Resizable,
  Spinner,
  StatusStrip,
  Tabs,
  Toaster,
  Waterfall,
  toast,
  type CommandItem,
  type DataTableColumn,
  type LogGroup,
  type StatusStripItem,
} from '@rtzll/reflow'
import { DiffView } from '@rtzll/reflow/diffs'
import { FileTree } from '@rtzll/reflow/trees'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { playCopyError, playCopySuccess } from '../../showcase-sound.ts'
import {
  artifactDecorations,
  artifactGitStatus,
  artifactPaths,
  failureFixDiff,
  type CiJobTelemetry,
  type CiRunData,
  type CiSuiteRow,
} from './fixtures.ts'

interface CiWorkspaceProps {
  runs: Record<string, CiRunData>
  history: StatusStripItem[]
  initialRunId: string
}

function cloneRuns(runs: Record<string, CiRunData>): Record<string, CiRunData> {
  return JSON.parse(JSON.stringify(runs)) as Record<string, CiRunData>
}

function sparklinePath(samples: readonly number[], max: number, width: number, height: number) {
  if (samples.length < 2) return { line: '', area: '' }
  const stepX = width / (samples.length - 1)
  const pts = samples.map((val, idx) => {
    const x = idx * stepX
    const y = height - Math.max(0.08, Math.min(1, val / max)) * (height - 4) - 2
    return [Number(x.toFixed(1)), Number(y.toFixed(1))] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const area = `${line} L ${width} ${height} L 0 ${height} Z`
  return { line, area }
}

function TelemetrySparkline(
  handle: Handle<{
    samples: readonly number[]
    max: number
    tone: 'accent' | 'info'
  }>,
) {
  return () => {
    const props = handle.props
    const { line, area } = sparklinePath(props.samples, props.max, 96, 26)
    return (
      <svg
        class="ci-sparkline"
        data-tone={props.tone}
        width="96"
        height="26"
        viewBox="0 0 96 26"
        aria-hidden="true"
      >
        <path class="ci-sparkline-area" d={area} />
        <path class="ci-sparkline-line" d={line} />
      </svg>
    )
  }
}

function TelemetryStrip(handle: Handle<{ telemetry: CiJobTelemetry }>) {
  return () => {
    const { telemetry } = handle.props
    return (
      <div class="ci-telemetry-grid" aria-label="Runner telemetry">
        <div class="ci-metric-card">
          <span class="ci-metric-label">Runner</span>
          <strong class="ci-metric-value">{telemetry.runner}</strong>
          <span class="ci-metric-sub">{telemetry.arch}</span>
        </div>
        <div class="ci-metric-card">
          <div class="ci-metric-head">
            <span class="ci-metric-label">Cache</span>
            <Badge
              size="compact"
              color={
                telemetry.cacheStatus === 'hit'
                  ? 'green'
                  : telemetry.cacheStatus === 'partial'
                    ? 'amber'
                    : 'red'
              }
            >
              {telemetry.cacheStatus.toUpperCase()}
            </Badge>
          </div>
          <strong class="ci-metric-value">{telemetry.cacheDetail}</strong>
          <span class="ci-metric-delta" data-tone={telemetry.deltaTone}>
            {telemetry.deltaVsP50}
          </span>
        </div>
        <div class="ci-metric-card ci-metric-spark">
          <div class="ci-metric-text">
            <span class="ci-metric-label">CPU</span>
            <strong class="ci-metric-value">{telemetry.cpuPeakPct}% peak</strong>
            <span class="ci-metric-sub">avg {telemetry.cpuAvgPct}%</span>
          </div>
          <TelemetrySparkline samples={telemetry.cpuSamples} max={100} tone="accent" />
        </div>
        <div class="ci-metric-card ci-metric-spark">
          <div class="ci-metric-text">
            <span class="ci-metric-label">Memory</span>
            <strong class="ci-metric-value">
              {telemetry.memPeakGb.toFixed(1)} / {telemetry.memLimitGb} GB
            </strong>
            <span class="ci-metric-sub">peak RSS</span>
          </div>
          <TelemetrySparkline
            samples={telemetry.memSamples}
            max={telemetry.memLimitGb}
            tone="info"
          />
        </div>
      </div>
    )
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export const CiWorkspace = clientEntry(
  import.meta.url,
  function CiWorkspace(handle: Handle<CiWorkspaceProps>) {
    let tab: 'graph' | 'waterfall' | 'artifacts' = 'graph'
    let showGraph = true
    let runsState: Record<string, CiRunData> = cloneRuns(handle.props.runs)
    let historyState: StatusStripItem[] = handle.props.history.map((item) => ({ ...item }))
    let activeRunId = handle.props.initialRunId
    let activeJobId = 'e2e'
    let activeStepId: string | null = null
    let logQuery = ''
    let selectedArtifact = 'test-results/apps-nav-fix.patch'
    let rerunning = false
    let rerunTimers: ReturnType<typeof setTimeout>[] = []

    handle.signal.addEventListener(
      'abort',
      () => {
        for (const timer of rerunTimers) clearTimeout(timer)
        rerunTimers = []
      },
      { once: true },
    )

    function currentRun(): CiRunData {
      return runsState[activeRunId] ?? runsState['4577'] ?? Object.values(runsState)[0]!
    }

    function selectJob(jobId: string, stepId: string | null = null) {
      activeJobId = jobId
      activeStepId = stepId
      logQuery = ''
      void handle.update()
    }

    function selectRun(id: string) {
      if (runsState[id]) {
        activeRunId = id
        const run = runsState[id]!
        const failedJob = run.jobs.find((j) => j.status === 'failed')
        activeJobId = failedJob?.id ?? run.jobs[run.jobs.length - 1]?.id ?? 'e2e'
        activeStepId = null
        logQuery = ''
        void handle.update()
      } else {
        const entry = historyState.find((item) => item.id === id)
        if (entry) toast(`${entry.label} (${entry.detail ?? 'archived'})`)
      }
    }

    function rerunFailedJobs() {
      const run = currentRun()
      if (rerunning || run.status !== 'failed') return
      rerunning = true

      const e2eLogs: LogGroup[] = [
        ...(run.logsByJob.e2e ?? []).slice(0, 2),
        {
          id: 'e2e-apps',
          title: 'Run E2E workspace suites (53 files)',
          status: 'running',
          duration: 'running…',
          defaultOpen: true,
          entries: [
            {
              text: '\x1b[36m▸\x1b[0m Re-running failed suite apps.test.e2e.ts…',
              source: 'chromium',
              timestamp: '+00:00.1',
              fields: { attempt: 2, runner: 'blacksmith-8vcpu-ubuntu-2404' },
            },
            {
              text: '\x1b[32m✓\x1b[0m app-review.test.e2e.ts (3.1s)',
              source: 'chromium',
              timestamp: '+00:03.2',
            },
          ],
        },
      ]
      run.status = 'running'
      run.jobs = run.jobs.map((job) =>
        job.id === 'e2e'
          ? { ...job, status: 'running', duration: 'running…' }
          : job.id === 'publish'
            ? { ...job, status: 'queued', meta: 'waiting' }
            : job,
      )
      run.logsByJob = { ...run.logsByJob, e2e: e2eLogs }
      activeJobId = 'e2e'
      activeStepId = 'e2e-apps'
      void handle.update()

      const finishTimer = setTimeout(() => {
        rerunning = false
        const latest = runsState[run.id]
        if (!latest) return
        latest.status = 'passed'
        latest.duration = '3m 48s'
        latest.deltaVsP50 = '−12% vs 7d p50'
        latest.cacheHitPct = 97
        latest.jobs = latest.jobs.map((job) =>
          job.id === 'e2e'
            ? { ...job, status: 'passed', duration: '2m 03s', meta: '291 passed' }
            : job.id === 'publish'
              ? { ...job, status: 'passed', duration: '24s', meta: 'ready' }
              : job,
        )
        if (latest.telemetryByJob.e2e) {
          latest.telemetryByJob.e2e = {
            ...latest.telemetryByJob.e2e,
            cacheStatus: 'hit',
            deltaVsP50: '−10% vs p50',
            deltaTone: 'faster',
            failureLocation: undefined,
            failureHeadline: undefined,
          }
        }
        latest.logsByJob = {
          ...latest.logsByJob,
          e2e: [
            ...(latest.logsByJob.e2e ?? []).slice(0, 2),
            {
              id: 'e2e-apps',
              title: 'Run E2E workspace suites (53 files)',
              status: 'passed',
              duration: '1m 39s',
              defaultOpen: true,
              entries: [
                {
                  text: '\x1b[36m▸\x1b[0m Re-running failed suite apps.test.e2e.ts…',
                  source: 'chromium',
                  timestamp: '+00:00.1',
                  fields: { attempt: 2, cache: 'hit' },
                },
                {
                  text: '\x1b[32m✓\x1b[0m app-review.test.e2e.ts (3.1s)',
                  source: 'chromium',
                  timestamp: '+00:03.2',
                },
                {
                  text: '\x1b[32m✓\x1b[0m apps.test.e2e.ts (3.0s) — single App navigation landmark verified',
                  source: 'chromium',
                  timestamp: '+00:06.2',
                  fields: { suite: 'apps.test.e2e.ts', passed: 4, failed: 0 },
                },
                {
                  text: '\x1b[1;32mPASS\x1b[0m  291 passed, 0 failed',
                  source: 'remix-test',
                  timestamp: '+01:39.0',
                  fields: { passed: 291, failed: 0, exit_code: 0 },
                },
              ],
            },
          ],
          publish: [
            {
              id: 'publish-ok',
              title: 'Publish verified packages and GitHub release',
              status: 'passed',
              duration: '24.0s',
              defaultOpen: true,
              entries: [
                {
                  text: '\x1b[32m✓\x1b[0m Published verified tarball artifacts',
                  source: 'npm',
                  timestamp: '+02:27.0',
                  fields: { provenance: true },
                },
              ],
            },
          ],
        }
        latest.waterfall = latest.waterfall.map((span) =>
          span.id === 'e2e'
            ? {
                ...span,
                status: 'passed',
                meta: '291 passed',
                children: span.children?.map((child) =>
                  child.id === 'e2e-apps' ? { ...child, status: 'passed' } : child,
                ),
              }
            : span.id === 'publish'
              ? { ...span, status: 'passed', durationMs: 24000 }
              : span,
        )
        latest.suites = latest.suites.map((suite) =>
          suite.id === 's1' ? { ...suite, status: 'passed', tests: '4/4' } : suite,
        )
        historyState = historyState.map((item) =>
          item.id === latest.id
            ? { ...item, status: 'passed', label: `Run #${latest.number} · passed` }
            : item,
        )
        toast.success(`Run #${latest.number} passed after re-run`)
        void handle.update()
      }, 350)
      rerunTimers.push(finishTimer)
    }

    function selectWaterfallSpan(spanId: string) {
      const run = currentRun()
      const directJob = run.jobs.find((job) => job.id === spanId)
      if (directJob) {
        selectJob(directJob.id, null)
        return
      }
      for (const [jobId, groups] of Object.entries(run.logsByJob)) {
        if (groups.some((group) => group.id === spanId)) {
          selectJob(jobId, spanId)
          return
        }
      }
    }

    const mountWorkspace = ref<HTMLElement>((_node, signal) => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.defaultPrevented || isEditableTarget(event.target)) return
        if (event.metaKey || event.ctrlKey || event.altKey) return
        const run = currentRun()
        if (event.key === 'j' || event.key === 'k') {
          event.preventDefault()
          const index = Math.max(
            0,
            run.jobs.findIndex((j) => j.id === activeJobId),
          )
          const nextIdx =
            event.key === 'j' ? Math.min(run.jobs.length - 1, index + 1) : Math.max(0, index - 1)
          const target = run.jobs[nextIdx]
          if (target) selectJob(target.id)
        }
      }
      window.addEventListener('keydown', onKeyDown, { signal })
    })

    return () => {
      const run = currentRun()
      const activeJob = run.jobs.find((job) => job.id === activeJobId) ?? run.jobs[0]!
      const activeLogs = run.logsByJob[activeJob.id] ?? []
      const activeTelemetry =
        run.telemetryByJob[activeJob.id] ?? Object.values(run.telemetryByJob)[0]!

      const commands: CommandItem[] = [
        ...run.jobs.map((job) => ({
          value: `job:${job.id}`,
          label: `Job: ${job.name} (${job.status})`,
          group: 'Jobs',
          icon: <Icon name={job.status === 'failed' ? 'x' : 'check'} size={14} />,
        })),
        { value: 'tab:graph', label: 'View Pipeline graph & logs', group: 'Views' },
        { value: 'tab:waterfall', label: 'View Timing waterfall', group: 'Views' },
        { value: 'tab:artifacts', label: 'View Suites & artifacts', group: 'Views' },
      ]

      const suiteColumns: DataTableColumn<CiSuiteRow>[] = [
        { id: 'suite', label: 'Suite', value: (row) => row.suite, rowHeader: true, sortable: true },
        { id: 'runner', label: 'Runner', value: (row) => row.runner, sortable: true },
        {
          id: 'status',
          label: 'Status',
          value: (row) => row.status,
          sortable: true,
          cell: (row) => (
            <Badge size="compact" color={row.status === 'passed' ? 'green' : 'red'}>
              {row.status === 'passed' ? 'Passed' : 'Failed'}
            </Badge>
          ),
        },
        { id: 'tests', label: 'Tests', value: (row) => row.tests },
        {
          id: 'duration',
          label: 'Duration',
          value: (row) => row.durationMs,
          sortable: true,
          cell: (row) => <span>{row.duration}</span>,
        },
      ]

      const runBadge =
        run.status === 'passed' ? (
          <Badge size="compact" color="green">
            Passed
          </Badge>
        ) : run.status === 'failed' ? (
          <Badge size="compact" color="red">
            Failed
          </Badge>
        ) : (
          <Badge size="compact" color="accent">
            Running
          </Badge>
        )

      const jobStatusBadge = (status: string) => {
        if (status === 'running') return <Spinner size="11px" label="Running" />
        if (status === 'passed') return <Icon name="check" size={11} />
        if (status === 'failed' || status === 'cancelled') return <Icon name="x" size={11} />
        return <Icon name="circle" size={9} />
      }

      const graphPanel = (
        <div class="ci-panel-stack">
          {showGraph && (
            <PipelineGraph
              label="CI job dependency graph"
              jobs={run.jobs}
              value={activeJob.id}
              onValueChange={(id) => selectJob(id)}
              size="compact"
            />
          )}

          <Resizable
            class="ci-resizable"
            label="Jobs and log explorer"
            defaultValue={24}
            min={18}
            max={34}
            first={
              <aside class="ci-job-rail" aria-label="Pipeline jobs">
                <div class="ci-rail-head">
                  <span class="ci-section-heading">Jobs ({run.jobs.length})</span>
                  <button
                    type="button"
                    class="ci-rail-toggle"
                    aria-pressed={showGraph}
                    mix={on('click', () => {
                      showGraph = !showGraph
                      void handle.update()
                    })}
                  >
                    {showGraph ? 'Hide DAG' : 'Show DAG'}
                  </button>
                </div>
                <ul class="ci-job-list" role="list">
                  {run.jobs.map((job) => {
                    const isSelected = job.id === activeJob.id
                    const jobGroups = run.logsByJob[job.id] ?? []
                    return (
                      <li key={job.id} class="ci-job-item">
                        <button
                          type="button"
                          class="ci-job-row"
                          data-selected={isSelected ? 'true' : undefined}
                          data-status={job.status}
                          aria-current={isSelected ? 'true' : undefined}
                          mix={on('click', () => selectJob(job.id))}
                        >
                          <span class="ci-job-dot" data-status={job.status} aria-hidden="true">
                            {jobStatusBadge(job.status)}
                          </span>
                          <span class="ci-job-info">
                            <span class="ci-job-name">{job.name}</span>
                            {job.meta && <span class="ci-job-meta">{job.meta}</span>}
                          </span>
                          {job.duration && <span class="ci-job-dur">{job.duration}</span>}
                        </button>
                        {isSelected && jobGroups.length > 1 && (
                          <ul class="ci-step-list" role="list">
                            {jobGroups.map((group) => (
                              <li key={group.id}>
                                <button
                                  type="button"
                                  class="ci-step-row"
                                  data-active={activeStepId === group.id ? 'true' : undefined}
                                  mix={on('click', () => {
                                    activeStepId = group.id
                                    void handle.update()
                                  })}
                                >
                                  <span
                                    class="ci-step-dot"
                                    data-status={group.status}
                                    aria-hidden="true"
                                  />
                                  <span class="ci-step-title">{group.title}</span>
                                  {group.duration && (
                                    <span class="ci-step-dur">{group.duration}</span>
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </aside>
            }
            second={
              <div class="ci-log-column">
                <TelemetryStrip telemetry={activeTelemetry} />

                {activeTelemetry.failureHeadline && (
                  <div class="ci-failure-callout" role="alert">
                    <div class="ci-failure-body">
                      <strong>{activeTelemetry.failureHeadline}</strong>
                      {activeTelemetry.failureLocation && (
                        <code>{activeTelemetry.failureLocation}</code>
                      )}
                    </div>
                    <div class="ci-failure-actions">
                      <Button
                        size="compact"
                        variant="secondary"
                        mix={on('click', () => {
                          logQuery = 'level:error'
                          void handle.update()
                        })}
                      >
                        Filter errors
                      </Button>
                      <Button
                        size="compact"
                        variant="ghost"
                        mix={on('click', () => {
                          tab = 'artifacts'
                          void handle.update()
                        })}
                      >
                        Inspect fix patch
                      </Button>
                    </div>
                  </div>
                )}

                <LogViewer
                  title={`${activeJob.name} · ${activeJob.meta ?? activeJob.stage ?? 'job'}`}
                  status={
                    activeJob.status === 'cancelled'
                      ? 'failed'
                      : activeJob.status === 'queued'
                        ? 'pending'
                        : activeJob.status
                  }
                  duration={activeJob.duration}
                  groups={activeLogs}
                  activeGroupId={activeStepId}
                  query={logQuery}
                  onQueryChange={(next) => {
                    logQuery = next
                    void handle.update()
                  }}
                  follow={activeJob.status === 'running'}
                  maxHeight="460px"
                  size="compact"
                  onCopy={playCopySuccess}
                  onCopyError={playCopyError}
                />
              </div>
            }
          />
        </div>
      )

      const waterfallPanel = (
        <div class="ci-panel-stack">
          <Waterfall
            label="CI execution waterfall"
            spans={run.waterfall}
            value={activeStepId ?? activeJob.id}
            onValueChange={selectWaterfallSpan}
            size="compact"
          />
          <TelemetryStrip telemetry={activeTelemetry} />
          <LogViewer
            title={`Selected logs · ${activeJob.name}`}
            status={
              activeJob.status === 'cancelled'
                ? 'failed'
                : activeJob.status === 'queued'
                  ? 'pending'
                  : activeJob.status
            }
            duration={activeJob.duration}
            groups={activeLogs}
            activeGroupId={activeStepId}
            maxHeight="360px"
            size="compact"
            onCopy={playCopySuccess}
            onCopyError={playCopyError}
          />
        </div>
      )

      const artifactsPanel = (
        <div class="ci-panel-stack">
          <DataTable
            label="Test suites"
            rows={run.suites}
            columns={suiteColumns}
            rowKey={(row) => row.id}
            size="compact"
          />
          <div class="ci-artifacts-grid">
            <div class="ci-tree-card">
              <h2 class="ci-section-heading">Build artifacts & patches</h2>
              <FileTree
                label="Build artifacts"
                paths={artifactPaths}
                gitStatus={artifactGitStatus}
                rowDecorations={artifactDecorations}
                value={selectedArtifact}
                onValueChange={(path) => {
                  if (artifactPaths.includes(path)) {
                    selectedArtifact = path
                    void handle.update()
                  }
                }}
                size="compact"
              />
            </div>
            <DiffView
              filename={selectedArtifact}
              diff={failureFixDiff}
              viewToggle
              copyable
              wrap
              size="compact"
              onCopy={playCopySuccess}
              onCopyError={playCopyError}
            />
          </div>
        </div>
      )

      return (
        <div class="ci-workspace" data-ci-ready="" mix={mountWorkspace}>
          <header class="ci-header">
            <div class="ci-header-top">
              <div class="ci-title-block">
                <div class="ci-title-row">
                  <h1>
                    {run.title} <span class="ci-run-number">#{run.number}</span>
                  </h1>
                  {runBadge}
                </div>
                <div class="ci-meta-row">
                  <code>{run.branch}</code>
                  <code>{run.sha}</code>
                  <span>Duration {run.duration}</span>
                  <span>{run.deltaVsP50}</span>
                  <span>Cache {run.cacheHitPct}% hit</span>
                  <span>Started {run.startedAt}</span>
                </div>
              </div>

              <div class="ci-header-controls">
                <CommandMenu
                  label="Jump to job or view"
                  placeholder="Jump to a CI job or view…"
                  shortcut="mod+k"
                  items={commands}
                  triggerSize="compact"
                  trigger={
                    <span class="ci-jump-trigger">
                      <span>Jump</span>
                      <Kbd size="compact" variant="outline" keys="mod+k" />
                    </span>
                  }
                  onSelect={(val) => {
                    if (val.startsWith('job:')) {
                      selectJob(val.slice(4))
                      tab = 'graph'
                    } else if (val === 'tab:graph') tab = 'graph'
                    else if (val === 'tab:waterfall') tab = 'waterfall'
                    else if (val === 'tab:artifacts') tab = 'artifacts'
                    void handle.update()
                  }}
                />
                <Button
                  size="compact"
                  variant={run.status === 'failed' ? 'primary' : 'secondary'}
                  disabled={run.status !== 'failed' || rerunning}
                  loading={rerunning}
                  mix={on('click', rerunFailedJobs)}
                >
                  Re-run failed jobs
                </Button>
              </div>
            </div>

            <div class="ci-history-bar">
              <StatusStrip
                label="Recent CI runs"
                items={historyState}
                value={run.id}
                onValueChange={selectRun}
                showReadout
              />
              <div class="ci-shortcuts" aria-label="Keyboard shortcuts">
                <span>
                  <Kbd size="compact" variant="outline">
                    j
                  </Kbd>{' '}
                  <Kbd size="compact" variant="outline">
                    k
                  </Kbd>{' '}
                  jobs
                </span>
                <span>
                  <Kbd size="compact" variant="outline">
                    /
                  </Kbd>{' '}
                  filter logs
                </span>
                <span>
                  <Kbd size="compact" variant="outline">
                    n
                  </Kbd>{' '}
                  <Kbd size="compact" variant="outline">
                    p
                  </Kbd>{' '}
                  errors
                </span>
              </div>
            </div>
          </header>

          <Tabs
            label="CI pipeline views"
            value={tab}
            onValueChange={(next) => {
              tab =
                next === 'waterfall' ? 'waterfall' : next === 'artifacts' ? 'artifacts' : 'graph'
              void handle.update()
            }}
            items={[
              { value: 'graph', label: 'Graph & logs', panel: graphPanel },
              { value: 'waterfall', label: 'Waterfall', panel: waterfallPanel },
              { value: 'artifacts', label: 'Suites & artifacts', panel: artifactsPanel },
            ]}
          />

          <Toaster position="bottom-right" />
        </div>
      )
    }
  },
)
