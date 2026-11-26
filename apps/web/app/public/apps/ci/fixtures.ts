import type { LogGroup, PipelineJob, StatusStripItem, WaterfallSpan } from '@rtzll/reflow'
import type { FileTreeRowDecoration, GitStatusEntry } from '@rtzll/reflow/trees'

export interface CiSuiteRow {
  id: string
  suite: string
  runner: string
  status: 'passed' | 'failed'
  tests: string
  durationMs: number
  duration: string
}

export interface CiRunData {
  id: string
  number: number
  title: string
  branch: string
  sha: string
  status: 'passed' | 'failed' | 'running'
  duration: string
  durationMs: number
  startedAt: string
  jobs: PipelineJob[]
  logsByJob: Record<string, LogGroup[]>
  waterfall: WaterfallSpan[]
  suites: CiSuiteRow[]
}

export const ciHistoryRuns: readonly StatusStripItem[] = [
  {
    id: '4569',
    status: 'passed',
    label: 'Run #4569 · passed',
    value: 224_000,
    detail: 'a84c1bb · v0.16.1 · 3m 44s',
  },
  {
    id: '4570',
    status: 'passed',
    label: 'Run #4570 · passed',
    value: 212_000,
    detail: 'bd975aa · main · 3m 32s',
  },
  {
    id: '4571',
    status: 'passed',
    label: 'Run #4571 · passed',
    value: 205_000,
    detail: '7e08207 · main · 3m 25s',
  },
  {
    id: '4572',
    status: 'passed',
    label: 'Run #4572 · passed',
    value: 218_000,
    detail: '3d99554 · main · 3m 38s',
  },
  {
    id: '4573',
    status: 'warning',
    label: 'Run #4573 · flaky retry',
    value: 268_000,
    detail: '19ec1d6 · main · 4m 28s',
  },
  {
    id: '4574',
    status: 'passed',
    label: 'Run #4574 · passed',
    value: 196_000,
    detail: '9a31faf · main · 3m 16s',
  },
  {
    id: '4575',
    status: 'passed',
    label: 'Run #4575 · passed',
    value: 192_000,
    detail: '04dc434 · main · 3m 12s',
  },
  {
    id: '4576',
    status: 'cancelled',
    label: 'Run #4576 · cancelled',
    value: 54_000,
    detail: '8e2f022 · main · 54s',
  },
  {
    id: '4577',
    status: 'failed',
    label: 'Run #4577 · failed',
    value: 243_000,
    detail: '3bb2c29 · feat/review-trees · 4m 03s',
  },
  {
    id: '4578',
    status: 'passed',
    label: 'Run #4578 · passed',
    value: 222_000,
    detail: '8b55f19 · v0.17.0 · 3m 42s',
  },
]

export const artifactPaths: readonly string[] = [
  'packages/reflow/dist/core.css',
  'packages/reflow/dist/diffs.css',
  'packages/reflow/dist/trees.css',
  'packages/reflow/dist/diagrams.css',
  'packages/reflow/dist/trees.js',
  'packages/reflow/dist/diagrams.js',
  'apps/web/build/worker/index.js',
  'test-results/apps-nav-fix.patch',
]

export const artifactGitStatus: readonly GitStatusEntry[] = [
  { path: 'packages/reflow/dist/trees.css', status: 'added' },
  { path: 'packages/reflow/dist/diagrams.css', status: 'added' },
  { path: 'packages/reflow/dist/trees.js', status: 'added' },
  { path: 'packages/reflow/dist/diagrams.js', status: 'added' },
  { path: 'test-results/apps-nav-fix.patch', status: 'modified' },
]

