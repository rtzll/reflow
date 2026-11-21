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
  await expect(page.getByRole('tabpanel', { name: 'Code' }).first()).toContainText('size="compact"')
})
