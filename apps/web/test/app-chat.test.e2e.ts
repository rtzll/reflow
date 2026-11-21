import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('keeps drafts with their conversations on a narrow screen', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, '/apps/chat?thread=photo-sequence')
  const picker = page.getByRole('combobox', { name: 'Conversation' })
  const field = page.getByRole('textbox', { name: 'Message' })
  await expect(page.getByRole('log', { name: 'Photo essay sequence' })).toBeVisible()
  await field.fill('Try the empty waiting room at the end.')
  await picker.selectOption('interview-notes')
  await expect(field).toHaveValue('')
  await field.fill('Ask Mara about the weather.')
  await picker.selectOption('photo-sequence')
  await expect(field).toHaveValue('Try the empty waiting room at the end.')
  await expect(picker).toBeInViewport()
  await expect(field).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
