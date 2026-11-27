import type { Locator, Page } from 'playwright'
import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { holdMotion, releaseMotion, seekMotion } from './motion.ts'
import { open, showcaseServer } from './showcase-router.ts'

it('moves two Todo issues by keyboard and continues from the next stationary issue', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps/issues')
  const list = page.getByRole('listbox', { name: 'Cycle issues' })
  const todo = list.getByRole('group', { name: 'Todo', exact: true })
  const inProgress = list.getByRole('group', { name: 'In progress', exact: true })
  const details = page.getByRole('dialog')
  const toolbar = page.getByRole('toolbar', { name: 'Selected issue actions' })
  const first = todo.getByRole('option', { name: /AT-142/ })
  const second = todo.getByRole('option', { name: /AT-139/ })
  await page.getByRole('radio', { name: 'Board' }).focus()
  await page.keyboard.press('Tab')
  await expect(first).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(second).toBeFocused()
  await expect(details).toBeHidden()
  await page.keyboard.press('Enter')
  await expect(
    details.getByRole('heading', { name: 'Restore an unfinished field note' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(second).toBeFocused()
  await expect(list.getByRole('option', { selected: true })).toHaveCount(0)

  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowUp')
  await expect(first).toBeFocused()
  await expect(second).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Space')
  await expect(list.getByRole('option', { selected: true })).toHaveCount(2)
  await page.keyboard.press('Tab')
  const move = toolbar.getByRole('button', { name: 'Move to' })
  await expect(move).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(toolbar.getByRole('button', { name: 'Clear selection' })).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Enter')

  await page.getByRole('menuitem', { name: 'Move to In progress' }).press('Enter')
  await expect(todo.getByRole('option')).toHaveCount(2)
  await expect(inProgress.getByRole('option')).toHaveCount(5)
  await expect(todo.getByRole('option', { name: /AT-138/ })).toBeFocused()
  await expect(list.getByRole('option', { selected: true })).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveText('Moved 2 issues to In progress.')
  await page.keyboard.press('ArrowRight')
  await expect(inProgress.getByRole('option', { name: /AT-142/ })).toBeFocused()
})

it('moves and clears selections using the narrow layout', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 375, height: 740 })
  await open(page, '/apps/issues')
  const todo = page.getByRole('group', { name: 'Todo', exact: true })
  const toolbar = page.getByRole('toolbar', { name: 'Selected issue actions' })
  await todo.getByRole('option').first().locator('.issues-check').click()
  await toolbar.getByRole('button', { name: 'Clear selection' }).click()
  await expect(todo.getByRole('option').first()).toBeFocused()
  await expect(toolbar).toHaveCount(0)
  await todo.getByRole('option').first().locator('.issues-check').click()
  await todo.getByRole('option').nth(1).locator('.issues-check').click()
  await toolbar.getByRole('button', { name: 'Move to' }).click()
  await page.getByRole('menuitem', { name: 'Move to In progress' }).click()
  const destination = page.getByRole('group', { name: 'In progress', exact: true })
  await expect(destination.getByRole('option', { name: /AT-142/ })).toBeVisible()
  await expect(destination.getByRole('option', { name: /AT-139/ })).toBeVisible()
  await expect(todo.getByRole('option', { name: /AT-138/ })).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
})

it('applies a context action to its invoking issue and preserves an unrelated selection', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps/issues')
  const list = page.getByRole('listbox', { name: 'Cycle issues' })
  const first = list.getByRole('option', { name: /AT-142/ })
  await first.locator('.issues-check').click()
  await list.getByRole('option', { name: /AT-139/ }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Move to Done' }).click()
  await expect(
    list.getByRole('group', { name: 'Done' }).getByRole('option', { name: /AT-139/ }),
  ).toBeVisible()
  await expect(first).toHaveAttribute('aria-selected', 'true')
  await expect(list.getByRole('option', { name: /AT-138/ })).toBeFocused()
  await page.getByRole('button', { name: 'Undo', exact: true }).press('Enter')
  await expect(
    list.getByRole('group', { name: 'Todo' }).getByRole('option', { name: /AT-139/ }),
  ).toBeFocused()
  await expect(first).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('End')
  await expect(list.getByRole('option', { name: /AT-125/ })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(first).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(list.getByRole('option', { selected: true })).toHaveCount(0)
})

it('disables the context action that would move an issue to its own status', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps/issues')
  const list = page.getByRole('listbox', { name: 'Cycle issues' })
  await list.getByRole('option', { name: /AT-139/ }).click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: 'Move to Todo' })).toBeDisabled()
  await expect(page.getByRole('menuitem', { name: 'Move to Done' })).toBeEnabled()
})

