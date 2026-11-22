import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { heldDurations, holdMotion, releaseMotion, seekMotion } from './motion.ts'
import { open, showcaseServer } from './showcase-router.ts'

it('slides a bottom drawer up to rest on the edge and closes it with a drag', async (t) => {
  const page = await t.serve(showcaseServer)
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
  // The drag stays on the panel: its content does not inherit it, so a move
  // restyles the panel alone, while the backdrop still lightens in step.
  const spread = await panel.evaluate((node) => ({
    content: getComputedStyle(node.querySelector('.rf-drawer-header')!).getPropertyValue(
      '--rf-drawer-drag',
    ),
    lighter: Number(getComputedStyle(node, '::backdrop').opacity) < 1,
  }))
  assert.deepEqual(spread, { content: '0px', lighter: true })
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 2 + height * 0.45, { steps: 5 })
  await page.mouse.up()
  await expect(panel).toBeHidden()
  await expect(trigger).toBeFocused()
})

it('rests side drawers against their edge at 400px wide', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 800 })
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
    const page = await t.serve(showcaseServer)
    await page.setViewportSize({ width: 1280, height: 800 })
    await open(page, '/docs/drawer', { motion: true })
    const trigger = page.locator('#sides').getByRole('button', { name: button, exact: true })
    const dialog = page.getByRole('dialog', { name: title })
    // A closing dialog leaves the accessibility tree, so the panel is marked once open.
    const panel = page.locator('[data-test-panel]')
    // How much of the panel is on screen, and how dark the backdrop is.
    const measure = () =>
      panel.evaluate((node, side) => {
        const box = node.getBoundingClientRect()
        const { clientWidth, clientHeight } = document.documentElement
        const shown =
          side === 'bottom'
            ? (clientHeight - box.top) / box.height
            : side === 'top'
              ? box.bottom / box.height
              : side === 'right'
                ? (clientWidth - box.left) / box.width
                : box.right / box.width
        return {
          shown: Math.max(0, Math.min(1, shown)),
          shade: Number(getComputedStyle(node, '::backdrop').opacity),
        }
      }, side)
    // The panel and its backdrop run 500ms together; seek both through it.
    const frames = async (points: number[]) => {
      await seekMotion(panel, 0)
      // The panel's slide, its backdrop's fade, and their stay in the top layer.
      const durations = await heldDurations(panel)
      assert.deepEqual(new Set(durations), new Set([500]), `durations: ${durations}`)
      const frames = []
      for (const progress of points) {
        await seekMotion(panel, progress)
        frames.push(await measure())
      }
      for (const frame of frames)
        assert.ok(Math.abs(frame.shown - frame.shade) < 0.15, `in step: ${JSON.stringify(frames)}`)
      return frames
    }

    await holdMotion(page)
    await trigger.click()
    await dialog.evaluate((node) => node.setAttribute('data-test-panel', ''))
    const opening = await frames([0, 0.25, 0.5, 0.75, 1])
    assert.ok(opening[0]!.shown < 0.01 && opening[4]!.shown > 0.99, JSON.stringify(opening))
    // A steep ease out: most of the way in after a quarter, then settling.
    assert.ok(opening[1]!.shown > 0.6 && opening[1]!.shown < 0.9, JSON.stringify(opening))
    assert.ok(
      opening[2]!.shown > opening[1]!.shown && opening[3]!.shown < 1,
      JSON.stringify(opening),
    )
    await releaseMotion(page)
    await expect.poll(measure).toEqual({ shown: 1, shade: 1 })

    await holdMotion(page)
    await page.keyboard.press('Escape')
    // At its end the closed panel leaves the page, so the last point is that.
    const closing = await frames([0, 0.25, 0.5, 0.75])
    assert.ok(closing[0]!.shown > 0.99 && closing[3]!.shown < 0.05, JSON.stringify(closing))
    assert.ok(closing[1]!.shown > 0.1 && closing[1]!.shown < 0.4, JSON.stringify(closing))
    await seekMotion(panel, 1)
    await expect(panel).toBeHidden()
    await releaseMotion(page)
  })
}

it('rests a drawer at its snap points and scales the page back while it is open', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 800 })
  // Scaling the page back is motion, so reduced motion would turn it off.
  await open(page, '/docs/drawer', { motion: true })
  await page.locator('#snap-points').getByRole('button', { name: 'Route', exact: true }).click()
  const panel = page.getByRole('dialog', { name: 'Lisbon to Porto' })
  await expect(panel).toBeVisible()
  const top = () => panel.evaluate((node) => Math.round(node.getBoundingClientRect().top))
  // As tall as 90% of the screen, resting with 40% of it showing.
  assert.equal(Math.round((await panel.boundingBox())!.height), 720)
  await expect.poll(top).toBe(480)
  const background = page.locator('[data-rf-drawer-background]')
  await expect.poll(() => background.evaluate((node) => getComputedStyle(node).scale)).toBe('0.94')
  // Below the top point the content does not scroll.
  assert.equal(await panel.evaluate((node) => getComputedStyle(node).overflowY), 'hidden')

  const handle = panel.getByRole('button', { name: 'Expand drawer' })
  await handle.click()
  await expect.poll(top).toBe(80)
  await expect(panel.getByRole('button', { name: 'Collapse drawer' })).toBeFocused()
  assert.equal(await panel.evaluate((node) => getComputedStyle(node).overflowY), 'auto')

  await page.keyboard.press('ArrowDown')
  await expect.poll(top).toBe(480)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect.poll(() => background.evaluate((node) => getComputedStyle(node).scale)).toBe('none')
  await expect(page.getByRole('button', { name: 'Route', exact: true })).toBeFocused()
})

it('steps a drawer back while another opens in front of it', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 800 })
  await open(page, '/docs/drawer', { motion: true })
  await page.locator('#nested').getByRole('button', { name: 'Filters', exact: true }).click()
  const outer = page.getByRole('dialog', { name: 'Filters' })
  await expect(outer).toBeVisible()
  await outer.getByRole('button', { name: 'Choose a color' }).click()
  const inner = page.getByRole('dialog', { name: 'Color' })
  await expect(inner).toBeVisible()
  await expect.poll(() => outer.evaluate((node) => getComputedStyle(node).scale)).toBe('0.96')
  await expect
    .poll(() => outer.evaluate((node) => getComputedStyle(node).translate))
    .toBe('0px -12px')
  await page.keyboard.press('Escape')
  await expect(inner).toBeHidden()
  await expect(outer).toBeVisible()
  await expect.poll(() => outer.evaluate((node) => getComputedStyle(node).scale)).toBe('none')
  await expect(outer.getByRole('button', { name: 'Choose a color' })).toBeFocused()
})
