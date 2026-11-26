import { prerenderDiff } from '@rtzll/reflow/diffs/ssr'
import { conversations } from './public/apps/chat/fixtures.ts'
import { sampleDiff } from './public/diff-view-sample.ts'

export interface DiffSamples {
  example: string
  chat: Record<string, string>
}

async function loadDiffSamples(): Promise<DiffSamples> {
  const chatEntries = conversations.flatMap((conversation) =>
    conversation.messages.flatMap((message) =>
      message.diff?.filename ? [[message.diff.filename, message.diff.patch] as const] : [],
    ),
  )

  const [example, ...chatRendered] = await Promise.all([
    prerenderDiff({ diff: sampleDiff, wrap: true }),
    ...chatEntries.map(
      async ([filename, patch]) =>
        [filename, (await prerenderDiff({ diff: patch })).prerenderedHTML] as const,
    ),
  ])

  return {
    example: example.prerenderedHTML,
    chat: Object.fromEntries(chatRendered),
  }
}

let cached: Promise<DiffSamples> | undefined

export function diffSamples(): Promise<DiffSamples> {
  cached ??= loadDiffSamples()
  return cached
}
