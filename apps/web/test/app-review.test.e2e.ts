import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { open, showcaseServer, waitForShowcase } from './showcase-router.ts'

it('server-renders zero-flash diffs, filters with EmptyState, tracks viewed files, handles inline threads, shortcuts, and reload persistence', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 900 })

  await open(page, '/apps/review')
  await page.locator('[data-review-ready]').waitFor()

  // Verify the raw SSR HTML contains Declarative Shadow DOM for diffs & file tree, plus Pele SVG, with zero fallback flash.
  const response = await page.request.get(page.url())
  const ssrHtml = await response.text()
  assert.ok(ssrHtml.includes('<diffs-container><template shadowrootmode="open">'))
  assert.ok(ssrHtml.includes('<file-tree-container id="review-files-tree"'))
  assert.ok(ssrHtml.includes('<svg') && ssrHtml.includes('class="pele '))
  assert.ok(!ssrHtml.includes('class="rf-diff-fallback"'))
  assert.ok(!ssrHtml.includes('class="rf-file-tree-fallback"'))

  // All 4 files render immediately ready, alongside the FileTree and seeded Pele diagram.
  await expect(page.locator('.review-file-card .rf-diff-view[data-rf-diffs-ready]')).toHaveCount(4)
  const fileTree = page.locator('.review-tree-wrap .rf-file-tree[data-rf-trees-ready]')
  await expect(fileTree).toBeVisible()
  const treeBox = await fileTree.boundingBox()
  assert.ok((treeBox?.height ?? 0) > 80, `expected FileTree to render rows, got ${treeBox?.height}`)

  // Header controls render a single Jump button (no nested button split) and single progress label.
  await expect(page.locator('.review-header-controls button', { hasText: 'Jump' })).toHaveCount(1)
  await expect(page.locator('.review-progress-wrap')).toHaveText('0 of 4 viewed')

  // FileTree renders compacted folders and colored +loc / -loc row decorations inside its shadow root.
  const addedCount = fileTree
    .locator('[data-item-section="decoration"] > span > span', { hasText: /^\+12$/ })
    .first()
  const removedCount = fileTree
    .locator('[data-item-section="decoration"] > span > span', { hasText: /^−5$/ })
    .first()
  await expect(addedCount).toBeVisible()
  await expect(removedCount).toBeVisible()
  const [addedColor, removedColor] = await Promise.all([
    addedCount.evaluate((el) => getComputedStyle(el).color),
    removedCount.evaluate((el) => getComputedStyle(el).color),
  ])
  assert.notEqual(addedColor, removedColor)

  // Left sidebar stays sticky inside the viewport when the page scrolls down through diffs.
  const stickyMetrics = await page.evaluate(() => {
    window.scrollTo(0, 600)
    const sidebar = document.querySelector<HTMLElement>('.review-sidebar')
    const pane = document.querySelector<HTMLElement>('.review-resizable > .rf-resizable-pane')
    const result = {
      scrollY: window.scrollY,
      sidebarTop: sidebar?.getBoundingClientRect().top ?? -1,
      sidebarPosition: sidebar ? getComputedStyle(sidebar).position : '',
      paneOverflow: pane ? getComputedStyle(pane).overflowY : '',
    }
    window.scrollTo(0, 0)
    return result
  })
  assert.equal(stickyMetrics.sidebarPosition, 'sticky')
  assert.equal(stickyMetrics.paneOverflow, 'visible')
  assert.ok(stickyMetrics.scrollY >= 400, `expected page to scroll, got ${stickyMetrics.scrollY}`)
  assert.ok(
    stickyMetrics.sidebarTop >= 0 && stickyMetrics.sidebarTop <= 24,
    `expected sticky sidebar near top of viewport, got ${stickyMetrics.sidebarTop}`,
  )

  // Filter files to zero matches -> EmptyState -> Clear filter.
  const filterInput = page.getByRole('searchbox', { name: 'Filter changed files' })
  await filterInput.fill('nonexistent.rs')
  await expect(page.locator('.rf-empty-state')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filter' }).click()
  await expect(page.locator('.review-file-card')).toHaveCount(4)

  // Mark the first file Viewed -> collapses it and updates progress.
  const firstCard = page.locator('[data-review-file="packages/reflow/src/diffs-ssr.ts"]')
  await firstCard.getByRole('button', { name: 'Mark viewed' }).click()
  await expect(page.locator('.review-progress-wrap')).toContainText('1 of 4 viewed')
  await expect(firstCard.locator('.rf-diff-view')).toHaveAttribute('data-collapsed', 'true')
  // Unmark viewed so we can interact with the inline CommentThread inside it.
  await firstCard.getByRole('button', { name: 'Viewed' }).click()
  await expect(firstCard.locator('.rf-diff-view')).not.toHaveAttribute('data-collapsed', 'true')

  // Interact with slotted CommentThread: verify seeded Pele diagram, apply suggestion, reply, resolve & reopen.
  const thread = firstCard.locator('.rf-comment-thread')
  await expect(thread).toBeVisible()
  await expect(thread.locator('.rf-diagram-canvas svg.pele')).toBeVisible()
  await thread.getByRole('button', { name: 'Apply suggestion' }).click()
  await expect(thread.getByText('Applied', { exact: true })).toBeVisible()

  await thread.getByRole('textbox', { name: 'Reply to thread' }).fill('Looks solid now!')
  await thread.getByRole('button', { name: 'Reply', exact: true }).click()
  await expect(thread.getByText('Looks solid now!')).toBeVisible()

  await thread.getByRole('button', { name: 'Resolve', exact: true }).click()
  await expect(thread).toHaveAttribute('data-resolved', 'true')
  await thread.getByRole('button', { name: 'Reopen', exact: true }).click()
  await expect(thread).not.toHaveAttribute('data-resolved', 'true')

  // Start and post a brand-new inline comment with a live Mermaid diagram on the CSS file.
  const cssCard = page.locator('[data-review-file="packages/reflow/src/diff-view.css"]')
  await cssCard.getByRole('button', { name: 'Comment', exact: true }).click()
  await cssCard
    .getByRole('textbox', { name: 'New review comment' })
    .fill('Border matches CodeBlock cleanly.\n\n```mermaid\nflowchart LR\n  Card --> Diff\n```')
  await cssCard.getByRole('button', { name: 'Post comment' }).click()
  await expect(cssCard.locator('.rf-comment-thread')).toContainText(
    'Border matches CodeBlock cleanly.',
  )
  await expect(cssCard.locator('.rf-comment-thread .rf-diagram-canvas svg.pele')).toBeVisible()

  // Switch between Unified and Split with a real pointer click on the SegmentedControl label.
  await page.locator('.review-header .rf-segmented label', { hasText: 'Split' }).click()
  await expect(firstCard.locator('.rf-diff-view')).toHaveAttribute('data-view', 'split')

  // Keyboard shortcuts: u/s toggle layout, v marks the active file viewed.
  await page.locator('.review-title-row h1').click()
  await page.keyboard.press('u')
  await expect(firstCard.locator('.rf-diff-view')).toHaveAttribute('data-view', 'unified')
  await page.keyboard.press('s')
  await expect(firstCard.locator('.rf-diff-view')).toHaveAttribute('data-view', 'split')
  await page.keyboard.press('u')
  await page.keyboard.press('v')
  await expect(page.locator('.review-progress-wrap')).toContainText('1 of 4 viewed')

  // Open a CI check log in the Drawer and filter ANSI Terminal output.
  await page.getByRole('button', { name: /test · diff-view SSR/ }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  const terminal = drawer.locator('.rf-terminal')
  await expect(terminal).toBeVisible()
  await terminal.getByRole('searchbox', { name: 'Filter terminal output' }).fill('PASS')
  await expect(terminal.locator('.rf-terminal-line')).toHaveCount(1)
  await drawer.getByRole('button', { name: 'Close' }).click()
  await expect(drawer).toBeHidden()

  // Switch to Conversation & checks, verify Architecture diagram, submit an approval review, verify Timeline updates.
  await page.getByRole('tab', { name: /Conversation & checks/ }).click()
  await expect(page.locator('.review-conversation .rf-diagram-canvas svg.pele')).toBeVisible()
  await expect(page.locator('.rf-timeline')).toBeVisible()
  await page.getByRole('button', { name: 'Submit review' }).click()
  const popover = page.getByRole('dialog', { name: 'Submit review' })
  await popover.getByRole('textbox', { name: 'Review summary' }).fill('Ship it!')
  await popover.getByRole('button', { name: 'Submit review' }).click()
  await expect(
    page.locator('.review-title-row').getByText('Approved', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('.rf-timeline').getByText('Ship it!')).toBeVisible()

  // Reload and confirm verdict, viewed count, and inline comments persisted locally.
  await page.reload()
  await waitForShowcase(page)
  await expect(
    page.locator('.review-title-row').getByText('Approved', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('.review-progress-wrap')).toContainText('1 of 4 viewed')
  await expect(
    page
      .locator('[data-review-file="packages/reflow/src/diff-view.css"]')
      .locator('.rf-comment-thread'),
  ).toContainText('Border matches CodeBlock cleanly.')
})
