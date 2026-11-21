import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('opens each workspace from the showcase and returns to the directory', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/')
  await page.locator('.site-left').getByRole('link', { name: 'Apps', exact: true }).click()
  for (const name of ['Issue tracker', 'Chat workspace', 'Team calendar', 'Analytics explorer']) {
    await page.getByRole('main').getByRole('link', { name }).click()
    await expect(page).toHaveTitle(name + ' · Reflow')
    const nav = page.getByRole('navigation', { name: 'App navigation' })
    await expect(nav.locator('[aria-current="page"]')).toHaveText(name)
    await nav.getByRole('link', { name: 'Apps' }).click()
    await expect(page.getByRole('heading', { name: 'Example apps' })).toBeVisible()
  }
})

it('serves the app directory without JavaScript and rejects an unknown app', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.route('**/*.js', (route) => route.abort())
  await open(page, '/apps', { hydrate: false })
  await page.getByRole('main').getByRole('link', { name: 'Team calendar' }).click()
  await expect(page).toHaveTitle('Team calendar · Reflow')
  const response = await open(page, '/apps/missing', { hydrate: false })
  expect(response?.status()).toBe(404)
})

it('reserves workspace shortcuts for the app and restores showcase shortcuts on return', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps?theme=light')
  await page.getByRole('main').getByRole('link', { name: 'Chat workspace' }).click()
  const theme = page.locator('html')
  const directory = page
    .getByRole('navigation', { name: 'App navigation' })
    .getByRole('link', { name: 'Apps' })
  await directory.press('t')
  await expect(theme).toHaveAttribute('data-theme', 'light')
  await directory.click()
  await page.getByRole('main').getByRole('link', { name: 'Chat workspace' }).press('t')
  await expect(theme).toHaveAttribute('data-theme', 'dark')
})
