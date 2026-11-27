import {
  ActivityHeatmap,
  Avatar,
  Badge,
  Button,
  CodeBrowser,
  CopyChip,
  DiffMinimap,
  DiffStat,
  InlineEdit,
  MatrixGrid,
  MergeQueue,
  MergeReadiness,
  MetadataList,
  ProportionBar,
  RelativeTime,
  ShortcutSheet,
  SizeDelta,
  SplitButton,
  StackGraph,
  TestReport,
  VirtualList,
  type CodeLineRange,
  type MergeQueueEntry,
} from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'
import { playCopyError, playCopySuccess } from './showcase-sound.ts'

const virtualRows = Array.from({ length: 1_000 }, (_, index) => ({
  id: `commit-${index}`,
  sha: (0x3a91c00 + index * 2654435761) >>> 0,
  message:
    index % 3 === 0
      ? 'fix(diff): preserve line anchors on resize'
      : index % 3 === 1
        ? 'feat(ci): stream flaky test badges'
        : 'chore(web): tighten worker bundle budget',
  author: index % 2 === 0 ? 'Ada' : 'Noah',
}))

export function VirtualListExample(handle: Handle<{ height?: number }>) {
  let target: number | undefined
  return () => (
    <div
      style={{ width: 'min(100%, 520px)', display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <Button
          size="compact"
          variant="secondary"
          mix={on('click', () => {
            target = 0
            void handle.update()
          })}
        >
          Top (#1)
        </Button>
        <Button
          size="compact"
          variant="secondary"
          mix={on('click', () => {
            target = 499
            void handle.update()
          })}
        >
          Jump to #500
        </Button>
        <Button
          size="compact"
          variant="secondary"
          mix={on('click', () => {
            target = 999
            void handle.update()
          })}
        >
          Bottom (#1000)
        </Button>
      </div>
      <VirtualList
        label="Commit history"
        items={virtualRows}
        itemHeight={36}
        height={handle.props.height ?? 216}
        scrollToIndex={target}
        getKey={(row) => row.id}
        renderItem={(row, index) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 10px',
              height: '36px',
              borderBottom: '1px solid var(--rf-border)',
              fontSize: '12.5px',
            }}
          >
            <span style={{ fontFamily: 'var(--rf-font-mono)', color: 'var(--rf-muted)' }}>
              #{index + 1}
            </span>
            <span style={{ fontFamily: 'var(--rf-font-mono)', color: 'var(--rf-accent)' }}>
              {row.sha.toString(16).padStart(7, '0').slice(0, 7)}
            </span>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.message}
            </span>
          </div>
        )}
      />
    </div>
  )
}

export function ShortcutSheetExample() {
  return () => (
    <div style={{ width: 'min(100%, 420px)' }}>
      <ShortcutSheet
        hotkey={false}
        trigger={
          <Button variant="secondary" size="compact">
            Keyboard shortcuts (?)
          </Button>
        }
        shortcuts={[
          { keys: ['g', 'p'], label: 'Go to pull requests', group: 'Navigation' },
          { keys: ['g', 'c'], label: 'Go to CI checks', group: 'Navigation' },
          { keys: 'mod+k', label: 'Open command menu', group: 'Navigation' },
          { keys: 'j', label: 'Next changed file', group: 'Code review' },
          { keys: 'k', label: 'Previous changed file', group: 'Code review' },
          { keys: 'v', label: 'Toggle file viewed', group: 'Code review' },
          { keys: 'r', label: 'Add inline review comment', group: 'Code review' },
        ]}
      />
    </div>
  )
}

const pinnedNow = new Date('2026-11-26T12:00:00Z')

export function RelativeTimeExample() {
  return () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
      }}
    >
      <span>
        Merged <RelativeTime date="2026-11-26T11:56:00Z" now={pinnedNow} live={false} />
      </span>
      <span>·</span>
      <span>
        Deployed <RelativeTime date="2026-11-26T09:00:00Z" now={pinnedNow} live={false} />
      </span>
      <span>·</span>
      <span>
        Opened <RelativeTime date="2026-11-21T12:00:00Z" now={pinnedNow} live={false} />
      </span>
    </div>
  )
}

