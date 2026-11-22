import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
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
  const spike = page.getByRole('link', {
    name: 'Oct 14: Studio editor 5 events, Media import 19 events',
  })
  await expect(spike).toHaveAttribute('href', /from=2026-10-14&to=2026-10-14/)
  await expect(spike).toHaveAttribute('tabindex', '0')
})

it('lays out a stacked horizontal chart with rows, a zero line and a legend', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/bar-chart')
  const chart = page.locator('#stacked-horizontal').getByRole('group', {
    name: 'Lines changed by package',
  })
  const web = chart.getByRole('img', { name: 'web: Added 260, Removed -310' })
  await expect(web).toBeVisible()
  const [added, removed] = await web.locator('.rf-bar-chart-fill').all()
  const zero = (await chart.locator('.rf-bar-chart-grid > span[data-zero]').boundingBox())!
  const [a, r] = [(await added!.boundingBox())!, (await removed!.boundingBox())!]
  // Added runs right from the zero line, removed runs left from it, on one row.
  assert.ok(Math.abs(a.x - zero.x) <= 1.5, `${a.x} ${zero.x}`)
  assert.ok(Math.abs(r.x + r.width - zero.x) <= 1.5, `${r.x + r.width} ${zero.x}`)
  assert.ok(Math.abs(a.y - r.y) <= 0.5)
  assert.ok(r.width > a.width, 'more removed than added')
  // Rows stack top to bottom, labels beside them.
  const rows = await chart
    .locator('.rf-bar-chart-column')
    .evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().top)))
  assert.ok(rows.every((top, index) => index === 0 || top > rows[index - 1]!))
  await expect(chart.getByRole('list', { name: 'Lines changed by package series' })).toHaveText(
    'AddedRemoved',
  )
})
