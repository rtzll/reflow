import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
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

it('lays out all-day events above the hours and an overnight event across two columns', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/time-grid')
  const section = page.locator('#all-day-and-overnight')
  const strip = section.getByRole('group', { name: 'Release week, all day' })
  const board = section.getByRole('group', { name: 'Release week', exact: true })
  const freeze = strip.getByRole('button', { name: 'Code freeze, Monday to Tuesday, all day' })
  const release = strip.getByRole('button', { name: 'Release day, Wednesday, all day' })
  const [stripBox, boardBox, freezeBox, releaseBox] = await Promise.all(
    [strip, board, freeze, release].map(async (locator) => (await locator.boundingBox())!),
  )
  const column = boardBox.width / 3
  // The strip sits above the board in the same columns.
  assert.ok(stripBox.y + stripBox.height <= boardBox.y)
  assert.ok(Math.abs(stripBox.x - boardBox.x) < 1)
  assert.ok(Math.abs(freezeBox.width - (2 * column - 5)) < 1.5, `${freezeBox.width}`)
  assert.ok(Math.abs(releaseBox.x - (boardBox.x + 2 * column + 3)) < 1.5)

  const migration = board.getByRole('button', {
    name: 'Database migration, Monday, 22:00–Tuesday, 03:00',
  })
  const next = board.locator('[data-continues="migration"]')
  const [first, second] = [(await migration.boundingBox())!, (await next.boundingBox())!]
  // Monday until midnight, then Tuesday from 00:00.
  assert.ok(Math.abs(first.y + first.height + 2 - (boardBox.y + boardBox.height)) < 1.5)
  assert.ok(Math.abs(second.y - boardBox.y) < 1.5)
  assert.ok(second.x > first.x + column / 2)

  // Arrow keys move an all-day event by a day and keep its span.
  await freeze.focus()
  await page.keyboard.press('ArrowRight')
  await expect(
    strip.getByRole('button', { name: 'Code freeze, Tuesday to Wednesday, all day' }),
  ).toBeFocused()
})
