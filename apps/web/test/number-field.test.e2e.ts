import { expect } from 'playwright/test'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

it('scrubs the guest count in the gallery input group', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/')
  const group = page.locator('[data-component="input-group"]')
  const input = group.getByRole('spinbutton', { name: 'Guests' })
  const label = group.getByText('Guests', { exact: true })
  await label.scrollIntoViewIfNeeded()
  const box = (await label.boundingBox())!
  await page.mouse.move(box.x + 4, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 19, box.y + box.height / 2)
  await page.mouse.up()
  await expect(input).toHaveValue('5')
  await input.press('ArrowDown')
  await expect(input).toHaveValue('4')
})
