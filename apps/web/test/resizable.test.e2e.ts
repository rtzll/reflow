import { expect } from 'playwright/test'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

it('resizes the gallery conversation and sources with the keyboard and pointer', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/')
  const tile = page.locator('[data-component="chat-message"]')
  const separator = tile.getByRole('separator', { name: 'Resize conversation' })
  await separator.press('ArrowLeft')
  await expect(separator).toHaveAttribute('aria-valuenow', '60')
  const bounds = (await separator.boundingBox())!
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x - 70, y)
  await page.mouse.up()
  await expect
    .poll(async () => Number(await separator.getAttribute('aria-valuenow')))
    .toBeLessThan(60)
  await separator.press('End')
  await expect(separator).toHaveAttribute('aria-valuenow', '75')
})

it('lists each cited source in the same order as the conversation', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  for (const [url, selector] of [
    ['/', '[data-component="chat-message"]'],
    ['/docs/resizable', '#playground'],
  ]) {
    await open(page, url)
    const example = page.locator(selector)
    const citations = example.getByRole('link', { name: /^Source \d+:/ })
    const sources = example.getByRole('region', { name: 'Sources' }).getByRole('link')
    await expect(citations).toHaveCount(2)
    await expect(sources).toHaveCount(2)
    for (const index of [0, 1]) {
      await expect(citations.nth(index)).toHaveText(String(index + 1))
      await expect(sources.nth(index)).toHaveAttribute(
        'href',
        (await citations.nth(index).getAttribute('href'))!,
      )
    }
  }
})

it('marks the source links with an underline before hover in both themes', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  for (const theme of ['light', 'dark']) {
    await open(page, `/docs/resizable?theme=${theme}`)
    const source = page
      .locator('#playground')
      .getByRole('link', { name: 'Ten principles for good design', exact: true })
    await expect(source).toHaveCSS('text-decoration-line', 'underline')
  }
})