export function SplitButtonExample(handle: Handle) {
  let mode = 'Squash and merge'
  let count = 0
  return () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
      <SplitButton
        label={mode}
        menuLabel="Choose merge method"
        onClick={() => {
          count++
          void handle.update()
        }}
        onSelect={(value) => {
          mode =
            value === 'merge'
              ? 'Create a merge commit'
              : value === 'rebase'
                ? 'Rebase and merge'
                : 'Squash and merge'
          void handle.update()
        }}
        items={[
          {
            value: 'squash',
            label: 'Squash and merge',
            hint: '1 commit',
          },
          {
            value: 'merge',
            label: 'Create a merge commit',
            hint: 'All commits',
          },
          {
            value: 'rebase',
            label: 'Rebase and merge',
            hint: 'Linear history',
          },
        ]}
      />
      {count > 0 && (
        <span style={{ fontSize: '12px', color: 'var(--rf-muted)' }}>Triggered {count}×</span>
      )}
    </div>
  )
}

export function DiffStatExample() {
  return () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
      <DiffStat added={142} removed={28} />
      <DiffStat added={12} removed={44} />
      <DiffStat added={6} removed={0} blocks={5} />
    </div>
  )
}

export function ProportionBarExample() {
  return () => (
    <div style={{ width: 'min(100%, 420px)' }}>
      <ProportionBar
        label="Repository languages"
        segments={[
          { id: 'ts', label: 'TypeScript', value: 78, tone: 'accent' },
          { id: 'css', label: 'CSS', value: 16, tone: 'info' },
          { id: 'md', label: 'Markdown', value: 6, tone: 'neutral' },
        ]}
      />
    </div>
  )
}

export function MetadataListExample() {
  return () => (
    <div style={{ width: 'min(100%, 340px)' }}>
      <MetadataList
        label="Pull request metadata"
        items={[
          {
            id: 'reviewers',
            label: 'Reviewers',
            value: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Avatar name="Ada Lovelace" size={20} decorative />
                <span>Ada Lovelace</span>
                <Badge color="green" size="compact">
                  Approved
                </Badge>
              </span>
            ),
          },
          {
            id: 'labels',
            label: 'Labels',
            value: (
              <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '4px' }}>
                <Badge color="blue" size="compact">
                  code-review
                </Badge>
                <Badge color="violet" size="compact">
                  wave-16
                </Badge>
              </span>
            ),
          },
          {
            id: 'commit',
            label: 'Head commit',
            value: (
              <CopyChip
                value="cef8e3891a20b9c441e82"
                display="cef8e38"
                size="compact"
                onCopy={playCopySuccess}
                onCopyError={playCopyError}
              />
            ),
          },
          {
            id: 'updated',
            label: 'Updated',
            value: <RelativeTime date="2026-11-26T11:48:00Z" now={pinnedNow} live={false} />,
          },
        ]}
      />
    </div>
  )
}

export function CopyChipExample() {
  return () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
      <CopyChip
        value="cef8e3891a20b9c441e82"
        display="cef8e38"
        onCopy={playCopySuccess}
        onCopyError={playCopyError}
      />
      <CopyChip
        value="feat/forge-primitives"
        onCopy={playCopySuccess}
        onCopyError={playCopyError}
      />
      <CopyChip value="#419" size="compact" onCopy={playCopySuccess} onCopyError={playCopyError} />
    </div>
  )
}

export function InlineEditExample(handle: Handle) {
  let title = 'feat(forge): add stacked PR review primitives'
  return () => (
    <div style={{ width: 'min(100%, 440px)' }}>
      <InlineEdit
        label="Pull request title"
        value={title}
        onCommit={(next) => {
          title = next
          void handle.update()
        }}
      />
    </div>
  )
}

export function StackGraphExample(handle: Handle<{ size?: 'default' | 'compact' }>) {
  let currentId = 'pr-402'
  return () => (
    <div style={{ width: 'min(100%, 540px)' }}>
      <StackGraph
        size={handle.props.size}
        currentId={currentId}
        onSelect={(node) => {
          currentId = node.id
          void handle.update()
        }}
        nodes={[
          {
            id: 'pr-401',
            ref: '#401',
            title: 'Add fixed-height virtualizer behavior',
            status: 'merged',
            checks: 'passed',
            review: 'approved',
            author: 'Ada',
            additions: 128,
            deletions: 4,
          },
          {
            id: 'pr-402',
            ref: '#402',
            title: 'Build CodeBrowser with blame gutter',
            parentId: 'pr-401',
            status: 'open',
            checks: 'passed',
            review: 'approved',
            author: 'Ada',
            additions: 248,
            deletions: 16,
          },
          {
            id: 'pr-403',
            ref: '#403',
            title: 'Add DiffMinimap unviewed & unresolved jumps',
            parentId: 'pr-402',
            status: 'open',
            checks: 'running',
            review: 'review-required',
            author: 'Noah',
            additions: 184,
            deletions: 11,
          },
          {
            id: 'pr-404',
            ref: '#404',
            title: 'Wire MergeReadiness into PR footer',
            parentId: 'pr-403',
            status: 'draft',
            checks: 'pending',
            author: 'Noah',
            additions: 92,
            deletions: 0,
          },
        ]}
      />
    </div>
  )
}

