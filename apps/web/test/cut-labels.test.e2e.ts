import { expect, type Page } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

// The control a label belongs to, which carries the tooltip.
const control =
  'xpath=ancestor-or-self::*[self::a or self::button or self::label or starts-with(@role, "menuitem")][1]'
const long = 'Benachrichtigungseinstellungen für Northwind Industries Holdings'

// A label cut by its row shows in full as a native tooltip on the control;
// one that fits gets none.
for (const { name, path, label, before } of [
  { name: 'Sidebar row', path: '/docs/sidebar', label: '.rf-sidebar-label' },
  { name: 'segment', path: '/docs/segmented-control', label: '.rf-segment-label' },
  {
    name: 'menu item',
    path: '/docs/dropdown',
    label: '.rf-menu-label',
    before: async (page: Page) => {
      await page.locator('main .rf-dropdown-trigger').first().click()
      return page.locator('.rf-menu-surface:popover-open')
    },
  },
]) {
  it(`names a cut ${name} in full on hover`, async (t) => {
    const page = await t.serve(showcaseServer)
    await open(page, path)
    const scope = before ? await before(page) : page.locator('main')
    const labels = scope.locator(label)
    const cut = labels.nth(0)
    // From another control: neighbours of the cut one may give way to it.
    const fits = labels.filter({ visible: true }).last()
    await cut.evaluate((node, text) => {
      const inner = node.firstElementChild ?? node
      inner.textContent = text
    }, long)
    const cutHost = cut.locator(control)
    await cut.hover()
    await expect(cutHost).toHaveAttribute('title', long)
    await fits.hover()
    const fitsHost = fits.locator(control)
    await expect(fitsHost).not.toHaveAttribute('title')
  })
}
