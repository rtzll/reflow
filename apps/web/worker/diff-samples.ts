import type { DiffSamples } from '../app/diff-samples.ts'

// Pre-rendered once by the build (tools/build.ts), so the worker ships Declarative
// Shadow DOM HTML and never @pierre/diffs or Shiki itself.
declare const REFLOW_DIFF_SAMPLES: DiffSamples

export async function diffSamples(): Promise<DiffSamples> {
  return REFLOW_DIFF_SAMPLES
}