export function MergeReadinessExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    status?: 'ready' | 'blocked' | 'pending' | 'draft' | 'merged'
    defaultExpanded?: boolean
  }>,
) {
  return () => {
    const status = handle.props.status ?? 'ready'
    const summary =
      status === 'blocked'
        ? '1 review requested · 1 failing required check'
        : status === 'pending'
          ? '2 approvals · 11/14 checks running'
          : status === 'draft'
            ? 'Work in progress · Mark ready for review to merge'
            : status === 'merged'
              ? 'Squashed and merged into main'
              : '2 approvals · 14/14 required checks passed · No conflicts'
    const checksStatus =
      status === 'blocked' ? 'failed' : status === 'pending' ? 'pending' : 'passed'
    return (
      <div style={{ width: 'min(100%, 580px)' }}>
        <MergeReadiness
          size={handle.props.size}
          status={status}
          defaultExpanded={handle.props.defaultExpanded}
          summary={summary}
          action={
            <SplitButton
              label={status === 'merged' ? 'Merged' : 'Squash and merge'}
              size="compact"
              disabled={status !== 'ready'}
              items={[
                { value: 'merge', label: 'Create a merge commit' },
                { value: 'rebase', label: 'Rebase and merge' },
              ]}
            />
          }
          gates={[
            {
              id: 'reviews',
              label: 'Code reviews',
              status: status === 'blocked' ? 'failed' : status === 'draft' ? 'pending' : 'passed',
              required: true,
              detail:
                status === 'blocked'
                  ? 'Changes requested by @ada'
                  : status === 'draft'
                    ? 'Waiting for ready-for-review'
                    : '2 of 2 required approvals',
            },
            {
              id: 'checks',
              label: 'Required checks',
              status: checksStatus,
              required: true,
              detail:
                status === 'blocked'
                  ? '13/14 passed · 1 failed'
                  : status === 'pending'
                    ? '11/14 completed'
                    : '14/14 passed',
              items: [
                { id: 'lint', label: 'oxlint + oxfmt', status: 'passed', detail: '4s' },
                { id: 'tsc', label: 'TypeScript check', status: 'passed', detail: '9s' },
                {
                  id: 'playwright',
                  label: 'Playwright browser + E2E',
                  status: checksStatus,
                  detail: status === 'pending' ? 'running' : '38s',
                },
              ],
            },
            {
              id: 'conflicts',
              label: 'Branch up to date',
              status: 'passed',
              detail: 'No conflicts with main',
            },
          ]}
        />
      </div>
    )
  }
}

const minimapFiles = [
  {
    id: 'f1',
    path: 'packages/reflow/src/stack-graph.tsx',
    additions: 142,
    deletions: 8,
    viewed: true,
  },
  {
    id: 'f2',
    path: 'packages/reflow/src/merge-readiness.tsx',
    additions: 186,
    deletions: 12,
    viewed: true,
  },
  {
    id: 'f3',
    path: 'packages/reflow/src/code-browser.tsx',
    additions: 224,
    deletions: 19,
    viewed: false,
    unresolvedComments: 2,
  },
  {
    id: 'f4',
    path: 'packages/reflow/src/diff-minimap.tsx',
    additions: 118,
    deletions: 4,
    viewed: false,
  },
  {
    id: 'f5',
    path: 'packages/reflow/src/test-report.tsx',
    additions: 164,
    deletions: 28,
    viewed: false,
    unresolvedComments: 1,
  },
  { id: 'f6', path: 'packages/reflow/src/styles.css', additions: 18, deletions: 0, viewed: true },
]

export function DiffMinimapExample(handle: Handle) {
  let activeId = 'f3'
  return () => (
    <div style={{ width: 'min(100%, 560px)' }}>
      <DiffMinimap
        files={minimapFiles}
        activeId={activeId}
        onSelect={(file) => {
          activeId = file.id
          void handle.update()
        }}
      />
    </div>
  )
}

