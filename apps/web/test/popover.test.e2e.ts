import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router, waitForShowcase } from './showcase-router.ts'

it('anchors the panel 8px from its trigger on the chosen side', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/popover')
  await waitForShowcase(page)
  const gap = async (example: string, name: string) => {
    const trigger = page.locator(`#${example}`).getByRole('button', { name, exact: true })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    const panel = page.locator(`#${await trigger.getAttribute('aria-controls')}`)
    await expect(panel).toBeVisible()
    // Focus moves in once the panel has opened.
    await expect
      .poll(() => panel.evaluate((node) => node.contains(document.activeElement)))
      .toBe(true)
    const result = await page.evaluate(
      ([t, p]) => {
        const a = t!.getBoundingClientRect()
        const b = p!.getBoundingClientRect()
        return {
          placement: p!.getAttribute('data-anchor-placement'),
          below: Math.round(b.top - a.bottom),
          left: Math.round(a.left - b.right),
          centered: Math.round(b.left + b.width / 2 - (a.left + a.width / 2)),
          focusInside: p!.contains(document.activeElement),
        }
      },
      [await trigger.elementHandle(), await panel.elementHandle()],
    )
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(trigger).toBeFocused()
    return result
  }
  const below = await gap('basic', 'Dimensions')
  assert.equal(below.placement, 'bottom')
  assert.equal(below.below, 8)
  assert.ok(Math.abs(below.centered) <= 1)
  assert.ok(below.focusInside)

  const left = await gap('placement', 'left')
  assert.equal(left.placement, 'left')
  assert.equal(left.left, 8)
})

it('shares the menu surfaces’ motion and closes on an outside click', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/popover')
  await waitForShowcase(page)
  const trigger = page.locator('#basic').getByRole('button', { name: 'Dimensions', exact: true })
  await trigger.click()
  const panel = page.locator('#basic .rf-popover-surface')
  await expect(panel).toBeVisible()
  // Settled, the panel rests at full size; its rest pose is the menus' drop and squash.
  await expect.poll(() => panel.evaluate((node) => getComputedStyle(node).transform)).toBe('none')
  assert.match(
    await panel.evaluate((node) =>
      getComputedStyle(node).getPropertyValue('--rf-menu-rest-transform').trim(),
    ),
    /^translateY\(-4px\) scaleY\(0?\.96\)$/,
  )
  await page.mouse.click(5, 5)
  await expect(panel).toBeHidden()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

it('leaves no closed panel in the way of clicks', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/popover')
  await waitForShowcase(page)
  const hits = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll('.rf-popover-surface'), (panel) => ({
        shown: getComputedStyle(panel).display !== 'none',
      })).filter((panel) => panel.shown).length,
  )
  assert.equal(hits, 0)
})
