import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

it('applies the sharp shape to every position marker in the gallery preview', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/?shape=sharp')
  const markers = page.locator('[data-component="toaster"] .example-toaster-screen label')
  await expect(markers).toHaveCount(6)
  const radii = await markers.evaluateAll((labels) =>
    labels.map((label) => parseFloat(getComputedStyle(label).borderTopLeftRadius)),
  )
  assert.ok(
    radii.every((radius) => radius <= 1),
    `Sharp preview radii: ${radii.join(', ')}`,
  )
})

it('piles toasts on QueuedStack’s values and spreads them a gap apart when pointed at', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/docs/toaster')
  const status = page.locator('#status')
  for (const name of ['Success', 'Info', 'Warning'])
    await status.getByRole('button', { name, exact: true }).click()
  const toasts = page.locator('.rf-toast:not([data-removed])')
  await expect(toasts).toHaveCount(3)
  const pose = () =>
    toasts.evaluateAll((items) =>
      items.map((item) => {
        const style = getComputedStyle(item)
        return {
          translate: style.translate,
          scale: style.scale,
          height: Math.round(item.getBoundingClientRect().height),
        }
      }),
    )
  // Piled: the newest in front, each one behind 6px higher and 3.5% narrower.
  await expect
    .poll(async () => (await pose()).map((item) => item.translate))
    .toEqual(['0px', '0px -6px', '0px -12px'])
  assert.deepEqual(
    (await pose()).map((item) => item.scale),
    ['1', '0.965 1', '0.93 1'],
  )
  const list = page.locator('.rf-toaster')
  const corner = await list.evaluate((node) => {
    const box = node.getBoundingClientRect()
    const { clientWidth, clientHeight } = document.documentElement
    return { right: clientWidth - box.right, bottom: clientHeight - box.bottom, width: box.width }
  })
  assert.deepEqual(corner, { right: 24, bottom: 24, width: 356 })
  // The same tokens drive QueuedStack.
  const tokens = await list.evaluate((node) =>
    ['--rf-stack-peek', '--rf-stack-gap', '--rf-stack-scale-step'].map((name) =>
      parseFloat(getComputedStyle(node).getPropertyValue(name)),
    ),
  )
  assert.deepEqual(tokens, [6, 5, 0.035])

  await toasts.first().hover()
  await expect(list).toHaveAttribute('data-expanded')
  const front = (await pose())[0]!.height
  await expect.poll(async () => (await pose())[1]!.translate).toBe(`0px -${front + 5}px`)
  assert.equal((await pose())[1]!.scale, '1')
})

it('moves to each of the six positions and slides a swiped toast away', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/docs/toaster')
  await page.locator('#position').getByRole('button', { name: 'top-center', exact: true }).click()
  const list = page.locator('.rf-toaster')
  await expect(list).toHaveAttribute('data-position', 'top-center')
  const toast = page.locator('.rf-toast:not([data-removed])', { hasText: 'Toast at top-center' })
  await toast.waitFor()
  const box = await list.evaluate((node) => {
    const rect = node.getBoundingClientRect()
    return {
      top: rect.top,
      center:
        Math.round(rect.left + rect.width / 2) ===
        Math.round(document.documentElement.clientWidth / 2),
    }
  })
  assert.deepEqual(box, { top: 24, center: true })

  // At the top, an upward swipe past the threshold dismisses it.
  const rect = (await toast.boundingBox())!
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
  await page.mouse.down()
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2 - 30, { steps: 4 })
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2 - 70, { steps: 4 })
  await page.mouse.up()
  await expect(page.locator('.rf-toast', { hasText: 'Toast at top-center' })).toHaveCount(0)
})

it('reaches the newest toast with Alt+T and dismisses it with Escape', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/toaster')
  const archive = page.locator('#action').getByRole('button', { name: 'Archive', exact: true })
  await archive.click()
  const toast = page.locator('.rf-toast:not([data-removed])', { hasText: 'Conversation archived' })
  await toast.waitFor()
  await expect(page.getByRole('region', { name: 'Notifications' })).toHaveAttribute(
    'aria-keyshortcuts',
    'Alt+T',
  )
  await page.keyboard.press('Alt+KeyT')
  await expect(toast).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(toast.getByRole('button', { name: 'Undo' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('.rf-toast', { hasText: 'Conversation archived' })).toHaveCount(0)
  await expect(archive).toBeFocused()
})
