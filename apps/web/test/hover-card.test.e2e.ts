import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { catalog } from '../app/catalog.tsx'
import { pauseClock } from './clock.ts'
import { open, showcaseServer } from './showcase-router.ts'

it('opens on a resting pointer, stays open over the card, and closes after leaving', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.clock.install()
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/hover-card')
  await pauseClock(page)
  const trigger = page.locator('#basic .doc-hover-trigger')
  const card = page.locator('#basic .rf-hover-card')
  await trigger.scrollIntoViewIfNeeded()
  await trigger.hover()
  await page.clock.runFor(500)
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
  await page.clock.runFor(500)
  await expect(card).toBeVisible()
  await page.mouse.move(5, 5)
  await page.clock.runFor(500)
  await expect(card).toBeHidden()
})

it('keeps a card whose trigger sits in a paragraph inside that paragraph', async (t) => {
  const page = await t.serve(showcaseServer)
  // As parsed from the server's HTML, before any script runs.
  await page.route('**/*.{js,mjs}', (route) => route.abort())
  await open(page, '/docs/hover-card', { hydrate: false })
  const sentence = page.locator('#link-preview .doc-hover-sentence')
  await expect(sentence).toHaveCount(1)
  await expect(sentence.locator('.rf-hover-card')).toHaveCount(1)
  await expect(page.locator('#link-preview .rf-hover-card')).toHaveCount(1)
})

it('shows the catalog totals in the Reflow profile on the gallery and docs', async (t) => {
  const page = await t.serve(showcaseServer)
  const systemCount = catalog.filter((entry) => entry.category === 'system').length
  const componentCount = catalog.length - systemCount
  for (const [url, preview] of [
    ['/', '.site-gallery [data-component="hover-card"]'],
    ['/docs/hover-card', '#basic'],
  ]) {
    await open(page, url)
    await page.locator(preview).getByRole('link', { name: '@reflow', exact: true }).hover()
    await expect(
      page
        .locator(preview)
        .locator('.rf-hover-card')
        .getByText(`${componentCount} components · ${systemCount} systems`),
    ).toBeVisible()
  }
})
