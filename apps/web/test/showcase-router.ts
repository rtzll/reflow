import type { Page } from 'playwright'
import { afterAll } from 'remix/test'
import { assets } from '../app/assets.ts'

export { router } from '../app/router.ts'

export async function waitForShowcase(page: Page) {
  // The browser entry awaits Remix hydration before it finishes evaluating.
  await page
    .locator('head script[type="module"][src]')
    .evaluate(async (script: HTMLScriptElement) => {
      await import(script.src)
    })
}

// HTTP servers close through t.serve(); the shared asset watchers need their
// own cleanup so workers can exit without the runner's shutdown timeout.
afterAll(() => assets.close())
