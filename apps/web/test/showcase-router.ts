import type { Page } from 'playwright'
import { afterAll } from 'remix/test'

// The full suite shares one built Worker. Direct file runs serve current source.
async function standaloneOrigin() {
  const { createTestServer } = await import('remix/node-fetch-server/test')
  const { router } = await import('../app/router.ts')
  const { assets } = await import('../app/assets.ts')
  const server = await createTestServer(router.fetch)
  afterAll(async () => {
    try {
      await server.close()
    } finally {
      await assets.close()
    }
  })
  return server.baseUrl
}

export const showcaseServer = {
  baseUrl: process.env.REFLOW_TEST_ORIGIN ?? (await standaloneOrigin()),
  // The suite or standalone file owns the server's lifetime.
  async close() {},
}

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
  /**
   * Keep the page's motion. By default a page opens with reduced motion, so a
   * test of what a component does is not timed against its animations; tests
   * of the motion itself opt in and seek it with ./motion.ts.
   */
  motion?: boolean
}

const silenced = new WeakSet<Page>()

/**
 * Opens a showcase page with reduced motion and, unless told not to, waits
 * until it has hydrated. End-to-end tests navigate only through this, so none can act on
 * markup before its scripts are wired; tools/check-tests.test.ts enforces it.
 */
export async function open(page: Page, url: string, options: OpenOptions = {}) {
  if (!silenced.has(page)) {
    silenced.add(page)
    // Route Web Audio to the silent sink so headless Chromium never grabs OS audio output.
    await page.addInitScript(() => {
      const Native = window.AudioContext
      if (!Native) return
      class SilentAudioContext extends Native {
        constructor(audioOptions?: AudioContextOptions) {
          super({ sinkId: { type: 'none' }, ...audioOptions } as AudioContextOptions)
        }
      }
      window.AudioContext = SilentAudioContext
    })
  }
  await page.emulateMedia({ reducedMotion: options.motion ? 'no-preference' : 'reduce' })
  const response = await page.goto(url, options.waitUntil ? { waitUntil: options.waitUntil } : {})
  if (options.hydrate !== false) await waitForShowcase(page)
  return response
}
