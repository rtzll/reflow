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
