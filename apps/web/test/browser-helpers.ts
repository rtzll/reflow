import { ok } from 'remix/assert'

export interface WaitForOptions {
  frames?: number
  timeout?: number
  message?: string
}

/**
 * Polls a condition in browser tests until it becomes truthy, either over
 * animation frames (default 90) or until a millisecond `timeout`.
 */
export async function waitFor(check: () => boolean, options?: number | string | WaitForOptions) {
  const opts: WaitForOptions =
    typeof options === 'number'
      ? { frames: options }
      : typeof options === 'string'
        ? { message: options }
        : (options ?? {})

  if (opts.timeout !== undefined) {
    const deadline = Date.now() + opts.timeout
    while (Date.now() < deadline) {
      if (check()) return
      await new Promise<void>((resolve) => setTimeout(resolve, 20))
    }
    ok(check(), opts.message ?? 'Expected state did not settle')
    return
  }

  const limit = opts.frames ?? 90
  for (let i = 0; i < limit; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), opts.message ?? 'Expected state did not settle')
}

export function frames(count = 2) {
  return new Promise<void>((resolve) => {
    const step = (left: number) => (left ? requestAnimationFrame(() => step(left - 1)) : resolve())
    step(count)
  })
}

export const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
