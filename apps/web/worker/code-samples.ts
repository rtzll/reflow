import type { CodeSamples } from '../app/public/code-block-example.tsx'

// Highlighted once by the build (tools/build.ts), so the worker ships the
// result and never Shiki itself.
declare const REFLOW_CODE_SAMPLES: CodeSamples

declare const REFLOW_EXAMPLE_SOURCES: Record<string, string>

export async function exampleSource(slug: string) {
  return REFLOW_EXAMPLE_SOURCES[slug]
}

export async function codeSamples(): Promise<CodeSamples> {
  return REFLOW_CODE_SAMPLES
}