it('extends and contracts a range across groups while J and K only navigate', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps/issues')
  const list = page.getByRole('listbox', { name: 'Cycle issues' })
  const rows = list.getByRole('option')
  const selected = list.getByRole('option', { selected: true })

  // An independent selection survives both ends of the range changing.
  await page.getByRole('radio', { name: 'Board' }).press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'List' })).toBeChecked()
  await rows.last().locator('.issues-check').click()
  await page.keyboard.press('Home')
  await page.keyboard.press('j')
  await page.keyboard.press('j')
  await expect(rows.nth(2)).toBeFocused()
  await expect(selected).toHaveCount(1)
  await page.keyboard.press('Shift+ArrowDown')
  await page.keyboard.press('Shift+ArrowDown')
  await expect(rows.nth(4)).toBeFocused()
  await expect(selected).toHaveText([/AT-138/, /AT-137/, /AT-136/, /AT-125/])
  await page.keyboard.press('Shift+ArrowUp')
  await expect(selected).toHaveText([/AT-138/, /AT-137/, /AT-125/])
  await page.keyboard.press('Shift+ArrowUp')
  await page.keyboard.press('Shift+ArrowUp')
  await expect(selected).toHaveText([/AT-139/, /AT-138/, /AT-125/])

  await page.keyboard.press('End')
  await page.keyboard.press('k')
  await expect(rows.nth(8)).toBeFocused()
  await expect(selected).toHaveText([/AT-139/, /AT-138/, /AT-125/])
  await page.keyboard.press('Shift+ArrowUp')
  await expect(selected).toHaveText([/AT-139/, /AT-138/, /AT-128/, /AT-127/, /AT-125/])
})

it('drills into live cycle and assignee summaries and clears an empty status filter', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps/issues')
  const progress = page.getByRole('region', { name: 'Cycle progress' })
  const list = page.getByRole('listbox', { name: 'Cycle issues' })
  const rows = list.getByRole('option')
  await expect(progress).toContainText('30%')
  await page.getByRole('button', { name: 'Show issues assigned to Mina Ortiz' }).click()
  await expect(rows).toHaveCount(4)
  await expect(rows.first()).toBeFocused()
  await page.getByRole('button', { name: 'Show Done issues' }).click()
  await expect(rows).toHaveCount(3)
  await expect(list.getByRole('group')).toHaveCount(1)
  await rows.first().press('Space')
  await page.keyboard.press('Shift+ArrowDown')
  await page.keyboard.press('Shift+ArrowDown')
  await page.getByRole('button', { name: 'Move to' }).click()
  await page.getByRole('menuitem', { name: 'Move to Todo' }).click()
  await expect(list).toContainText('No issues in Done.')
  await expect(progress).toContainText('0%')
  const clear = page.getByRole('button', { name: 'Clear filter Done' })
  await expect(clear).toBeFocused()
  await page.getByRole('button', { name: 'Undo', exact: true }).press('Enter')
  await expect(rows).toHaveCount(3)
  await expect(rows.last()).toBeFocused()
  await expect(progress).toContainText('30%')
  await clear.press('Enter')
  await expect(rows).toHaveCount(10)
  await expect(rows.first()).toBeFocused()
})

