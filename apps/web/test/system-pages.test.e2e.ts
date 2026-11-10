import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { expect } from 'playwright/test'
import { open, router } from './showcase-router.ts'

it('fits the size toolbar controls and height guides without overlap', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/docs/sizes')

  for (const [density, height, gap] of [
    ['default', 36, 8],
    ['compact', 28, 4],
  ] as const) {
    const row = page.locator(`.system-size-row[data-density="${density}"]`)
    const geometry = await row.evaluate((node) => {
      const rect = (selector: string) => node.querySelector(selector)!.getBoundingClientRect()
      const controls = [
        '.rf-tabs',
        '.system-size-search',
        '.rf-select .rf-picker-trigger',
        'button[aria-label="Filter"]',
        '.system-size-actions > .rf-button:last-child',
      ].map(rect)
      return {
        heights: controls.map((box) => box.height),
        gaps: controls.slice(1).map((box, index) => box.left - controls[index].right),
        guide: rect('.system-size-guide > svg').height,
      }
    })
    assert.deepEqual(geometry.heights, Array(5).fill(height))
    assert.ok(geometry.gaps.every((value) => value >= gap - 0.5))
    assert.equal(geometry.guide, height)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  const row = page.locator('.system-size-row[data-density="default"]')
  const search = row.getByRole('textbox', { name: 'default search' })
  await expect(row.locator('.system-size-guide')).toBeHidden()
  await expect(search).toBeHidden()
  await row.getByRole('button', { name: 'Filter' }).click()
  await expect(search).toBeFocused()
  await search.fill('Website')
  await expect(row.getByRole('status')).toHaveText('Website')
})

it('applies region density to both the Sizes toolbar and its inline sort menu', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/docs/sizes')
  const demo = page.locator('.system-density-demo')
  const header = demo.getByRole('tablist', { name: 'Region density' })
  const menu = demo.locator('.rf-dropdown-surface[data-inline]')
  await expect(header.getByRole('tab', { name: 'Compact' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(menu.locator('.rf-menu-item')).toHaveText(['Last updated', 'Created', 'Name'])
  const heights = () =>
    demo
      .locator('.system-density-toolbar > button, .rf-menu-item')
      .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().height))
  assert.deepEqual(await heights(), Array(6).fill(28))
  await header.getByRole('tab', { name: 'Default' }).click()
  await expect.poll(heights).toEqual(Array(6).fill(36))
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(demo.locator('.system-density-callout')).toBeHidden()
  await expect(menu).toBeVisible()
})

it('aligns the three hover axes and keeps the card grid interactive', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/docs/fluid-hover')

  const axes = page.locator('.system-axes')
  await expect(axes.getByRole('tab', { name: 'Settings' })).toBeVisible()
  const measure = () =>
    axes.evaluate((demo) => {
      const { left, right } = demo.getBoundingClientRect()
      const list = demo.querySelector('.system-hover-list')!.getBoundingClientRect()
      const cards = [...demo.querySelectorAll('.rf-card')]
      const first = cards[0].getBoundingClientRect()
      const second = cards[1].getBoundingClientRect()
      const heading = cards[0].querySelector('.rf-card-title')!.getBoundingClientRect()
      return {
        listInset: Math.round(list.left - left),
        gridInset: Math.round(first.left - left),
        gridGap: Math.round(second.left - first.right),
        titleInset: Math.round(heading.left - first.left),
        fits: second.right <= right + 1,
      }
    })

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    const layout = await measure()
    assert.equal(layout.listInset, 0)
    assert.equal(layout.gridInset, 0)
    assert.equal(layout.gridGap, 8)
    assert.ok(layout.titleInset > 0 && layout.fits)
  }

  const draft = axes
    .locator('.rf-card')
    .filter({ has: page.getByRole('heading', { name: 'Drafts' }) })
  const target = draft.getByRole('button', { name: 'Drafts' })
  await target.hover()
  await expect(draft).toHaveAttribute('data-rf-hovered', '')
  await target.click()
  await expect(draft).toHaveAttribute('data-selected', 'true')
})

