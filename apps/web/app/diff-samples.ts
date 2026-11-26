import { prerenderDiagram } from '@rtzll/reflow/diagrams/ssr'
import { prerenderDiff } from '@rtzll/reflow/diffs/ssr'
import { prerenderFileTree, type PrerenderedFileTree } from '@rtzll/reflow/trees/ssr'
import { conversations } from './public/apps/chat/fixtures.ts'
import {
  buildReviewTreeDecorations,
  buildReviewTreeGitStatus,
  pullRequestDiagram,
  reviewFiles,
  seedThreads,
} from './public/apps/review/fixtures.ts'
import { sampleDiagrams } from './public/diagram-sample.ts'
import { sampleDiff } from './public/diff-view-sample.ts'
import {
  sampleFileTreeDecorations,
  sampleFileTreeGitStatus,
  sampleFileTreeId,
  sampleFileTreePaths,
} from './public/file-tree-sample.ts'

export interface DiffSamples {
  example: string
  fileTreeExample: PrerenderedFileTree
  diagramExamples: Record<string, string>
  chat: Record<string, string>
  review: Record<string, string>
  reviewTree: PrerenderedFileTree
  reviewDiagrams: Record<string, string>
}

function extractMermaidBlocks(markdown: string): string[] {
  const blocks: string[] = []
  for (const match of markdown.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)) {
    const code = match[1]?.trim()
    if (code) blocks.push(code)
  }
  return blocks
}

async function loadDiffSamples(): Promise<DiffSamples> {
  const chatEntries = conversations.flatMap((conversation) =>
    conversation.messages.flatMap((message) =>
      message.diff?.filename ? [[message.diff.filename, message.diff.patch] as const] : [],
    ),
  )

  const [example, chatRendered, reviewRendered] = await Promise.all([
    prerenderDiff({ diff: sampleDiff, wrap: true }),
    Promise.all(
      chatEntries.map(
        async ([filename, patch]) =>
          [filename, (await prerenderDiff({ diff: patch })).prerenderedHTML] as const,
      ),
    ),
    Promise.all(
      reviewFiles.map(async (file) => {
        const lineAnnotations = seedThreads
          .filter((thread) => thread.filePath === file.path)
          .map((thread) => ({
            side: thread.side,
            lineNumber: thread.lineNumber,
            metadata: { id: thread.id },
          }))
        const result = await prerenderDiff({
          oldFile: file.oldFile,
          newFile: file.newFile,
          wrap: true,
          lineAnnotations,
        })
        return [file.path, result.prerenderedHTML] as const
      }),
    ),
  ])

  const reviewTree = prerenderFileTree({
    id: 'review-files-tree',
    paths: reviewFiles.map((file) => file.path),
    defaultValue: reviewFiles[0]?.path,
    gitStatus: buildReviewTreeGitStatus(reviewFiles),
    rowDecorations: buildReviewTreeDecorations(reviewFiles, new Set(), seedThreads),
    size: 'compact',
  })

  const mermaidSources = new Set<string>([pullRequestDiagram.trim()])
  for (const thread of seedThreads) {
    for (const comment of thread.comments) {
      for (const code of extractMermaidBlocks(comment.body)) {
        mermaidSources.add(code)
      }
    }
  }
  const reviewDiagrams = Object.fromEntries(
    [...mermaidSources].map((code) => [code, prerenderDiagram(code).svg]),
  )

  const fileTreeExample = prerenderFileTree({
    id: sampleFileTreeId,
    paths: sampleFileTreePaths,
    defaultValue: sampleFileTreePaths[1],
    gitStatus: sampleFileTreeGitStatus,
    rowDecorations: sampleFileTreeDecorations,
    size: 'compact',
  })

  const diagramExamples = Object.fromEntries(
    Object.values(sampleDiagrams).map((entry) => [
      entry.code.trim(),
      prerenderDiagram(entry.code.trim()).svg,
    ]),
  )

  return {
    example: example.prerenderedHTML,
    fileTreeExample,
    diagramExamples,
    chat: Object.fromEntries(chatRendered),
    review: Object.fromEntries(reviewRendered),
    reviewTree,
    reviewDiagrams,
  }
}

let cached: Promise<DiffSamples> | undefined

export function diffSamples(): Promise<DiffSamples> {
  cached ??= loadDiffSamples()
  return cached
}