// Begin the native drag before scrolling to the destination. Scrolling the
// page between pointerdown and dragstart can put another row under the pointer.
async function startDrag(page: Page, source: Locator) {
  await source.hover()
  const start = (await source.boundingBox())!
  await page.mouse.down()
  await page.mouse.move(start.x + start.width / 2 + 10, start.y + start.height / 2, { steps: 4 })
  await expect(source).toHaveAttribute('data-dragging', '')
}

async function dragIssue(page: Page, source: Locator, destination: Locator) {
  await startDrag(page, source)
  await destination.scrollIntoViewIfNeeded()
  const end = (await destination.boundingBox())!
  const x = end.x + end.width / 2
  const y = end.y + end.height / 2
  await page.mouse.move(x, y, { steps: 8 })
  await page.mouse.move(x + 1, y)
  await page.mouse.up()
}

// Stop with the mouse held so the test can inspect the proposed order before dropping.
async function hoverAbove(page: Page, row: Locator) {
  const box = (await row.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 4
  await page.mouse.move(x, y)
  await page.mouse.move(x + 1, y)
}

for (const layout of ['Board', 'List']) {
  for (const withinColumn of [true, false]) {
    it(`opens a gap ${withinColumn ? 'within' : 'across'} status groups in ${layout}`, async (t) => {
      const page = await t.serve(showcaseServer)
      await page.setViewportSize({ width: 1440, height: 1250 })
      await open(page, '/apps/issues')
      if (layout === 'List') await page.getByRole('radio', { name: 'Board' }).press('ArrowRight')
      const todo = page.getByRole('group', { name: 'Todo', exact: true })
      const destination = withinColumn
        ? todo
        : page.getByRole('group', { name: 'In progress', exact: true })
      const rows = destination.getByRole('option')
      const original = await rows.allTextContents()
      const source = todo.getByRole('option', { name: /AT-137/ })
      const moving = await source.textContent()
      const above = rows.nth(0)
      const below = rows.nth(1)
      async function spacing() {
        const top = (await above.boundingBox())!
        return (await below.boundingBox())!.y - top.y - top.height
      }
      await startDrag(page, source)
      await hoverAbove(page, below)
      const slot = destination.locator('.issues-drop-slot')
      await expect.poll(spacing).toBeGreaterThan(25)
      const gap = (await slot.boundingBox())!
      expect(gap.y).toBeGreaterThan((await above.boundingBox())!.y)
      expect(gap.y + gap.height).toBeLessThanOrEqual((await below.boundingBox())!.y + 1)
      await page.mouse.move(gap.x + gap.width / 2, gap.y + gap.height / 2)
      await page.mouse.up()
      const expected = original.filter((text) => text !== moving)
      expected.splice(1, 0, moving!)
      await expect(rows).toHaveText(expected)
      await expect(slot).toHaveCount(0)
      await page.getByRole('button', { name: 'Undo', exact: true }).click()
      await expect(rows).toHaveText(original)
      await expect(todo.getByRole('option').last()).toContainText('AT-137')
    })
  }
}

for (const layout of ['Board', 'List']) {
  it(`slides neighbors and accepts a reversal mid-animation in ${layout}`, async (t) => {
    const page = await t.serve(showcaseServer)
    await page.setViewportSize({ width: 1440, height: 1250 })
    await open(page, '/apps/issues', { motion: true })
    if (layout === 'List') await page.getByRole('radio', { name: 'Board' }).press('ArrowRight')
    const todo = page.getByRole('group', { name: 'Todo', exact: true })
    const rows = todo.getByRole('option')
    const original = await rows.allTextContents()
    const second = rows.nth(1)
    const rest = (await second.boundingBox())!
    const origin = (await rows.last().boundingBox())!
    await startDrag(page, rows.last())
    await holdMotion(page)
    await hoverAbove(page, second)
    await seekMotion(second, 0.4)
    const midway = (await second.boundingBox())!.y
    expect(midway).toBeGreaterThan(rest.y + 1)
    await seekMotion(second, 0.8)
    expect((await second.boundingBox())!.y).toBeGreaterThan(midway + 1)
    await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height - 3)
    await page.mouse.move(origin.x + origin.width / 2 + 1, origin.y + origin.height - 3)
    await expect
      .poll(async () =>
        Math.abs((await todo.locator('.issues-drop-slot').boundingBox())!.y - origin.y),
      )
      .toBeLessThanOrEqual(2)
    await page.mouse.up()
    await releaseMotion(page)
    await expect(rows).toHaveText(original)
    await expect(page.getByRole('button', { name: 'Undo', exact: true })).toHaveCount(0)
  })
}

