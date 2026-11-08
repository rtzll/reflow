import type { Page } from 'playwright'
import { afterAll } from 'remix/test'
import { assets } from '../app/assets.ts'

export { router } from '../app/router.ts'

export async function waitForShowcase(page: Page) {
  // Wait for every client entry and the showcase's page-level handlers.
  // An individual component can mount while the rest of the page is still hydrating.
  await page
    .locator('head script[type="module"][src]')
    .evaluate(async (script: HTMLScriptElement) => {
      await import(script.src)
    })
}

// HTTP servers close through t.serve(); the shared asset watchers need their
// own cleanup so workers can exit without the runner's shutdown timeout.
afterAll(() => assets.close())
