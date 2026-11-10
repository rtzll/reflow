import { readFileSync } from 'node:fs'
import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

const { version } = JSON.parse(
  readFileSync(new URL('../../../packages/reflow/package.json', import.meta.url), 'utf8'),
) as { version: string }

it('lets the visitor take over skill examples and replay their initial state', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, '/docs/skill')
  // Clicks before hydration land on inert markup.
  const tabs = page.getByRole('tablist', { name: 'Reflow tabs' })
  const tab = (name: string) => tabs.getByRole('tab', { name, exact: true })
  await tab('Settings').click()
  await expect(tab('Settings')).toHaveAttribute('aria-selected', 'true')
  // Arrow keys move focus without selecting; Enter selects.
  await tab('Settings').press('ArrowLeft')
  await expect(tab('Settings')).toHaveAttribute('aria-selected', 'true')
  await tab('Activity').press('Enter')
  await expect(tab('Activity')).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('button', { name: 'Replay demonstration' }).first().click()
  await expect(tab('Overview')).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.skill-cursor').first()).toHaveCSS('display', 'none')
  assert.deepEqual(errors, [])
})

it('copies an installation prompt that includes the active preferences', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(
    page,
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
  assert.ok(prompt.includes(`pnpm add --save-exact @rtzll/reflow@${version} remix@3.2.0`))
  assert.ok(prompt.includes('skills/reflow/SKILL.md'))
  assert.ok(prompt.includes('showcase icon preference is tabler'))
  assert.ok(prompt.includes('Reflow does not require an icon package'))
})

it('copies a prompt that installs the skill with npx and audits the project', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, '/docs/skill')
  await page.getByRole('button', { name: 'Copy prompt', exact: true }).first().click()
  await page.getByRole('button', { name: 'Copied', exact: true }).waitFor()
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    'Install the reflow skill with `npx skills add rtzll/reflow -g -y` (skip this if you already have it). Then read its SKILL.md and use it to audit this project.',
  )
})
