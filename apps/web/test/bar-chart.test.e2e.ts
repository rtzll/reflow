import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('inspects build stages and updates the live BarChart example and its code', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/docs/bar-chart')
  const chart = page.getByRole('group', { name: 'Seconds by build stage' }).first()
  const testStage = chart.getByRole('button', { name: 'Test, 48 seconds' })
  await expect(testStage).toHaveAttribute('aria-current', 'true')
  await expect(testStage).toHaveCSS('outline-style', 'none')
  await testStage.press('ArrowRight')
  const bundle = chart.getByRole('button', { name: 'Bundle, 12 seconds' })
  await expect(bundle).toBeFocused()
  await expect(bundle).toHaveCSS('outline-style', 'solid')
  await expect(testStage).toHaveCSS('outline-style', 'none')
  await page.emulateMedia({ forcedColors: 'active' })
  await expect(bundle).toHaveCSS('outline-style', 'solid')
  expect(await testStage.evaluate((el) => getComputedStyle(el, '::after').borderBottomWidth)).toBe(
    '2px',
  )
  await bundle.press('Enter')
  await expect(chart.locator('..').getByRole('status')).toContainText(
    'Bundled the client and server.',
  )
  const settings = page.getByRole('region', { name: 'BarChart playground settings' })
  await settings.getByLabel('Show axis labels').click()
  await expect(chart.locator('.rf-bar-chart-ticks')).toHaveCount(0)
  await page.getByRole('tab', { name: 'Code', exact: true }).first().click()
  await expect(page.getByRole('tabpanel', { name: 'Code' }).first()).toContainText(
    '<BuildTimings showAxes={false} />',
  )
})

it('shows static bars within the Analytics directory link before hydration', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.route('**/*.js', (route) => route.abort())
  await open(page, '/apps', { hydrate: false })
  const card = page.getByRole('link', { name: 'Analytics', exact: true })
  await expect(card.locator('.rf-bar-chart-column')).toHaveCount(14)
  await expect(card.locator('a, button, [tabindex]')).toHaveCount(0)
  await card.click()
  const spike = page.getByRole('link', { name: 'Oct 14, 24 events' })
  await expect(spike).toHaveAttribute('href', /from=2026-10-14&to=2026-10-14/)
  await expect(spike).toHaveAttribute('tabindex', '0')
})
