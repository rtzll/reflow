import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('uses the density selected in the focused demo and serves its examples in the docs', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/demo?c=markdown')
  const stage = page.locator('.site-demo-stage')
  const note = stage.locator('[data-slot="markdown"]')
  await expect(note.getByRole('heading', { name: 'On the last ferry' })).toBeVisible()
  const initialSize = await note.evaluate((element) => getComputedStyle(element).fontSize)
  await page.locator('summary[aria-label="Customize Markdown"]').click()
  await page.getByLabel('Size', { exact: true }).selectOption('compact')
  await expect(note).toHaveAttribute('data-size', 'compact')
  expect(await note.evaluate((element) => getComputedStyle(element).fontSize)).not.toBe(initialSize)

  await page.route('**/*.js', (route) => route.abort())
  await open(page, '/docs/markdown', { hydrate: false })
  await expect(
    page.locator('#pipe-table').getByRole('columnheader', { name: 'Frame' }),
  ).toBeVisible()
  await expect(page.locator('#fenced-code .rf-markdown pre code')).toContainText('18:40')
})

it('shows a same-site image inline within the column and keeps a remote one as a link', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, '/docs/markdown')
  const section = page.locator('#images')
  const image = section.getByRole('img', { name: 'Reflow component preview' })
  await expect(image).toBeVisible()
  await expect
    .poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
    .toBe(true)
  const fits = await image.evaluate((node) => {
    const box = node.getBoundingClientRect()
    const column = node.closest('.rf-markdown')!.getBoundingClientRect()
    return box.width <= column.width + 0.5 && box.height <= 480 && getComputedStyle(node).display
  })
  assert.equal(fits, 'block')
  await expect(section.getByRole('link', { name: 'Harbor at dawn' })).toHaveAttribute(
    'href',
    'https://images.example.com/harbor.jpg',
  )
  assert.equal(await section.locator('img[src^="https://images.example.com"]').count(), 0)
})