const sampleBrowserCode = [
  "import { computeVirtualRange } from './behaviors/virtualizer.ts'",
  '',
  'export function visibleWindow(count: number, scrollTop: number) {',
  '  return computeVirtualRange({',
  '    count,',
  '    itemHeight: 36,',
  '    scrollTop,',
  '    viewportHeight: 360,',
  '  })',
  '}',
].join('\n')

export function CodeBrowserExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    defaultShowBlame?: boolean
    wrap?: boolean
  }>,
) {
  let selectedRange: CodeLineRange | null = { start: 4, end: 8 }
  return () => (
    <div style={{ width: 'min(100%, 640px)' }}>
      <CodeBrowser
        size={handle.props.size}
        filename="packages/reflow/src/virtual-list.tsx"
        refName="main"
        language="tsx"
        code={sampleBrowserCode}
        selectedRange={selectedRange}
        onSelectRange={(next) => {
          selectedRange = next
          void handle.update()
        }}
        defaultShowBlame={handle.props.defaultShowBlame ?? true}
        wrap={handle.props.wrap}
        blame={[
          { line: 1, sha: '7845cb2', author: 'Ada', date: '2026-11-25T14:00:00Z', heat: 0.9 },
          { line: 2, sha: '7845cb2', author: 'Ada', date: '2026-11-25T14:00:00Z', heat: 0.9 },
          { line: 3, sha: '07be64e', author: 'Noah', date: '2026-11-22T09:30:00Z', heat: 0.6 },
          { line: 4, sha: '07be64e', author: 'Noah', date: '2026-11-22T09:30:00Z', heat: 0.6 },
          { line: 5, sha: '07be64e', author: 'Noah', date: '2026-11-22T09:30:00Z', heat: 0.6 },
          { line: 6, sha: 'cef8e38', author: 'Ada', date: '2026-11-26T10:15:00Z', heat: 1.0 },
          { line: 7, sha: 'cef8e38', author: 'Ada', date: '2026-11-26T10:15:00Z', heat: 1.0 },
          { line: 8, sha: 'cef8e38', author: 'Ada', date: '2026-11-26T10:15:00Z', heat: 1.0 },
          { line: 9, sha: '07be64e', author: 'Noah', date: '2026-11-22T09:30:00Z', heat: 0.6 },
          { line: 10, sha: '07be64e', author: 'Noah', date: '2026-11-22T09:30:00Z', heat: 0.6 },
        ]}
      />
    </div>
  )
}

export function TestReportExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    defaultFilter?: 'all' | 'failed' | 'flaky' | 'passed' | 'skipped'
  }>,
) {
  return () => (
    <div style={{ width: 'min(100%, 620px)' }}>
      <TestReport
        size={handle.props.size}
        defaultFilter={handle.props.defaultFilter}
        cases={[
          {
            id: 't1',
            suite: 'code-browser.test.browser.tsx',
            name: 'extends line range on Shift+Click',
            status: 'passed',
            durationMs: 18,
          },
          {
            id: 't2',
            suite: 'diff-view.test.e2e.ts',
            name: 'keeps #L42-L58 permalink anchored after hydration',
            status: 'failed',
            durationMs: 412,
            message: 'AssertionError: expected anchor range to stay synced',
            expected: '#L42-L58',
            actual: '#L42-L57',
            stack: 'at apps/web/test/diff-view.test.e2e.ts:88:14',
          },
          {
            id: 't3',
            suite: 'shortcut-sheet.test.browser.tsx',
            name: 'toggles dialog via ? hotkey outside inputs',
            status: 'flaky',
            durationMs: 265,
            flakyRate: 14,
            message: 'Passed on retry 2 of 2 (focus race on cold Chromium)',
          },
          {
            id: 't4',
            suite: 'worker-isolation.test.ts',
            name: 'loads core without optional peer dependencies',
            status: 'passed',
            durationMs: 64,
          },
          {
            id: 't5',
            suite: 'safari-webkit.test.e2e.ts',
            name: 'popover fallback on legacy WebKit',
            status: 'skipped',
          },
        ]}
      />
    </div>
  )
}

