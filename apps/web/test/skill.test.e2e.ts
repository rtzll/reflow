import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router } from './showcase-router.ts'

it('lets the visitor take over skill examples and replay their initial state', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/skill')
  const tabs = page.getByRole('tablist', { name: 'Reflow tabs' })
  await tabs.getByRole('tab', { name: 'Settings', exact: true }).click()
  assert.equal(
    await tabs.getByRole('tab', { name: 'Settings', exact: true }).getAttribute('aria-selected'),
    'true',
  )
  await tabs.getByRole('tab', { name: 'Settings', exact: true }).press('ArrowLeft')
  assert.equal(
    await tabs.getByRole('tab', { name: 'Settings', exact: true }).getAttribute('aria-selected'),
    'true',
  )
  await tabs.getByRole('tab', { name: 'Activity', exact: true }).press('Enter')
  assert.equal(
    await tabs.getByRole('tab', { name: 'Activity', exact: true }).getAttribute('aria-selected'),
    'true',
  )
  await page.getByRole('button', { name: 'Replay demonstration' }).first().click()
  assert.equal(
    await tabs.getByRole('tab', { name: 'Overview', exact: true }).getAttribute('aria-selected'),
    'true',
  )
  assert.equal(
    await page
      .locator('.skill-cursor')
      .first()
      .evaluate((cursor) => getComputedStyle(cursor).display),
    'none',
  )
  assert.deepEqual(errors, [])
})

it('copies an installation prompt that includes the active preferences', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(
    '/?theme=light&accent=violet&shape=pill&density=compact&font=geist-serif&fontWeight=600&icons=tabler',
  )
  await page.getByRole('button', { name: 'Copy install prompt', exact: true }).first().click()
  await page.getByRole('button', { name: 'Copied', exact: true }).waitFor()
  const prompt = await page.evaluate(() => navigator.clipboard.readText())
  for (const setting of [
    'theme: light',
    'accent: violet',
    'shape: pill',
    'density: compact',
    'font: geist-serif',
    'fontWeight: 600',
  ])
    assert.ok(prompt.includes(setting), setting)
  assert.ok(prompt.includes('skills/reflow/SKILL.md'))
  assert.ok(prompt.includes('showcase icon preference is tabler'))
  assert.ok(prompt.includes('Reflow does not require an icon package'))
})
