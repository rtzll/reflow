import type { Page } from 'playwright/test'

// Timer-driven behaviour (autoplay, streaming, resets) runs on the page's
// timers. Tests install Playwright's fake clock before open() and move it on
// with page.clock.runFor() rather than waiting in real time.

/**
 * Stop the page's installed fake clock, so that from now on only runFor()
 * moves its time and no timer fires while the test is between steps.
 */
export async function pauseClock(page: Page) {
  // pauseAt() only moves forward; a moment ahead leaves room for the round trip.
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 100)
}