it('inserts a mixed selection together in board order and undoes both positions', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1440, height: 1250 })
  await open(page, '/apps/issues')
  const todo = page.getByRole('group', { name: 'Todo', exact: true }).getByRole('option')
  const started = page.getByRole('group', { name: 'In progress', exact: true })
  const rows = started.getByRole('option')
  const original = await rows.allTextContents()
  await rows.last().locator('.issues-check').click()
  await todo.last().locator('.issues-check').click()
  await startDrag(page, todo.last())
  await hoverAbove(page, rows.nth(1))
  await expect(started.locator('.issues-drop-slot')).toHaveCount(2)
  await page.mouse.up()
  await expect(rows).toHaveText([/AT-136/, /AT-137/, /AT-130/, /AT-131/])
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(rows).toHaveText(original)
  await expect(todo.last()).toContainText('AT-137')
})

it('extends and contracts a Shift-click range and drags the selection together in List', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1440, height: 1250 })
  await open(page, '/apps/issues')
  await page.getByRole('radio', { name: 'Board' }).press('ArrowRight')
  const todo = page.getByRole('group', { name: 'Todo', exact: true }).getByRole('option')
  const started = page.getByRole('group', { name: 'In progress', exact: true }).getByRole('option')
  const done = page.getByRole('group', { name: 'Done', exact: true })
  const selected = page.getByRole('option', { selected: true })
  await started.last().locator('.issues-check').click()
  await todo.first().locator('.issues-check').click()
  await todo.nth(2).click({ modifiers: ['Shift'] })
  await expect(selected).toHaveText([/AT-142/, /AT-139/, /AT-138/, /AT-130/])
  await todo.nth(1).click({ modifiers: ['Shift'] })
  await expect(selected).toHaveText([/AT-142/, /AT-139/, /AT-130/])
  await startDrag(page, todo.nth(1))
  await hoverAbove(page, done.getByRole('option').nth(1))
  await expect(done.locator('.issues-drop-slot')).toHaveCount(3)
  await page.mouse.up()
  await expect(done.getByRole('option')).toHaveText([
    /AT-128/,
    /AT-142/,
    /AT-139/,
    /AT-130/,
    /AT-127/,
    /AT-125/,
  ])
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(todo).toHaveText([/AT-142/, /AT-139/, /AT-138/, /AT-137/])
  await expect(started.last()).toContainText('AT-130')
})