export const artifactDecorations: Readonly<Record<string, FileTreeRowDecoration>> = {
  'packages/reflow/dist/core.css': {
    text: '335 KB',
    parts: [{ text: '335 KB', color: 'var(--rf-muted)' }],
  },
  'packages/reflow/dist/diffs.css': {
    text: '6.6 KB',
    parts: [{ text: '6.6 KB', color: 'var(--rf-muted)' }],
  },
  'packages/reflow/dist/trees.css': {
    text: '3.2 KB',
    parts: [{ text: '3.2 KB', color: 'var(--rf-success)' }],
  },
  'packages/reflow/dist/diagrams.css': {
    text: '4.3 KB',
    parts: [{ text: '4.3 KB', color: 'var(--rf-success)' }],
  },
  'packages/reflow/dist/trees.js': {
    text: '9.0 KB',
    parts: [{ text: '9.0 KB', color: 'var(--rf-success)' }],
  },
  'packages/reflow/dist/diagrams.js': {
    text: '7.5 KB',
    parts: [{ text: '7.5 KB', color: 'var(--rf-success)' }],
  },
  'apps/web/build/worker/index.js': {
    text: 'worker ok',
    parts: [{ text: '0 peers', color: 'var(--rf-info)' }],
  },
  'test-results/apps-nav-fix.patch': {
    text: '+12 −10',
    parts: [
      { text: '+12', color: 'var(--rf-success)' },
      { text: ' ' },
      { text: '−10', color: 'var(--rf-danger)' },
    ],
  },
}

export const failureFixDiff = `--- a/apps/web/app/ui/example-apps.tsx
+++ b/apps/web/app/ui/example-apps.tsx
@@ -88,12 +88,14 @@ export function AppWorkspace(handle) {
         <a class="site-skip" href="#main">
           Skip to content
         </a>
-        <nav aria-label="App navigation" class="site-app-nav">
-          <a href={routes.gallery.href()}>Reflow</a>
-          <a href={routes.apps.href()}>Apps</a>
-          <span aria-current="page">{app.name}</span>
-          {app.slug !== 'chat' && <ShowcaseSoundButton enabled={soundEnabled} />}
-        </nav>
+        {app.slug !== 'chat' && (
+          <nav aria-label="App navigation" class="site-app-nav">
+            <a href={routes.gallery.href()}>Reflow</a>
+            <a href={routes.apps.href()}>Apps</a>
+            <span aria-current="page">{app.name}</span>
+            <ShowcaseSoundButton enabled={soundEnabled} />
+          </nav>
+        )}
         <main id="main" data-rmx-key={app.slug}>
`

