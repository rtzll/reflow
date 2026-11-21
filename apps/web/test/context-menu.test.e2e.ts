import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('lets a reader try compact file actions and copy the corresponding tree example', async (t) => {
  const page = await t.serve(showcaseServer)
  const response = await open(page, '/docs/context-menu')
  expect(response?.status()).toBe(200)
  const settings = page.getByRole('region', { name: 'ContextMenu playground settings' })
  await settings.getByLabel('Size').selectOption('compact')
  const row = page.getByRole('treeitem', { name: 'code-block-example.tsx' })
  await row.press('Shift+F10')
  const menu = page.getByRole('menu', { name: 'File actions' })
  await expect(menu).toBeFocused()
  await menu.getByRole('menuitem', { name: 'Open file' }).click()
  await expect(row).toHaveAttribute('aria-selected', 'true')
  await expect(row).toBeFocused()
  await page.getByRole('tab', { name: 'Code', exact: true }).first().click()
  const example = page.getByRole('tabpanel', { name: 'Code' }).first()
  for (const part of [
    'size="compact"',
    'icon: <Icon',
    "shortcut: 'Enter'",
    'children:',
    'navigator.clipboard.writeText',
  ])
    await expect(example).toContainText(part)
})

it('shows the Open shortcut and copies the clicked file’s relative path from a submenu', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, '/docs/context-menu')
  const file = page.getByRole('treeitem', { name: 'code-block-example.tsx' })
  await file.click({ button: 'right' })
  const root = page.getByRole('menu', { name: 'File actions', exact: true })
  const openFile = root.getByRole('menuitem', { name: /Open file/ })
  await expect(openFile.locator('kbd')).toHaveText('Enter')
  const icon = (await openFile.locator('svg').boundingBox())!
  const label = (await openFile.getByText('Open file', { exact: true }).boundingBox())!
  const hint = (await openFile.locator('kbd').boundingBox())!
  expect(icon.x + icon.width).toBeLessThan(label.x)
  expect(hint.x).toBeGreaterThan(label.x + label.width)
  await root.getByRole('menuitem', { name: 'Copy', exact: true }).hover()
  const copy = page.getByRole('menu', { name: 'Copy', exact: true })
  await copy.getByRole('menuitem', { name: 'Relative path' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('app/code-block-example.tsx')
  await expect(file).toBeFocused()
  await expect(file).toHaveAttribute('aria-selected', 'false')
  await file.press('Enter')
  await expect(file).toHaveAttribute('aria-selected', 'true')
  await file.press('Shift+F10')
  await expect(root).toBeFocused()
  await root.press('End')
  await expect(root.getByRole('menuitem', { name: 'Copy', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(copy.getByRole('menuitem', { name: 'File name' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('code-block-example.tsx')
  await expect(file).toBeFocused()
})
