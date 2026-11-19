import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, expect } from 'playwright/test'
import type { Browser } from 'playwright/test'

const root = fileURLToPath(new URL('../', import.meta.url))
const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'reflow-package-')))
const destination = join(temporary, 'starter')
const tarball = process.argv[2] ? resolve(process.argv[2]) : join(temporary, 'rtzll-reflow.tgz')
let server: ChildProcess | undefined
let browser: Browser | undefined

const run = (command: string, args: string[], cwd = root) =>
  execFileSync(command, args, { cwd, stdio: 'inherit', timeout: 180_000 })

try {
  if (!process.argv[2]) {
    run('pnpm', ['pack', '--silent', '--out', tarball], join(root, 'packages/reflow'))
  }
  const files = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n')
  for (const name of [
    'package.json',
    'LICENSE',
    'NOTICE',
    'README.md',
    'dist/index.js',
    'dist/index.d.ts',
    'dist/highlight.js',
    'dist/highlight.d.ts',
    'dist/styles.css',
  ]) {
    assert.ok(files.includes(`package/${name}`), `Package is missing ${name}`)
  }
  for (const file of files) {
    assert.match(
      file,
      /^package\/(?:package\.json|LICENSE|NOTICE|README\.md|dist\/(?:(?:behaviors|systems)\/)?[^/]+\.(?:js|ts|css))$/,
    )
  }
  assert.equal(
    execFileSync('tar', ['-xOzf', tarball, 'package/LICENSE'], { encoding: 'utf8' }),
    readFileSync(join(root, 'LICENSE'), 'utf8'),
  )
  // Shiki is opt-in: only the highlight entry may import it.
  for (const file of files.filter((name) => /^package\/dist\/.+\.js$/.test(name))) {
    if (file === 'package/dist/highlight.js') continue
    const source = execFileSync('tar', ['-xOzf', tarball, file], { encoding: 'utf8' })
    assert.doesNotMatch(source, /from ['"](?:shiki|@shikijs\/)/, `${file} must not import Shiki`)
  }
  run(process.execPath, ['tools/create-starter.ts', destination, '--tarball', tarball])
  run('pnpm', ['install', '--frozen-lockfile'], destination)
  run('pnpm', ['check'], destination)
  const installed = realpathSync(join(destination, 'node_modules/@rtzll/reflow'))
  assert.ok(installed.startsWith(`${temporary}/`), 'The starter must not link to the workspace')
  // The optional peers stay out of an app that does not ask for them.
  const store = join(destination, 'node_modules/.pnpm')
  assert.ok(
    !existsSync(join(destination, 'node_modules/shiki')) &&
      !(existsSync(store) && readdirSync(store).some((name) => name.startsWith('shiki@'))),
    'Installing Reflow must not install Shiki',
  )

  const starter = spawn(process.execPath, ['--import', 'remix/node-tsx', 'server.ts'], {
    cwd: destination,
    env: { ...process.env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server = starter
  const url = await new Promise<string>((resolve, reject) => {
    let output = ''
    const timeout = setTimeout(() => reject(new Error(`Starter did not start: ${output}`)), 30_000)
    const receive = (chunk: Buffer) => {
      output += chunk.toString()
      const match = output.match(/listening on (http:\/\/127\.0\.0\.1:\d+)/)
      if (match) {
        clearTimeout(timeout)
        resolve(match[1])
      }
    }
    starter.stdout.on('data', receive)
    starter.stderr.on('data', receive)
    starter.once('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    starter.once('exit', (code) => {
      clearTimeout(timeout)
      reject(new Error(`Starter exited (${code}): ${output}`))
    })
  })
  browser = await chromium.launch()
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`)
  })
  await page.goto(url)
  await page.locator('[data-starter-ready]').waitFor({ state: 'attached' })
  await page.getByRole('button', { name: 'Preview alert', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Notification preview' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Preview alert', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Hide sidebar', exact: true }).click()
  await expect(page.locator('.rf-sidebar-layout')).toHaveAttribute('data-collapsed', 'true')
  await page.getByRole('button', { name: 'Show sidebar', exact: true }).click()
  await page.getByRole('button', { name: 'Theme', exact: true }).click()
  await page.getByRole('option', { name: 'Dark', exact: true }).click()
  await expect(page.locator('.starter')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('input[name=theme]')).toHaveValue('dark')
  await page.getByRole('switch', { name: 'Compact layout', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Weekly digest', exact: true }).check()
  await expect(page.locator('input[name=theme]')).toHaveValue('dark')
  await page.getByRole('button', { name: 'Apply settings', exact: true }).click()
  await page.waitForURL(
    (url) =>
      url.searchParams.get('theme') === 'dark' && url.searchParams.get('density') === 'compact',
  )
  await page.reload()
  await expect(page.locator('.starter')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('.starter')).toHaveAttribute('data-density', 'compact')
  await expect(page.getByRole('checkbox', { name: 'Weekly digest', exact: true })).toBeChecked()
  assert.equal(
    (await page
      .locator('.starter')
      .evaluate((element) => getComputedStyle(element).getPropertyValue('--rf-radius').trim())) !==
      '',
    true,
    'Packaged CSS must load',
  )
  assert.deepEqual(errors, [])
  console.log(
    'Package contents, isolated install, production assets, and starter interactions passed.',
  )
} finally {
  await browser?.close()
  if (server && server.exitCode === null) {
    const running = server
    const stopped = once(running, 'exit')
    running.kill('SIGTERM')
    const force = setTimeout(() => running.kill('SIGKILL'), 5000)
    await stopped
    clearTimeout(force)
  }
  rmSync(temporary, { recursive: true, force: true })
}
