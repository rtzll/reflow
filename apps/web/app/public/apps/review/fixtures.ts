import type { CommentAuthor, CommentSuggestion, TimelineItem } from '@rtzll/reflow'
import type { DiffFile } from '@rtzll/reflow/diffs'
import type { FileTreeRowDecoration, GitStatusEntry } from '@rtzll/reflow/trees'

export interface ReviewComment {
  id: string
  author: CommentAuthor
  timestamp?: string
  body: string
  suggestion?: Omit<CommentSuggestion, 'onApply'>
}

export interface ReviewFile {
  id: string
  path: string
  status: 'added' | 'modified'
  oldFile: DiffFile | null
  newFile: DiffFile
  added: number
  removed: number
}

export interface ReviewThread {
  id: string
  filePath: string
  side: 'additions' | 'deletions'
  lineNumber: number
  resolved: boolean
  outdated?: boolean
  comments: ReviewComment[]
}

export interface ReviewCheck {
  id: string
  name: string
  command: string
  status: 'passed' | 'failed'
  exitCode: number
  duration: string
  summary: string
  output: string[]
}

export const pullRequestDiagram = `flowchart LR
  Server[prerenderDiff / SSR] --> DSD[Declarative Shadow DOM]
  DSD --> Paint[First paint · 0ms flash]
  Paint --> Hydrate[Client hydrate]
  Hydrate --> Live[Slotted threads & split view]`

export const pullRequest = {
  number: 142,
  title: 'Zero-flash SSR hydration for DiffView',
  branch: 'feat/diff-ssr',
  base: 'main',
  author: 'Maya Chen',
  reviewers: ['Noah Park', 'Sora Lin', 'Maya Chen'],
  openedAt: '42m ago',
  summary:
    'Adds `@rtzll/reflow/diffs/ssr` (`prerenderDiff()`) so server-rendered diffs emit Declarative Shadow DOM HTML and hydrate in place with zero flash, plus slotted Remix annotations and review header controls.',
  diagram: pullRequestDiagram,
} as const

export function buildReviewTreeGitStatus(files: readonly ReviewFile[]): GitStatusEntry[] {
  return files.map((file) => ({
    path: file.path,
    status: file.status,
  }))
}

export function buildReviewTreeDecorations(
  files: readonly ReviewFile[],
  viewed: ReadonlySet<string>,
  threads: readonly ReviewThread[],
): Record<string, FileTreeRowDecoration> {
  const decorations: Record<string, FileTreeRowDecoration> = {}
  for (const file of files) {
    const parts: { text: string; color?: string }[] = []
    const textChunks: string[] = []
    if (viewed.has(file.path)) {
      parts.push({ text: '✓ ', color: 'var(--rf-success)' })
      textChunks.push('viewed')
    }
    const unresolved = threads.filter((t) => t.filePath === file.path && !t.resolved).length
    if (unresolved > 0) {
      parts.push({ text: `${unresolved} · `, color: 'var(--rf-accent)' })
      textChunks.push(`${unresolved} open`)
    }
    if (file.added > 0) {
      parts.push({ text: `+${file.added}`, color: 'var(--rf-success)' })
      textChunks.push(`+${file.added}`)
    }
    if (file.removed > 0) {
      if (file.added > 0) parts.push({ text: ' ' })
      parts.push({ text: `−${file.removed}`, color: 'var(--rf-danger)' })
      textChunks.push(`−${file.removed}`)
    }
    if (parts.length > 0) {
      decorations[file.path] = {
        text: textChunks.join(' '),
        title: `${file.path}: ${textChunks.join(', ')}`,
        parts,
      }
    }
  }
  return decorations
}

