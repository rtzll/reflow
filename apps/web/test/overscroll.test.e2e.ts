import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

// Scrolling a panel to its end must not carry on into the page behind it:
// on a phone the page would rubber-band or refresh under the open panel.
it('keeps scrolling inside dialogs, menus and panes', async (t) => {
  const page = await t.serve(showcaseServer)
  const contained = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((node) => getComputedStyle(node).overscrollBehaviorY)

  await open(page, '/docs/resizable')
  await expect.poll(() => contained('main .rf-resizable-pane')).toBe('contain')

  await open(page, '/docs/dialog')
  await page.locator('main').getByRole('button', { name: /open/i }).first().click()
  await expect.poll(() => contained('.rf-dialog[open]')).toBe('contain')
})
