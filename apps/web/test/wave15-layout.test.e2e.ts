import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('renders MarkdownEditor Split mode as 2 columns on desktop and 1 column on mobile with monospace font', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 900 })

  await open(page, '/docs/markdown-editor')
  const editor = page.locator('.doc-preview .rf-md-editor').first()
  await expect(editor).toBeVisible()

  // Switch editor to Split mode.
  await editor.locator('.rf-segment', { hasText: 'Split' }).click()
  await expect(editor).toHaveAttribute('data-mode', 'split')

  const writePane = editor.locator('.rf-md-editor-write')
  const previewPane = editor.locator('.rf-md-editor-preview')
  await expect(writePane).toBeVisible()
  await expect(previewPane).toBeVisible()

  // Desktop: side-by-side (preview sits to the right of write pane).
  const desktopWrite = await writePane.boundingBox()
  const desktopPreview = await previewPane.boundingBox()
  expect(desktopWrite).not.toBeNull()
  expect(desktopPreview).not.toBeNull()
  expect(desktopPreview!.x).toBeGreaterThanOrEqual(desktopWrite!.x + desktopWrite!.width - 2)

  // Verify --rf-font-mono resolves to a monospace stack on the textarea.
  const fontFamily = await editor
    .locator('.rf-md-editor-textarea')
    .evaluate((el) => getComputedStyle(el).fontFamily)
  expect(fontFamily.toLowerCase()).toContain('mono')

  // Mobile (390px): stacks vertically (preview sits below write pane) with zero overflow.
  await page.setViewportSize({ width: 390, height: 844 })
  const mobileWrite = await writePane.boundingBox()
  const mobilePreview = await previewPane.boundingBox()
  expect(mobileWrite).not.toBeNull()
  expect(mobilePreview).not.toBeNull()
  expect(mobilePreview!.y).toBeGreaterThanOrEqual(mobileWrite!.y + mobileWrite!.height - 2)
})

it('inherits ancestor data-density="compact" and applies elevation + popover z-index on Wave 15 popups', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 900 })

  // FilterBar default vs compact ancestor density + elevated popover menu.
  await open(page, '/docs/filter-bar')
  const bar = page.locator('.doc-preview .rf-filter-bar').first()
  const box = bar.locator('.rf-filter-bar-box')
  await expect(box).toBeVisible()

  const defaultMinHeight = await box.evaluate((el) => parseFloat(getComputedStyle(el).minHeight))
  expect(defaultMinHeight).toBe(36)

  // Remove explicit data-size on the preview element so it inherits ancestor density="compact".
  await bar.evaluate((el) => {
    el.removeAttribute('data-size')
    document.documentElement.setAttribute('data-density', 'compact')
  })
  const compactMinHeight = await box.evaluate((el) => parseFloat(getComputedStyle(el).minHeight))
  expect(compactMinHeight).toBe(30)

  // Focus input to open suggestion menu and verify elevation shadow + popover z-index.
  await bar.locator('.rf-filter-bar-input').focus()
  const menu = bar.locator('.rf-filter-menu')
  await expect(menu).toBeVisible()
  const menuStyle = await menu.evaluate((el) => {
    const cs = getComputedStyle(el)
    return { boxShadow: cs.boxShadow, zIndex: cs.zIndex }
  })
  expect(menuStyle.boxShadow).not.toBe('none')
  expect(menuStyle.zIndex).toBe('60')
})
