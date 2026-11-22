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
  // Past midnight it continues into Friday; more than 24 hours is refused.
  await editor.getByLabel('Duration (minutes)').fill('1455')
  await editor.getByRole('button', { name: 'Save changes' }).click()
  await expect(editor.getByLabel('Duration (minutes)')).toHaveJSProperty(
    'validity.rangeOverflow',
    true,
  )
  await editor.getByLabel('Duration (minutes)').fill('60')
  await editor.getByRole('button', { name: 'Save changes' }).click()
  await expect(event).toHaveAccessibleName('Field notes, Thursday, 23:30–Friday, 00:30 UTC')
  await expect(event).toBeFocused()
  await open(page, '/apps/calendar')
  await expect(event).toHaveAccessibleName('Field notes, Thursday, 23:30–Friday, 00:30 UTC')
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
  const board = (await page
    .getByRole('group', { name: 'Timed events', exact: true })
    .boundingBox())!
  const x = original!.x + original!.width / 2
  const y = original!.y + 8
  await page.mouse.move(x, y)
  await page.mouse.down()
  const readout = page.locator('.rf-time-grid-readout')
  await expect(readout).toBeHidden()
  await page.mouse.move(x + board.width / 7, y + board.height / 8, { steps: 5 })
  await expect(readout).toHaveText('Tuesday · 10:00–11:00')
  await expect(readout).toHaveCSS('pointer-events', 'none')
  await expect(event).toHaveAccessibleName('Weekly kickoff, Tuesday, 10:00–11:00 UTC')
  await page.mouse.up()
  await expect(readout).toBeHidden()
  await expect(event).toHaveAttribute('aria-pressed', 'true')
  const moved = (await event.boundingBox())!
  expect(moved.width).toBeLessThan(original!.width / 2)
  const edge = (await event.locator('.rf-time-grid-resize').boundingBox())!
  await page.mouse.move(edge.x + edge.width / 2, edge.y + edge.height / 2)
  await page.mouse.down()
  await page.mouse.move(edge.x + edge.width / 2, edge.y + edge.height / 2 + board.height / 16)
  await expect(readout).toHaveText('Tuesday · 10:00–11:30')
  await page.mouse.up()
  await expect(event).toHaveAccessibleName('Weekly kickoff, Tuesday, 10:00–11:30 UTC')
  expect((await event.boundingBox())!.height).toBeGreaterThan(moved.height)
  const undo = page.getByRole('button', { name: 'Undo', exact: true })
  await undo.focus()
  await page.keyboard.press('Enter')
  await expect(event).toHaveAccessibleName('Weekly kickoff, Tuesday, 10:00–11:00 UTC')
  await expect(event).toBeFocused()
  await expect(undo).toBeHidden()
  await open(page, '/apps/calendar')
  await expect(event).toHaveAccessibleName('Weekly kickoff, Tuesday, 10:00–11:00 UTC')
  await event.press('ArrowLeft')
  await expect(event).toHaveAccessibleName('Weekly kickoff, Monday, 10:00–11:00 UTC')
  await undo.click()
  await expect(event).toHaveAccessibleName('Weekly kickoff, Tuesday, 10:00–11:00 UTC')
  await event.press('Shift+ArrowUp')
  await open(page, '/apps/calendar')
  await expect(event).toHaveAccessibleName('Weekly kickoff, Tuesday, 10:00–10:45 UTC')
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
  const board = page.getByRole('group', { name: 'Timed events', exact: true })
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
  const board = page.getByRole('group', { name: 'Timed events', exact: true })
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
  const event = page
    .getByRole('group', { name: 'Timed events', exact: true })
    .getByRole('button')
    .first()
  await expect(event).toHaveAccessibleDescription(/use arrows to move/)
  await expect(event).not.toHaveAccessibleDescription(/Drag down an empty time slot/)
  await expect(page.getByText('Drag down an empty time slot')).toBeVisible()
})

it('keeps a touch drag readable beside a short event and discards canceled or unchanged gestures', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, '/apps/calendar')
  const event = page.getByRole('button', { name: /^Weekly kickoff,/ })
  await event.press('Enter')
  const editor = page.getByRole('dialog')
  await editor.getByLabel('Duration (minutes)').fill('15')
  await editor.getByRole('button', { name: 'Save changes' }).click()
  const rect = (await event.boundingBox())!
  const edge = (await event.locator('.rf-time-grid-resize').boundingBox())!
  const x = edge.x + edge.width - 4
  const y = edge.y + edge.height / 2
  const client = await page.context().newCDPSession(page)
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x, y: y + 56 }],
  })
  const readout = page.locator('.rf-time-grid-readout')
  await expect(readout).toHaveText('Monday · 09:00–10:15')
  const tip = (await readout.boundingBox())!
  expect(tip.x).toBeGreaterThanOrEqual(0)
  expect(tip.x + tip.width).toBeLessThanOrEqual(390)
  expect(tip.height).toBeGreaterThan(rect.height)
  await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  await expect(readout).toBeHidden()
  await expect(event).toHaveAccessibleName('Weekly kickoff, Monday, 09:00–09:15 UTC')
  const undo = page.getByRole('button', { name: 'Undo', exact: true })
  await expect(undo).toBeHidden()
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + 56)
  await expect(readout).toBeVisible()
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(readout).toBeHidden()
  await expect(undo).toBeHidden()
  await event.press('ArrowLeft')
  await expect(undo).toBeHidden()
  await event.press('ArrowDown')
  await expect(undo).toBeVisible()
  await undo.click()
  await expect(event).toHaveAccessibleName('Weekly kickoff, Monday, 09:00–09:15 UTC')
  await expect(event).toBeFocused()
})