for (const layout of ['Board', 'List']) {
  it(`opens issues on click and selects a range only on Shift-click in ${layout}`, async (t) => {
    const page = await t.serve(showcaseServer)
    await open(page, '/apps/issues')
    if (layout === 'List') await page.getByRole('radio', { name: 'Board' }).press('ArrowRight')
    const rows = page.getByRole('group', { name: 'Todo', exact: true }).getByRole('option')
    const selected = page.getByRole('option', { selected: true })
    await rows.nth(1).click()
    await expect(page.getByRole('dialog')).toContainText('Restore an unfinished field note')
    await page.keyboard.press('Escape')
    await expect(selected).toHaveCount(0)
    await rows.first().press('Space')
    await expect(rows.first()).toBeFocused()
    await page.keyboard.down('Shift')
    await rows.nth(1).hover()
    await rows.last().hover()
    await expect(selected).toHaveText([/AT-142/])
    await expect(rows.first()).toBeFocused()
    await rows.last().click()
    await expect(selected).toHaveText([/AT-142/, /AT-139/, /AT-138/, /AT-137/])
    await rows.nth(1).hover()
    await expect(selected).toHaveCount(4)
    await rows.nth(1).click()
    await expect(selected).toHaveText([/AT-142/, /AT-139/])
    await page.keyboard.up('Shift')
    await rows.first().click({ modifiers: ['ControlOrMeta'] })
    await expect(selected).toHaveText([/AT-139/])
  })

  it(`lifts the grabbed issue under the pointer with the selected titles stacked below in ${layout}`, async (t) => {
    const page = await t.serve(showcaseServer)
    await page.setViewportSize({ width: 1440, height: 1250 })
    await open(page, '/apps/issues')
    if (layout === 'List') await page.getByRole('radio', { name: 'Board' }).press('ArrowRight')
    const rows = page.getByRole('group', { name: 'Todo', exact: true }).getByRole('option')
    const count = layout === 'Board' ? 2 : 4
    await rows.first().locator('.issues-check').click()
    await rows.nth(count - 1).click({ modifiers: ['Shift'] })
    const source = rows.nth(1)
    // Native drag images live outside the page. Inspect what Chromium actually captures.
    const captured = await page.evaluateHandle(() => {
      const snapshot = document.createElement('div')
      const original = DataTransfer.prototype.setDragImage
      DataTransfer.prototype.setDragImage = function (image, x, y) {
        original.call(this, image, x, y)
        DataTransfer.prototype.setDragImage = original
        snapshot.append(image.cloneNode(true))
        const face = image.querySelector('.issues-row')
        if (!face) return
        const rect = face.getBoundingClientRect()
        snapshot.dataset.grabX = String(x / rect.width)
        snapshot.dataset.grabY = String(y / rect.height)
        snapshot.dataset.font = getComputedStyle(face).fontFamily
      }
      return snapshot
    })
    await source.hover()
    const box = (await source.boundingBox())!
    const x = box.x + box.width * 0.72
    const y = box.y + box.height * 0.35
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 10, y, { steps: 4 })
    await expect(source).toHaveAttribute('data-dragging', '')
    const preview = await captured.evaluate((image) => ({
      title: image.querySelector('.issues-title')?.textContent,
      count: image.querySelector('.issues-drag-count')?.textContent,
      layers: [...image.querySelectorAll('.issues-drag-layer')].map((layer) => layer.textContent),
      x: Number(image.dataset.grabX),
      y: Number(image.dataset.grabY),
      font: image.dataset.font,
    }))
    expect(preview.title).toBe('Restore an unfinished field note')
    expect(preview.count).toBe(String(count))
    expect(preview.layers).toHaveLength(Math.min(2, count - 1))
    expect(preview.layers[0]).toContain('Keep the map in view')
    if (count > 2) expect(preview.layers[1]).toContain('Mark water stops')
    expect(preview.x).toBeCloseTo(0.72, 1)
    expect(preview.y).toBeCloseTo(0.35, 1)
    expect(preview.font).toBe(await source.evaluate((row) => getComputedStyle(row).fontFamily))
    await page.keyboard.press('Escape')
    await page.mouse.up()
    await expect(page.getByRole('option', { selected: true })).toHaveCount(count)
    await expect(
      page.locator('.issues-drag-stack, [data-dragging], .issues-drop-slot'),
    ).toHaveCount(0)
  })
}

it('uses X and Select All on the visible issues', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps/issues')
  await page.getByRole('radio', { name: 'Board' }).press('ArrowRight')
  await page.getByRole('button', { name: 'Show Done issues' }).click()
  const rows = page.getByRole('option')
  const selected = page.getByRole('option', { selected: true })
  await rows.first().press('x')
  await expect(selected).toHaveCount(1)
  await rows.first().press('ControlOrMeta+a')
  await expect(selected).toHaveCount(3)
  await rows.nth(1).press('x')
  await expect(selected).toHaveText([/AT-128/, /AT-125/])
})