export const reviewFiles: readonly ReviewFile[] = [
  {
    id: 'diffs-ssr',
    path: 'packages/reflow/src/diffs-ssr.ts',
    status: 'added',
    added: 29,
    removed: 0,
    oldFile: null,
    newFile: {
      name: 'packages/reflow/src/diffs-ssr.ts',
      contents: `import {
  getSingularPatch,
  parseDiffFromFile,
  registerCustomCSSVariableTheme,
  type FileContents,
  type FileDiffMetadata,
} from '@pierre/diffs'
import { preloadDiffHTML } from '@pierre/diffs/ssr'

export interface PrerenderDiffOptions {
  diff?: string
  oldFile?: FileContents | null
  newFile?: FileContents | null
  view?: 'unified' | 'split'
  wrap?: boolean
}

export async function prerenderDiff(input: PrerenderDiffOptions) {
  ensureReflowTheme()
  const fileDiff: FileDiffMetadata = input.diff
    ? getSingularPatch(input.diff)
    : parseDiffFromFile(input.oldFile ?? null, input.newFile ?? null)

  const prerenderedHTML = await preloadDiffHTML({
    fileDiff,
    options: {
      disableFileHeader: true,
      diffStyle: input.view ?? 'unified',
      overflow: input.wrap ? 'wrap' : 'scroll',
      theme: 'reflow',
      themeType: 'system',
      unsafeCSS: ':host { color-scheme: inherit; }',
    },
  })

  const filename = (fileDiff.name || fileDiff.prevName || '').replace(/^[ab]\\//, '') || undefined
  return { prerenderedHTML, filename }
}
`,
    },
  },
  {
    id: 'diffs-tsx',
    path: 'packages/reflow/src/diffs.tsx',
    status: 'modified',
    added: 12,
    removed: 5,
    oldFile: {
      name: 'packages/reflow/src/diffs.tsx',
      contents: `import { ref, unsafeHTML, type Handle } from 'remix/component'
import { SegmentedControl } from './segmented-control.tsx'

export function DiffView(handle: Handle<DiffViewProps>) {
  let ready = false

  return () => {
    const { prerenderedHTML } = handle.props
    return (
      <figure class="rf-diff-view" data-rf-diffs-ready={ready ? '' : undefined}>
        <div class="rf-diff-stage">
          {prerenderedHTML ? (
            <div
              class="rf-diff-mount"
              innerHTML={unsafeHTML(\`<diffs-container><template shadowrootmode="open">\${prerenderedHTML}</template></diffs-container>\`)}
            />
          ) : (
            <div class="rf-diff-mount" />
          )}
        </div>
      </figure>
    )
  }
}
`,
    },
    newFile: {
      name: 'packages/reflow/src/diffs.tsx',
      contents: `import { createElement, ref, unsafeHTML, type Handle, type RemixNode } from 'remix/component'
import { SegmentedControl } from './segmented-control.tsx'

export function DiffView(handle: Handle<DiffViewProps>) {
  let ready = Boolean(handle.props.prerenderedHTML)

  return () => {
    const { prerenderedHTML, lineAnnotations, renderAnnotation } = handle.props
    const isServer = typeof window === 'undefined'
    const isReady = ready || Boolean(prerenderedHTML)
    const shadowTemplate =
      isServer && prerenderedHTML
        ? createElement('template', { shadowrootmode: 'open', innerHTML: unsafeHTML(prerenderedHTML) })
        : null
    const slots = renderAnnotation
      ? lineAnnotations?.map((annotation, i) => (
          <div key={i} class="rf-diff-annotation" slot={\`annotation-\${annotation.side}-\${annotation.lineNumber}\`}>
            {renderAnnotation(annotation)}
          </div>
        ))
      : null

    return (
      <figure class="rf-diff-view" data-rf-diffs-ready={isReady ? '' : undefined}>
        <div class="rf-diff-stage">
          <div class="rf-diff-mount">
            {createElement('diffs-container', { mix: mountContainer }, shadowTemplate, slots)}
          </div>
        </div>
      </figure>
    )
  }
}
`,
    },
  },
  {
    id: 'diff-view-css',
    path: 'packages/reflow/src/diff-view.css',
    status: 'modified',
    added: 10,
    removed: 2,
    oldFile: {
      name: 'packages/reflow/src/diff-view.css',
      contents: `.rf-diff-view {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--rf-panel-radius);
  background: var(--rf-surface-2);
  box-shadow: inset 0 0 0 1px var(--rf-border);
}

.rf-diff-header {
  display: flex;
  align-items: center;
  min-block-size: 40px;
  border-block-end: 1px solid var(--rf-border);
}
`,
    },
    newFile: {
      name: 'packages/reflow/src/diff-view.css',
      contents: `.rf-diff-view {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--rf-border);
  border-radius: var(--rf-panel-radius);
  background: var(--rf-surface-2);
}

.rf-diff-header {
  display: flex;
  align-items: center;
  min-block-size: 40px;
  border-block-end: 1px solid var(--rf-border);
}

.rf-diff-annotation {
  padding: 10px var(--rf-diff-pad);
  background: var(--rf-surface-1);
  border-block: 1px solid var(--rf-border);
  white-space: normal;
}
`,
    },
  },
  {
    id: 'diffs-ssr-test',
    path: 'apps/web/test/diffs-ssr.test.server.tsx',
    status: 'added',
    added: 20,
    removed: 0,
    oldFile: null,
    newFile: {
      name: 'apps/web/test/diffs-ssr.test.server.tsx',
      contents: `import { DiffView } from '@rtzll/reflow/diffs'
import { prerenderDiff } from '@rtzll/reflow/diffs/ssr'
import { equal, match, ok } from 'remix/assert'
import { renderToString } from 'remix/component/server'
import { it } from 'remix/test'

it('emits Declarative Shadow DOM with zero fallback on SSR', async () => {
  const { prerenderedHTML, filename } = await prerenderDiff({ diff: sampleDiff, wrap: true })
  equal(filename, 'src/cache.ts')

  const html = await renderToString(
    <DiffView diff={sampleDiff} prerenderedHTML={prerenderedHTML} />,
  )

  ok(html.includes('data-rf-diffs-ready'))
  ok(!html.includes('rf-diff-fallback'))
  match(html, /<diffs-container><template shadowrootmode="open">/)
})
`,
    },
  },
]

