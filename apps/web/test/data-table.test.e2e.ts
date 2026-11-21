import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('keeps team filtering, sorting, and pagination in the URL across reload and Back', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/?q=table&teamPage=3')
  const tile = page.locator('[data-component="table"]')
  const table = tile.getByRole('table', { name: 'Team members' })
  const filter = tile.getByRole('searchbox', { name: 'Filter Team members' })
  await filter.fill('Engineer')
  await expect(table.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/teamFilter=Engineer/)
  await table.getByRole('link', { name: 'Name' }).click()
  await table.getByRole('link', { name: 'Name' }).click()
  await expect(table.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
    'aria-sort',
    'descending',
  )
  await expect(table.locator('tbody tr').first()).toContainText('Kai')
  const next = tile.getByRole('link', { name: 'Next page' })
  await next.click()
  await expect(table.locator('tbody tr')).toHaveCount(1)
  await expect(table.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible()
  const url = new URL(page.url())
  expect(url.searchParams.get('q')).toBe('table')
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
