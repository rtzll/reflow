import { expect } from 'playwright/test'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

it('opens a team page from its URL and follows links without JavaScript', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.route('**/*.js', (route) => route.abort())
  await open(page, '/?teamPage=2', { hydrate: false })
  const tile = page.locator('[data-component="table"]')
  const navigation = tile.getByRole('navigation', { name: 'Team pages' })
  await expect(navigation.getByRole('link', { name: 'Page 2' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(tile.getByRole('cell', { name: 'Emilia' })).toBeVisible()
  await navigation.getByRole('link', { name: 'Next page' }).click()
  await expect(page).toHaveURL(/teamPage=3/)
  await expect(tile.getByRole('cell', { name: 'Iris' })).toBeVisible()
  await page.goBack()
  await expect(tile.getByRole('cell', { name: 'Emilia' })).toBeVisible()
})
