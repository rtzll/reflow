import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('uses the density selected in the focused demo and serves its examples in the docs', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/demo?c=markdown')
  const stage = page.locator('.site-demo-stage')
  const note = stage.locator('[data-slot="markdown"]')
  await expect(note.getByRole('heading', { name: 'On the last ferry' })).toBeVisible()
  const initialSize = await note.evaluate((element) => getComputedStyle(element).fontSize)
  await page.locator('summary[aria-label="Customize Markdown"]').click()
  await page.getByLabel('Size', { exact: true }).selectOption('compact')
  await expect(note).toHaveAttribute('data-size', 'compact')
  expect(await note.evaluate((element) => getComputedStyle(element).fontSize)).not.toBe(initialSize)

  await page.route('**/*.js', (route) => route.abort())
  await open(page, '/docs/markdown', { hydrate: false })
  await expect(
    page.locator('#pipe-table').getByRole('columnheader', { name: 'Frame' }),
  ).toBeVisible()
  await expect(page.locator('#fenced-code .rf-markdown pre code')).toContainText('18:40')
})
