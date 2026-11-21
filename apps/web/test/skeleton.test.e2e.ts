import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('keeps the team table at the same height while loading', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/')
  const tile = page.locator('[data-component="data-table"]')
  const table = tile.getByRole('table', { name: 'Team members' })
  const filter = tile.getByRole('searchbox')
  const toggle = tile.getByRole('switch', { name: 'Loading preview' })
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    const search = (await filter.boundingBox())!
    const control = (await toggle.boundingBox())!
    const bounds = (await table.boundingBox())!
    expect(control.x).toBeGreaterThan(search.x + search.width)
    expect(Math.abs(control.x + control.width - (bounds.x + bounds.width))).toBeLessThanOrEqual(1)
    expect(
      Math.abs(control.y + control.height / 2 - (search.y + search.height / 2)),
    ).toBeLessThanOrEqual(1)
  }
  await filter.press('Tab')
  await expect(toggle).toBeFocused()
  const before = (await table.boundingBox())!.height
  await toggle.press('Space')
  await expect(table).toHaveAttribute('aria-busy', 'true')
  await expect(table.getByRole('row')).toHaveCount(1)
  const placeholder = table.locator('[data-slot="skeleton"]').first()
  await expect(placeholder).toBeVisible()
  await expect(placeholder).toHaveCSS('animation-name', 'none')
  expect((await table.boundingBox())!.height).toBe(before)
  await toggle.click()
  await expect(table.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible()
})
