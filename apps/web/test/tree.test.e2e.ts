import { expect } from 'playwright/test'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

it('opens a file from the gallery tree without moving focus into its preview', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/')
  const tile = page.locator('[data-component="code-block"]')
  const tree = tile.getByRole('tree', { name: 'Project files' })
  const source = tree.getByRole('treeitem', { name: 'code-block-example.tsx' })
  await expect(source).toBeVisible()
  await source.focus()
  await source.press('ArrowLeft')
  const folder = tree.getByRole('treeitem', { name: 'app' })
  await expect(folder).toBeFocused()
  await folder.press('ArrowLeft')
  await expect(folder).toHaveAttribute('aria-expanded', 'false')
  await expect(source).toHaveCount(0)
  await folder.press('ArrowRight')
  await folder.press('ArrowRight')
  await expect(source).toBeFocused()
  await source.press('ArrowDown')
  const readme = tree.getByRole('treeitem', { name: 'README.md' })
  await expect(readme).toBeFocused()
  await readme.press('Enter')
  await expect(readme).toHaveAttribute('aria-selected', 'true')
  await expect(tile.locator('code')).toContainText('# Reflow')
  await expect(readme).toBeFocused()
})

it('gives the gallery file browser its own row', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await open(page, '/')
    const tile = page.locator('.site-gallery [data-component="code-block"]')
    const [browser, gallery] = await Promise.all([
      tile.boundingBox(),
      page.locator('.site-gallery').boundingBox(),
    ])
    const padding = await page.locator('.site-gallery').evaluate((element) => {
      const style = getComputedStyle(element)
      return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
    })
    expect(Math.abs(browser!.width - (gallery!.width - padding))).toBeLessThanOrEqual(1)
    const chat = page.locator('.site-gallery [data-component="chat-message"]')
    await expect(chat.getByRole('separator')).toHaveCount(0)
    await expect(chat.getByText('What makes a product easy to use?')).toBeVisible()
  }
})
