import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('inspects a filtered event and returns keyboard focus to the same row', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(
    page,
    '/apps/analytics?from=2026-10-14&to=2026-10-14&eventFilter=Media+import&eventPage=4',
  )
  const result = page.getByRole('button', {
    name: 'Inspect Asset imported for Autumn lookbook / 01',
  })
  await result.press('Enter')
  const details = page.getByRole('dialog', { name: 'Asset imported' })
  await expect(details).toBeVisible()
  await expect(details.locator('code')).toContainText('2026-10-14-import-0')
  await page.keyboard.press('Escape')
  await expect(details).toBeHidden()
  await expect(result).toBeFocused()
  await expect(page.getByRole('searchbox', { name: 'Filter Studio events' })).toHaveValue(
    'Media import',
  )
})

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
  await expect(chart.getByText('19 of 24 events were media imports.')).toBeVisible()
  await chart.getByRole('link', { name: 'View 19 media imports' }).press('Enter')
  await expect(filter).toHaveValue('Media import')
  await expect(
    page.getByRole('status').filter({ hasText: '19 results, page 1 of 4' }),
  ).toBeVisible()
  const latest = page.getByRole('button', {
    name: 'Inspect Asset imported for Autumn lookbook / 19',
  })
  await latest.press('Enter')
  const details = page.getByRole('dialog', { name: 'Asset imported' })
  await expect(details.locator('code')).toContainText('2026-10-14-import-18')
  await page.keyboard.press('Escape')
  await expect(latest).toBeFocused()
  await page.goBack()
  await expect(filter).toHaveValue('')
  await chart.getByRole('link', { name: 'View 19 media imports' }).click()
  // Unfiltered page 2 shows the same imports, so page only once the filter has landed.
  await expect(filter).toHaveValue('Media import')
  await page.getByRole('link', { name: 'Next page' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: '19 results, page 2 of 4' }),
  ).toBeVisible()
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

it('cancels a pending endpoint with Escape and when the date picker commits a new range', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps/analytics')
  const chart = page.getByRole('region', { name: 'Daily activity' })
  const spike = chart.getByRole('link', { name: 'Oct 14, 24 events' })
  const select = chart.getByRole('button', { name: 'Select range' })
  await select.click()
  await spike.press('Enter')
  await expect(chart.getByRole('status')).toContainText('Choose the other end')
  await spike.press('Escape')
  await expect(select).toHaveAttribute('aria-pressed', 'false')
  await expect(spike).toBeFocused()
  await expect(page).toHaveURL(/\/apps\/analytics$/)

  await select.click()
  await spike.press('Enter')
  await page.getByRole('button', { name: /Activity date range/ }).click()
  const picker = page.getByRole('dialog', { name: 'Activity date range' })
  await picker.locator('[data-rf-day="2026-10-10"]').click()
  await picker.locator('[data-rf-day="2026-10-11"]').click()
  await expect(page.getByText('Oct 10 – Oct 11 · 5 events')).toBeVisible()
  await expect(select).toHaveAttribute('aria-pressed', 'false')
  await expect(spike).not.toHaveAttribute('aria-current', 'true')

  const rangeButton = page.getByRole('button', { name: /Activity date range/ })
  const committedLabel = await rangeButton.textContent()
  await rangeButton.click()
  await picker.locator('[data-rf-day="2026-10-14"]').click()
  await page.keyboard.press('Escape')
  await expect(picker).toBeHidden()
  await expect(rangeButton).toHaveText(committedLabel!)
})

it('follows the busiest day and its source from a server-rendered mobile chart', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/*.js', (route) => route.abort())
  await open(page, '/apps/analytics', { hydrate: false })
  await page.getByRole('link', { name: 'View 24 events on Oct 14' }).click()
  await expect(page).toHaveURL(/from=2026-10-14&to=2026-10-14/)
  const chart = page.getByRole('region', { name: 'Daily activity' })
  await chart.getByRole('link', { name: 'View 19 media imports' }).click()
  await expect(page).toHaveURL(/eventFilter=Media\+import#events$/)
  const table = page.getByRole('table', { name: 'Studio events' })
  await expect(table.getByRole('cell', { name: 'Media import', exact: true })).toHaveCount(6)
  await expect(
    page.getByRole('status').filter({ hasText: '19 results, page 1 of 4' }),
  ).toBeVisible()
})

it('explains tied sources and regular editing days without losing the active range or sort', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(
    page,
    '/apps/analytics?from=2026-10-12&to=2026-10-14&eventPage=2&eventSort=item&eventDir=desc',
  )
  const chart = page.getByRole('region', { name: 'Daily activity' })
  await expect(
    chart.getByText('Media import and Studio editor each accounted for 19 of 38 events.'),
  ).toBeVisible()
  await chart.getByRole('link', { name: 'View 19 events from Studio editor' }).click()
  const query = new URL(page.url()).searchParams
  expect(query.get('from')).toBe('2026-10-12')
  expect(query.get('to')).toBe('2026-10-14')
  expect(query.get('eventFilter')).toBe('Studio editor')
  expect(query.get('eventSort')).toBe('item')
  expect(query.get('eventDir')).toBe('desc')
  expect(query.has('eventPage')).toBe(false)
  await expect(
    page.getByRole('status').filter({ hasText: '19 results, page 1 of 4' }),
  ).toBeVisible()
  await chart.getByRole('link', { name: 'Oct 10, 2 events' }).click()
  await expect(chart.getByText('Both events came from Studio editor.')).toBeVisible()
  await expect(chart.getByRole('link', { name: /media imports/i })).toHaveCount(0)
})