it('places a card between neighbors in a filtered board that wraps across rows', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1440, height: 1250 })
  await open(page, '/apps/issues')
  await page.getByRole('button', { name: 'Show Todo issues' }).click()
  const todo = page.getByRole('group', { name: 'Todo', exact: true })
  const rows = todo.getByRole('option')
  const second = (await rows.nth(1).boundingBox())!
  const x = second.x + second.width / 4
  const y = second.y + second.height / 2
  await startDrag(page, rows.last())
  await page.mouse.move(x, y)
  await page.mouse.move(x + 1, y)
  await expect
    .poll(async () => (await todo.locator('.issues-drop-slot').boundingBox())?.x)
    .toBeCloseTo(second.x, 0)
  await page.mouse.up()
  await expect(rows).toHaveText([/AT-142/, /AT-137/, /AT-139/, /AT-138/])
  await page.getByRole('radio', { name: 'Board' }).press('ArrowRight')
  await expect(rows).toHaveText([/AT-142/, /AT-137/, /AT-139/, /AT-138/])
})

it('closes the board gap and restores positions when a drag leaves the board', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1440, height: 1250 })
  await open(page, '/apps/issues')
  const todo = page.getByRole('group', { name: 'Todo', exact: true })
  const rows = todo.getByRole('option')
  const original = await rows.allTextContents()
  const below = rows.nth(1)
  const initialY = (await below.boundingBox())!.y
  await startDrag(page, rows.last())
  await hoverAbove(page, below)
  await expect.poll(async () => (await below.boundingBox())!.y).toBeGreaterThan(initialY + 25)
  await page.mouse.move(10, 10)
  await page.mouse.move(11, 10)
  await page.mouse.up()
  await expect(page.locator('.issues-drop-slot')).toHaveCount(0)
  await expect(rows).toHaveText(original)
  expect((await below.boundingBox())!.y).toBeCloseTo(initialY, 0)
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toHaveCount(0)
})

