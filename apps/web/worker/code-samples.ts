import type { CodeSamples } from '../app/public/code-block-example.tsx'

// Highlighted once by the build (tools/build.ts), so the worker ships the
// result and never Shiki itself.
declare const REFLOW_CODE_SAMPLES: CodeSamples

export async function codeSamples(): Promise<CodeSamples> {
  return REFLOW_CODE_SAMPLES
}
