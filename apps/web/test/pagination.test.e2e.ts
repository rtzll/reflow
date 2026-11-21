import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('opens a team page from its URL and follows links without JavaScript', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.route('**/*.js', (route) => route.abort())
  await open(page, '/?teamPage=2', { hydrate: false })
  const tile = page.locator('[data-component="data-table"]')
  const navigation = tile.getByRole('navigation', { name: 'Team pages' })
  await expect(navigation.getByRole('link', { name: 'Page 2' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(tile.getByRole('cell', { name: 'Emilia', exact: true })).toBeVisible()
  await navigation.getByRole('link', { name: 'Next page' }).click()
  await expect(page).toHaveURL(/teamPage=3/)
  await expect(tile.getByRole('cell', { name: 'Iris', exact: true })).toBeVisible()
  await page.goBack()
  await expect(tile.getByRole('cell', { name: 'Emilia', exact: true })).toBeVisible()
})

it('changes the team page without moving the table in the viewport', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/')
  const tile = page.locator('[data-component="data-table"]')
  const navigation = tile.getByRole('navigation', { name: 'Team pages' })
  const table = tile.getByRole('table', { name: 'Team members' })
  await table.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const top = (await table.boundingBox())!.y
  const next = navigation.getByRole('link', { name: 'Next page' })
  await next.click()
  await expect(table.getByRole('cell', { name: 'Emilia', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/teamPage=2/)
  expect(Math.abs((await table.boundingBox())!.y - top)).toBeLessThanOrEqual(1)
  await next.press('Enter')
  await expect(table.getByRole('cell', { name: 'Iris', exact: true })).toBeVisible()
  expect(Math.abs((await table.boundingBox())!.y - top)).toBeLessThanOrEqual(1)
  await page.goBack()
  await expect(table.getByRole('cell', { name: 'Emilia', exact: true })).toBeVisible()
  expect(Math.abs((await table.boundingBox())!.y - top)).toBeLessThanOrEqual(1)
})

it('pages through the component directory in place and restores its records with Back', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.route('**/*.js', (route) => route.abort())
  for (const path of ['/docs/pagination', '/demo?c=pagination']) {
    await open(page, path + (path.includes('?') ? '&' : '?') + 'page=5', { hydrate: false })
    const directory = page.getByRole('list', { name: 'Component directory' })
    const pages = page.getByRole('navigation', { name: 'Component pages' })
    await expect(directory.getByRole('link', { name: 'CommandMenu', exact: true })).toBeVisible()
    const records = await directory.getByRole('link').allTextContents()
    await pages.getByRole('link', { name: 'Page 12' }).click()
    await expect(page).toHaveURL(new RegExp(path.replace('?', '\\?') + '[?&]page=12'))
    await expect(pages.getByRole('link', { name: 'Page 12' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(directory.getByRole('link', { name: 'TriggerMenu' })).toBeVisible()
    await expect(directory.getByRole('link')).toHaveCount(3)
    await page.goBack()
    await expect(directory.getByRole('link')).toHaveText(records)
  }
})
