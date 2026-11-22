import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { pauseClock } from './clock.ts'
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
  await expect(board.locator('.rf-time-grid-hover')).toHaveText('11:00')
  await page.mouse.down()
  await page.mouse.move(x, rect.y + rect.height * 0.875)
  await expect(board.locator('.rf-time-grid-range')).toHaveText('11:00–12:30')
  await page.mouse.up()
  await expect(
    board.getByRole('button', { name: 'Studio booking, Friday, 11:00–12:30' }),
  ).toBeVisible()
})

it('shows the snapped start after the pointer rests in an empty day column', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.clock.install()
  await open(page, '/docs/time-grid')
  const viewport = page.locator('.release-week-scroll')
  await viewport.scrollIntoViewIfNeeded()
  const board = viewport.getByRole('group', { name: 'Release week', exact: true })
  const notes = board.getByRole('button', { name: /^Release notes,/ })
  const rect = (await board.boundingBox())!
  const column = rect.width / 3
  const hour = rect.height / 24
  const startY = rect.y + 10.25 * hour
  const x = rect.x + 1.5 * column
  const line = board.locator('.rf-time-grid-hover')
  await pauseClock(page)

  await page.mouse.move(rect.x + 2.5 * column, startY + hour / 2)
  await page.clock.runFor(150)
  await page.mouse.move(x, startY + 4)
  await page.clock.runFor(150)
  await expect(line).toHaveCount(0)
  await page.clock.runFor(150)
  await expect(line).toHaveText('10:15')
  const marker = (await line.boundingBox())!
  expect(marker.y).toBeCloseTo(startY, 0)
  expect(marker.x).toBeGreaterThanOrEqual(rect.x + column)
  expect(marker.x + marker.width).toBeLessThanOrEqual(rect.x + 2 * column)
  await expect(board.locator('.rf-time-grid-range')).toHaveCount(0)

  await page.mouse.down()
  await expect(line).toHaveCount(0)
  await page.mouse.move(x, startY + hour / 2)
  await page.mouse.up()
  await expect(board.getByRole('button', { name: 'New event, Tuesday, 10:15–10:45' })).toBeVisible()

  // Moving onto an appointment or away from the board cancels a pending preview.
  await page.mouse.move(x, startY + hour)
  const chip = (await notes.boundingBox())!
  await page.mouse.move(chip.x + chip.width / 2, chip.y + chip.height / 2)
  await page.clock.runFor(300)
  await expect(line).toHaveCount(0)
  await page.mouse.move(x, startY + hour)
  await page.mouse.move(rect.x - 5, startY + hour)
  await page.clock.runFor(300)
  await expect(line).toHaveCount(0)

  // With the pointer at rest, scrolling by an hour gives the new snap time.
  await page.mouse.move(x, startY + hour)
  await page.clock.runFor(300)
  await expect(line).toHaveText('11:15')
  await viewport.evaluate(async (node, distance) => {
    const scrolled = new Promise<void>((resolve) =>
      node.addEventListener('scroll', () => resolve(), { once: true }),
    )
    node.scrollTop += distance
    await scrolled
  }, hour)
  await page.clock.runFor(400)
  await expect(line).toHaveText('12:15')
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
  const gutter = section.locator('.rf-time-grid-all-day-label')
  const viewport = section.locator('.release-week-scroll')
  // The gutter and strip share a divider even when pinned over the morning hours.
  const bottom = async (locator: typeof strip) => {
    const box = (await locator.boundingBox())!
    return box.y + box.height
  }
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)
  expect(await bottom(gutter)).toBeCloseTo(await bottom(strip), 1)
  await viewport.evaluate((node) => {
    node.scrollTop = 0
  })
  const [stripBox, boardBox, freezeBox, releaseBox] = await Promise.all(
    [strip, board, freeze, release].map(async (locator) => (await locator.boundingBox())!),
  )
  const column = boardBox.width / 3
  // The strip sits above the board in the same columns.
  expect(stripBox.y + stripBox.height).toBeCloseTo(boardBox.y, 1)
  expect(await bottom(gutter)).toBeCloseTo(boardBox.y, 1)
  expect(freezeBox.y).toBeCloseTo(releaseBox.y, 1)
  expect(stripBox.height - freezeBox.height).toBeLessThan(12)
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
  const movedFreeze = strip.getByRole('button', {
    name: 'Code freeze, Tuesday to Wednesday, all day',
  })
  await expect(movedFreeze).toBeFocused()
  const stacked = (await release.boundingBox())!
  const moved = (await movedFreeze.boundingBox())!
  expect(stacked.y).toBeGreaterThanOrEqual(moved.y + moved.height)
  expect(await bottom(gutter)).toBeCloseTo(await bottom(strip), 1)
  await movedFreeze.press('ArrowLeft')
  expect((await strip.boundingBox())!.height).toBeCloseTo(stripBox.height, 1)
})

