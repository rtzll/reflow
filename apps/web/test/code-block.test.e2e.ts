import { readFileSync } from 'node:fs'
import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

// The card's own source, as the file has it, less the notation comment.
function cardSource() {
  const text = readFileSync(
    new URL('../app/public/code-block-example.tsx', import.meta.url),
    'utf8',
  )
  const start = text.indexOf('export function CodeBlockCard')
  return text
    .slice(start, text.indexOf('\n}\n', start) + 2)
    .replace(/\s*\/\/ \[!code highlight\]/, '')
}

it('shows the gallery card its own source, highlighted on the server', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1440, height: 900 })
  // No script: the colours arrive with the page.
  await page.route('**/*.{js,mjs}', (route) => route.abort())
  await open(page, '/?theme=dark', { hydrate: false })
  const card = page.locator('.site-gallery [data-component="code-block"]')
  const code = card.locator('code')
  assert.equal(await code.textContent(), cardSource())
  await expect(card.locator('.rf-code-filename')).toHaveText('code-block-example.tsx')
  const highlighted = card.locator('.rf-code-line.highlighted')
  await expect(highlighted).toHaveCount(1)
  await expect(highlighted).toContainText('code={handle.props.source}')
  // Keywords take Reflow's token colour, which follows the accent.
  const colours = await card.evaluate((node) => {
    const keyword = Array.from(node.querySelectorAll<HTMLElement>('.rf-code-text span')).find(
      (span) => span.textContent === 'export',
    )!
    return {
      keyword: getComputedStyle(keyword).color,
      text: getComputedStyle(node.querySelector('.rf-code')!).color,
    }
  })
  assert.notEqual(colours.keyword, colours.text)
})

it('copies the code without its line numbers and confirms it', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, '/docs/code-block')
  const block = page.locator('#line-numbers [data-slot="code-block"]')
  await block.scrollIntoViewIfNeeded()
  const gutter = await block
    .locator('.rf-code-line')
    .first()
    .evaluate((line) => {
      const before = getComputedStyle(line, '::before')
      return { content: before.content, select: before.userSelect }
    })
  assert.match(gutter.content, /counter\(rf-code-line\)/)
  assert.equal(gutter.select, 'none')

  const copy = block.getByRole('button', { name: 'Copy code' })
  await copy.click()
  await expect(block.getByRole('button', { name: 'Copied' })).toBeVisible()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  assert.equal(copied, await block.locator('code').textContent())
  assert.ok(!/^\s*42/.test(copied), 'line numbers stay out of the copy')
})

it('folds long code, blurs unfocused lines, and follows a light and dark theme pair', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, '/docs/code-block?theme=light')

  const folded = page.locator('#long-code [data-slot="code-block"]')
  await folded.scrollIntoViewIfNeeded()
  const viewport = folded.locator('.rf-code-viewport')
  const short = (await viewport.boundingBox())!.height
  const toggle = folded.getByRole('button', { name: /^Show all \d+ lines$/ })
  await toggle.click()
  await expect(folded.getByRole('button', { name: 'Show less' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  assert.ok((await viewport.boundingBox())!.height > short * 1.5)

  const focus = page.locator('#focus [data-slot="code-block"]')
  await focus.scrollIntoViewIfNeeded()
  const dim = focus.locator('.rf-code-line:not(.focused)').first()
  await page.mouse.move(5, 5)
  await expect(dim).toHaveCSS('opacity', '0.5')
  await focus.hover()
  await expect(dim).toHaveCSS('opacity', '1')

  const themed = page.locator('#other-themes [data-slot="code-block"]')
  await themed.scrollIntoViewIfNeeded()
  const keyword = themed.locator('.rf-code-text span').first()
  const light = await keyword.evaluate((node) => getComputedStyle(node).color)
  await open(page, '/docs/code-block?theme=dark')
  const dark = await page
    .locator('#other-themes [data-slot="code-block"] .rf-code-text span')
    .first()
    .evaluate((node) => getComputedStyle(node).color)
  assert.notEqual(light, dark)
})

it('wraps long lines to the block instead of scrolling them', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, '/docs/code-block')
  const viewport = page.locator('#wrapping [data-slot="code-block"] .rf-code-viewport')
  await viewport.scrollIntoViewIfNeeded()
  const size = await viewport.evaluate((node) => ({
    scroll: node.scrollWidth,
    client: node.clientWidth,
    lines: Math.round(node.querySelector('.rf-code-line')!.getBoundingClientRect().height / 20),
  }))
  assert.ok(size.scroll <= size.client + 1, `no sideways scroll: ${JSON.stringify(size)}`)
  assert.ok(size.lines > 1, 'the long line breaks over several rows')
})
