import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

it('slides a bottom drawer up to rest on the edge and closes it with a drag', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 800 })
  await open(page, '/docs/drawer')
  const trigger = page.locator('#basic').getByRole('button', { name: 'Filters', exact: true })
  await trigger.click()
  const panel = page.getByRole('dialog', { name: 'Filters' })
  await expect(panel).toBeVisible()
  await expect.poll(() => panel.evaluate((node) => getComputedStyle(node).translate)).toBe('0px')
  const rest = await panel.evaluate((node) => {
    const box = node.getBoundingClientRect()
    return {
      bottom: Math.round(document.documentElement.clientHeight - box.bottom),
      left: box.left,
      handle: Boolean(node.querySelector('.rf-drawer-handle')),
      // The content keeps to a 560px column on a wide screen.
      column: Math.round(node.querySelector('.rf-drawer-header')!.getBoundingClientRect().width),
    }
  })
  assert.deepEqual(rest, { bottom: 0, left: 0, handle: true, column: 560 })

  // Dragging the handle down past a quarter of the panel closes it.
  const handle = (await panel.locator('.rf-drawer-handle').boundingBox())!
  const height = (await panel.boundingBox())!.height
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 2)
  await page.mouse.down()
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 2 + height * 0.2, { steps: 5 })
  await expect(panel).toHaveAttribute('data-dragging', '')
  const dragged = await panel.evaluate((node) => getComputedStyle(node).translate)
  assert.match(dragged, /^0px \d+px$/)
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 2 + height * 0.45, { steps: 5 })
  await page.mouse.up()
  await expect(panel).toBeHidden()
  await expect(trigger).toBeFocused()
})

it('rests side drawers against their edge at 400px wide', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, '/docs/drawer')
  for (const [name, title] of [
    ['Right', 'Details'],
    ['Left', 'Mailboxes'],
  ] as const) {
    await page.locator('#sides').getByRole('button', { name, exact: true }).click()
    const panel = page.getByRole('dialog', { name: title })
    await expect(panel).toBeVisible()
    const box = await panel.evaluate((node, right) => {
      const rect = node.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
        edge: right ? document.documentElement.clientWidth - rect.right : rect.left,
      }
    }, name === 'Right')
    expect(box).toEqual({ width: 400, height: 800, edge: 0 })
    await expect(panel.getByRole('button', { name: 'Close drawer' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
  }
})

for (const [side, button, title] of [
  ['bottom', 'Bottom', 'Filters'],
  ['top', 'Top', 'Announcement'],
  ['right', 'Right', 'Details'],
  ['left', 'Left', 'Mailboxes'],
] as const) {
  it(`slides a ${side} drawer in and out over 500ms, the backdrop darkening in step`, async (t) => {
    const page = await t.serve(await createTestServer(router.fetch))
    await page.setViewportSize({ width: 1280, height: 800 })
    await open(page, '/docs/drawer')
    const trigger = page.locator('#sides').getByRole('button', { name: button, exact: true })
    const panel = page.getByRole('dialog', { name: title })
    // Every frame: how much of the panel is on screen, and how dark the backdrop is.
    const sample = () =>
      panel.evaluate(async (node, side) => {
        const frames: { shown: number; shade: number; time: number }[] = []
        const start = performance.now()
        const { clientWidth, clientHeight } = document.documentElement
        while (performance.now() - start < 800) {
          const box = node.getBoundingClientRect()
          const shown =
            side === 'bottom'
              ? (clientHeight - box.top) / box.height
              : side === 'top'
                ? box.bottom / box.height
                : side === 'right'
                  ? (clientWidth - box.left) / box.width
                  : box.right / box.width
          frames.push({
            shown: Math.max(0, Math.min(1, shown)),
            shade: Number(getComputedStyle(node, '::backdrop').opacity),
            time: Math.round(performance.now() - start),
          })
          await new Promise((resolve) => requestAnimationFrame(resolve))
        }
        return frames
      }, side)
    const check = (frames: Awaited<ReturnType<typeof sample>>) => {
      const moving = frames.filter((frame) => frame.shown > 0.1 && frame.shown < 0.9)
      assert.ok(moving.length >= 3, `slides over several frames: ${JSON.stringify(frames)}`)
      for (const frame of moving)
        assert.ok(Math.abs(frame.shown - frame.shade) < 0.15, `in step: ${JSON.stringify(frame)}`)
    }

    await trigger.click()
    const opening = await sample()
    check(opening)
    // Still arriving at 120ms, settled well before 800ms.
    assert.ok(opening.find((frame) => frame.time >= 120)!.shown < 0.97)
    assert.ok(opening.at(-1)!.shown > 0.99 && opening.at(-1)!.shade > 0.99)

    await page.keyboard.press('Escape')
    check(await sample())
    await expect(panel).toBeHidden()
  })
}