for (const layout of ['Board', 'List']) {
  it('drags issues between populated and empty groups in ' + layout, async (t) => {
    const page = await t.serve(showcaseServer)
    await page.setViewportSize({ width: 1440, height: 950 })
    await open(page, '/apps/issues')
    if (layout === 'List') await page.getByRole('radio', { name: 'Board' }).press('ArrowRight')
    const issues = page.getByRole('listbox', { name: 'Cycle issues' })
    const todo = issues.getByRole('group', { name: 'Todo', exact: true })
    const started = issues.getByRole('group', { name: 'In progress', exact: true })
    const done = issues.getByRole('group', { name: 'Done', exact: true })
    const first = todo.getByRole('option', { name: /AT-142/ })
    const unrelated = todo.getByRole('option', { name: /AT-139/ })
    await unrelated.locator('.issues-check').click()
    await dragIssue(page, first, page.getByRole('heading', { name: 'Issue tracker', exact: true }))
    await expect(first).toBeVisible()
    await expect(issues.locator('[data-dragging], .issues-drop-slot')).toHaveCount(0)
    await expect(first).toHaveAttribute('draggable', 'true')
    await dragIssue(page, first, started.getByRole('option').first())
    await expect(started.getByRole('option', { name: /AT-142/ })).toBeVisible()
    await expect(unrelated).toBeFocused()
    await expect(unrelated).toHaveAttribute('aria-selected', 'true')
    await unrelated.press('Escape')

    await done.getByRole('option').first().locator('.issues-check').click()
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('Shift+ArrowDown')
    await dragIssue(page, done.getByRole('option').first(), started)
    await expect(done).toContainText('No issues in Done.')
    await expect(page.getByRole('status')).toHaveText('Moved 3 issues to In progress.')
    const moved = [/AT-128/, /AT-127/, /AT-125/]
    await expect(started.getByRole('option', { selected: true })).toHaveText(moved)
    await expect(started.getByRole('option', { name: /AT-128/ })).toBeFocused()
    await expect(page.getByRole('region', { name: 'Cycle progress' })).toContainText('0%')

    await dragIssue(
      page,
      started.getByRole('option', { name: /AT-142/ }),
      done.getByText('No issues in Done.'),
    )
    await expect(done.getByRole('option', { name: /AT-142/ })).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('Moved 1 issue to Done.')
    await expect(page.getByRole('region', { name: 'Cycle progress' })).toContainText('10%')
    const undo = page.getByRole('button', { name: 'Undo', exact: true })
    await undo.click()
    await expect(done.getByRole('option')).toHaveCount(0)
    await expect(started.getByRole('option', { name: /AT-142/ })).toBeFocused()
    await expect(page.getByRole('region', { name: 'Cycle progress' })).toContainText('0%')
    await expect(undo).toHaveCount(0)

    // Pick up a different member of the same selection for the return trip.
    await dragIssue(
      page,
      started.getByRole('option', { name: /AT-127/ }),
      done.getByText('No issues in Done.'),
    )
    await expect(done.getByRole('option', { selected: true })).toHaveText(moved)
    await expect(done.getByRole('option', { name: /AT-127/ })).toBeFocused()
    await page.getByRole('button', { name: 'Move to', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Move to Todo' }).click()
    for (const name of moved) await expect(todo.getByRole('option', { name })).toBeVisible()
  })
}

it('collapses the overview before hydration on phones and keeps the dashboard visible on desktop', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/*.js', (route) => route.abort())
  await open(page, '/apps/issues', { hydrate: false })
  const toggle = page.getByRole('button', { name: /Cycle overview/ })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  const first = page.getByRole('option').first()
  expect((await first.boundingBox())!.y).toBeLessThan(350)
  await expect(first).toBeInViewport()
  await expect(page.getByRole('button', { name: 'Show Todo issues' })).toHaveCount(0)
  await page.setViewportSize({ width: 1200, height: 844 })
  await expect(toggle).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Cycle progress' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Team workload' })).toBeVisible()
})

it('uses the phone disclosure and undoes a mixed-status bulk move by touch', async (t) => {
  const desktop = await t.serve(showcaseServer)
  const context = await desktop
    .context()
    .browser()!
    .newContext({
      baseURL: showcaseServer.baseUrl,
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    })
  t.after(() => context.close())
  const page = await context.newPage()
  await open(page, '/apps/issues')
  const toggle = page.getByRole('button', { name: /Cycle overview/ })
  await toggle.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('button', { name: 'Show issues assigned to Mina Ortiz' }).tap()
  const list = page.getByRole('listbox', { name: 'Cycle issues' })
  await expect(list.getByRole('option')).toHaveCount(4)
  await toggle.tap()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  const todo = list.getByRole('group', { name: 'Todo', exact: true })
  const started = list.getByRole('group', { name: 'In progress', exact: true })
  const done = list.getByRole('group', { name: 'Done', exact: true })
  await todo
    .getByRole('option', { name: /AT-142/ })
    .locator('.issues-check')
    .tap()
  await started
    .getByRole('option', { name: /AT-131/ })
    .locator('.issues-check')
    .tap()
  await page.getByRole('button', { name: 'Move to', exact: true }).tap()
  await page.getByRole('menuitem', { name: 'Move to Done' }).tap()
  await expect(done.getByRole('option')).toHaveCount(3)
  await expect(toggle).toContainText('50%')
  const undo = page.getByRole('button', { name: 'Undo', exact: true })
  await expect(undo).toBeInViewport()
  await undo.tap()
  await expect(toggle).toContainText('30%')
  await expect(todo.getByRole('option', { name: /AT-142/ })).toBeVisible()
  await expect(started.getByRole('option', { name: /AT-131/ })).toBeFocused()
  await expect(done.getByRole('option')).toHaveCount(1)
  await expect(list.getByRole('option', { selected: true })).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveText('Restored 2 issues to their previous statuses.')
  await expect(undo).toHaveCount(0)
})

it('keeps the current filter and drops hidden selections when undoing from the destination view', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps/issues')
  const list = page.getByRole('listbox', { name: 'Cycle issues' })
  await list.getByRole('option', { name: /AT-142/ }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Move to Done' }).click()
  await page.getByRole('button', { name: 'Show Done issues' }).click()
  const moved = list.getByRole('option', { name: /AT-142/ })
  const stationary = list.getByRole('option', { name: /AT-128/ })
  await stationary.locator('.issues-check').click()
  await moved.locator('.issues-check').click()
  await page.getByRole('button', { name: 'Undo', exact: true }).press('Enter')
  await expect(list.getByRole('group')).toHaveCount(1)
  await expect(moved).toHaveCount(0)
  await expect(stationary).toBeFocused()
  await expect(list.getByRole('option', { selected: true })).toHaveCount(1)
  await expect(stationary).toHaveAttribute('aria-selected', 'true')
})

it('filters via SavedViewTabs, toggles card properties via ViewOptionsPopover, and captures via QuickCreateBar & TriageQueue', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/apps/issues')
  const list = page.getByRole('listbox', { name: 'Cycle issues' })
  const views = page.getByRole('tablist', { name: 'Saved issue views' })

  await expect(list.getByRole('option')).toHaveCount(10)
  await views.getByRole('tab', { name: /Active/ }).click()
  await expect(list.getByRole('option')).toHaveCount(7)
  await views.getByRole('tab', { name: /High priority/ }).click()
  await expect(list.getByRole('option')).toHaveCount(5)
  await views.getByRole('tab', { name: /All issues/ }).click()
  await expect(list.getByRole('option')).toHaveCount(10)

  await expect(list.locator('.rf-estimate-pill').first()).toBeVisible()
  await page.getByRole('button', { name: 'Display' }).click()
  await page.getByRole('button', { name: 'Estimate', exact: true }).click()
  await expect(list.locator('.rf-estimate-pill')).toHaveCount(0)
  await page.getByRole('button', { name: 'Estimate', exact: true }).click()
  await expect(list.locator('.rf-estimate-pill').first()).toBeVisible()
  await page.keyboard.press('Escape')

  const input = page.getByRole('textbox', { name: 'Issue title' })
  await input.fill('Verify offline cache eviction')
  await page.getByRole('button', { name: 'Create issue', exact: true }).click()
  await expect(list.getByRole('option')).toHaveCount(11)
  await expect(list.getByRole('option', { name: /AT-143/ })).toBeVisible()

  await page.getByRole('button', { name: /Accept/ }).click()
  await expect(list.getByRole('option')).toHaveCount(12)
  await expect(list.getByRole('option', { name: /AT-151/ })).toBeVisible()

  // Switch to List view and verify area, estimate, and avatar columns align across rows.
  await page.getByRole('radio', { name: 'Board' }).press('ArrowRight')
  await expect(list).toHaveAttribute('data-layout', 'list')
  const rowCols = await list.getByRole('option').evaluateAll((rows) =>
    rows.slice(0, 8).map((row) => {
      const area = row.querySelector<HTMLElement>('.issues-area')!
      const estimate = row.querySelector<HTMLElement>('.rf-estimate-pill')
      const avatar = row.querySelector<HTMLElement>('.rf-avatar')!
      return {
        areaRight: Math.round(area.getBoundingClientRect().right),
        estimateRight: estimate ? Math.round(estimate.getBoundingClientRect().right) : null,
        avatarLeft: Math.round(avatar.getBoundingClientRect().left),
      }
    }),
  )
  const estimateCols = rowCols.filter((row) => row.estimateRight !== null)
  expect(estimateCols.length).toBeGreaterThan(2)
  for (const row of rowCols.slice(1)) {
    expect(Math.abs(row.areaRight - rowCols[0].areaRight)).toBeLessThanOrEqual(1)
    expect(Math.abs(row.avatarLeft - rowCols[0].avatarLeft)).toBeLessThanOrEqual(1)
  }
  for (const row of estimateCols.slice(1)) {
    expect(Math.abs(row.estimateRight! - estimateCols[0].estimateRight!)).toBeLessThanOrEqual(1)
  }
})
