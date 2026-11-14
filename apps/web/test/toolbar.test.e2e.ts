import { expect } from 'playwright/test'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

it('moves through the gallery button toolbar with arrows and leaves it with Tab', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/')
  const toolbar = page.getByRole('toolbar', { name: 'Button variants' })
  const primary = toolbar.getByRole('button', { name: 'Primary' })
  const tertiary = toolbar.getByRole('button', { name: 'Tertiary' })
  await primary.focus()
  await primary.press('ArrowRight')
  await expect(toolbar.getByRole('button', { name: 'Secondary' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(tertiary).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(toolbar.locator(':focus')).toHaveCount(0)
  await page.keyboard.press('Shift+Tab')
  await expect(tertiary).toBeFocused()
})
