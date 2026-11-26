import { expect } from 'playwright/test'
import { setTimeout as delay } from 'node:timers/promises'
import { it } from 'remix/test'
import { exampleApps } from '../app/ui/example-apps.tsx'
import { open, showcaseServer, waitForShowcase } from './showcase-router.ts'

it('paints a cold workspace with its stylesheet on the first visible frame', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.addInitScript(() => {
    function sample() {
      const schedule = document.querySelector('.week-schedule')
      if (schedule) {
        sessionStorage.setItem(
          'first-calendar-radius',
          getComputedStyle(schedule).borderTopLeftRadius,
        )
      } else requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  await open(page, '/apps')
  const calendarStyle = /\/(?:app-calendar-[^/]+|apps\/calendar\/styles)\.css(?:\?|$)/
  await page.route(calendarStyle, async (route) => {
    await delay(350)
    await route.continue()
  })
  await Promise.all([
    page.waitForRequest(calendarStyle),
    page.getByRole('link', { name: 'Calendar', exact: true }).click(),
  ])
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem('first-calendar-radius')))
    .toBe('12px')
})

it('opens each workspace from the showcase and returns to the directory', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/?shape=pill')
  await page.locator('.site-left').getByRole('link', { name: 'Apps', exact: true }).click()
  const workspaces = [
    ['Issue tracker', page.getByRole('listbox', { name: 'Cycle issues' }), '.issues-insight'],
    ['Chat', page.getByRole('textbox', { name: 'Message' }), '.rf-composer'],
    ['Calendar', page.getByRole('button', { name: 'New event' }), '.week-schedule'],
    ['Analytics', page.getByRole('table', { name: 'Studio events' }), '.analytics-chart'],
    ['Code review', page.getByRole('button', { name: 'Submit review' }), '.rf-diff-view'],
  ] as const
  await expect(page.locator('.site-app-card')).toHaveCount(workspaces.length)
  await expect(page.locator('.site-app-card').first()).toHaveCSS('border-top-left-radius', '12px')
  for (const [name, workspaceControl, surface] of workspaces) {
    await page.getByRole('main').getByRole('link', { name }).click()
    await expect(page).toHaveTitle(name + ' · Reflow')
    await expect(workspaceControl).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-shape', 'rounded')
    await expect(page.locator(surface).first()).toHaveCSS('border-top-left-radius', /^[1-9]\d*px$/)
    const nav = page.getByRole('navigation', { name: 'App navigation' })
    await expect(nav.locator('[aria-current="page"]')).toHaveText(name)
    await nav.getByRole('link', { name: 'Apps' }).click()
    await expect(page.getByRole('heading', { name: 'Example apps' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-shape', 'rounded')
  }
  await page
    .getByRole('navigation', { name: 'Reflow' })
    .getByRole('link', { name: 'Showcase' })
    .click()
  await expect(page.locator('html')).toHaveAttribute('data-shape', 'pill')
})

it('serves the app directory without JavaScript and rejects an unknown app', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/*.js', (route) => route.abort())
  await open(page, '/apps', { hydrate: false })
  const links = page.getByRole('main').getByRole('link')
  await expect(links).toHaveCount(exampleApps.length)
  const bounds = await links.evaluateAll((cards) =>
    cards.map((card) => {
      const { left, right, top, bottom } = card.getBoundingClientRect()
      return { left, right, top, bottom }
    }),
  )
  for (const [i, card] of bounds.entries()) {
    expect(card.left).toBeGreaterThanOrEqual(0)
    expect(card.right).toBeLessThanOrEqual(390)
    if (i > 0) expect(card.top).toBeGreaterThanOrEqual(bounds[i - 1].bottom)
  }
  await page.getByRole('main').getByRole('link', { name: 'Calendar' }).click()
  await expect(page).toHaveTitle('Calendar · Reflow')
  await expect(page.getByRole('button', { name: 'New event' })).toBeVisible()
  const response = await open(page, '/apps/missing', { hydrate: false })
  expect(response?.status()).toBe(404)
})

it('reserves workspace shortcuts for the app and restores showcase shortcuts on return', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps?theme=light')
  await page.getByRole('main').getByRole('link', { name: 'Chat' }).click()
  await waitForShowcase(page)
  const theme = page.locator('html')
  const directory = page
    .getByRole('navigation', { name: 'App navigation' })
    .getByRole('link', { name: 'Apps' })
  await directory.press('t')
  await expect(theme).toHaveAttribute('data-theme', 'light')
  await directory.click()
  await waitForShowcase(page)
  await page.getByRole('main').getByRole('link', { name: 'Chat' }).press('t')
  await expect(theme).toHaveAttribute('data-theme', 'dark')
})
