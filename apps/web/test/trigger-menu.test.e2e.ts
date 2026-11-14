import { expect } from 'playwright/test'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

it('inserts a mention at the caret before Enter can send the message', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/')
  const tile = page.locator('[data-component="input-message"]')
  const composer = tile.getByRole('textbox', { name: 'Message' })
  await composer.fill('Ask @gr tomorrow')
  // Back from the end to just after "@gr". Home would scroll the page on macOS
  // rather than move the caret.
  for (let i = 0; i < ' tomorrow'.length; i++) await composer.press('ArrowLeft')
  await expect(tile.getByRole('option', { name: 'Grace Hopper' })).toBeVisible()
  await composer.press('Enter')
  await expect(composer).toHaveValue('Ask @Grace Hopper tomorrow')
  await expect(composer).toBeFocused()
  await expect(tile.getByRole('listbox')).toHaveCount(0)
  await composer.press('Enter')
  await expect(composer).toHaveValue('')
  await expect(tile.getByText('Ask @Grace Hopper tomorrow')).toBeVisible()
})