it('can drag below a full all-day row to create an overlapping event', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/time-grid')
  const strip = page.getByRole('group', { name: 'Release week, all day' })
  await strip.scrollIntoViewIfNeeded()
  const box = (await strip.boundingBox())!
  const y = box.y + box.height - 3
  await page.mouse.move(box.x + box.width / 6, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, y, { steps: 4 })
  const preview = strip.locator('.rf-time-grid-range')
  await expect(preview).toBeVisible()
  const row = (await preview.boundingBox())!
  const freeze = (await strip.getByRole('button', { name: /^Code freeze,/ }).boundingBox())!
  expect(row.y).toBeGreaterThanOrEqual(freeze.y + freeze.height)
  await page.mouse.up()
  const created = strip.getByRole('button', {
    name: 'New all-day event, Monday to Tuesday, all day',
  })
  await expect(created).toBeVisible()
  expect((await created.boundingBox())!.y).toBeCloseTo(row.y, 1)
})

it('fits the title of a fifteen-minute event and a half-hour event inside their time slots', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/docs/time-grid')
  const board = page.getByRole('group', { name: 'Release week', exact: true })
  const event = board.getByRole('button', { name: /^Standup,/ })
  for (const duration of [15, 30]) {
    if (duration === 30) await event.press('Shift+ArrowDown')
    const slot = (await event.boundingBox())!
    const title = (await event.locator('strong').boundingBox())!
    expect(title.y).toBeGreaterThanOrEqual(slot.y)
    expect(title.y + title.height).toBeLessThanOrEqual(slot.y + slot.height + 0.5)
    expect(title.height).toBeGreaterThanOrEqual(12)
    expect(slot.height).toBeLessThanOrEqual(((await board.boundingBox())!.height * duration) / 1440)
  }
})

it('centers Release notes and its full time range together in the half-hour slot', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/time-grid')
  const card = page.getByRole('button', { name: 'Release notes, Wednesday, 10:00–10:30' })
  const time = card.locator('.rf-time-grid-time')
  await expect(time).toHaveText('10:00–10:30')
  await expect(time.locator('.rf-time-grid-end')).toBeVisible()
  const [slot, title, range] = await Promise.all(
    [card, card.locator('strong'), time].map(async (locator) => (await locator.boundingBox())!),
  )
  expect(range.y).toBeGreaterThanOrEqual(title.y + title.height)
  expect(range.height).toBeGreaterThanOrEqual(12)
  const spaceAbove = title.y - slot.y
  const spaceBelow = slot.y + slot.height - (range.y + range.height)
  expect(spaceAbove).toBeGreaterThanOrEqual(3)
  expect(Math.abs(spaceAbove - spaceBelow)).toBeLessThanOrEqual(1)
  expect(range.x + range.width).toBeLessThanOrEqual(slot.x + slot.width)
})

it('keeps the complete half-hour title readable in a narrow week column', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, '/docs/time-grid')
  const event = page.getByRole('button', { name: 'Release notes, Wednesday, 10:00–10:30' })
  const title = event.locator('strong')
  const fits = await title.evaluate(
    (node) => node.scrollHeight <= node.clientHeight && node.scrollWidth <= node.clientWidth,
  )
  expect(fits).toBe(true)
  const card = (await event.boundingBox())!
  const text = (await title.boundingBox())!
  expect(text.y).toBeGreaterThanOrEqual(card.y)
  expect(text.y + text.height).toBeLessThanOrEqual(card.y + card.height + 0.5)
  const range = await event.locator('.rf-time-grid-time').boundingBox()
  const bottom = range && range.height > 0 ? range.y + range.height : text.y + text.height
  expect(Math.abs(text.y - card.y - (card.y + card.height - bottom))).toBeLessThanOrEqual(1)
  if (range && range.height > 0) {
    expect(range.height).toBeGreaterThanOrEqual(12)
    expect(range.y + range.height).toBeLessThanOrEqual(card.y + card.height + 0.5)
  }
})
