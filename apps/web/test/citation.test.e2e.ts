import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router, waitForShowcase } from './showcase-router.ts'

it('keeps citations and their previews inside the paragraph the server sends', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  // As parsed from the server's HTML, before any script runs.
  await page.route('**/*.{js,mjs}', (route) => route.abort())
  for (const path of ['/docs/citation']) {
    await page.goto(path)
    const chips = await page.locator('.doc-citation-text').count()
    assert.ok(chips > 0, `${path} has paragraphs to check`)
    const broken = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('.doc-citation-text .rf-citation')).filter(
          (chip) => !chip.closest('p') || !chip.closest('p')!.querySelector('.rf-hover-card'),
        ).length,
    )
    assert.equal(broken, 0, `${path}: every chip and its card stay in their paragraph`)
  }
})

it('sits within the line and previews its sources above it', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/citation')
  await waitForShowcase(page)
  const paragraph = page.locator('#several-sources .doc-citation-text')
  const chip = paragraph.getByRole('link', { name: /^Sources 1 to 3: / })
  await chip.scrollIntoViewIfNeeded()
  const fits = await chip.evaluate((node) => {
    const box = node.getBoundingClientRect()
    const line = parseFloat(getComputedStyle(node.parentElement!).lineHeight)
    return { height: box.height, line }
  })
  assert.ok(fits.height <= fits.line, `the chip fits the line: ${JSON.stringify(fits)}`)
  const lines = await paragraph.evaluate(
    (node) => node.getBoundingClientRect().height / parseFloat(getComputedStyle(node).lineHeight),
  )
  assert.equal(Math.round(lines), 2, 'the chip adds no height to its line')

  await chip.hover()
  const card = page.locator('#several-sources .rf-hover-card')
  await expect(card).toBeVisible()
  await expect(card.getByRole('listitem')).toHaveCount(3)
  // Its content fits: nothing scrolls sideways.
  const overflow = await card.evaluate((node) => node.scrollWidth - node.clientWidth)
  assert.equal(overflow, 0, `the preview overflows by ${overflow}px`)
  await expect(card.getByRole('link', { name: 'Laws of UX' })).toHaveCount(0)
  await expect(card.getByRole('link', { name: 'Aesthetic–Usability Effect' })).toBeVisible()
  const placement = await card.evaluate((node) => ({
    side: node.getAttribute('data-anchor-placement'),
    above:
      node.getBoundingClientRect().bottom <=
      document.querySelector('#several-sources a.rf-citation')!.getBoundingClientRect().top,
  }))
  assert.deepEqual(placement, { side: 'top', above: true })
})

it('follows the shape setting, sharp to pill', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const radius = async (shape: string) => {
    await page.goto(`/docs/citation?shape=${shape}`)
    return page
      .locator('#basic .rf-citation')
      .first()
      .evaluate((node) => ({
        radius: parseFloat(getComputedStyle(node).borderTopLeftRadius),
        height: node.getBoundingClientRect().height,
      }))
  }
  const sharp = await radius('sharp')
  const round = await radius('rounded')
  const pill = await radius('pill')
  assert.ok(sharp.radius <= 1, `sharp: ${sharp.radius}`)
  assert.ok(round.radius >= 4 && round.radius <= 8, `round: ${round.radius}`)
  assert.ok(pill.radius >= pill.height / 2, `pill: ${pill.radius}`)
})
