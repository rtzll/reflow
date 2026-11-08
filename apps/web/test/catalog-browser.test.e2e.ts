import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { join } from 'node:path'
import { catalog } from '../app/catalog.tsx'
import { router } from './showcase-router.ts'

for (const layout of [
  { name: 'desktop dark', width: 1280, height: 720, theme: 'dark' },
  { name: 'mobile light', width: 390, height: 844, theme: 'light' },
]) {
  it(`hydrates every documentation page without overflow in ${layout.name}`, async (t) => {
    const page = await t.serve(await createTestServer(router.fetch))
    await page.setViewportSize({ width: layout.width, height: layout.height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const overflow: string[] = []
    for (const entry of catalog) {
      await page.goto(`/docs/${entry.slug}?theme=${layout.theme}&density=default&font=inter`)
      await page.locator('[data-site-controls-ready]').waitFor({ state: 'attached' })
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }))
      if (dimensions.scroll > dimensions.width + 1) {
        const elements = await page.locator('main *').evaluateAll((nodes) =>
          nodes
            .filter(
              (node) =>
                node.getBoundingClientRect().right > document.documentElement.clientWidth + 1,
            )
            .slice(0, 5)
            .map((node) => `${node.tagName}.${node.className}`),
        )
        overflow.push(
          `${entry.slug}: ${dimensions.scroll}px in ${dimensions.width}px, ${elements.join(', ')}`,
        )
      }
      assert.deepEqual(errors, [], entry.slug)
      if (process.env.REFLOW_SCREENSHOT_DIR && ['button', 'skill'].includes(entry.slug)) {
        await page.screenshot({
          path: join(process.env.REFLOW_SCREENSHOT_DIR, `reflow-${entry.slug}-${layout.width}.png`),
          fullPage: false,
          animations: 'disabled',
        })
      }
    }
    assert.equal(overflow.length, 0, overflow.join('\n'))
  })
}
