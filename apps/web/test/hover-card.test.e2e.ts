import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

it('opens on a resting pointer, stays open over the card, and closes after leaving', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/hover-card')
  const trigger = page.locator('#basic .doc-hover-trigger')
  const card = page.locator('#basic .rf-hover-card')
  await trigger.scrollIntoViewIfNeeded()
  await trigger.hover()
  await expect(card).toBeVisible()
  // Measure the rest pose, once the entry's drop and squash have settled.
  await expect.poll(() => card.evaluate((node) => getComputedStyle(node).transform)).toBe('none')
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

it('keeps a card whose trigger sits in a paragraph inside that paragraph', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  // As parsed from the server's HTML, before any script runs.
  await page.route('**/*.{js,mjs}', (route) => route.abort())
  await open(page, '/docs/hover-card', { hydrate: false })
  const sentence = page.locator('#link-preview .doc-hover-sentence')
  await expect(sentence).toHaveCount(1)
  await expect(sentence.locator('.rf-hover-card')).toHaveCount(1)
  await expect(page.locator('#link-preview .rf-hover-card')).toHaveCount(1)
})
