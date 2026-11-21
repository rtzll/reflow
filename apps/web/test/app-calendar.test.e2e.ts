import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('creates a timed event, moves and resizes it with the keyboard, and edits its details', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/apps/calendar')
  await page.getByRole('button', { name: 'New event' }).click()
  const editor = page.getByRole('dialog')
  await editor.getByLabel('Event title').fill('Field notes')
  await editor.getByLabel('Day', { exact: true }).selectOption('2')
  await editor.getByLabel('Start (UTC)').fill('11:30')
  await editor.getByLabel('Duration (minutes)').fill('45')
  await editor.getByLabel('Calendar', { exact: true }).selectOption('Focus')
  await editor.getByRole('button', { name: 'Create event' }).click()
  const event = page.getByRole('button', { name: /^Field notes,/ })
  await expect(event).toHaveAccessibleName('Field notes, Wednesday, 11:30–12:15 UTC')
  await expect(event).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Shift+ArrowDown')
  await expect(event).toHaveAccessibleName('Field notes, Thursday, 11:30–12:30 UTC')
  await expect(event).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(editor.getByLabel('Day', { exact: true })).toHaveValue('3')
  await expect(editor.getByLabel('Duration (minutes)')).toHaveValue('60')
  await editor.getByLabel('Start (UTC)').fill('23:30')
  await editor.getByRole('button', { name: 'Save changes' }).click()
  await expect(editor.getByLabel('Duration (minutes)')).toHaveJSProperty(
    'validationMessage',
    'Choose a duration that ends by midnight.',
  )
  await editor.getByLabel('Duration (minutes)').fill('30')
  await editor.getByRole('button', { name: 'Save changes' }).click()
  await expect(event).toHaveAccessibleName('Field notes, Thursday, 23:30–24:00 UTC')
  await expect(event).toBeFocused()
})

it('places overlapping events side by side and previews pointer moves and duration changes', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/apps/calendar')
  const research = page.getByRole('button', { name: /^Research synthesis,/ })
  const checkIn = page.getByRole('button', { name: /^Partner check-in,/ })
  const event = page.getByRole('button', { name: /^Weekly kickoff,/ })
  const [first, second, original] = await Promise.all([
    research.boundingBox(),
    checkIn.boundingBox(),
    event.boundingBox(),
  ])
  expect(first!.x + first!.width).toBeLessThanOrEqual(second!.x)
  expect(first!.y + first!.height).toBeGreaterThan(second!.y)
  const board = (await page.getByRole('group', { name: 'Timed events' }).boundingBox())!
  const x = original!.x + original!.width / 2
  const y = original!.y + 8
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + board.width / 7, y + board.height / 8, { steps: 5 })
  await expect(event).toHaveAccessibleName('Weekly kickoff, Tuesday, 10:00–11:00 UTC')
  await page.mouse.up()
  await expect(event).toHaveAttribute('aria-pressed', 'true')
  const moved = (await event.boundingBox())!
  expect(moved.width).toBeLessThan(original!.width / 2)
  const edge = (await event.locator('.rf-time-grid-resize').boundingBox())!
  await page.mouse.move(edge.x + edge.width / 2, edge.y + edge.height / 2)
  await page.mouse.down()
  await page.mouse.move(edge.x + edge.width / 2, edge.y + edge.height / 2 + board.height / 16)
  await page.mouse.up()
  await expect(event).toHaveAccessibleName('Weekly kickoff, Tuesday, 10:00–11:30 UTC')
  expect((await event.boundingBox())!.height).toBeGreaterThan(moved.height)
})

