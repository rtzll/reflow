import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('opens a file from the gallery tree without moving focus into its preview', async (t) => {
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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

it('opens file actions at the icon and previews the file only when its action is chosen', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/')
  const tile = page.locator('[data-component="code-block"]')
  const tree = tile.getByRole('tree', { name: 'Project files' })
  const readme = tree.getByRole('treeitem', { name: 'README.md' })
  await expect(tree.locator('[role=treeitem][tabindex="0"]')).toHaveCount(1)
  const icon = readme.locator('svg').last()
  await icon.scrollIntoViewIfNeeded()
  const box = (await icon.boundingBox())!
  await icon.click({ button: 'right', position: { x: 3, y: 3 } })
  const menu = tile.getByRole('menu', { name: 'File actions' })
  await expect(menu).toBeFocused()
  const panel = tile.locator(':popover-open')
  const bounds = (await panel.boundingBox())!
  expect(Math.abs(bounds.x - (box.x + 3))).toBeLessThanOrEqual(2)
  expect(Math.abs(bounds.y - (box.y + 5))).toBeLessThanOrEqual(2)
  await expect(panel).toHaveCSS('transform', 'none')
  await expect(readme).toHaveAttribute('aria-selected', 'false')
  await menu.getByRole('menuitem', { name: 'Open file' }).click()
  await expect(readme).toHaveAttribute('aria-selected', 'true')
  await expect(tile.locator('code')).toContainText('# Reflow')
  await expect(readme).toBeFocused()
})

it('anchors keyboard actions to the focused file and keeps them visible at the viewport edge', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1100, height: 680 })
  await open(page, '/')
  const tile = page.locator('[data-component="code-block"]')
  const row = tile.getByRole('treeitem', { name: 'README.md' })
  await row.focus()
  await row.evaluate((node) => node.scrollIntoView({ block: 'end', behavior: 'instant' }))
  await row.press('ContextMenu')
  const menu = tile.getByRole('menu', { name: 'File actions' })
  await expect(menu).toBeFocused()
  const panel = tile.locator(':popover-open')
  const file = (await row.boundingBox())!
  const bounds = (await panel.boundingBox())!
  expect(Math.abs(bounds.x - file.x)).toBeLessThanOrEqual(2)
  expect(Math.abs(bounds.y + bounds.height - file.y + 2)).toBeLessThanOrEqual(2)
  await expect(menu.getByRole('menuitem')).toBeInViewport({ ratio: 1 })
  await page.keyboard.press('Escape')
  await expect(row).toBeFocused()
  await expect(row).toHaveAttribute('aria-selected', 'false')
})
