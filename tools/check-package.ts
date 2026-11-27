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
// Pass both archives to check them without packing: <reflow.tgz> <create-reflow.tgz>
const given = process.argv.slice(2).filter((arg) => arg !== '--')
const tarball = given[0] ? resolve(given[0]) : join(temporary, 'rtzll-reflow.tgz')
const createTarball = given[1] ? resolve(given[1]) : join(temporary, 'rtzll-create-reflow.tgz')
let server: ChildProcess | undefined
let browser: Browser | undefined

const run = (command: string, args: string[], cwd = root) =>
  execFileSync(command, args, { cwd, stdio: 'inherit', timeout: 180_000 })
const list = (archive: string) =>
  execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split('\n')
const extract = (archive: string, file: string) =>
  execFileSync('tar', ['-xOzf', archive, file], { encoding: 'utf8' })

interface DomainConfig {
  entry: string
  ssrEntry?: string
  css?: string
  peers: readonly string[]
  optionalPeer?: boolean
  coreForbiddenSelector?: string
}

interface StyleBundleConfig {
  css: string
  sourceCss: readonly string[]
  coreForbiddenSelector?: string
}

const domains = JSON.parse(
  readFileSync(join(root, 'packages/reflow/domains.json'), 'utf8'),
) as Record<string, DomainConfig>
const styleBundles = JSON.parse(
  readFileSync(join(root, 'packages/reflow/style-bundles.json'), 'utf8'),
) as Record<string, StyleBundleConfig>
const domainList = Object.values(domains)
const styleBundleList = Object.values(styleBundles)
const domainCssFiles = [
  ...domainList.flatMap((domain) => (domain.css ? [domain.css] : [])),
  ...styleBundleList.map((bundle) => bundle.css),
]
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

