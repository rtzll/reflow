import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('inspects the spike by keyboard and opens its underlying events', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps/analytics')
  const chart = page.getByRole('region', { name: 'Daily activity' })
  const first = chart.getByRole('link', { name: 'Oct 5, 4 events' })
  const spike = chart.getByRole('link', { name: 'Oct 14, 24 events' })
  await first.press('End')
  await expect(chart.getByRole('link', { name: 'Oct 18, 3 events' })).toBeFocused()
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowLeft')
  await expect(spike).toBeFocused()
  await expect(chart.getByRole('tooltip', { name: 'Oct 14, 24 events' })).toBeVisible()
  await spike.press('Enter')
  await expect(page.getByText('Oct 14 · 24 events')).toBeVisible()
  await expect(spike).toBeFocused()
  const filter = page.getByRole('searchbox', { name: 'Filter Studio events' })
  await filter.fill('Media import')
  await expect(
    page.getByRole('status').filter({ hasText: '19 results, page 1 of 4' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Next page' }).click()
  await expect(page.getByRole('cell', { name: 'Autumn lookbook / 13' })).toBeVisible()
  const shared = new URL(page.url())
  expect(shared.searchParams.get('from')).toBe('2026-10-14')
  expect(shared.searchParams.get('to')).toBe('2026-10-14')
  expect(shared.searchParams.get('eventFilter')).toBe('Media import')
  expect(shared.searchParams.get('eventPage')).toBe('2')
  await open(page, shared.pathname + shared.search)
  await expect(filter).toHaveValue('Media import')
  await expect(page.getByRole('cell', { name: 'Autumn lookbook / 13' })).toBeVisible()
  await page.getByRole('link', { name: 'All dates' }).click()
  await expect(page).toHaveURL(/\/apps\/analytics$/)
  await page.goBack()
  await expect(page.getByText('Oct 14 · 24 events')).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Autumn lookbook / 13' })).toBeVisible()
})

it('selects either order of chart endpoints and changes the window in the date picker on mobile', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 360, height: 800 })
  await open(page, '/apps/analytics')
  const chart = page.getByRole('region', { name: 'Daily activity' })
  await chart.getByRole('button', { name: 'Select range' }).click()
  await chart.getByRole('link', { name: 'Oct 15, 7 events' }).click()
  await expect(chart.getByRole('status')).toContainText('Choose the other end')
  await chart.getByRole('link', { name: 'Oct 13, 8 events' }).click()
  await expect(page.getByText('Oct 13 – Oct 15 · 39 events')).toBeVisible()
  await page.getByRole('button', { name: /Activity date range/ }).click()
  const picker = page.getByRole('dialog', { name: 'Activity date range' })
  await picker.locator('[data-rf-day="2026-10-10"]').click()
  await picker.locator('[data-rf-day="2026-10-11"]').click()
  await expect(page.getByText('Oct 10 – Oct 11 · 5 events')).toBeVisible()
  const rows = page.getByRole('table', { name: 'Studio events' }).locator('tbody tr')
  await expect(rows).toHaveCount(5)
  for (const date of await rows
    .locator('time')
    .evaluateAll((times) => times.map((time) => time.getAttribute('datetime')?.slice(0, 10)))) {
    expect(['2026-10-10', '2026-10-11']).toContain(date)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.goBack()
  await expect(page.getByText('Oct 13 – Oct 15 · 39 events')).toBeVisible()
})

it('renders shareable table and chart filters before hydration and handles malformed ranges', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.route('**/*.js', (route) => route.abort())
  await open(
    page,
    '/apps/analytics?from=2026-10-14&to=2026-10-14&eventFilter=Media+import&eventPage=4',
    { hydrate: false },
  )
  await expect(page.getByText('Oct 14 · 24 events')).toBeVisible()
  const table = page.getByRole('table', { name: 'Studio events' })
  await expect(table.locator('tbody tr')).toHaveCount(1)
  await expect(table.getByRole('cell', { name: 'Autumn lookbook / 01' })).toBeVisible()
  await page.getByRole('link', { name: 'Oct 10, 2 events' }).click()
  await expect(page.getByText('Oct 10 · 2 events')).toBeVisible()
  await expect(table.locator('tbody tr')).toHaveCount(2)
  await open(page, '/apps/analytics?from=bad&to=2026-10-01', { hydrate: false })
  await expect(page.getByText('Oct 5 – Oct 18 · 89 events')).toBeVisible()
})
