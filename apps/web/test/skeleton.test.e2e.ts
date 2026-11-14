import { expect } from 'playwright/test'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

it('keeps the team table at the same height while loading', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/')
  const tile = page.locator('[data-component="table"]')
  const table = tile.getByRole('table', { name: 'Team members' })
  const before = (await table.boundingBox())!.height
  await tile.getByRole('switch', { name: 'Loading preview' }).click()
  await expect(table).toHaveAttribute('aria-busy', 'true')
  await expect(table.getByRole('row')).toHaveCount(1)
  const placeholder = table.locator('[data-slot="skeleton"]').first()
  await expect(placeholder).toBeVisible()
  await expect(placeholder).toHaveCSS('animation-name', 'none')
  expect((await table.boundingBox())!.height).toBe(before)
  await tile.getByRole('switch', { name: 'Loading preview' }).click()
  await expect(table.getByRole('cell', { name: 'Alice' })).toBeVisible()
})