it('switches days and reschedules a selected event on a narrow screen', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, '/apps/calendar')
  const picker = page.getByRole('group', { name: 'Day to display' })
  await picker.getByRole('button', { name: 'Saturday' }).click()
  await expect(page.getByText('No events on Saturday.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Edit event' })).toBeHidden()
  await picker.getByRole('button', { name: 'Tuesday' }).click()
  await page.getByRole('button', { name: /^Partner check-in,/ }).click()
  await page.getByRole('button', { name: 'Edit event' }).click()
  const editor = page.getByRole('dialog')
  await editor.getByLabel('Day', { exact: true }).selectOption('6')
  await editor.getByLabel('Duration (minutes)').fill('75')
  await editor.getByRole('button', { name: 'Save changes' }).click()
  await expect(picker.getByRole('button', { name: 'Sunday' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(
    page.getByRole('button', { name: 'Partner check-in, Sunday, 10:15–11:30 UTC' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /^Research synthesis,/ })).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

it('previews a dragged time range and opens a new event with its day, start, and duration', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/apps/calendar')
  const board = page.getByRole('group', { name: 'Timed events' })
  const rect = (await board.boundingBox())!
  const hour = rect.height / 8
  const sunday = rect.x + (rect.width * 6.5) / 7
  await page.mouse.move(sunday, rect.y + hour * 1.28)
  await page.mouse.down()
  const range = board.locator('.rf-time-grid-range')
  await expect(range).toHaveText('10:15–10:30')
  await page.mouse.move(sunday - rect.width / 7, rect.y + hour * 2.52, { steps: 5 })
  await expect(range).toHaveText('10:15–11:30')
  await expect(page.getByRole('dialog')).toBeHidden()
  await page.mouse.up()
  const editor = page.getByRole('dialog', { name: 'New event' })
  await expect(editor.getByLabel('Day', { exact: true })).toHaveValue('6')
  await expect(editor.getByLabel('Start (UTC)')).toHaveValue('10:15')
  await expect(editor.getByLabel('Duration (minutes)')).toHaveValue('75')
  await editor.getByLabel('Event title').fill('Studio visit')
  await editor.getByRole('button', { name: 'Create event' }).click()
  await expect(
    board.getByRole('button', { name: 'Studio visit, Sunday, 10:15–11:30 UTC' }),
  ).toBeFocused()
  await expect(range).toHaveCount(0)
})

it('cancels range selection and clamps it at the end of the displayed day', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 900 })
  await open(page, '/apps/calendar')
  await page
    .getByRole('group', { name: 'Day to display' })
    .getByRole('button', { name: 'Saturday' })
    .click()
  const board = page.getByRole('group', { name: 'Timed events' })
  const rect = (await board.boundingBox())!
  const x = rect.x + rect.width / 2
  await page.mouse.move(x, rect.y + 1)
  await page.mouse.down()
  await page.mouse.move(x, rect.y + rect.height / 4)
  const range = board.locator('.rf-time-grid-range')
  await expect(range).toHaveText('09:00–11:00')
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(range).toHaveCount(0)
  await expect(page.getByRole('dialog')).toBeHidden()
  await page.mouse.move(x, rect.y + rect.height - 2)
  await page.mouse.down()
  await page.mouse.move(x, rect.y + rect.height + 12)
  await expect(range).toHaveText('16:45–17:00')
  await page.mouse.up()
  const editor = page.getByRole('dialog', { name: 'New event' })
  await expect(editor.getByLabel('Day', { exact: true })).toHaveValue('5')
  await expect(editor.getByLabel('Start (UTC)')).toHaveValue('16:45')
  await expect(editor.getByLabel('Duration (minutes)')).toHaveValue('15')
  await editor.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByText('No events on Saturday.')).toBeVisible()
})

it('describes events with the grid instructions once, without repeating the visible hint', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/apps/calendar')
  const event = page.getByRole('group', { name: 'Timed events' }).getByRole('button').first()
  await expect(event).toHaveAccessibleDescription(/use arrows to move/)
  await expect(event).not.toHaveAccessibleDescription(/Drag down an empty time slot/)
  await expect(page.getByText('Drag down an empty time slot')).toBeVisible()
})
