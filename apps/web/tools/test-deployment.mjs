import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'

const root = fileURLToPath(new URL('../', import.meta.url))
process.chdir(root)
process.env.WRANGLER_LOG_PATH = resolve(root, '.wrangler/logs')
process.env.WRANGLER_SEND_METRICS = 'false'
const { unstable_dev } = await import('wrangler')

// Inspect both the public files and Worker bundle for machine-specific paths.
for (const directory of ['client', 'worker']) {
  for (const file of await readdir(resolve(root, 'build', directory), { recursive: true })) {
    if (!/\.[^/]+$/.test(file)) continue
    assert.ok(!/(?:^|\/)(?:\.env|\.dev\.vars|wrangler|metadata|manifest)/.test(file), file)
    assert.ok(!/\.(?:map|tsx?|toml|jsonc)$/.test(file), file)
    const bytes = await readFile(resolve(root, 'build', directory, file))
    assert.ok(!bytes.includes(Buffer.from(homedir())), `Home directory leaked in ${file}`)
    assert.ok(!bytes.includes(Buffer.from(root)), `Checkout path leaked in ${file}`)
  }
}
const metadata = JSON.parse(await readFile(resolve(root, 'build/metadata.json'), 'utf8'))
assert.ok(!Object.keys(metadata.worker.inputs).includes('app/assets.ts'))
assert.ok(!Object.keys(metadata.worker.inputs).some((path) => path.includes('@remix-run/assets')))

const worker = await unstable_dev('build/worker/index.js', {
  config: 'wrangler.jsonc',
  local: true,
  ip: '127.0.0.1',
  port: 0,
  inspectorPort: 0,
  persist: false,
  logLevel: 'error',
  experimental: {
    forceLocal: true,
    watch: false,
    disableDevRegistry: true,
    disableExperimentalWarning: true,
  },
})
let browser
try {
  const origin = `http://${worker.address}:${worker.port}`
  for (const path of ['/', '/docs', '/docs/button', '/demo?c=dropdown&theme=dark']) {
    const response = await fetch(origin + path)
    assert.equal(response.status, 200, path)
    assert.match(response.headers.get('content-type'), /text\/html/)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.ok(!(await response.text()).includes(homedir()), path)
  }
  for (const path of [
    '/missing',
    '/docs/not-a-component',
    '/assets/missing.js',
    '/.env',
    '/.dev.vars',
    '/wrangler.local.jsonc',
    '/manifest.json',
    '/metadata.json',
    '/worker/index.js',
    '/assets/app/actions/controller.tsx',
  ]) {
    assert.equal((await fetch(origin + path)).status, 404, path)
  }
  const manifest = JSON.parse(await readFile(resolve(root, 'build/manifest.json'), 'utf8'))
  for (const [path, type] of [
    [manifest.page.entry.href, /javascript/],
    ...manifest.page.stylesheets.map((href) => [href, /text\/css/]),
    ...Object.values(manifest.entries).map(({ href }) => [href, /javascript/]),
  ]) {
    const response = await fetch(origin + path)
    assert.equal(response.status, 200, path)
    assert.match(response.headers.get('content-type'), type, path)
    assert.match(response.headers.get('cache-control'), /immutable/, path)
  }

  browser = await chromium.launch()
  const page = await browser.newPage({ baseURL: origin })
  async function openShowcase(path) {
    await page.goto(path)
    // The entry waits for Remix hydration before it finishes evaluating.
    await page.evaluate(async (entry) => {
      await import(entry)
    }, manifest.page.entry.href)
  }
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
  })
  await openShowcase('/docs/tabs?theme=dark&density=compact')
  const preview = page.locator('.doc-preview').first()
  await preview.getByRole('tab', { name: 'Recents' }).click()
  await expect(preview.getByRole('tabpanel', { name: 'Recents' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')

  const docs = await page
    .locator('a[href^="/docs/"]')
    .evaluateAll((links) => [...new Set(links.map((link) => new URL(link.href).pathname))])
  assert.ok(docs.length > 30)
  for (const path of docs) {
    const response = await fetch(origin + path)
    assert.equal(response.status, 200, path)
    assert.match(await response.text(), /<\/html>/, path)
  }

  await openShowcase('/docs/button')
  await preview.getByRole('button', { name: 'Get started', exact: true }).click()
  await expect(preview.getByText('Ready to start')).toBeVisible()
  await page
    .locator('.site-right .doc-playground-controls')
    .getByLabel('Label', { exact: true })
    .fill('Try Reflow')
  await expect(preview.getByRole('button', { name: 'Try Reflow', exact: true })).toBeVisible()

  await openShowcase('/demo?c=dropdown&theme=dark')
  await page.getByRole('button', { name: 'Email', exact: true }).click()
  await page.getByRole('menuitemradio', { name: 'Notifications' }).click()
  await expect(
    page.locator('button[aria-haspopup="menu"]', { hasText: 'Notifications' }),
  ).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await openShowcase('/docs/input-message')
  const composer = preview.getByRole('textbox', { name: 'Message' })
  await composer.fill('Local Worker demo')
  await composer.press('Enter')
  await expect(page.getByText('Local Worker demo', { exact: true })).toBeVisible()

  const noScript = await browser.newPage({ baseURL: origin, javaScriptEnabled: false })
  await noScript.goto('/docs/button')
  await expect(noScript.getByRole('region', { name: 'Button API reference' })).toBeVisible()
  assert.deepEqual(errors, [])
  console.log(
    `Local Worker checks passed: ${docs.length} docs routes, assets, 404s, hydration, playgrounds, mobile, and SSR without JavaScript.`,
  )
} finally {
  await browser?.close()
  await worker.stop()
}
