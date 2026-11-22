import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('copies details of the filtered team member from the row menu and the actions button', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, '/?q=table&teamFilter=Bob')
  const tile = page.locator('[data-component="data-table"]')
  const row = tile.getByRole('row', { name: /Bob/ })
  await row.click({ button: 'right' })
  const contextMenu = tile.getByRole('menu', { name: 'Team members row actions' })
  await contextMenu.getByRole('menuitem', { name: 'Copy details' }).hover()
  await contextMenu.getByRole('menuitem', { name: 'Role', exact: true }).click()
  await expect(tile.getByRole('status').filter({ hasText: 'Copied Designer.' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Designer')
  await expect(contextMenu).toBeHidden()
  await row.getByRole('button', { name: 'Actions for Bob' }).click()
  const buttonMenu = tile.getByRole('menu', { name: 'Actions for Bob' })
  await buttonMenu.getByRole('menuitem', { name: 'Copy details' }).press('ArrowRight')
  await buttonMenu.getByRole('menuitem', { name: 'Status', exact: true }).press('Enter')
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Away')
})

it('keeps team filtering, sorting, and pagination in the URL across reload and Back', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/?q=table&teamPage=3')
  const tile = page.locator('[data-component="data-table"]')
  const table = tile.getByRole('table', { name: 'Team members' })
  const filter = tile.getByRole('searchbox', { name: 'Filter Team members' })
  await filter.fill('Engineer')
  await expect(table.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/teamFilter=Engineer/)
  const sortByName = table.getByRole('link', { name: 'Name' })
  const nameColumn = table.getByRole('columnheader', { name: 'Name' })
  await sortByName.click()
  await expect(nameColumn).toHaveAttribute('aria-sort', 'ascending')
  await sortByName.click()
  await expect(nameColumn).toHaveAttribute('aria-sort', 'descending')
  await expect(table.locator('tbody tr').first()).toContainText('Kai')
  const next = tile.getByRole('link', { name: 'Next page' })
  await next.click()
  await expect(table.locator('tbody tr')).toHaveCount(1)
  await expect(table.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible()
  const url = new URL(page.url())
  expect(url.searchParams.get('q')).toBe('table')
  expect(url.searchParams.get('teamSort')).toBe('name')
  expect(url.searchParams.get('teamDir')).toBe('desc')
  expect(url.searchParams.get('teamPage')).toBe('2')
  await open(page, url.pathname + url.search + url.hash)
  await expect(filter).toHaveValue('Engineer')
  await expect(table.locator('tbody tr')).toHaveCount(1)
  await tile.getByRole('link', { name: 'Previous page' }).click()
  await expect(table.locator('tbody tr')).toHaveCount(4)
  await page.goBack()
  await expect(table.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible()
  await expect(table.locator('tbody tr')).toHaveCount(1)
})

it('finds and sorts props in the Dropdown API reference, including from a server-rendered link', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/docs/dropdown?apiFilter=search')
  const api = page.getByRole('region', { name: 'Dropdown API reference' })
  await expect(api.getByRole('searchbox')).toHaveValue('search')
  await expect(api.getByRole('rowheader', { name: 'searchable', exact: true })).toBeVisible()
  await api.getByRole('link', { name: 'Prop', exact: true }).click()
  await expect(api.getByRole('columnheader', { name: 'Prop' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  )
  await api.getByRole('searchbox').fill('nothing matches this')
  await expect(api.getByText('No matching results')).toBeVisible()
  await page.route('**/*.js', (route) => route.abort())
  await open(page, '/docs/dropdown?apiPage=2', { hydrate: false })
  await expect(api.getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  await api.getByRole('link', { name: 'Previous page' }).click()
  await expect(api.getByRole('rowheader', { name: 'label', exact: false })).toBeVisible()
})

it('shows the directory in the DataTable playground with a working page-size control', async (t) => {
  const page = await t.serve(showcaseServer)
  const response = await open(page, '/docs/data-table')
  expect(response?.status()).toBe(200)
  const settings = page.getByRole('region', { name: 'DataTable playground settings' })
  await settings.getByLabel('Rows per page').selectOption('8')
  const table = page.getByRole('table', { name: 'Team members' })
  await expect(table.locator('tbody tr')).toHaveCount(8)
  await page.getByRole('tab', { name: 'Code', exact: true }).first().click()
  await expect(page.getByRole('tabpanel', { name: 'Code' }).first()).toContainText('pageSize={8}')
})

it('submits a team filter without JavaScript and preserves sort and gallery search', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.route('**/*.js', (route) => route.abort())
  await open(page, '/?q=table&teamSort=name&teamDir=desc&teamPage=2', { hydrate: false })
  const tile = page.locator('[data-component="data-table"]')
  const filter = tile.getByRole('searchbox')
  await filter.fill('Designer')
  await filter.press('Enter')
  await expect(page).toHaveURL(/teamFilter=Designer/)
  expect(new URL(page.url()).searchParams.get('q')).toBe('table')
  await expect(tile.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
    'aria-sort',
    'descending',
  )
  await expect(tile.locator('tbody tr').first()).toContainText('Lina')
})

it('reopens the original routed page after editing the filter in place', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/?teamPage=2')
  const tile = page.locator('[data-component="data-table"]')
  const filter = tile.getByRole('searchbox')
  const secondPage = tile.getByRole('link', { name: 'Page 2', exact: true })
  await expect(tile.getByRole('cell', { name: 'Emilia', exact: true })).toBeVisible()
  await filter.fill('Alice')
  await filter.fill('')
  await expect(tile.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible()
  await secondPage.click()
  await expect(secondPage).toHaveAttribute('aria-current', 'page')
  await expect(tile.getByRole('cell', { name: 'Emilia', exact: true })).toBeVisible()
})

it('keeps the current team page usable until a page link finishes loading', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/?q=table')
  const tile = page.locator('[data-component="data-table"]')
  const next = tile.getByRole('link', { name: 'Next page' })
  const pending = page.waitForEvent(
    'request',
    (request) => new URL(request.url()).searchParams.get('teamPage') === '2',
  )
  const response = Promise.withResolvers<void>()
  await page.route(/teamPage=2/, async (route) => {
    await response.promise
    await route.continue()
  })
  const navigating = next.press('Enter')
  try {
    await pending
    await expect(tile.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
  } finally {
    response.resolve()
    await navigating
  }
  await expect(tile.getByRole('cell', { name: 'Emilia', exact: true })).toBeVisible()
  await page.goBack()
  await expect(tile.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible()
})

it('copies a keyboard selection in displayed order and restores focus in the team directory', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, '/docs/data-table')
  const table = page.getByRole('table', { name: 'Team members', exact: true })
  const box = (name: string) => table.getByRole('checkbox', { name: 'Select ' + name, exact: true })
  const filter = page.getByRole('searchbox', { name: 'Filter Team members' })
  const actions = page.getByRole('toolbar', { name: 'Selected row actions' })
  await box('Alice').press('Space')
  await table.getByRole('button', { name: 'Name', exact: true }).click()
  await expect(actions).toHaveCount(0)
  await table.getByRole('button', { name: 'Name', exact: true }).click()
  await filter.fill('Engineer')
  await box('Kai').press('Shift+ArrowDown')
  await box('Hugo').press('Shift+ArrowDown')
  await box('Emilia').press('Shift+ArrowUp')
  await expect(box('Hugo')).toBeFocused()
  await expect(box('Emilia')).not.toBeChecked()
  await actions.getByRole('button', { name: 'Copy names' }).press('Enter')
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Kai\nHugo')
  await expect(page.getByText('Copied 2 member names.', { exact: true })).toBeVisible()
  await expect(box('Hugo')).toBeFocused()
  await expect(actions).toHaveCount(0)
  await box('Kai').press('Space')
  await filter.fill('Designer')
  await expect(actions).toHaveCount(0)
  await table.getByRole('checkbox', { name: 'Select all rows on this page' }).check()
  await expect(actions).toContainText('4 selected')
  await filter.fill('')
  await box('Lina').press('Space')
  await page
    .getByRole('navigation', { name: 'Team pages' })
    .getByRole('button', { name: 'Next page' })
    .click()
  await expect(actions).toHaveCount(0)
})

it('retains the gallery selection after a clipboard failure so the action can be retried', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, '/?q=table&teamFilter=Alice')
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, 'writeText', {
      configurable: true,
      async value() {
        Reflect.deleteProperty(navigator.clipboard, 'writeText')
        throw new DOMException('Clipboard unavailable', 'NotAllowedError')
      },
    })
  })
  const tile = page.locator('[data-component="data-table"]')
  const checkbox = tile.getByRole('checkbox', { name: 'Select Alice' })
  const copy = tile
    .getByRole('toolbar', { name: 'Selected row actions' })
    .getByRole('button', { name: 'Copy names' })
  await checkbox.check()
  await copy.click()
  await expect(tile.getByText('Could not copy to the clipboard.')).toBeVisible()
  await expect(checkbox).toBeChecked()
  await copy.press('Enter')
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Alice')
  await expect(checkbox).not.toBeChecked()
  await expect(checkbox).toBeFocused()
})

