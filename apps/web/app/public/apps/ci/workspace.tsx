import {
  Badge,
  Button,
  CommandMenu,
  DataTable,
  Icon,
  Kbd,
  LogViewer,
  PipelineGraph,
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
import { clientEntry, on, type Handle } from 'remix/component'
import { playCopyError, playCopySuccess } from '../../showcase-sound.ts'
import {
  artifactDecorations,
  artifactGitStatus,
  artifactPaths,
  failureFixDiff,
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

export const CiWorkspace = clientEntry(
  import.meta.url,
  function CiWorkspace(handle: Handle<CiWorkspaceProps>) {
    let tab: 'graph' | 'waterfall' | 'artifacts' = 'graph'
    let runsState: Record<string, CiRunData> = cloneRuns(handle.props.runs)
    let historyState: StatusStripItem[] = handle.props.history.map((item) => ({ ...item }))
    let activeRunId = handle.props.initialRunId
    let activeJobId = 'e2e'
    let activeStepId: string | null = null
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

    function selectRun(id: string) {
      if (runsState[id]) {
        activeRunId = id
        const run = runsState[id]!
        const failedJob = run.jobs.find((j) => j.status === 'failed')
        activeJobId = failedJob?.id ?? run.jobs[run.jobs.length - 1]?.id ?? 'e2e'
        activeStepId = null
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

      // Immediately flip failed job to running and stream a fresh log entry.
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
              timestamp: '+00:00.1',
            },
            { text: '\x1b[32m✓\x1b[0m app-review.test.e2e.ts (3.1s)', timestamp: '+00:03.2' },
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
        latest.jobs = latest.jobs.map((job) =>
          job.id === 'e2e'
            ? { ...job, status: 'passed', duration: '2m 03s', meta: '291 passed' }
            : job.id === 'publish'
              ? { ...job, status: 'passed', duration: '24s', meta: 'ready' }
              : job,
        )
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
                  timestamp: '+00:00.1',
                },
                { text: '\x1b[32m✓\x1b[0m app-review.test.e2e.ts (3.1s)', timestamp: '+00:03.2' },
                {
                  text: '\x1b[32m✓\x1b[0m apps.test.e2e.ts (3.0s) — single App navigation landmark verified',
                  timestamp: '+00:06.2',
                },
                { text: '\x1b[1;32mPASS\x1b[0m  291 passed, 0 failed', timestamp: '+01:39.0' },
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
                  timestamp: '+02:27.0',
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
        activeJobId = directJob.id
        activeStepId = null
      } else {
        for (const [jobId, groups] of Object.entries(run.logsByJob)) {
          if (groups.some((group) => group.id === spanId)) {
            activeJobId = jobId
            activeStepId = spanId
            break
          }
        }
      }
      void handle.update()
    }

    return () => {
      const run = currentRun()
      const activeJob = run.jobs.find((job) => job.id === activeJobId) ?? run.jobs[0]!
      const activeLogs = run.logsByJob[activeJob.id] ?? []

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

      const graphPanel = (
        <div class="ci-panel-stack">
          <PipelineGraph
            label="CI job dependency graph"
            jobs={run.jobs}
            value={activeJob.id}
            onValueChange={(id) => {
              activeJobId = id
              activeStepId = null
              void handle.update()
            }}
            size="compact"
          />
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
            follow={activeJob.status === 'running'}
            maxHeight="420px"
            size="compact"
            onCopy={playCopySuccess}
            onCopyError={playCopyError}
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
            maxHeight="340px"
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
        <div class="ci-workspace" data-ci-ready="">
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
                      activeJobId = val.slice(4)
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
              <span class="ci-history-label">Recent runs (click #4577 / #4578 to switch)</span>
              <StatusStrip
                label="Recent CI runs"
                items={historyState}
                value={run.id}
                onValueChange={selectRun}
                showReadout
              />
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
