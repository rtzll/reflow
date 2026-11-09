import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router, waitForShowcase } from './showcase-router.ts'

it('opens on a resting pointer, stays open over the card, and closes after leaving', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/docs/hover-card')
  await waitForShowcase(page)
  const trigger = page.locator('#basic .doc-hover-trigger')
  const card = page.locator('#basic .rf-hover-card')
  await trigger.scrollIntoViewIfNeeded()
  await trigger.hover()
  await expect(card).toBeVisible()
  const geometry = await page.evaluate(
    ([a, b]) => {
      const t = a!.getBoundingClientRect()
      const c = b!.getBoundingClientRect()
      return {
        below: Math.round(c.top - t.bottom),
        placement: b!.getAttribute('data-anchor-placement'),
        focused: b!.contains(document.activeElement),
      }
    },
    [await trigger.elementHandle(), await card.elementHandle()],
  )
  // Supplementary: the card opens 8px below and never takes focus.
  assert.deepEqual(geometry, { below: 8, placement: 'bottom', focused: false })

  await card.hover()
  await page.waitForTimeout(400)
  await expect(card).toBeVisible()
  await page.mouse.move(5, 5)
  await expect(card).toBeHidden()
})
