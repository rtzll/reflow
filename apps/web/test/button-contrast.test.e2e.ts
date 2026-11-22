import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { showcaseServer, open } from './showcase-router.ts'

it('keeps the install button label legible while hovered in both themes', async (t) => {
  const page = await t.serve(showcaseServer)
  for (const theme of ['light', 'dark']) {
    await open(page, `/docs?theme=${theme}`)
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
  const page = await t.serve(showcaseServer)
  for (const theme of ['light', 'dark']) {
    await open(page, `/docs/banner?theme=${theme}`)
    const link = page.getByRole('button', { name: 'Open the docs', exact: true }).first()
    const { color, fill } = await link.evaluate((element) => ({
      color: getComputedStyle(element).color,
      fill: getComputedStyle(element, '::before').backgroundColor,
    }))
    assert.ok(color !== fill, `${theme}: ${color} on ${fill}`)
  }
})

it('presses in slightly while held, and stays still in reduced motion', async (t) => {
  const page = await t.serve(showcaseServer)
  const pressed = async () => {
    const button = page.locator('main .rf-button:not(:disabled):visible').first()
    const box = await button.boundingBox()
    assert.ok(box)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    const scale = await button.evaluate(async (element) => {
      await Promise.all(
        element.getAnimations().map((animation) => animation.finished.catch(() => {})),
      )
      return getComputedStyle(element).scale
    })
    await page.mouse.up()
    return scale
  }
  await open(page, '/docs/button', { motion: true })
  assert.equal(await pressed(), '0.97')
  await open(page, '/docs/button')
  assert.equal(await pressed(), 'none')
})
