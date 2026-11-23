// A tap leaves :hover behind on touch screens until the next tap elsewhere,
// so a hover highlight would stay stuck on whatever was last tapped. Each of
// these taps a control in a touch context and checks nothing hover-only stays.
import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('leaves no hover highlight behind after a tap', async (t) => {
  const desktop = await t.serve(showcaseServer)
  const context = await desktop
    .context()
    .browser()!
    .newContext({
      baseURL: showcaseServer.baseUrl,
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    })
  t.after(() => context.close())
  const page = await context.newPage()
  assert.equal(
    await page.evaluate(() => matchMedia('(hover: hover)').matches),
    false,
    'a touch phone reports no hover',
  )

  // Next moves the page on but is never the current page itself, so once
  // tapped it rests unfilled again.
  await open(page, '/docs/pagination')
  const next = page.locator('main .rf-pagination').first().locator('[aria-label="Next page"]')
  await next.tap()
  await expect
    .poll(() => next.evaluate((node) => getComputedStyle(node).backgroundColor))
    .toBe('rgba(0, 0, 0, 0)')

  // The slider's value shows only while the finger is down.
  await open(page, '/docs/slider')
  const track = page.locator('main .rf-slider-track:has(.rf-slider-tooltip)').first()
  const tooltip = track.locator('.rf-slider-tooltip').first()
  await track.tap()
  await expect.poll(() => tooltip.evaluate((node) => getComputedStyle(node).opacity)).toBe('0')
})
