import { prerenderDiff } from '@rtzll/reflow/diffs/ssr'
import { conversations } from './public/apps/chat/fixtures.ts'
import { reviewFiles, seedThreads } from './public/apps/review/fixtures.ts'
import { sampleDiff } from './public/diff-view-sample.ts'

export interface DiffSamples {
  example: string
  chat: Record<string, string>
  review: Record<string, string>
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

  return {
    example: example.prerenderedHTML,
    chat: Object.fromEntries(chatRendered),
    review: Object.fromEntries(reviewRendered),
  }
}

let cached: Promise<DiffSamples> | undefined

export function diffSamples(): Promise<DiffSamples> {
  cached ??= loadDiffSamples()
  return cached
}
