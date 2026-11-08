import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router } from './showcase-router.ts'

it('keeps the install button label legible while hovered in both themes', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  for (const theme of ['light', 'dark']) {
    await page.goto(`/docs?theme=${theme}`)
    const button = page.getByRole('button', { name: 'Copy install prompt', exact: true }).first()
    const color = await button.evaluate((element) => getComputedStyle(element).color)
    await button.hover()
    const hoveredColor = await button.evaluate(async (element) => {
      await Promise.all(
        element.getAnimations().map((animation) => animation.finished.catch(() => {})),
      )
      return getComputedStyle(element).color
    })
    assert.equal(hoveredColor, color, theme)
  }
})

it('keeps the primary banner action label distinct from its fill in both themes', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  for (const theme of ['light', 'dark']) {
    await page.goto(`/docs/banner?theme=${theme}`)
    const link = page.getByRole('button', { name: 'Open the docs', exact: true }).first()
    const { color, fill } = await link.evaluate((element) => ({
      color: getComputedStyle(element).color,
      fill: getComputedStyle(element, '::before').backgroundColor,
    }))
    assert.ok(color !== fill, `${theme}: ${color} on ${fill}`)
  }
})
