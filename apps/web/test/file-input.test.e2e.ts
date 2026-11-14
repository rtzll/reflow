import { expect } from 'playwright/test'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

it('adds and removes a review file in the gallery details drawer', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/')
  await page.locator('[data-component="drawer"]').getByRole('button', { name: 'Details' }).click()
  const drawer = page.getByRole('dialog', { name: 'Details' })
  const input = drawer.getByLabel('Review files')
  await input.setInputFiles({
    name: 'review.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Notes'),
  })
  const remove = drawer.getByRole('button', { name: 'Remove review.txt' })
  await remove.click()
  await expect(remove).toHaveCount(0)
  await expect(input).toBeFocused()
})
