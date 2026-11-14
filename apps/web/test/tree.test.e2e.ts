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
