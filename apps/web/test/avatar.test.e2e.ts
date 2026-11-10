import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router, waitForShowcase } from './showcase-router.ts'

it('gives neighbours in a group different colours, overlaps them, and spreads them on hover', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/avatar')
  await waitForShowcase(page)
  const group = page.getByRole('list', { name: 'Editors' })
  await group.scrollIntoViewIfNeeded()
  const avatars = group.getByRole('img')
  await expect(avatars).toHaveCount(4)
  const colours = await avatars.evaluateAll((nodes) =>
    nodes.slice(0, 3).map((node) => getComputedStyle(node).backgroundColor),
  )
  assert.equal(new Set(colours).size, 3, `three different colours: ${colours.join(' ')}`)
  await expect(avatars.last()).toHaveAccessibleName(
    '3 more: Katherine Johnson, Edsger Dijkstra, Barbara Liskov',
  )

  const gaps = () =>
    avatars.evaluateAll((nodes) =>
      nodes
        .slice(1)
        .map((node, index) =>
          Math.round(
            node.getBoundingClientRect().left - nodes[index]!.getBoundingClientRect().right,
          ),
        ),
    )
  // A quarter of 32px overlaps.
  assert.deepEqual(await gaps(), [-8, -8, -8])
  await group.hover()
  await expect.poll(gaps).toEqual([2, 2, 2])

  // Each avatar names itself in a tooltip.
  await avatars.nth(1).hover()
  await expect(page.getByRole('tooltip', { name: 'Grace Hopper' })).toBeVisible()
})

it('falls back to initials for a failed image and shows the image that loads', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/avatar')
  await waitForShowcase(page)
  const row = page.locator('#images-and-initials .doc-avatar-row')
  const broken = row.getByRole('img', { name: 'Broken Image' })
  await expect(broken).toHaveAttribute('data-image', 'error')
  await expect(broken.locator('img')).toBeHidden()
  await expect(broken.locator('.rf-avatar-initials')).toHaveText('BI')
  const photo = row.getByRole('img', { name: 'Alex Morgan' })
  await expect(photo.locator('img')).toBeVisible()
  assert.ok(await photo.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth > 0))
})