export const seedThreads: readonly ReviewThread[] = [
  {
    id: 'thread-prefix',
    filePath: 'packages/reflow/src/diffs-ssr.ts',
    side: 'additions',
    lineNumber: 36,
    resolved: false,
    comments: [
      {
        id: 'c1',
        author: { name: 'Noah Park', role: 'Reviewer' },
        timestamp: '18m ago',
        body: 'Nice catch stripping `a/` and `b/` here. We can also guard against `/dev/null` for pure additions or deletions.',
        suggestion: {
          removed:
            "const filename = (fileDiff.name || fileDiff.prevName || '').replace(/^[ab]\\//, '') || undefined",
          added:
            "const raw = fileDiff.name && fileDiff.name !== '/dev/null' ? fileDiff.name : fileDiff.prevName\nconst filename = raw?.replace(/^[ab]\\//, '') || undefined",
        },
      },
      {
        id: 'c2',
        author: { name: 'Maya Chen', role: 'Author' },
        timestamp: '11m ago',
        body: `Good point — applying this handles deleted files where \`name\` is \`/dev/null\`. Here is the full SSR-to-hydration handoff for reference:

\`\`\`mermaid
flowchart LR
  Patch[oldFile / newFile] --> SSR[prerenderDiff]
  SSR --> Shadow[Declarative Shadow DOM]
  Shadow --> Hydrate[DiffView hydrate]
\`\`\``,
      },
    ],
  },
  {
    id: 'thread-hydrate',
    filePath: 'packages/reflow/src/diffs.tsx',
    side: 'additions',
    lineNumber: 12,
    resolved: true,
    comments: [
      {
        id: 'c3',
        author: { name: 'Sora Lin', role: 'Reviewer' },
        timestamp: '26m ago',
        body: 'Only rendering `<template shadowrootmode="open">` on the server avoids Remix overwriting the hydrated shadow root on the client. Verified in Chromium.',
      },
    ],
  },
]