try {
  assert.ok(given.length === 0 || given.length === 2, 'Pass both archives or neither')
  if (given.length === 0) {
    run('pnpm', ['pack', '--silent', '--out', tarball], join(root, 'packages/reflow'))
    run('pnpm', ['pack', '--silent', '--out', createTarball], join(root, 'packages/create-reflow'))
  }
  const files = list(tarball)
  const expectedFiles = [
    'package.json',
    'LICENSE',
    'NOTICE',
    'README.md',
    'dist/index.js',
    'dist/index.d.ts',
    'dist/core.css',
    'dist/styles.css',
    ...domainList.flatMap((domain) => [
      `dist/${domain.entry}.js`,
      `dist/${domain.entry}.d.ts`,
      ...(domain.ssrEntry ? [`dist/${domain.ssrEntry}.js`, `dist/${domain.ssrEntry}.d.ts`] : []),
      ...(domain.css ? [`dist/${domain.css}`] : []),
    ]),
    ...styleBundleList.map((bundle) => `dist/${bundle.css}`),
  ]
  for (const name of expectedFiles) {
    assert.ok(files.includes(`package/${name}`), `Package is missing ${name}`)
  }
  const allowedCssAlternation = [
    'styles',
    'core',
    ...domainCssFiles.map((c) => c.replace(/\.css$/, '')),
  ]
    .map(escapeRegex)
    .join('|')
  const allowedTarballPattern = new RegExp(
    `^package\\/(?:package\\.json|LICENSE|NOTICE|README\\.md|dist\\/(?:(?:${allowedCssAlternation})\\.css|(?:(?:behaviors|systems)\\/)?[^/]+\\.(?:js|ts)))$`,
  )
  for (const file of files) {
    assert.match(file, allowedTarballPattern)
  }
  const shippedCss = extract(tarball, 'package/dist/styles.css')
  assert.doesNotMatch(shippedCss, /@import\b/, 'dist/styles.css must be a single bundled file')
  const sourceOrder = [
    ...readFileSync(join(root, 'packages/reflow/src/styles.css'), 'utf8').matchAll(
      /^@import\s+'\.\/([^']+)'\s+layer\(reflow\)\s*;$/gm,
    ),
  ].map(([, file]) => file)
  let previousIndex = -1
  for (const file of sourceOrder) {
    const marker = `/* ${file} */`
    const index = shippedCss.indexOf(marker)
    assert.ok(index > previousIndex, `dist/styles.css must preserve ${file} in source order`)
    previousIndex = index
  }
  const layerStart = shippedCss.indexOf('@layer reflow {')
  assert.ok(layerStart !== -1, 'dist/styles.css must wrap its rules in @layer reflow')
  assert.ok(shippedCss.trimEnd().endsWith('}'), 'dist/styles.css must close @layer reflow')
  const outsideLayer = shippedCss
    .slice(0, layerStart)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@property\s+[^{]+\{[^{}]*\}/g, '')
    .trim()
  assert.equal(outsideLayer, '', 'Only @property declarations may sit outside @layer reflow')
  // Explicit named re-exports let unbundled servers resolve only imported components.
  assert.doesNotMatch(
    extract(tarball, 'package/dist/index.js'),
    /^export\s*\*/m,
    'dist/index.js must use explicit named re-exports instead of export *',
  )
  assert.equal(extract(tarball, 'package/LICENSE'), readFileSync(join(root, 'LICENSE'), 'utf8'))
  // Per-domain stylesheets sit inside @layer reflow just like styles.css.
  for (const cssFile of [
    'package/dist/core.css',
    ...domainCssFiles.map((c) => `package/dist/${c}`),
  ]) {
    assert.ok(files.includes(cssFile), `Tarball must include ${cssFile}`)
    assert.match(extract(tarball, cssFile), /@layer reflow \{/, `${cssFile} must use @layer reflow`)
  }
  const forbiddenCoreSelectors = [...domainList, ...styleBundleList]
    .flatMap((domain) => (domain.coreForbiddenSelector ? [domain.coreForbiddenSelector] : []))
    .join('|')
  if (forbiddenCoreSelectors) {
    assert.doesNotMatch(
      extract(tarball, 'package/dist/core.css'),
      new RegExp(forbiddenCoreSelectors),
      'dist/core.css must exclude specialist domain stylesheets',
    )
  }
  // Specialist peers stay strictly isolated to their designated entry points.
  const distJsFiles = files.filter((name) => /^package\/dist\/.+\.js$/.test(name))
  for (const domain of domainList) {
    const allowed = new Set([
      `package/dist/${domain.entry}.js`,
      ...(domain.ssrEntry ? [`package/dist/${domain.ssrEntry}.js`] : []),
    ])
    const peerImportPattern = new RegExp(
      `['"](?:${domain.peers.map(escapeRegex).join('|')})(?:/[^'"]*)?['"]`,
    )
    for (const file of distJsFiles) {
      if (allowed.has(file)) continue
      assert.doesNotMatch(
        extract(tarball, file),
        peerImportPattern,
        `${file} must not import ${domain.peers.join(' / ')}`,
      )
    }
    assert.match(
      extract(tarball, `package/dist/${domain.entry}.js`),
      peerImportPattern,
      `dist/${domain.entry}.js should import ${domain.peers[0]}`,
    )
    if (domain.ssrEntry) {
      assert.match(
        extract(tarball, `package/dist/${domain.ssrEntry}.js`),
        peerImportPattern,
        `dist/${domain.ssrEntry}.js should import ${domain.peers[0]}`,
      )
    }
  }

  // The create package ships its command and the starter, pinned to this release.
  const library = JSON.parse(extract(tarball, 'package/package.json'))
  const createFiles = list(createTarball)
  for (const name of [
    'package.json',
    'LICENSE',
    'README.md',
    'dist/index.js',
    'dist/create.js',
    'template/_gitignore',
    'template/package.json',
    'template/pnpm-workspace.yaml',
    'template/server.ts',
  ]) {
    assert.ok(createFiles.includes(`package/${name}`), `Create package is missing ${name}`)
  }
  for (const file of createFiles) {
    assert.match(
      file,
      /^package\/(?:package\.json|LICENSE|README\.md|dist\/[^/]+\.js|template\/.+)$/,
    )
    assert.doesNotMatch(file, /\/(?:node_modules|vendor)\/|pnpm-lock\.yaml$|\/\.gitignore$/)
  }
  const created = JSON.parse(extract(createTarball, 'package/package.json'))
  assert.equal(created.version, library.version, 'Both packages share one version')
  assert.equal(
    JSON.parse(extract(createTarball, 'package/template/package.json')).dependencies[
      '@rtzll/reflow'
    ],
    library.version,
    'The template installs the Reflow release with the same version',
  )
  // As npm create runs it. This version may not be on npm yet, so install
  // the packed library instead in the second run.
  run(
    'npm',
    [
      'exec',
      '--yes',
      `--package=${createTarball}`,
      '--',
      'create-reflow',
      destination,
      '--no-install',
    ],
    temporary,
  )
  assert.equal(
    JSON.parse(readFileSync(join(destination, 'package.json'), 'utf8')).dependencies[
      '@rtzll/reflow'
    ],
    library.version,
  )
  rmSync(destination, { recursive: true })
  run(
    'npm',
    [
      'exec',
      '--yes',
      `--package=${createTarball}`,
      '--',
      'create-reflow',
      destination,
      '--tarball',
      tarball,
    ],
    temporary,
  )
  run('pnpm', ['install', '--frozen-lockfile'], destination)
  run('pnpm', ['check'], destination)
  const installed = realpathSync(join(destination, 'node_modules/@rtzll/reflow'))
  assert.ok(installed.startsWith(`${temporary}/`), 'The starter must not link to the workspace')
  // The optional peers stay out of an app that does not ask for them.
  const store = join(destination, 'node_modules/.pnpm')
  const storeEntries = existsSync(store) ? readdirSync(store) : []
  for (const domain of domainList) {
    if (!domain.optionalPeer) continue
    for (const peer of domain.peers) {
      const storePrefix = `${peer.replace('/', '+')}@`
      assert.ok(
        !existsSync(join(destination, 'node_modules', peer)) &&
          !storeEntries.some((name) => name.startsWith(storePrefix)),
        `Installing Reflow must not install ${peer}`,
      )
    }
  }

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
  const stylesheetRequests: string[] = []
  const scriptRequests: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`)
    const type = response.request().resourceType()
    if (type === 'stylesheet') stylesheetRequests.push(new URL(response.url()).pathname)
    if (type === 'script') scriptRequests.push(new URL(response.url()).pathname)
  })
  await page.goto(url)
  await page.locator('[data-starter-ready]').waitFor({ state: 'attached' })
  assert.equal(
    stylesheetRequests.length,
    2,
    `Starter should load only Reflow styles.css and starter.css, got ${stylesheetRequests.join(', ')}`,
  )
  const reflowScripts = scriptRequests
    .map((path) => decodeURIComponent(path))
    .filter((path) => path.includes('/@rtzll/reflow/dist/'))
  assert.ok(
    reflowScripts.length > 0 && reflowScripts.length <= 30,
    `Expected direct Reflow script loads (<= 30), got ${reflowScripts.length} (all scripts: ${scriptRequests.join(', ')})`,
  )
  for (const unused of ['color-picker', 'time-grid', 'bar-chart', 'data-table']) {
    assert.ok(
      !reflowScripts.some((path) => path.includes(`/${unused}.`)),
      `Starter should not load unused Reflow module ${unused}`,
    )
  }
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
  assert.equal(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--rf-drawer-drag').trim(),
    ),
    '0px',
    'Packaged @property declarations must register',
  )
  assert.equal(
    await page.evaluate(() => {
      const style = document.createElement('style')
      style.textContent = '.rf-button { border-radius: 99px; }'
      // Prepending before the library stylesheet proves unlayered app CSS beats @layer reflow regardless of source order.
      document.head.prepend(style)
      try {
        const button = document.querySelector<HTMLElement>('.rf-button')
        return button ? getComputedStyle(button).borderRadius : ''
      } finally {
        style.remove()
      }
    }),
    '99px',
    'Unlayered app CSS must override packaged @layer reflow rules',
  )
  assert.deepEqual(errors, [])
  console.log(
    'Package contents, the create command, isolated install, production assets, and starter interactions passed.',
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