it('skips damaged calendar records and allows scheduling when local storage is denied', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps/calendar')
  await page.evaluate(() => {
    localStorage.setItem('reflow.calendar.2026-11-16.v1.kickoff', '{')
    localStorage.setItem(
      'reflow.calendar.2026-11-16.v1.identity',
      JSON.stringify({
        id: 'identity',
        title: 'Restored session',
        calendar: 'Design',
        day: 1,
        start: 600,
        duration: 30,
      }),
    )
    localStorage.setItem(
      'reflow.calendar.2026-11-16.v1.office',
      JSON.stringify({ id: 'office', start: -30 }),
    )
  })
  await open(page, '/apps/calendar')
  const event = page.getByRole('button', { name: /^Weekly kickoff,/ })
  await expect(event).toHaveAccessibleName('Weekly kickoff, Monday, 09:00–10:00 UTC')
  await expect(
    page.getByRole('button', { name: 'Restored session, Tuesday, 10:00–10:30 UTC' }),
  ).toBeVisible()
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage denied', 'SecurityError')
      },
    }),
  )
  await open(page, '/apps/calendar')
  await event.press('ArrowDown')
  await expect(event).toHaveAccessibleName('Weekly kickoff, Monday, 09:15–10:15 UTC')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(event).toHaveAccessibleName('Weekly kickoff, Monday, 09:00–10:00 UTC')
})

it('shows all-day events above the hours and saves all-day and overnight events from the editor', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/apps/calendar')
  const allDay = page.getByRole('group', { name: 'Timed events, all day' })
  const offsite = allDay.getByRole('button', {
    name: 'Studio offsite, Thursday to Friday, all day',
  })
  await expect(offsite).toBeVisible()

  // The editor opens an all-day event with its days instead of times.
  await offsite.click()
  await expect(page.locator('.week-detail')).toContainText('Thursday–Friday · All day')
  await page.getByRole('button', { name: 'Edit event' }).click()
  const editor = page.getByRole('dialog')
  await expect(editor.getByLabel('All day')).toBeChecked()
  await expect(editor.getByLabel('Days')).toHaveValue('2')
  await expect(editor.getByLabel('Start (UTC)')).toHaveCount(0)
  await editor.getByRole('button', { name: 'Cancel' }).click()

  // An overnight event continues in the next column.
  await page.getByRole('button', { name: 'New event' }).click()
  await editor.getByLabel('Event title').fill('Overnight render')
  await editor.getByLabel('Day', { exact: true }).selectOption('4')
  await editor.getByLabel('Start (UTC)').fill('22:00')
  await editor.getByLabel('Duration (minutes)').fill('300')
  await editor.getByRole('button', { name: 'Create event' }).click()
  const render = page.getByRole('button', {
    name: 'Overnight render, Friday, 22:00–Saturday, 03:00 UTC',
  })
  await expect(render).toBeFocused()
  await expect(page.locator('[data-continues]')).toHaveCount(1)
  await expect(page.locator('.week-detail')).toContainText('Friday 22:00–Saturday 03:00 UTC')

  // A new all-day event, from the same editor.
  await page.getByRole('button', { name: 'New event' }).click()
  await editor.getByLabel('Event title').fill('Holiday')
  await editor.getByLabel('Day', { exact: true }).selectOption('0')
  await editor.getByLabel('All day').check()
  await editor.getByRole('button', { name: 'Create event' }).click()
  await expect(allDay.getByRole('button', { name: 'Holiday, Monday, all day' })).toBeFocused()

  // Both survive a refresh.
  await open(page, '/apps/calendar')
  await expect(allDay.getByRole('button', { name: 'Holiday, Monday, all day' })).toBeVisible()
  await expect(render).toBeVisible()
})

it('shows the all-day strip on a narrow screen only for days it covers', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, '/apps/calendar')
  const strip = page.getByRole('group', { name: 'Timed events, all day' })
  await expect(strip).toBeHidden()
  await page
    .getByRole('group', { name: 'Day to display' })
    .getByRole('button', { name: 'Thursday' })
    .click()
  await expect(
    strip.getByRole('button', { name: 'Studio offsite, Thursday to Friday, all day' }),
  ).toBeVisible()
})