export const seedChecks: readonly ReviewCheck[] = [
  {
    id: 'check-typecheck',
    name: 'verify · typecheck & lint',
    command: 'pnpm check && pnpm lint',
    status: 'passed',
    exitCode: 0,
    duration: '4.8s',
    summary: 'All 3 workspace packages clean, 0 lint warnings',
    output: [
      '\x1b[2m$ pnpm check && pnpm lint\x1b[0m',
      '\x1b[36m▸\x1b[0m Building @rtzll/reflow (dist/index.js, dist/diffs.js, dist/diffs-ssr.js)',
      '\x1b[32m✓\x1b[0m packages/reflow check (470ms)',
      '\x1b[32m✓\x1b[0m packages/create-reflow check (203ms)',
      '\x1b[32m✓\x1b[0m apps/web check (720ms)',
      '\x1b[32m✓\x1b[0m oxlint . --max-warnings=0 (0 warnings)',
    ],
  },
  {
    id: 'check-browser',
    name: 'test · diff-view SSR & browser',
    command:
      'remix test apps/web/test/diffs-ssr.test.server.tsx apps/web/test/diff-view.test.browser.tsx',
    status: 'passed',
    exitCode: 0,
    duration: '2.3s',
    summary: '7 passed (3 server, 4 browser)',
    output: [
      '\x1b[2m$ remix test diffs-ssr.test.server.tsx diff-view.test.browser.tsx\x1b[0m',
      '\x1b[36m▸\x1b[0m Server suite [node]',
      '  \x1b[32m✓\x1b[0m prerenderDiff returns Declarative Shadow DOM HTML and file summary counts (167ms)',
      '  \x1b[32m✓\x1b[0m prerenderDiff computes diffs from oldFile and newFile pairs (4ms)',
      '  \x1b[32m✓\x1b[0m DiffView server-renders Declarative Shadow DOM with zero fallback (6ms)',
      '\x1b[36m▸\x1b[0m Browser suite [chromium]',
      '  \x1b[32m✓\x1b[0m renders a unified diff with @pierre/diffs and change counts (483ms)',
      '  \x1b[32m✓\x1b[0m switches between unified and split views (28ms)',
      '  \x1b[32m✓\x1b[0m computes diffs from oldFile and newFile (22ms)',
      '  \x1b[32m✓\x1b[0m supports collapsible body, copyable button, and slotted Remix annotations (29ms)',
      '\x1b[1;32mPASS\x1b[0m  7 passed, 0 failed',
    ],
  },
  {
    id: 'check-package',
    name: 'verify · check-package isolation',
    command: 'node tools/check-package.ts',
    status: 'passed',
    exitCode: 0,
    duration: '14.2s',
    summary: 'Optional @pierre/diffs & Shiki peers stay uninstalled in starter',
    output: [
      '\x1b[2m$ node tools/check-package.ts\x1b[0m',
      '\x1b[36m▸\x1b[0m Packing @rtzll/reflow and @rtzll/create-reflow',
      '\x1b[32m✓\x1b[0m dist/diffs.js and dist/diffs-ssr.js isolate all @pierre/diffs imports',
      '\x1b[32m✓\x1b[0m Starter installs cleanly without @pierre/diffs or shiki',
      '\x1b[32m✓\x1b[0m Starter production server and Playwright interactions passed',
    ],
  },
]

export interface SeedActivityEvent {
  id: string
  actor: string
  summary: string
  badge?: string
  timestamp: string
  tone?: TimelineItem['tone']
  detail?: string
}

export const seedActivity: readonly SeedActivityEvent[] = [
  {
    id: 'ev-open',
    actor: 'Maya Chen',
    summary: 'opened pull request #142',
    badge: 'feat/diff-ssr',
    timestamp: '42m ago',
    detail: pullRequest.summary,
  },
  {
    id: 'ev-sora',
    actor: 'Sora Lin',
    summary: 'resolved a thread on packages/reflow/src/diffs.tsx',
    timestamp: '26m ago',
    tone: 'success',
  },
  {
    id: 'ev-noah',
    actor: 'Noah Park',
    summary: 'suggested a change on packages/reflow/src/diffs-ssr.ts',
    timestamp: '18m ago',
    tone: 'accent',
    detail: 'Guard against /dev/null when resolving pure additions or deletions.',
  },
  {
    id: 'ev-checks',
    actor: 'CI',
    summary: 'All 3 checks passed (typecheck, diff-view SSR, package isolation)',
    timestamp: '6m ago',
    tone: 'success',
  },
]
