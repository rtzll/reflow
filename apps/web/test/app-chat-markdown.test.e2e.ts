import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('shows the existing ferry sequence as a table on a phone and formats new assistant replies', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, '/apps/chat?thread=photo-sequence')
  const log = page.getByRole('log')
  await expect(log.getByRole('columnheader', { name: 'Frame' })).toBeVisible()
  await expect(log.getByRole('cell', { name: 'Waiting room' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

  await page.clock.install()
  const field = page.getByRole('textbox', { name: 'Message' })
  await field.fill('**Sequence** the photos')
  await field.press('Enter')
  const user = log.getByRole('article', { name: 'You' }).last()
  await expect(user).toContainText('**Sequence** the photos')
  await expect(user.locator('strong')).toHaveCount(0)
  await page.clock.runFor(6000)
  const reply = log.getByRole('article', { name: 'Assistant' }).last()
  await expect(reply.locator('strong')).toContainText(['Reflow', 'opening and closing frames'])
  await expect(reply.getByRole('columnheader', { name: 'Spread' })).toBeVisible()
})

it('renders the caption and its code example before hydration', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.route('**/*.js', (route) => route.abort())
  await open(page, '/apps/chat?thread=caption-edit', { hydrate: false })
  const answer = page.getByRole('article', { name: 'Assistant' })
  await expect(answer.locator('p code')).toHaveText('Photo note')
  await expect(answer.locator('pre code')).toHaveText('North landing · Last departure, 18:40')
})