const failedRun: CiRunData = {
  id: '4577',
  number: 4577,
  title: 'feat(review): FileTree SSR + Pele diagrams',
  branch: 'feat/review-trees',
  sha: '3bb2c29',
  status: 'failed',
  duration: '4m 03s',
  durationMs: 243_000,
  startedAt: '14m ago',
  jobs: [
    {
      id: 'lint',
      name: 'Lint & format',
      stage: 'Check',
      status: 'passed',
      duration: '3s',
      meta: 'oxlint · oxfmt',
    },
    {
      id: 'typecheck',
      name: 'Typecheck',
      stage: 'Check',
      status: 'passed',
      duration: '6s',
      meta: 'tsc --noEmit',
    },
    {
      id: 'build',
      name: 'Build workspace',
      stage: 'Build',
      needs: ['lint', 'typecheck'],
      status: 'passed',
      duration: '11s',
      meta: '3 packages',
    },
    {
      id: 'deploy-test',
      name: 'Worker smoke',
      stage: 'Verify',
      needs: ['build'],
      status: 'passed',
      duration: '18s',
      meta: '82 routes',
    },
    {
      id: 'e2e',
      name: 'E2E & browser',
      stage: 'Verify',
      needs: ['build'],
      status: 'failed',
      duration: '2m 11s',
      meta: 'chromium',
      matrixCount: 3,
    },
    {
      id: 'pack',
      name: 'Pack & isolate',
      stage: 'Verify',
      needs: ['build'],
      status: 'passed',
      duration: '16s',
      meta: 'starter',
    },
    {
      id: 'publish',
      name: 'Publish release',
      stage: 'Release',
      needs: ['deploy-test', 'e2e', 'pack'],
      status: 'skipped',
      meta: 'blocked',
    },
  ],
  logsByJob: {
    lint: [
      {
        id: 'lint-fmt',
        title: 'Run pnpm fmt:check && pnpm lint',
        status: 'passed',
        duration: '3.1s',
        defaultOpen: true,
        entries: [
          { text: '\x1b[2m$ oxfmt . --check\x1b[0m', timestamp: '+00:00.2' },
          {
            text: '\x1b[32m✓\x1b[0m All 491 files formatted cleanly (64ms)',
            timestamp: '+00:00.8',
          },
          { text: '\x1b[2m$ oxlint . --max-warnings=0\x1b[0m', timestamp: '+00:01.0' },
          { text: '\x1b[32m✓\x1b[0m 0 warnings, 0 errors across workspace', timestamp: '+00:03.1' },
        ],
      },
    ],
    typecheck: [
      {
        id: 'tsc-all',
        title: 'Run pnpm check',
        status: 'passed',
        duration: '6.2s',
        defaultOpen: true,
        entries: [
          { text: '\x1b[32m✓\x1b[0m packages/reflow check (510ms)', timestamp: '+00:01.2' },
          { text: '\x1b[32m✓\x1b[0m packages/create-reflow check (220ms)', timestamp: '+00:01.8' },
          { text: '\x1b[32m✓\x1b[0m apps/web check (780ms)', timestamp: '+00:06.2' },
        ],
      },
    ],
    build: [
      {
        id: 'build-pkgs',
        title: 'Build @rtzll/reflow & showcase bundle',
        status: 'passed',
        duration: '11.4s',
        defaultOpen: true,
        entries: [
          {
            text: '\x1b[36m▸\x1b[0m Emitting core.css, diffs.css, trees.css, diagrams.css, styles.css',
            timestamp: '+00:01.4',
          },
          {
            text: '\x1b[36m▸\x1b[0m Pre-rendering Declarative Shadow DOM diffs, FileTree, and Pele SVGs',
            timestamp: '+00:04.8',
          },
          {
            text: '\x1b[32m✓\x1b[0m Built showcase with 16 client entry modules and isolated Worker',
            timestamp: '+00:11.4',
          },
        ],
      },
    ],
    'deploy-test': [
      {
        id: 'worker-check',
        title: 'Build and test local Cloudflare deployment',
        status: 'passed',
        duration: '18.2s',
        defaultOpen: true,
        entries: [
          {
            text: '\x1b[32m✓\x1b[0m Worker bundle excludes @pierre/diffs, @pierre/trees, preact, pele, and shiki',
            timestamp: '+00:02.1',
          },
          {
            text: '\x1b[32m✓\x1b[0m /apps/review serves zero-flash DSD diffs, FileTree, and Pele SVG',
            timestamp: '+00:05.4',
          },
          {
            text: '\x1b[32m✓\x1b[0m Hydrated 82 docs pages at desktop & mobile widths in 6.3s',
            timestamp: '+00:18.2',
          },
        ],
      },
    ],
    e2e: [
      {
        id: 'e2e-install',
        title: 'Prepare Chromium & server',
        status: 'passed',
        duration: '4.1s',
        entries: [
          { text: '\x1b[2m$ pnpm test:run\x1b[0m', timestamp: '+00:00.2' },
          {
            text: '\x1b[32m✓\x1b[0m Server suite: 6/6 passed (docs-api, diffs-ssr, trees-ssr, diagrams-ssr)',
            timestamp: '+00:02.6',
          },
          {
            text: 'WARN: 1 deprecated subdependency (node-domexception@1.0.0)',
            level: 'warn',
            timestamp: '+00:03.9',
          },
        ],
      },
      {
        id: 'e2e-browser',
        title: 'Run browser component suites (chromium)',
        status: 'passed',
        duration: '19.4s',
        entries: [
          { text: '\x1b[32m✓\x1b[0m diff-view.test.browser.tsx (4 passed)', timestamp: '+00:08.1' },
          { text: '\x1b[32m✓\x1b[0m file-tree.test.browser.tsx (1 passed)', timestamp: '+00:11.2' },
          { text: '\x1b[32m✓\x1b[0m diagram.test.browser.tsx (2 passed)', timestamp: '+00:14.7' },
          {
            text: '\x1b[32m✓\x1b[0m log-viewer / waterfall / pipeline-graph / status-strip (4 passed)',
            timestamp: '+00:19.4',
          },
        ],
      },
      {
        id: 'e2e-apps',
        title: 'Run E2E workspace suites (53 files)',
        status: 'failed',
        duration: '1m 47s',
        entries: [
          { text: '\x1b[32m✓\x1b[0m app-review.test.e2e.ts (3.4s)', timestamp: '+00:24.8' },
          { text: '\x1b[32m✓\x1b[0m app-issues.test.e2e.ts (18.9s)', timestamp: '+00:46.2' },
          {
            text: '\x1b[31m✗\x1b[0m apps.test.e2e.ts:57 strict mode violation: getByRole("navigation", { name: "App navigation" }) resolved to 2 elements',
            level: 'error',
            timestamp: '+01:58.4',
          },
          {
            text: '    1) <span aria-current="page">Chat</span> inside .site-app-nav',
            level: 'error',
            timestamp: '+01:58.4',
          },
          {
            text: '    2) <span aria-current="page" class="rf-basic-sr-only">Chat</span> inside .studio-app-nav',
            level: 'error',
            timestamp: '+01:58.4',
          },
          {
            text: '\x1b[33m!\x1b[0m Tip: omit .site-app-nav on /apps/chat so only one App navigation landmark exists.',
            level: 'warn',
            timestamp: '+01:58.5',
          },
          {
            text: '\x1b[1;31mFAIL\x1b[0m  290 passed, 1 failed (129.4s)',
            level: 'error',
            timestamp: '+02:11.0',
          },
        ],
      },
    ],
    pack: [
      {
        id: 'pack-check',
        title: 'Pack tarballs & verify starter isolation',
        status: 'passed',
        duration: '16.1s',
        defaultOpen: true,
        entries: [
          {
            text: '\x1b[32m✓\x1b[0m Per-domain CSS files wrapped in @layer reflow',
            timestamp: '+00:02.4',
          },
          {
            text: '\x1b[32m✓\x1b[0m Starter installs cleanly without @pierre/diffs, @pierre/trees, preact, pele, or shiki',
            timestamp: '+00:11.8',
          },
          {
            text: '\x1b[32m✓\x1b[0m Starter production server & Playwright checks passed',
            timestamp: '+00:16.1',
          },
        ],
      },
    ],
    publish: [
      {
        id: 'publish-wait',
        title: 'Publish verified packages and GitHub release',
        status: 'skipped',
        entries: [
          {
            text: 'Skipped because upstream job `e2e` failed.',
            level: 'warn',
            timestamp: '+02:31.0',
          },
        ],
      },
    ],
  },
  waterfall: [
    {
      id: 'lint',
      label: 'Lint & format',
      meta: 'cached',
      status: 'cached',
      startMs: 0,
      durationMs: 3100,
    },
    {
      id: 'typecheck',
      label: 'Typecheck',
      status: 'passed',
      startMs: 0,
      durationMs: 6200,
      critical: true,
    },
    {
      id: 'build',
      label: 'Build workspace',
      status: 'passed',
      startMs: 6200,
      durationMs: 11400,
      critical: true,
    },
    {
      id: 'deploy-test',
      label: 'Worker smoke',
      meta: '82 routes',
      status: 'passed',
      startMs: 17600,
      durationMs: 18200,
    },
    {
      id: 'e2e',
      label: 'E2E & browser',
      meta: 'chromium',
      status: 'failed',
      startMs: 17600,
      durationMs: 131000,
      critical: true,
      children: [
        {
          id: 'e2e-install',
          label: 'Prepare Chromium & server',
          status: 'passed',
          startMs: 17600,
          durationMs: 4100,
        },
        {
          id: 'e2e-browser',
          label: 'Browser component suites',
          status: 'passed',
          startMs: 21700,
          durationMs: 19400,
        },
        {
          id: 'e2e-apps',
          label: 'E2E workspace suites',
          status: 'failed',
          startMs: 41100,
          durationMs: 107500,
          critical: true,
        },
      ],
    },
    { id: 'pack', label: 'Pack & isolate', status: 'passed', startMs: 17600, durationMs: 16100 },
    {
      id: 'publish',
      label: 'Publish release',
      status: 'skipped',
      startMs: 148600,
      durationMs: 2000,
    },
  ],
  suites: [
    {
      id: 's1',
      suite: 'apps.test.e2e.ts',
      runner: 'e2e:chromium',
      status: 'failed',
      tests: '3/4',
      durationMs: 3260,
      duration: '3.3s',
    },
    {
      id: 's2',
      suite: 'app-review.test.e2e.ts',
      runner: 'e2e:chromium',
      status: 'passed',
      tests: '1/1',
      durationMs: 3410,
      duration: '3.4s',
    },
    {
      id: 's3',
      suite: 'app-issues.test.e2e.ts',
      runner: 'e2e:chromium',
      status: 'passed',
      tests: '6/6',
      durationMs: 18900,
      duration: '18.9s',
    },
    {
      id: 's4',
      suite: 'file-tree.test.browser.tsx',
      runner: 'browser:chromium',
      status: 'passed',
      tests: '1/1',
      durationMs: 86,
      duration: '86ms',
    },
    {
      id: 's5',
      suite: 'diagram.test.browser.tsx',
      runner: 'browser:chromium',
      status: 'passed',
      tests: '2/2',
      durationMs: 107,
      duration: '107ms',
    },
    {
      id: 's6',
      suite: 'trees-ssr.test.server.tsx',
      runner: 'server:node',
      status: 'passed',
      tests: '2/2',
      durationMs: 14,
      duration: '14ms',
    },
  ],
}

