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

export interface OpenOptions {
  /** Wait for the page to hydrate. Default true; pass false only to check the server's HTML. */
  hydrate?: boolean
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit'
}

/**
 * Opens a showcase page and, unless told not to, waits until it has
 * hydrated. End-to-end tests navigate only through this, so none can act on
 * markup before its scripts are wired; tools/check-tests.test.mjs enforces it.
 */
export async function open(page: Page, url: string, options: OpenOptions = {}) {
  const response = await page.goto(url, options.waitUntil ? { waitUntil: options.waitUntil } : {})
  if (options.hydrate !== false) await waitForShowcase(page)
  return response
}

// HTTP servers close through t.serve(); the shared asset watchers need their
// own cleanup so workers can exit without the runner's shutdown timeout.
afterAll(() => assets.close())
