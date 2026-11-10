import { expect, type Locator } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

// Which slide rests at the start of the viewport, or -1 between slides.
const resting = (viewport: Locator) =>
  viewport.evaluate((node) =>
    Array.from(node.querySelectorAll<HTMLElement>('.rf-carousel-slide')).findIndex(
      (slide) => Math.abs(slide.offsetLeft - node.scrollLeft) < 2,
    ),
  )

it('snaps to the next slide after a mouse drag, and keeps a short drag in place', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/carousel')
  const example = page.locator('#basic')
  const viewport = example.locator('.rf-carousel-viewport')
  await viewport.scrollIntoViewIfNeeded()
  const box = (await viewport.boundingBox())!
  const y = box.y + box.height / 2

  // A slow, short drag springs back to the same slide.
  await page.mouse.move(box.x + box.width * 0.6, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.5, y, { steps: 10 })
  await page.waitForTimeout(150)
  await page.mouse.up()
  await expect.poll(() => resting(viewport)).toBe(0)

  // Past half a slide, it lands on the next one.
  await page.mouse.move(box.x + box.width * 0.8, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 12 })
  await page.mouse.up()
  await expect.poll(() => resting(viewport)).toBe(1)
  await expect(example.getByRole('button', { name: 'Show Shared hover' })).toHaveAttribute(
    'aria-current',
    'true',
  )
  await expect(example.getByRole('group', { name: 'Shared hover, 2 of 4' })).toHaveAttribute(
    'data-current',
    'true',
  )
  // Text in slides stays selectable.
  assert.equal(
    await example
      .locator('.rf-carousel-slide')
      .first()
      .evaluate((node) => getComputedStyle(node).userSelect),
    'auto',
  )
})

it('scrolls with the keyboard and its buttons without moving the page', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/carousel')
  const example = page.locator('#basic')
  const viewport = example.locator('.rf-carousel-viewport')
  await viewport.scrollIntoViewIfNeeded()
  const pageTop = await page.evaluate(() => scrollY)

  await example.getByRole('button', { name: 'Next slide' }).click()
  await expect.poll(() => resting(viewport)).toBe(1)
  await example.getByRole('button', { name: 'Show Yours to theme' }).click()
  await expect.poll(() => resting(viewport)).toBe(3)
  await expect(example.getByRole('button', { name: 'Next slide' })).toBeDisabled()
  assert.equal(await page.evaluate(() => scrollY), pageTop, 'the page stays where it was')

  // Arrow keys scroll the focused viewport natively, and the dots follow.
  await viewport.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(example.getByRole('button', { name: 'Show Keyboard care' })).toHaveAttribute(
    'aria-current',
    'true',
  )
})

it('does not follow a link a drag ends on, but follows a click', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/carousel')
  const example = page.locator('#linked-slides')
  const viewport = example.locator('.rf-carousel-viewport')
  await viewport.scrollIntoViewIfNeeded()
  const box = (await viewport.boundingBox())!
  const y = box.y + box.height / 2
  await page.mouse.move(box.x + box.width * 0.8, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 12 })
  await page.mouse.up()
  await expect.poll(() => resting(viewport)).toBe(1)
  assert.equal(new URL(page.url()).hash, '')

  await example.getByRole('link', { name: /Shared hover/ }).click()
  await expect.poll(() => new URL(page.url()).hash).toBe('#Shared%20hover')
})

it('autoplays through its dots, pauses while pointed at, and stops with its button', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/carousel', { motion: true })
  const example = page.locator('#autoplay')
  const viewport = example.locator('.rf-carousel-viewport')
  await viewport.scrollIntoViewIfNeeded()
  await page.mouse.move(5, 5)
  await expect(viewport).toHaveAttribute('aria-live', 'off')
  await expect(example.getByRole('button', { name: 'Show Shared hover' })).toHaveAttribute(
    'aria-current',
    'true',
    { timeout: 5000 },
  )
  await expect.poll(() => resting(viewport), { timeout: 3000 }).toBe(1)

  await viewport.hover()
  await expect(example.locator('.rf-carousel-dots[data-rf-paused]')).toHaveCount(1)
  await expect(viewport).toHaveAttribute('aria-live', 'polite')

  const pause = example.getByRole('button', { name: 'Pause slides' })
  await pause.click()
  await page.mouse.move(5, 5)
  await page.locator('h1').first().click()
  await expect(example.getByRole('button', { name: 'Play slides' })).toBeVisible()
  await expect(example.locator('.rf-carousel-dots[data-rf-paused]')).toHaveCount(1)
})

it('counts only the stops it can reach when several slides are in view', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/carousel')
  const example = page.locator('#several-in-view')
  await example.scrollIntoViewIfNeeded()
  // Six slides, three in view: four places to rest.
  await expect(example.locator('.rf-carousel-dots button')).toHaveCount(4)
  await example.getByRole('button', { name: 'Show Yours to theme' }).click()
  await expect(example.getByRole('button', { name: 'Next slide' })).toBeDisabled()
  // The last three slides are all in view at the end.
  await expect(example.getByRole('group', { name: 'Small by default, 6 of 6' })).toBeInViewport()
  await example.getByRole('button', { name: 'Previous slide' }).click()
  await expect(example.getByRole('button', { name: 'Show Keyboard care' })).toHaveAttribute(
    'aria-current',
    'true',
  )
})

it('works the same in a right-to-left page', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/carousel')
  const example = page.locator('#basic')
  const viewport = example.locator('.rf-carousel-viewport')
  await viewport.scrollIntoViewIfNeeded()
  await example.evaluate((node) => node.setAttribute('dir', 'rtl'))
  await viewport.evaluate((node) => node.scrollTo({ left: 0, behavior: 'instant' }))
  assert.equal(await viewport.evaluate((node) => getComputedStyle(node).direction), 'rtl')
  // In RTL a slide rests with its right edge on the viewport's.
  const restingRtl = () =>
    viewport.evaluate((node) => {
      const right = node.getBoundingClientRect().right
      return Array.from(node.querySelectorAll<HTMLElement>('.rf-carousel-slide')).findIndex(
        (slide) => Math.abs(slide.getBoundingClientRect().right - right) < 2,
      )
    })
  await expect.poll(restingRtl).toBe(0)
  await example.getByRole('button', { name: 'Next slide' }).click()
  await expect.poll(restingRtl).toBe(1)
  await example.getByRole('button', { name: 'Show Yours to theme' }).click()
  await expect.poll(restingRtl).toBe(3)
  await expect(example.getByRole('button', { name: 'Next slide' })).toBeDisabled()

  // Scrolling by hand moves the dots too.
  await viewport.evaluate((node) => node.scrollTo({ left: 0, behavior: 'instant' }))
  await expect(example.getByRole('button', { name: 'Show Fluid motion' })).toHaveAttribute(
    'aria-current',
    'true',
  )
})