export function MatrixGridExample(handle: Handle) {
  let activeCell: { rowId: string; columnId: string } | null = {
    rowId: 'linux',
    columnId: 'node24',
  }
  return () => (
    <div style={{ width: 'min(100%, 560px)' }}>
      <MatrixGrid
        rowHeaderLabel="OS / Runtime"
        activeCell={activeCell}
        onSelectCell={(cell) => {
          activeCell = { rowId: cell.rowId, columnId: cell.columnId }
          void handle.update()
        }}
        rows={[
          { id: 'linux', label: 'Ubuntu 24.04' },
          { id: 'macos', label: 'macOS 15' },
          { id: 'windows', label: 'Windows 2025' },
        ]}
        columns={[
          { id: 'node22', label: 'Node 22' },
          { id: 'node24', label: 'Node 24' },
          { id: 'node26', label: 'Node 26' },
        ]}
        cells={[
          { rowId: 'linux', columnId: 'node22', status: 'passed', durationMs: 24_200 },
          { rowId: 'linux', columnId: 'node24', status: 'passed', durationMs: 21_800 },
          { rowId: 'linux', columnId: 'node26', status: 'passed', durationMs: 19_400 },
          { rowId: 'macos', columnId: 'node22', status: 'passed', durationMs: 31_000 },
          { rowId: 'macos', columnId: 'node24', status: 'running', durationMs: 14_600 },
          { rowId: 'macos', columnId: 'node26', status: 'pending' },
          { rowId: 'windows', columnId: 'node22', status: 'passed', durationMs: 38_500 },
          { rowId: 'windows', columnId: 'node24', status: 'failed', durationMs: 12_900 },
        ]}
      />
    </div>
  )
}

const initialQueueEntries: readonly MergeQueueEntry[] = [
  {
    id: 'q1',
    ref: '#418',
    title: 'feat(components): add VirtualList and keymap behavior',
    author: 'Ada Lovelace',
    status: 'merging',
    batch: 'Batch 14',
    checksPassed: 14,
    checksTotal: 14,
    eta: '~20s',
  },
  {
    id: 'q2',
    ref: '#419',
    title: 'feat(components): add MergeReadiness and StackGraph',
    author: 'Noah Kim',
    status: 'testing',
    batch: 'Batch 14',
    checksPassed: 11,
    checksTotal: 14,
    eta: '~2m',
  },
  {
    id: 'q3',
    ref: '#420',
    title: 'feat(ci): wire MatrixGrid and SizeDelta reports',
    author: 'Lin Chen',
    status: 'queued',
    batch: 'Batch 15',
    checksPassed: 0,
    checksTotal: 14,
    eta: '~5m',
  },
]

export function MergeQueueExample(
  handle: Handle<{ size?: 'default' | 'compact'; removable?: boolean }>,
) {
  let entries: readonly MergeQueueEntry[] = initialQueueEntries
  return () => (
    <div style={{ width: 'min(100%, 600px)' }}>
      <MergeQueue
        size={handle.props.size}
        entries={entries}
        onRemove={
          handle.props.removable
            ? (entry) => {
                entries = entries.filter((item) => item.id !== entry.id)
                if (entries.length === 0) entries = initialQueueEntries
                void handle.update()
              }
            : undefined
        }
      />
    </div>
  )
}

export function SizeDeltaExample() {
  return () => (
    <div style={{ width: 'min(100%, 560px)' }}>
      <SizeDelta
        items={[
          {
            id: 'core',
            name: 'dist/index.js',
            beforeBytes: 42_800,
            afterBytes: 46_950,
            budgetBytes: 51_200,
            encoding: 'gzip',
          },
          {
            id: 'styles',
            name: 'dist/styles.css',
            beforeBytes: 24_600,
            afterBytes: 22_900,
            encoding: 'gzip',
          },
          {
            id: 'worker',
            name: 'worker/entry.js',
            beforeBytes: 88_400,
            afterBytes: 108_200,
            budgetBytes: 102_400,
            encoding: 'gzip',
          },
        ]}
      />
    </div>
  )
}

const heatmapCells = Array.from({ length: 14 * 7 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 7, 21 + index))
  const iso = date.toISOString().slice(0, 10)
  const wave = (index * 7 + (index % 5) * 3) % 13
  const count = index % 7 === 0 || index % 11 === 0 ? 0 : wave
  return { date: iso, count }
})

export function ActivityHeatmapExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    tone?: 'success' | 'accent' | 'warning' | 'danger'
    showLegend?: boolean
  }>,
) {
  return () => (
    <div style={{ width: 'min(100%, 540px)' }}>
      <ActivityHeatmap
        size={handle.props.size}
        cells={heatmapCells}
        unit="commits"
        tone={handle.props.tone ?? 'success'}
        showLegend={handle.props.showLegend ?? true}
      />
    </div>
  )
}
