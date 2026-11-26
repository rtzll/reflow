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

export interface CiJobTelemetry {
  runner: string
  arch: string
  cacheStatus: 'hit' | 'partial' | 'miss'
  cacheDetail: string
  deltaVsP50: string
  deltaTone: 'faster' | 'slower' | 'neutral'
  cpuPeakPct: number
  cpuAvgPct: number
  cpuSamples: readonly number[]
  memPeakGb: number
  memLimitGb: number
  memSamples: readonly number[]
  failureLocation?: string
  failureHeadline?: string
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
  deltaVsP50: string
  cacheHitPct: number
  startedAt: string
  jobs: PipelineJob[]
  telemetryByJob: Record<string, CiJobTelemetry>
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
    text: '0 peers',
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

export interface CiArtifactContent {
  kind: 'diff' | 'code'
  language?: string
  content: string
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

export const artifactContents: Readonly<Record<string, CiArtifactContent>> = {
  'packages/reflow/dist/core.css': {
    kind: 'code',
    language: 'css',
    content: `/* @rtzll/reflow/core.css — 335 KB (unminified), @layer reflow */
@layer reflow {
  :root {
    --rf-bg: #ffffff;
    --rf-surface-1: #fafafa;
    --rf-surface-2: #f4f4f5;
    --rf-border: rgba(15, 23, 42, 0.1);
    --rf-text: #111827;
    --rf-muted: #6b7280;
    --rf-accent: #6b97ff;
    --rf-success: #16a34a;
    --rf-warning: #d97706;
    --rf-danger: #dc2626;
  }
}`,
  },
  'packages/reflow/dist/diffs.css': {
    kind: 'code',
    language: 'css',
    content: `/* @rtzll/reflow/diffs.css — 6.6 KB, @layer reflow */
@layer reflow {
  .rf-diff-view {
    border: 1px solid var(--rf-border);
    border-radius: var(--rf-panel-radius);
    background: var(--rf-surface-1);
    overflow: hidden;
  }
}`,
  },
  'packages/reflow/dist/trees.css': {
    kind: 'code',
    language: 'css',
    content: `/* @rtzll/reflow/trees.css — 3.2 KB, @layer reflow */
@layer reflow {
  .rf-file-tree {
    display: block;
    min-width: 0;
    --trees-bg-override: transparent;
    --trees-fg-override: var(--rf-text);
    --trees-fg-muted-override: var(--rf-muted);
    --trees-selected-bg-override: color-mix(in srgb, var(--rf-accent) 14%, transparent);
  }
}`,
  },
  'packages/reflow/dist/diagrams.css': {
    kind: 'code',
    language: 'css',
    content: `/* @rtzll/reflow/diagrams.css — 4.3 KB, @layer reflow */
@layer reflow {
  .rf-diagram-canvas {
    --pele-bg: transparent;
    --pele-fg: var(--rf-text);
    --pele-accent: var(--rf-accent);
    --pele-surface: var(--rf-surface-2);
    --pele-border: var(--rf-border);
    --pele-font: var(--rf-font-sans);
  }
}`,
  },
  'packages/reflow/dist/trees.js': {
    kind: 'code',
    language: 'js',
    content: `// @rtzll/reflow/trees — 9.0 KB ESM (optional peer: @pierre/trees)
export { FileTree } from './trees-impl.js'
// Zero-flash SSR entry: @rtzll/reflow/trees/ssr -> prerenderFileTree()`,
  },
  'packages/reflow/dist/diagrams.js': {
    kind: 'code',
    language: 'js',
    content: `// @rtzll/reflow/diagrams — 7.5 KB ESM (optional peer: pele)
import { renderMermaid } from 'pele/lazy'
export { Diagram, renderMermaid }`,
  },
  'apps/web/build/worker/index.js': {
    kind: 'code',
    language: 'js',
    content: `// Cloudflare Worker bundle — verified 0 optional peers bundled
// Excluded: @pierre/diffs, @pierre/trees, preact, pele, shiki
// Pre-rendered assets inlined at build time:
//   - REFLOW_CODE_SAMPLES (Shiki HTML)
//   - REFLOW_DIFF_SAMPLES (DSD diffs, FileTree DSD, Pele SVGs)`,
  },
  'test-results/apps-nav-fix.patch': {
    kind: 'diff',
    content: failureFixDiff,
  },
}

const baseTelemetry: Record<string, CiJobTelemetry> = {
  lint: {
    runner: 'blacksmith-4vcpu-ubuntu-2404',
    arch: 'x64 · NVMe',
    cacheStatus: 'hit',
    cacheDetail: 'pnpm store · 412 MB (0.7s)',
    deltaVsP50: '−31% vs p50',
    deltaTone: 'faster',
    cpuPeakPct: 62,
    cpuAvgPct: 38,
    cpuSamples: [12, 34, 62, 54, 41, 28, 16],
    memPeakGb: 0.9,
    memLimitGb: 8,
    memSamples: [0.4, 0.6, 0.9, 0.8, 0.7, 0.6, 0.5],
  },
  typecheck: {
    runner: 'blacksmith-4vcpu-ubuntu-2404',
    arch: 'x64 · NVMe',
    cacheStatus: 'hit',
    cacheDetail: 'tsbuildinfo · 18 MB (0.3s)',
    deltaVsP50: '−18% vs p50',
    deltaTone: 'faster',
    cpuPeakPct: 79,
    cpuAvgPct: 54,
    cpuSamples: [18, 45, 79, 72, 61, 48, 22],
    memPeakGb: 1.8,
    memLimitGb: 8,
    memSamples: [0.6, 1.1, 1.6, 1.8, 1.7, 1.4, 0.9],
  },
  build: {
    runner: 'blacksmith-8vcpu-ubuntu-2404',
    arch: 'x64 · NVMe',
    cacheStatus: 'hit',
    cacheDetail: 'esbuild + DSD pre-render · 84 MB',
    deltaVsP50: '−22% vs p50',
    deltaTone: 'faster',
    cpuPeakPct: 88,
    cpuAvgPct: 61,
    cpuSamples: [24, 58, 88, 84, 72, 64, 42, 26],
    memPeakGb: 2.4,
    memLimitGb: 16,
    memSamples: [0.8, 1.4, 2.1, 2.4, 2.2, 1.9, 1.5, 1.1],
  },
  'deploy-test': {
    runner: 'blacksmith-4vcpu-ubuntu-2404',
    arch: 'x64 · workerd',
    cacheStatus: 'hit',
    cacheDetail: 'wrangler + chromium · 290 MB',
    deltaVsP50: '−44% vs p50',
    deltaTone: 'faster',
    cpuPeakPct: 74,
    cpuAvgPct: 49,
    cpuSamples: [22, 48, 74, 68, 62, 51, 35, 19],
    memPeakGb: 2.1,
    memLimitGb: 8,
    memSamples: [0.9, 1.4, 1.9, 2.1, 2.0, 1.8, 1.4, 1.0],
  },
  e2e: {
    runner: 'blacksmith-8vcpu-ubuntu-2404',
    arch: 'x64 · NVMe · 3 shards',
    cacheStatus: 'partial',
    cacheDetail: 'playwright browsers · 412 MB (1.2s)',
    deltaVsP50: '+9% vs p50',
    deltaTone: 'slower',
    cpuPeakPct: 94,
    cpuAvgPct: 71,
    cpuSamples: [28, 64, 88, 94, 86, 91, 82, 76, 68, 44],
    memPeakGb: 4.8,
    memLimitGb: 16,
    memSamples: [1.4, 2.6, 3.8, 4.5, 4.8, 4.6, 4.3, 4.1, 3.6, 2.2],
    failureLocation: 'apps/web/test/apps.test.e2e.ts:57',
    failureHeadline: 'Strict mode violation: 2 App navigation landmarks mounted on /apps/chat',
  },
  pack: {
    runner: 'blacksmith-4vcpu-ubuntu-2404',
    arch: 'x64 · NVMe',
    cacheStatus: 'hit',
    cacheDetail: 'pnpm store · 412 MB',
    deltaVsP50: '−12% vs p50',
    deltaTone: 'faster',
    cpuPeakPct: 58,
    cpuAvgPct: 36,
    cpuSamples: [15, 42, 58, 51, 44, 32, 18],
    memPeakGb: 1.3,
    memLimitGb: 8,
    memSamples: [0.5, 0.9, 1.2, 1.3, 1.2, 1.0, 0.7],
  },
  publish: {
    runner: 'blacksmith-4vcpu-ubuntu-2404',
    arch: 'x64 · OIDC',
    cacheStatus: 'hit',
    cacheDetail: 'verified tarball artifact',
    deltaVsP50: '0% vs p50',
    deltaTone: 'neutral',
    cpuPeakPct: 31,
    cpuAvgPct: 18,
    cpuSamples: [10, 22, 31, 24, 16, 12],
    memPeakGb: 0.6,
    memLimitGb: 8,
    memSamples: [0.3, 0.5, 0.6, 0.6, 0.5, 0.4],
  },
}

const failedRun: CiRunData = {
  id: '4577',
  number: 4577,
  title: 'feat(review): FileTree SSR + Pele diagrams',
  branch: 'feat/review-trees',
  sha: '3bb2c29',
  status: 'failed',
  duration: '4m 03s',
  durationMs: 243_000,
  deltaVsP50: '+7% vs 7d p50',
  cacheHitPct: 92,
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
  telemetryByJob: baseTelemetry,
  logsByJob: {
    lint: [
      {
        id: 'lint-fmt',
        title: 'Run pnpm fmt:check && pnpm lint',
        status: 'passed',
        duration: '3.1s',
        defaultOpen: true,
        entries: [
          { text: '\x1b[2m$ oxfmt . --check\x1b[0m', source: 'oxfmt', timestamp: '+00:00.2' },
          {
            text: '\x1b[32m✓\x1b[0m All 491 files formatted cleanly (64ms)',
            source: 'oxfmt',
            timestamp: '+00:00.8',
            fields: { files: 491, duration_ms: 64, runner: 'blacksmith-4vcpu-ubuntu-2404' },
          },
          {
            text: '\x1b[2m$ oxlint . --max-warnings=0\x1b[0m',
            source: 'oxlint',
            timestamp: '+00:01.0',
          },
          {
            text: '\x1b[32m✓\x1b[0m 0 warnings, 0 errors across workspace',
            source: 'oxlint',
            timestamp: '+00:03.1',
            fields: { warnings: 0, errors: 0, threads: 4 },
          },
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
          {
            text: '\x1b[32m✓\x1b[0m packages/reflow check (510ms)',
            source: 'tsc',
            timestamp: '+00:01.2',
            fields: { package: '@rtzll/reflow', cache: 'hit', duration_ms: 510 },
          },
          {
            text: '\x1b[32m✓\x1b[0m packages/create-reflow check (220ms)',
            source: 'tsc',
            timestamp: '+00:01.8',
            fields: { package: '@rtzll/create-reflow', cache: 'hit', duration_ms: 220 },
          },
          {
            text: '\x1b[32m✓\x1b[0m apps/web check (780ms)',
            source: 'tsc',
            timestamp: '+00:06.2',
            fields: { package: '@reflow/web', cache: 'hit', duration_ms: 780 },
          },
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
            source: 'reflow',
            timestamp: '+00:01.4',
            fields: { core_css_kb: 335, trees_css_kb: 3.2, diagrams_css_kb: 4.3 },
          },
          {
            text: '\x1b[36m▸\x1b[0m Pre-rendering Declarative Shadow DOM diffs, FileTree, and Pele SVGs',
            source: 'ssr',
            timestamp: '+00:04.8',
            fields: { diffs: 7, trees: 1, diagrams: 2, cache: 'hit' },
          },
          {
            text: '\x1b[32m✓\x1b[0m Built showcase with 17 client entry modules and isolated Worker',
            source: 'esbuild',
            timestamp: '+00:11.4',
            fields: { client_entries: 17, worker_peers_leaked: 0 },
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
            source: 'worker',
            timestamp: '+00:02.1',
            fields: { runtime: 'workerd', peers_bundled: 0 },
          },
          {
            text: '\x1b[32m✓\x1b[0m /apps/review serves zero-flash DSD diffs, FileTree, and Pele SVG',
            source: 'worker',
            timestamp: '+00:05.4',
            fields: { route: '/apps/review', dsd_diffs: true, dsd_tree: true, pele_svg: true },
          },
          {
            text: '\x1b[32m✓\x1b[0m Hydrated 88 docs pages at desktop & mobile widths in 8.5s',
            source: 'chromium',
            timestamp: '+00:18.2',
            fields: { routes: 88, concurrency: 4, duration_ms: 8500 },
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
          { text: '\x1b[2m$ pnpm test:run\x1b[0m', source: 'pnpm', timestamp: '+00:00.2' },
          {
            text: '\x1b[32m✓\x1b[0m Server suite: 6/6 passed (docs-api, diffs-ssr, trees-ssr, diagrams-ssr)',
            source: 'node',
            timestamp: '+00:02.6',
            fields: { passed: 6, failed: 0, cache: 'hit', duration_ms: 252 },
          },
          {
            text: 'WARN: 1 deprecated subdependency (node-domexception@1.0.0)',
            level: 'warn',
            source: 'pnpm',
            timestamp: '+00:03.9',
            fields: { package: 'node-domexception', version: '1.0.0' },
          },
        ],
      },
      {
        id: 'e2e-browser',
        title: 'Run browser component suites (chromium)',
        status: 'passed',
        duration: '19.4s',
        entries: [
          {
            text: '\x1b[32m✓\x1b[0m diff-view.test.browser.tsx (4 passed)',
            source: 'chromium',
            timestamp: '+00:08.1',
            fields: { suite: 'diff-view.test.browser.tsx', passed: 4, duration_ms: 562 },
          },
          {
            text: '\x1b[32m✓\x1b[0m file-tree.test.browser.tsx (1 passed)',
            source: 'chromium',
            timestamp: '+00:11.2',
            fields: { suite: 'file-tree.test.browser.tsx', passed: 1, duration_ms: 86 },
          },
          {
            text: '\x1b[32m✓\x1b[0m diagram.test.browser.tsx (2 passed)',
            source: 'chromium',
            timestamp: '+00:14.7',
            fields: { suite: 'diagram.test.browser.tsx', passed: 2, duration_ms: 107 },
          },
          {
            text: '\x1b[32m✓\x1b[0m log-viewer / waterfall / pipeline-graph / status-strip (4 passed)',
            source: 'chromium',
            timestamp: '+00:19.4',
            fields: { suites: 4, passed: 4, duration_ms: 1443 },
          },
        ],
      },
      {
        id: 'e2e-apps',
        title: 'Run E2E workspace suites (53 files)',
        status: 'failed',
        duration: '1m 47s',
        entries: [
          {
            text: '\x1b[32m✓\x1b[0m app-review.test.e2e.ts (3.4s)',
            source: 'chromium',
            timestamp: '+00:24.8',
            fields: { suite: 'app-review.test.e2e.ts', passed: 1, duration_ms: 3410 },
          },
          {
            text: '\x1b[32m✓\x1b[0m app-issues.test.e2e.ts (18.9s)',
            source: 'chromium',
            timestamp: '+00:46.2',
            fields: { suite: 'app-issues.test.e2e.ts', passed: 6, duration_ms: 18900 },
          },
          {
            text: '\x1b[31m✗\x1b[0m apps.test.e2e.ts:57 strict mode violation: getByRole("navigation", { name: "App navigation" }) resolved to 2 elements',
            level: 'error',
            source: 'chromium',
            timestamp: '+01:58.4',
            fields: {
              suite: 'apps.test.e2e.ts',
              line: 57,
              route: '/apps/chat',
              exit_code: 1,
              runner: 'blacksmith-8vcpu-ubuntu-2404',
              matched_elements: 2,
            },
          },
          {
            text: '    1) <span aria-current="page">Chat</span> inside .site-app-nav',
            level: 'error',
            source: 'chromium',
            timestamp: '+01:58.4',
          },
          {
            text: '    2) <span aria-current="page" class="rf-basic-sr-only">Chat</span> inside .studio-app-nav',
            level: 'error',
            source: 'chromium',
            timestamp: '+01:58.4',
          },
          {
            text: '\x1b[33m!\x1b[0m Tip: omit .site-app-nav on /apps/chat so only one App navigation landmark exists.',
            level: 'warn',
            source: 'diagnostics',
            timestamp: '+01:58.5',
            fields: {
              suggestion: 'omit .site-app-nav for chat',
              patch: 'test-results/apps-nav-fix.patch',
            },
          },
          {
            text: '\x1b[1;31mFAIL\x1b[0m  290 passed, 1 failed (129.4s)',
            level: 'error',
            source: 'remix-test',
            timestamp: '+02:11.0',
            fields: { passed: 290, failed: 1, exit_code: 1, duration_ms: 129400 },
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
            source: 'pack',
            timestamp: '+00:02.4',
            fields: { css_bundles: 6, layer: 'reflow' },
          },
          {
            text: '\x1b[32m✓\x1b[0m Starter installs cleanly without @pierre/diffs, @pierre/trees, preact, pele, or shiki',
            source: 'pack',
            timestamp: '+00:11.8',
            fields: { isolated_peers: 5, starter_packages: 98 },
          },
          {
            text: '\x1b[32m✓\x1b[0m Starter production server & Playwright checks passed',
            source: 'chromium',
            timestamp: '+00:16.1',
            fields: { exit_code: 0, duration_ms: 16100 },
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
            source: 'scheduler',
            timestamp: '+02:31.0',
            fields: { blocked_by: 'e2e' },
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
  deltaVsP50: '−14% vs 7d p50',
  cacheHitPct: 98,
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
  telemetryByJob: {
    ...baseTelemetry,
    e2e: {
      ...baseTelemetry.e2e!,
      cacheStatus: 'hit',
      deltaVsP50: '−11% vs p50',
      deltaTone: 'faster',
      failureLocation: undefined,
      failureHeadline: undefined,
    },
  },
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
          {
            text: '\x1b[32m✓\x1b[0m app-review.test.e2e.ts (3.4s)',
            source: 'chromium',
            timestamp: '+00:24.1',
            fields: { suite: 'app-review.test.e2e.ts', passed: 1, duration_ms: 3400 },
          },
          {
            text: '\x1b[32m✓\x1b[0m apps.test.e2e.ts (3.2s)',
            source: 'chromium',
            timestamp: '+00:29.8',
            fields: { suite: 'apps.test.e2e.ts', passed: 4, duration_ms: 3200 },
          },
          {
            text: '\x1b[1;32mPASS\x1b[0m  291 passed, 0 failed (124.0s)',
            source: 'remix-test',
            timestamp: '+02:04.0',
            fields: { passed: 291, failed: 0, exit_code: 0, duration_ms: 124000 },
          },
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
          {
            text: '\x1b[32m✓\x1b[0m Published @rtzll/reflow@0.17.0 to npm',
            source: 'npm',
            timestamp: '+02:32.4',
            fields: { package: '@rtzll/reflow', version: '0.17.0', provenance: true },
          },
          {
            text: '\x1b[32m✓\x1b[0m Published @rtzll/create-reflow@0.17.0 to npm',
            source: 'npm',
            timestamp: '+02:41.2',
            fields: { package: '@rtzll/create-reflow', version: '0.17.0', provenance: true },
          },
          {
            text: '\x1b[32m✓\x1b[0m Created GitHub release tag v0.17.0',
            source: 'github',
            timestamp: '+02:49.0',
            fields: { tag: 'v0.17.0' },
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
