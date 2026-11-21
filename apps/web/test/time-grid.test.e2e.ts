import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('books a room in a single day with half-hour range selection', async (t) => {
  const page = await t.serve(showcaseServer)
  const response = await open(page, '/docs/time-grid')
  expect(response?.status()).toBe(200)
  const board = page.getByRole('group', { name: 'Studio bookings' }).first()
  await board.scrollIntoViewIfNeeded()
  const rect = (await board.boundingBox())!
  const x = rect.x + rect.width / 2
  await page.mouse.move(x, rect.y + rect.height * 0.52)
  await page.mouse.down()
  await page.mouse.move(x, rect.y + rect.height * 0.875)
  await expect(board.locator('.rf-time-grid-range')).toHaveText('11:00–12:30')
  await page.mouse.up()
  await expect(
    board.getByRole('button', { name: 'Studio booking, Friday, 11:00–12:30' }),
  ).toBeVisible()
})

it('does not create an event from a click on open time', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/docs/time-grid')
  const board = page.getByRole('group', { name: 'Studio bookings' }).first()
  await board.scrollIntoViewIfNeeded()
  const bookings = board.getByRole('button')
  const count = await bookings.count()
  const rect = (await board.boundingBox())!
  await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height * 0.9)
  await expect(board.locator('.rf-time-grid-range')).toHaveCount(0)
  await expect(bookings).toHaveCount(count)
})