const passedRun: CiRunData = {
  id: '4578',
  number: 4578,
  title: 'Release v0.17.0 · FileTree, Pele diagrams & review fixes',
  branch: 'main',
  sha: '8b55f19',
  status: 'passed',
  duration: '3m 42s',
  durationMs: 222_000,
  startedAt: '4m ago',
  jobs: [
    {
      id: 'lint',
      name: 'Lint & format',
      stage: 'Check',
      status: 'passed',
      duration: '3s',
      meta: 'oxlint · oxfmt',
    },
    {
      id: 'typecheck',
      name: 'Typecheck',
      stage: 'Check',
      status: 'passed',
      duration: '6s',
      meta: 'tsc --noEmit',
    },
    {
      id: 'build',
      name: 'Build workspace',
      stage: 'Build',
      needs: ['lint', 'typecheck'],
      status: 'passed',
      duration: '10s',
      meta: '3 packages',
    },
    {
      id: 'deploy-test',
      name: 'Worker smoke',
      stage: 'Verify',
      needs: ['build'],
      status: 'passed',
      duration: '16s',
      meta: '82 routes',
    },
    {
      id: 'e2e',
      name: 'E2E & browser',
      stage: 'Verify',
      needs: ['build'],
      status: 'passed',
      duration: '2m 04s',
      meta: '291 passed',
      matrixCount: 3,
    },
    {
      id: 'pack',
      name: 'Pack & isolate',
      stage: 'Verify',
      needs: ['build'],
      status: 'passed',
      duration: '15s',
      meta: 'starter',
    },
    {
      id: 'publish',
      name: 'Publish release',
      stage: 'Release',
      needs: ['deploy-test', 'e2e', 'pack'],
      status: 'passed',
      duration: '25s',
      meta: 'v0.17.0',
    },
  ],
  logsByJob: {
    ...failedRun.logsByJob,
    e2e: [
      failedRun.logsByJob.e2e![0]!,
      failedRun.logsByJob.e2e![1]!,
      {
        id: 'e2e-apps',
        title: 'Run E2E workspace suites (53 files)',
        status: 'passed',
        duration: '1m 41s',
        defaultOpen: true,
        entries: [
          { text: '\x1b[32m✓\x1b[0m app-review.test.e2e.ts (3.4s)', timestamp: '+00:24.1' },
          { text: '\x1b[32m✓\x1b[0m apps.test.e2e.ts (3.2s)', timestamp: '+00:29.8' },
          { text: '\x1b[1;32mPASS\x1b[0m  291 passed, 0 failed (124.0s)', timestamp: '+02:04.0' },
        ],
      },
    ],
    publish: [
      {
        id: 'publish-npm',
        title: 'Publish @rtzll/reflow@0.17.0 and GitHub release',
        status: 'passed',
        duration: '25.0s',
        defaultOpen: true,
        entries: [
          { text: '\x1b[32m✓\x1b[0m Published @rtzll/reflow@0.17.0 to npm', timestamp: '+02:32.4' },
          {
            text: '\x1b[32m✓\x1b[0m Published @rtzll/create-reflow@0.17.0 to npm',
            timestamp: '+02:41.2',
          },
          { text: '\x1b[32m✓\x1b[0m Created GitHub release tag v0.17.0', timestamp: '+02:49.0' },
        ],
      },
    ],
  },
  waterfall: [
    {
      id: 'lint',
      label: 'Lint & format',
      meta: 'cached',
      status: 'cached',
      startMs: 0,
      durationMs: 3000,
    },
    {
      id: 'typecheck',
      label: 'Typecheck',
      status: 'passed',
      startMs: 0,
      durationMs: 6000,
      critical: true,
    },
    {
      id: 'build',
      label: 'Build workspace',
      status: 'passed',
      startMs: 6000,
      durationMs: 10000,
      critical: true,
    },
    {
      id: 'deploy-test',
      label: 'Worker smoke',
      meta: '82 routes',
      status: 'passed',
      startMs: 16000,
      durationMs: 16000,
    },
    {
      id: 'e2e',
      label: 'E2E & browser',
      meta: '291 passed',
      status: 'passed',
      startMs: 16000,
      durationMs: 124000,
      critical: true,
      children: [
        {
          id: 'e2e-install',
          label: 'Prepare Chromium & server',
          status: 'passed',
          startMs: 16000,
          durationMs: 4000,
        },
        {
          id: 'e2e-browser',
          label: 'Browser component suites',
          status: 'passed',
          startMs: 20000,
          durationMs: 19000,
        },
        {
          id: 'e2e-apps',
          label: 'E2E workspace suites',
          status: 'passed',
          startMs: 39000,
          durationMs: 101000,
          critical: true,
        },
      ],
    },
    { id: 'pack', label: 'Pack & isolate', status: 'passed', startMs: 16000, durationMs: 15000 },
    {
      id: 'publish',
      label: 'Publish release',
      meta: 'v0.17.0',
      status: 'passed',
      startMs: 140000,
      durationMs: 25000,
      critical: true,
    },
  ],
  suites: failedRun.suites.map((row) =>
    row.id === 's1' ? { ...row, status: 'passed', tests: '4/4' } : row,
  ),
}

export const seedCiRuns: Record<string, CiRunData> = {
  '4577': failedRun,
  '4578': passedRun,
}