it('clears a locally typed gallery filter when navigating back to the initial URL and suppresses empty Enter submits', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/')
  const tile = page.locator('[data-component="data-table"]')
  const filter = tile.getByRole('searchbox')
  await filter.fill('Alice')
  await expect(tile.locator('tbody tr')).toHaveCount(1)
  await filter.fill('')
  await filter.press('Enter')
  expect(new URL(page.url()).searchParams.has('teamFilter')).toBe(false)
  await filter.fill('Alice')
  await expect(tile.locator('tbody tr')).toHaveCount(1)
  await page
    .locator('.site-primary-nav')
    .getByRole('link', { name: 'Showcase', exact: true })
    .click()
  await expect(filter).toHaveValue('')
  await expect(tile.locator('tbody tr')).toHaveCount(4)
})

it('selects every matching team member across pages and copies them in order', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, '/docs/data-table')
  const table = page.getByRole('table', { name: 'Team members', exact: true })
  const actions = page.getByRole('toolbar', { name: 'Selected row actions' })
  await page.getByRole('searchbox', { name: 'Filter Team members' }).fill('Engineer')
  await table.getByRole('checkbox', { name: 'Select all rows on this page' }).check()
  const offer = actions.getByRole('button', { name: /^Select all \d+ matching$/ })
  const total = Number((await offer.textContent())!.match(/\d+/)![0])
  const names = await table.getByRole('rowheader').allTextContents()
  await offer.click()
  await expect(actions).toContainText(`All ${total} selected`)
  await expect(actions.getByRole('button', { name: 'Select this page only' })).toBeFocused()

  // A page link keeps the selection and checks every row there.
  await page
    .getByRole('navigation', { name: 'Team pages' })
    .getByRole('button', { name: 'Next page' })
    .click()
  await expect(actions).toContainText(`All ${total} selected`)
  for (const box of await table.getByRole('checkbox').all()) await expect(box).toBeChecked()
  names.push(...(await table.getByRole('rowheader').allTextContents()))

  await actions.getByRole('button', { name: 'Copy names' }).click()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  assert.equal(copied.split('\n').length, total)
  assert.deepEqual(
    copied.split('\n').slice(0, names.length),
    names.map((name) => name.trim()),
  )
  await expect(actions).toHaveCount(0)
})