it('staggers the landing hero on both presets and on replay', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.addInitScript(() => {
    const animate = HTMLElement.prototype.animate
    HTMLElement.prototype.animate = function (frames, options) {
      const animation = animate.call(this, frames, options)
      if (this.parentElement?.matches('.system-reveal-hero')) {
        this.dataset.revealDelay = String(animation.effect?.getTiming().delay)
      }
      return animation
    }
  })
  await open(page, '/docs/reveal', { motion: true })

  const frame = page.locator('[data-reveal-kind="landing"]')
  const heroItems = frame.locator('.system-reveal-hero > *')
  const delays = () =>
    heroItems.evaluateAll((items) => items.map((item) => item.getAttribute('data-reveal-delay')))
  await frame.scrollIntoViewIfNeeded()
  await expect.poll(delays).toEqual(['0', '100', '200', '300', '300'])

  await frame.getByRole('tab', { name: 'Subtle' }).click()
  await expect.poll(delays).toEqual(['0', '60', '120', '180', '180'])

  const viewport = frame.getByRole('region', { name: 'landing preset example' })
  await viewport.evaluate((node) => {
    node.scrollTop = 150
    for (const item of node.querySelectorAll('[data-reveal-delay]'))
      item.removeAttribute('data-reveal-delay')
  })
  await frame.getByRole('button', { name: 'Replay' }).click()
  assert.equal(await viewport.evaluate((node) => node.scrollTop), 0)
  await expect.poll(delays).toEqual(['0', '60', '120', '180', '180'])
})

it('uses the native viewport through the custom scrollbar', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/scrollbars')
  const viewport = page.getByRole('region', { name: 'Scrollable example', exact: true }).first()
  await viewport.hover()
  const scrollbar = page
    .getByRole('scrollbar', { name: 'Scrollable example vertical scrollbar' })
    .first()
  await scrollbar.press('End')
  assert.ok(await viewport.evaluate((element) => element.scrollTop > 0))
  await scrollbar.press('Home')
  assert.equal(await viewport.evaluate((element) => element.scrollTop), 0)
})

it('follows scroll reveal progress, and holds still with reduced motion', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/reveal', { motion: true })
  const revealViewport = page.getByRole('region', { name: 'Scroll reveal preview', exact: true })
  await revealViewport.waitFor()
  await revealViewport.evaluate((element) => {
    element.scrollTop = 280
  })
  await page.waitForFunction(
    () =>
      Number(getComputedStyle(document.querySelector('.system-reveal-landing section')!).opacity) >
      0.9,
  )
  await revealViewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })

  await page.waitForFunction(
    () =>
      Number(getComputedStyle(document.querySelector('.system-reveal-landing section')!).opacity) <
      0.1,
    undefined,
    { timeout: 5000 },
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(
    await page
      .locator('.system-reveal-landing section')
      .first()
      .evaluate((element) => getComputedStyle(element).animationName),
    'none',
  )
})

it('renders editable Markdown tables and nested tasks while treating raw HTML as text', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/typography')
  const specimen = page.locator('.system-markdown-specimen')
  await specimen.getByRole('table').waitFor()
  assert.ok((await specimen.getByRole('checkbox').count()) >= 4)
  await specimen.getByRole('switch', { name: 'Edit Markdown' }).check()
  await specimen
    .getByRole('textbox', { name: 'Markdown source' })
    .fill(
      '# A new heading\n\n**Strong text** and *emphasis*.\n\n<script>window.alert(1)</script>\n\n[Unsafe](javascript:alert)',
    )
  await specimen.getByRole('heading', { name: 'A new heading' }).waitFor()
  assert.equal(await specimen.locator('strong').innerText(), 'Strong text')
  assert.equal(await specimen.locator('em').innerText(), 'emphasis')
  assert.equal(await specimen.locator('script').count(), 0)
  assert.equal(await specimen.getByRole('link', { name: 'Unsafe' }).count(), 0)
  await specimen.getByText('<script>window.alert(1)</script>', { exact: true }).waitFor()
  await specimen.getByRole('button', { name: 'Reset sample' }).click()
  await specimen.getByRole('table').waitFor()
})
