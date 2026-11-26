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
    // Measure all three boxes in one frame so unrelated vertical layout above
    // the card cannot shift y between separate Playwright round trips.
    const { search, control, bounds } = await tile.evaluate((root) => {
      const searchEl = root.querySelector<HTMLElement>('[role="searchbox"], input[type="search"]')!
      const toggleEl = root.querySelector<HTMLElement>('[role="switch"]')!
      const tableEl = root.querySelector<HTMLElement>('table')!
      const frameEl = tableEl.parentElement!
      const box = (el: HTMLElement) => {
        const r = el.getBoundingClientRect()
        return { x: r.x, y: r.y, width: r.width, height: r.height }
      }
      return { search: box(searchEl), control: box(toggleEl), bounds: box(frameEl) }
    })
    // Align with the scroll container, not the table: on narrow screens the
    // table may be a few pixels wider and scroll sideways (Linux fonts are
    // wider, so CI hit this at 390px).
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
