// Touch drags for the interactions mouse tests cannot vouch for: a touch drag
// can turn into a scroll or be cancelled by the browser, so each of these
// runs in a touch context with real touch events from the DevTools protocol.
import { expect, type Page } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

async function touchPage(
  t: {
    serve: (server: typeof showcaseServer) => Promise<Page>
    after: (fn: () => unknown) => void
  },
  width: number,
  height: number,
) {
  const desktop = await t.serve(showcaseServer)
  const context = await desktop.context().browser()!.newContext({
    baseURL: showcaseServer.baseUrl,
    hasTouch: true,
    isMobile: true,
    viewport: { width, height },
  })
  t.after(() => context.close())
  return context.newPage()
}

// Drags one finger from a point to another in small steps, then lifts it.
async function touchDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const client = await page.context().newCDPSession(page)
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] })
  const steps = 8
  for (let step = 1; step <= steps; step++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        {
          x: from.x + ((to.x - from.x) * step) / steps,
          y: from.y + ((to.y - from.y) * step) / steps,
        },
      ],
    })
    await page.waitForTimeout(40)
  }
  // Held still before lifting, so the release carries no flick.
  await page.waitForTimeout(150)
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

it('expands and collapses a snapping drawer with a finger on its content', async (t) => {
  const page = await touchPage(t, 390, 844)
  await open(page, '/docs/drawer')
  await page.locator('#snap-points').getByRole('button', { name: 'Route', exact: true }).tap()
  const panel = page.getByRole('dialog', { name: 'Lisbon to Porto' })
  const top = () => panel.evaluate((node) => Math.round(node.getBoundingClientRect().top))
  const atFirst = Math.round(844 - 0.4 * 844)
  await expect.poll(top).toBe(atFirst)

  // Below the top point a drag on the list moves the sheet, not the text.
  const step = (await panel.getByRole('listitem').nth(2).boundingBox())!
  await touchDrag(page, { x: 195, y: step.y + 5 }, { x: 195, y: step.y - 300 })
  await expect.poll(top).toBe(Math.round(844 - 0.9 * 844))
  assert.equal(await panel.evaluate((node) => node.scrollTop), 0)

  // A drag down from the header returns it to the first point.
  const header = (await panel.locator('.rf-drawer-header').boundingBox())!
  await touchDrag(page, { x: 195, y: header.y + 10 }, { x: 195, y: header.y + 330 })
  await expect.poll(top).toBe(atFirst)
  await expect(panel).toBeVisible()
})

it('moves an all-day event by whole days with a finger', async (t) => {
  const page = await touchPage(t, 1100, 900)
  await open(page, '/docs/time-grid')
  const section = page.locator('#all-day-and-overnight')
  const freeze = section.getByRole('button', { name: 'Code freeze, Monday to Tuesday, all day' })
  await freeze.scrollIntoViewIfNeeded()
  const box = (await freeze.boundingBox())!
  const column =
    (await section.getByRole('group', { name: 'Release week', exact: true }).boundingBox())!.width /
    3
  await touchDrag(
    page,
    { x: box.x + 30, y: box.y + box.height / 2 },
    { x: box.x + 30 + column, y: box.y + box.height / 2 },
  )
  await expect(
    section.getByRole('button', { name: 'Code freeze, Tuesday to Wednesday, all day' }),
  ).toBeVisible()
})

it('drags an overnight event an hour later with a finger and keeps it across midnight', async (t) => {
  const page = await touchPage(t, 1100, 1200)
  await open(page, '/docs/time-grid')
  const section = page.locator('#all-day-and-overnight')
  const board = section.getByRole('group', { name: 'Release week', exact: true })
  const migration = board.getByRole('button', { name: /^Database migration,/ })
  await migration.scrollIntoViewIfNeeded()
  const box = (await migration.boundingBox())!
  const hour = (await board.boundingBox())!.height / 24
  await touchDrag(
    page,
    { x: box.x + box.width / 2, y: box.y + 6 },
    { x: box.x + box.width / 2, y: box.y + 6 + hour },
  )
  await expect(migration).toHaveAccessibleName('Database migration, Monday, 23:00–Tuesday, 04:00')
  await expect(board.locator('[data-continues="migration"]')).toBeVisible()
})
