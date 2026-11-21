import type { Locator, Page } from 'playwright'
import { expect } from 'playwright/test'
import { it } from 'remix/test'
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
  await todo.getByRole('option').first().click()
  await toolbar.getByRole('button', { name: 'Clear selection' }).click()
  await expect(todo.getByRole('option').first()).toBeFocused()
  await expect(toolbar).toHaveCount(0)
  await todo.getByRole('option').first().click()
  await todo.getByRole('option').nth(1).click()
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
  await first.click()
  await list.getByRole('option', { name: /AT-139/ }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Move to Done' }).click()
  await expect(
    list.getByRole('group', { name: 'Done' }).getByRole('option', { name: /AT-139/ }),
  ).toBeVisible()
  await expect(first).toHaveAttribute('aria-selected', 'true')
  await expect(list.getByRole('option', { name: /AT-138/ })).toBeFocused()
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
  await rows.last().click()
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
  await clear.press('Enter')
  await expect(rows).toHaveCount(10)
  await expect(rows.first()).toBeFocused()
})

// Begin the native drag before scrolling to the destination. Scrolling the
// page between pointerdown and dragstart can put another row under the pointer.
async function dragIssue(page: Page, source: Locator, destination: Locator) {
  await source.hover()
  const start = (await source.boundingBox())!
  await page.mouse.down()
  await page.mouse.move(start.x + start.width / 2 + 10, start.y + start.height / 2, { steps: 4 })
  await expect(source).toHaveAttribute('data-dragging', '')
  await destination.scrollIntoViewIfNeeded()
  const end = (await destination.boundingBox())!
  const x = end.x + end.width / 2
  const y = end.y + end.height / 2
  await page.mouse.move(x, y, { steps: 8 })
  await page.mouse.move(x + 1, y)
  await page.mouse.up()
}

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
    await unrelated.click()
    await dragIssue(page, first, page.getByRole('heading', { name: 'Issue tracker', exact: true }))
    await expect(first).toBeVisible()
    await expect(issues.locator('[data-dragging], [data-drag-over]')).toHaveCount(0)
    await expect(first).toHaveAttribute('draggable', 'true')
    await dragIssue(page, first, started.getByRole('option').first())
    await expect(started.getByRole('option', { name: /AT-142/ })).toBeVisible()
    await expect(unrelated).toBeFocused()
    await expect(unrelated).toHaveAttribute('aria-selected', 'true')
    await unrelated.press('Escape')

    await done.getByRole('option').first().click()
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('Shift+ArrowDown')
    await dragIssue(page, done.getByRole('option').first(), started)
    await expect(done).toContainText('No issues in Done.')
    await expect(page.getByRole('status')).toHaveText('Moved 3 issues to In progress.')
    await expect(issues.getByRole('option', { selected: true })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Cycle progress' })).toContainText('0%')

    await dragIssue(
      page,
      started.getByRole('option', { name: /AT-142/ }),
      done.getByText('No issues in Done.'),
    )
    await expect(done.getByRole('option', { name: /AT-142/ })).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('Moved 1 issue to Done.')
    await expect(page.getByRole('region', { name: 'Cycle progress' })).toContainText('10%')
  })
}
