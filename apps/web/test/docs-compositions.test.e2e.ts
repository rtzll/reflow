import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router } from './showcase-router.ts'

it('lets external question controls load, navigate, and clear answer state', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const hydration = Promise.withResolvers<void>()
  await page.route(/\/doc-preview(?:\.@[^.]+)?\.tsx(?:\?.*)?$/, async (route) => {
    await hydration.promise
    await route.continue()
  })
  const example = page.locator('#controlled .doc-preview')
  const loadSample = example.getByRole('button', { name: 'Load sample answer' })
  try {
    await page.goto('/docs/ask-user-questions', { waitUntil: 'commit' })
    await loadSample.waitFor()
    assert.ok(await loadSample.isDisabled())
  } finally {
    hydration.resolve()
  }
  await loadSample.click()
  assert.ok(await example.getByRole('radio', { name: 'Engineer', exact: true }).isChecked())
  await example.getByRole('tab', { name: 'Tool', exact: true }).click()
  await example.getByRole('radio', { name: 'Figma', exact: true }).click()
  await example.getByRole('tab', { name: 'Role', exact: true }).click()
  assert.ok(await example.getByRole('radio', { name: 'Engineer', exact: true }).isChecked())
  const state = await example.locator('.doc-controlled-state pre').textContent()
  assert.ok(state?.includes('eng'))
  assert.ok(state?.includes('figma'))
  await example.getByRole('button', { name: 'Clear answers' }).click()
  assert.equal(await example.locator('.doc-controlled-state pre').textContent(), '{}')
  assert.equal(
    await example.getByRole('radio', { name: 'Engineer', exact: true }).isChecked(),
    false,
  )
})

it('streams reasoning text, replays it, and displays local images and expandable sources', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/thinking-steps')
  const basic = page.locator('#basic .rf-thinking-steps-disclosure')
  const trigger = basic.locator(':scope > summary')
  const nested = basic.getByText('Explored 6 files', { exact: true })
  assert.ok(await nested.isVisible())
  await nested.click()
  await basic.getByText('Read accordion.tsx', { exact: true }).waitFor()
  await trigger.press('Space')
  await nested.waitFor({ state: 'hidden' })
  await trigger.press('Space')
  await basic.getByText('Read accordion.tsx', { exact: true }).waitFor()

  const stream = page.locator('#streaming-text .doc-preview')
  await stream.locator('.doc-streaming-text').scrollIntoViewIfNeeded()
  await page.waitForFunction(
    () =>
      document.querySelector('#streaming-text .doc-streaming-text')?.getAttribute('aria-busy') ===
      'false',
  )
  const text = await stream.locator('.doc-streaming-text').textContent()
  assert.ok((text?.length ?? 0) > 100)
  await stream.getByRole('button', { name: 'Replay example' }).click()
  assert.equal(await stream.locator('.doc-streaming-text').getAttribute('aria-busy'), 'true')

  await page.getByRole('heading', { name: 'With Images', exact: true }).scrollIntoViewIfNeeded()
  const image = page.locator('#with-images .rf-thinking-step-image img')
  await image.waitFor()
  await page.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>(
      '#with-images .rf-thinking-step-image img',
    )
    return image?.complete && image.naturalWidth > 0
  })
  assert.equal(await image.getAttribute('alt'), 'Reflow component showcase preview')
  const sources = page.locator('#sources-and-details .doc-research-content')
  await sources.locator('summary').click()
  await sources.getByText('Component anatomy', { exact: true }).waitFor()

  const custom = page.locator('#custom-content .rf-thinking-steps')
  await custom.locator('summary').press('Space')
  await custom.getByText('Build verified', { exact: true }).waitFor({ state: 'hidden' })
  await custom.locator('summary').press('Enter')
  await custom.getByText('Build verified', { exact: true }).waitFor()
})

it('keeps workspace switching, project creation and profile controls functional inside the sidebar composition', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/sidebar')
  const example = page.locator('#workspace-composition .doc-preview')
  await example.getByRole('button', { name: 'Acme Inc', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Design Studio', exact: true }).click()
  await example.getByRole('button', { name: 'Design Studio', exact: true }).waitFor()
  await example.getByRole('button', { name: 'New project', exact: true }).click()
  const project = page.getByRole('dialog', { name: 'New project', exact: true })
  await project.getByLabel('Project name', { exact: true }).fill('Launch')
  await project.getByRole('button', { name: 'Create project', exact: true }).click()
  await example.getByRole('heading', { name: 'Launch', exact: true }).waitFor()
  await example.locator('.rf-sidebar-toolbar').getByText('Design Studio / Launch').waitFor()
  assert.ok((await example.locator('.rf-sidebar-nav a').filter({ hasText: 'Launch' }).count()) > 0)
  await example.getByRole('button', { name: 'Alex Morgan', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Profile settings', exact: true }).click()
  const profile = page.getByRole('dialog', { name: 'Profile settings', exact: true })
  await profile.getByLabel('Display name', { exact: true }).fill('Sam')
  await profile.getByRole('button', { name: 'Done', exact: true }).click()
  await example.getByRole('button', { name: 'Sam', exact: true }).waitFor()
})
