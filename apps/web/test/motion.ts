import type { Locator, Page } from 'playwright/test'

// Motion tests seek animations to fixed points rather than sampling frames in
// real time: a busy machine skips frames, so a sample taken "at 120ms" can land
// anywhere. holdMotion() pauses every animation and transition that starts
// after it, seekMotion() moves an element's to the same point of their timing, and
// releaseMotion() lets them finish.

type MotionWindow = Window & { __rfMotion?: Set<Animation> }

/** Pause each animation that starts from now on. Call before the action that starts it. */
export async function holdMotion(page: Page) {
  await page.evaluate(() => {
    const motionWindow = window as MotionWindow
    const held = new Set<Animation>()
    motionWindow.__rfMotion = held
    const holding = () => motionWindow.__rfMotion === held
    const hold = (animation: Animation) => {
      held.add(animation)
      animation.pause()
    }
    // Script animations, as they are created.
    const animate = Element.prototype.animate
    Element.prototype.animate = function (...args: Parameters<Element['animate']>) {
      const animation = animate.apply(this, args)
      if (holding()) hold(animation)
      return animation
    }
    // CSS transitions and animations, on their first frame.
    const holdStarted = (event: Event) => {
      if (!holding() || !(event.target instanceof Element)) return
      const origin = event.target
      for (const animation of document.getAnimations()) {
        const target = (animation.effect as KeyframeEffect | null)?.target
        if (target && origin.contains(target) && !held.has(animation)) hold(animation)
      }
    }
    document.addEventListener('transitionrun', holdStarted, true)
    document.addEventListener('animationstart', holdStarted, true)
  })
}

/**
 * Move the held animations of an element, and of its pseudo-elements, to the
 * same fraction of their timing: 0 for their start and 1 for their end. Waits
 * for at least one to have started.
 */
export async function seekMotion(element: Locator, progress: number) {
  await element.evaluate(async (node, progress) => {
    const own = () =>
      Array.from((window as MotionWindow).__rfMotion ?? []).filter(
        (animation) =>
          // A cancelled animation was replaced by a later one.
          animation.playState !== 'idle' &&
          (animation.effect as KeyframeEffect | null)?.target === node,
      )
    const deadline = performance.now() + 10_000
    while (own().length === 0) {
      if (performance.now() > deadline) throw new Error('No animation started on the element')
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    for (const animation of own()) {
      const end = Number(animation.effect?.getComputedTiming().endTime ?? 0)
      animation.currentTime = end * progress
    }
  }, progress)
}

/** How long each held animation on an element, or its pseudo-elements, runs in milliseconds. */
export async function heldDurations(element: Locator) {
  return element.evaluate((node) =>
    Array.from((window as MotionWindow).__rfMotion ?? [])
      .filter(
        (animation) =>
          animation.playState !== 'idle' &&
          (animation.effect as KeyframeEffect | null)?.target === node,
      )
      .map((animation) => Math.round(Number(animation.effect?.getComputedTiming().endTime ?? 0))),
  )
}

/** Stop holding new animations and let the held ones finish. */
export async function releaseMotion(page: Page) {
  await page.evaluate(() => {
    const motionWindow = window as MotionWindow
    const held = motionWindow.__rfMotion ?? new Set<Animation>()
    motionWindow.__rfMotion = undefined
    for (const animation of held) {
      if (animation.playState === 'idle') continue
      try {
        animation.finish()
      } catch {
        animation.play()
      }
    }
  })
}

/**
 * Skip an element's running animations, and its descendants', to their end,
 * as if their time had passed: for motion that drives behaviour, such as an
 * autoplay fill that moves on when it ends. Waits for one to be running.
 */
export async function finishMotion(element: Locator) {
  await element.evaluate(async (node) => {
    const running = () =>
      node.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running')
    const deadline = performance.now() + 10_000
    while (running().length === 0) {
      if (performance.now() > deadline) throw new Error('No animation is running on the element')
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    for (const animation of running()) animation.finish()
  })
}
