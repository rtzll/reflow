import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('runs page commands by click and by keyboard in each primary example', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  for (const url of ['/', '/docs/command-menu']) {
    await open(page, url)
    const menu = page.locator('[aria-label="Project commands"]').first()
    const search = menu.getByRole('combobox')
    await search.fill('clipboard')
    await search.press('Enter')
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(page.url())
    await search.fill('dark')
    await menu.getByRole('option', { name: /Toggle dark mode/ }).click()
    const theme = await page.locator('html').getAttribute('data-theme')
    expect(['dark', 'light']).toContain(theme)
    await search.press('Enter')
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      theme === 'dark' ? 'light' : 'dark',
    )
    await search.fill('tree')
    await search.press('Enter')
    await expect(page).toHaveURL(/\/docs\/tree$/)
  }
})

it('supports the advertised copy shortcut and skips disabled rows', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, '/docs/command-menu')
  const demo = page.locator('#descriptions-shortcuts-disabled-rows')
  const search = demo.getByRole('combobox')
  await search.fill('clipboard')
  await search.press('Alt+Shift+KeyC')
  await expect(demo.getByRole('status')).toHaveText('Page link copied')
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(page.url())
  await search.fill('export')
  await expect(demo.getByRole('option', { name: /Export as PDF/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  await search.press('ArrowDown')
  await expect(search).not.toHaveAttribute('aria-activedescendant', /.+/)
})
