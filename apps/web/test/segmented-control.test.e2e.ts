import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

// The track's geometry, and the boxes of the thumb and the checked segment.
function measure(control: Element) {
  const track = control.querySelector<HTMLElement>('.rf-segmented-track')!
  const thumb = track.querySelector<HTMLElement>(':scope > .rf-segmented-thumb')!
  const checked = track.querySelector('input:checked')!.closest('label')!
  const box = (node: Element) => {
    const rect = node.getBoundingClientRect()
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
    }
  }
  const style = getComputedStyle(track)
  return {
    track: box(track),
    thumb: box(thumb),
    checked: box(checked),
    padding: parseFloat(style.paddingTop),
    trackRadius: parseFloat(style.borderTopLeftRadius),
    thumbRadius: parseFloat(getComputedStyle(thumb).borderTopLeftRadius),
  }
}

it('sits on the size ladder with a concentric thumb on the checked segment', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/segmented-control')
  for (const [example, height, segment, padding] of [
    ['basic', 36, 28, 4],
    ['compact', 28, 24, 2],
  ] as const) {
    const geometry = await page.locator(`#${example} .rf-segmented`).evaluate(measure)
    assert.equal(geometry.track.h, height, example)
    assert.equal(geometry.checked.h, segment, example)
    assert.equal(geometry.padding, padding, example)
    assert.deepEqual(geometry.thumb, geometry.checked, example)
    assert.equal(geometry.trackRadius, geometry.thumbRadius + padding, example)
  }
})

it('glides the thumb, follows arrow keys and squeezes while pressed', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/segmented-control')
  const control = page.locator('#basic .rf-segmented')
  const segment = (name: string) => control.locator('label', { hasText: name })
  const offset = () =>
    control.evaluate((node) => {
      const thumb = node.querySelector('.rf-segmented-thumb')!.getBoundingClientRect()
      const checked = node.querySelector('input:checked')!.closest('label')!.getBoundingClientRect()
      return Math.abs(thumb.x - checked.x) + Math.abs(thumb.width - checked.width)
    })

  await segment('Week').click()
  await expect(control.locator('input[value="week"]')).toBeChecked()
  await expect.poll(offset).toBeLessThan(1)

  // Native radios: the arrow keys move the selection, and the shared ring follows.
  await page.keyboard.press('ArrowRight')
  await expect(control.locator('input[value="month"]')).toBeChecked()
  await expect(control.locator('.rf-focus-ring')).toHaveAttribute('data-visible', '')
  await expect.poll(offset).toBeLessThan(1)

  // Pressing a segment squeezes the thumb; letting go springs it back.
  const box = (await segment('Year').boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  const thumb = control.locator('.rf-segmented-thumb')
  await expect.poll(() => thumb.evaluate((node) => getComputedStyle(node).scale)).toBe('0.97')
  await page.mouse.up()
  await expect.poll(() => thumb.evaluate((node) => getComputedStyle(node).scale)).toBe('none')
  await expect(control.locator('input[value="year"]')).toBeChecked()
})

it('fills its container with equal segments and names icon-only segments in a tooltip', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/segmented-control')
  const fill = await page.locator('#fill-width .rf-segmented').evaluate((control) => {
    const widths = Array.from(control.querySelectorAll('label'), (label) =>
      Math.round(label.getBoundingClientRect().width),
    )
    const parent = control.parentElement!.getBoundingClientRect().width
    return {
      equal: Math.max(...widths) - Math.min(...widths) <= 1,
      fills: Math.abs(control.getBoundingClientRect().width - parent) <= 1,
    }
  })
  assert.deepEqual(fill, { equal: true, fills: true })

  const dark = page.locator('#icon-only .rf-segmented label', {
    has: page.locator('input[value="dark"]'),
  })
  await dark.hover()
  await expect(page.locator('.rf-tooltip[data-open]')).toHaveText('Dark')
  assert.equal(await page.getByRole('radio', { name: 'Dark', exact: true }).count(), 1)
})
