import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import type { Browser } from 'playwright'
import { expect } from 'playwright/test'
import { startLocalWorker } from './local-worker.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
process.chdir(root)

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
assert.ok(
  !Object.keys(metadata.worker.inputs).some((path) =>
    path.includes('@atlaskit/pragmatic-drag-and-drop'),
  ),
)
interface DomainConfig {
  peers: readonly string[]
  optionalPeer?: boolean
}
const domains = JSON.parse(
  await readFile(resolve(root, '../../packages/reflow/domains.json'), 'utf8'),
) as Record<string, DomainConfig>
for (const [name, domain] of Object.entries(domains)) {
  if (!domain.optionalPeer) continue
  const peerPattern = new RegExp(
    `(?:^|/)(?:${domain.peers.map((peer) => peer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?:/|$)`,
  )
  assert.ok(
    !Object.keys(metadata.worker.inputs).some(
      (path) => peerPattern.test(path) && !path.startsWith(`reflow-worker-${name}-stub:`),
    ),
    `Worker bundle must not include ${domain.peers.join(' or ')}`,
  )
}

const appSlugs = (await readdir(resolve(root, 'app/public/apps'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name !== 'directory')
  .map((entry) => entry.name)
  .sort()

const worker = await startLocalWorker()
let browser: Browser | undefined
try {
  const origin = `http://${worker.address}:${worker.port}`
  for (const path of [
    '/',
    '/docs',
    '/docs/button',
    '/docs/dropdown?theme=dark',
    '/docs/file-tree',
    '/docs/diagram',
    '/apps',
    ...appSlugs.map((slug) => `/apps/${slug}`),
  ]) {
    const response = await fetch(origin + path)
    assert.equal(response.status, 200, path)
    assert.match(response.headers.get('content-type') ?? '', /text\/html/)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    const html = await response.text()
    assert.ok(!html.includes(homedir()), path)
    if (path === '/docs/file-tree') {
      assert.ok(
        html.includes('<file-tree-container id="docs-file-tree-example"'),
        'Built Worker must serve zero-flash Declarative Shadow DOM FileTree on /docs/file-tree',
      )
    }
    if (path === '/docs/diagram') {
      assert.ok(
        html.includes('<svg') && html.includes('class="pele '),
        'Built Worker must serve zero-flash Pele Mermaid SVG on /docs/diagram',
      )
    }
    if (path === '/apps/review') {
      assert.ok(
        html.includes('<diffs-container><template shadowrootmode="open">'),
        'Built Worker must serve zero-flash Declarative Shadow DOM diffs on /apps/review',
      )
      assert.ok(
        html.includes('<file-tree-container id="review-files-tree"'),
        'Built Worker must serve zero-flash Declarative Shadow DOM FileTree on /apps/review',
      )
      assert.ok(
        html.includes('<svg') && html.includes('class="pele '),
        'Built Worker must serve zero-flash Pele Mermaid SVG on /apps/review',
      )
      assert.ok(
        !html.includes('class="rf-diff-fallback"'),
        '/apps/review must not emit diff fallback',
      )
    }
  }
  for (const [path, destination] of [
    ['/docs/app-sidebar', '/docs/sidebar'],
    ['/docs/settings-dialog', '/docs/dialog#with-a-sidebar'],
  ]) {
    const response = await fetch(origin + path, { redirect: 'manual' })
    assert.equal(response.status, 301, path)
    assert.equal(response.headers.get('location'), origin + destination, path)
  }
  const directory = await (await fetch(origin + '/llms.txt')).text()
  const tabsHref = directory.match(/^- \[Tabs\]\(([^)]+)\)/m)?.[1]
  assert.equal(tabsHref, origin + '/docs/tabs.md')
  const tabsMarkdown = await fetch(tabsHref)
  assert.equal(tabsMarkdown.headers.get('content-type'), 'text/markdown; charset=utf-8')
  const tabsText = await tabsMarkdown.text()
  assert.match(tabsText, /export function ProjectTabs/)
  const motion = await (await fetch(origin + '/docs/motion.md')).text()
  assert.ok(motion.includes('motionExit.slow') && motion.includes('## All tokens'))
  // Link previews need an absolute image URL that the built site serves.
  const home = await (await fetch(origin + '/docs/button')).text()
  const ogImage = home.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
  assert.equal(ogImage, `${origin}/og.png`)
  assert.ok(ogImage)
  const image = await fetch(ogImage)
  assert.equal(image.status, 200)
  assert.equal(image.headers.get('content-type'), 'image/png')
  assert.match(home, /<meta name="twitter:card" content="summary_large_image"/)
  for (const path of [
    '/missing',
    '/docs/not-a-component',
    '/apps/not-an-app',
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
  const assets: [string, RegExp][] = [
    [manifest.page.entry.href, /javascript/],
    ...manifest.page.stylesheets.map((href: string): [string, RegExp] => [href, /text\/css/]),
    ...Object.values(manifest.appStyles as Record<string, string>).map((href): [string, RegExp] => [
      href,
      /text\/css/,
    ]),
    ...Object.values(manifest.entries as Record<string, { href: string }>).map(
      ({ href }): [string, RegExp] => [href, /javascript/],
    ),
  ]
  for (const [path, type] of assets) {
    const response = await fetch(origin + path)
    assert.equal(response.status, 200, path)
    assert.match(response.headers.get('content-type') ?? '', type, path)
    assert.match(response.headers.get('cache-control') ?? '', /immutable/, path)
  }

  browser = await chromium.launch()
  const page = await browser.newPage({ baseURL: origin })
  async function openShowcase(path: string) {
    const response = await page.goto(path)
    assert.equal(response?.status(), 200, path)
    // The entry waits for Remix hydration before it finishes evaluating.
    await page.evaluate(async (entry) => {
      await import(entry)
    }, manifest.page.entry.href)
    return response
  }
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
  })
  await openShowcase('/docs/tabs?theme=dark&density=compact')
  const preview = page.locator('.doc-preview').first()
  await preview.getByRole('tab', { name: 'Activity' }).click()
  await expect(preview.getByRole('tabpanel', { name: 'Activity' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')

  const sample = await preview.locator('.doc-code-panel pre code').textContent()
  assert.ok(
    sample && tabsText.includes(sample),
    'The Markdown page includes the full default Code tab example',
  )
  const markdownLink = page.getByRole('link', { name: 'View as Markdown' })
  await expect(markdownLink).toHaveAttribute('href', '/docs/tabs.md')
  await markdownLink.click()
  await expect(page).toHaveURL(origin + '/docs/tabs.md')
  await expect(page.locator('body')).toContainText('# Tabs')
  await openShowcase('/docs/tabs')

  const docs = await page
    .locator('.site-left a[href^="/docs/"]')
    .evaluateAll((links) => [
      ...new Set(links.map((link) => new URL((link as HTMLAnchorElement).href).pathname)),
    ])
  assert.ok(docs.length > 30)

  await openShowcase('/')
  const buttonExample = page.locator('.site-gallery [data-component="button"]')
  const start = buttonExample.getByRole('button', { name: 'Primary', exact: true })
  await start.click()
  await expect(start).toHaveAttribute('aria-busy', 'true')
  await expect(start).toBeEnabled()
  await expect(buttonExample.locator('.example-status')).toHaveCount(0)

  await expect(page.locator('head link[rel="describedby"]')).toHaveAttribute('href', '/llms.txt')
  await page.getByRole('link', { name: 'Markdown index', exact: true }).click()
  await expect(page).toHaveURL(origin + '/llms.txt')
  await expect(page.locator('body')).toContainText('# Reflow')

  await openShowcase('/docs/button')
  await page
    .locator('.site-right .doc-playground-controls')
    .getByLabel('Label', { exact: true })
    .fill('Try Reflow')
  await expect(preview.getByRole('button', { name: 'Try Reflow', exact: true })).toBeVisible()

  await openShowcase('/docs/dropdown?theme=dark')
  const dropdown = page.locator('#playground .doc-preview-stage')
  await dropdown.getByRole('button', { name: 'Email', exact: true }).click()
  await page.getByRole('menuitemradio', { name: 'Notifications' }).click()
  await expect(
    dropdown.locator('button[aria-haspopup="menu"]', { hasText: 'Notifications' }),
  ).toBeVisible()

  await openShowcase('/apps')
  await expect(page.getByRole('heading', { name: 'Example apps', exact: true })).toBeVisible()
  await openShowcase('/apps/issues')
  await expect(page.getByRole('heading', { name: 'Issue tracker', exact: true })).toBeVisible()

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

  const catalogStart = performance.now()
  const concurrency = 4
  const crawlRoutes = [...docs, ...appSlugs.map((slug) => `/apps/${slug}`)]
  for (const { width, height, theme } of [
    { width: 1280, height: 720, theme: 'dark' },
    { width: 390, height: 844, theme: 'light' },
  ]) {
    const overflow: string[] = []
    const collapsedPreviews: string[] = []
    let cursor = 0
    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        const workerPage = await browser!.newPage({
          baseURL: origin,
          viewport: { width, height },
          reducedMotion: 'reduce',
        })
        const pageErrors: string[] = []
        workerPage.on('pageerror', (error) => pageErrors.push(error.message))
        workerPage.on('console', (message) => {
          if (message.type() === 'error') pageErrors.push(message.text())
        })
        workerPage.on('response', (response) => {
          if (response.status() >= 400) pageErrors.push(`${response.status()} ${response.url()}`)
        })
        try {
          while (cursor < crawlRoutes.length) {
            const path = crawlRoutes[cursor++]!
            const response = await workerPage.goto(
              `${path}?theme=${theme}&density=default&font=inter`,
            )
            assert.equal(response?.status(), 200, path)
            await workerPage.evaluate(async (entry) => {
              await import(entry)
            }, manifest.page.entry.href)
            if (theme === 'dark') assert.match((await response?.text()) ?? '', /<\/html>/, path)
            const dimensions = await workerPage.evaluate(() => ({
              width: document.documentElement.clientWidth,
              scroll: document.documentElement.scrollWidth,
            }))
            if (dimensions.scroll > dimensions.width + 1) {
              const elements: string[] = await workerPage.locator('main *').evaluateAll((nodes) =>
                nodes
                  .filter(
                    (node) =>
                      node.getBoundingClientRect().right > document.documentElement.clientWidth + 1,
                  )
                  .slice(0, 5)
                  .map((node) => `${node.tagName}.${node.className}`),
              )
              overflow.push(
                `${path}: ${dimensions.scroll}px in ${dimensions.width}px, ${elements.join(', ')}`,
              )
            }
            if (path.startsWith('/docs/')) {
              const stageHeight = await workerPage.evaluate(() => {
                const content = document.querySelector<HTMLElement>(
                  '.doc-preview-stage .doc-example-content',
                )
                return content ? content.getBoundingClientRect().height : null
              })
              if (stageHeight !== null && stageHeight < 12) {
                collapsedPreviews.push(`${path} at ${width}px (${stageHeight}px)`)
              }
            }
            assert.deepEqual(pageErrors, [], `${path} at ${width}px`)
            const slug = path.split('/').at(-1) ?? ''
            if (process.env.REFLOW_SCREENSHOT_DIR && ['button', 'skill'].includes(slug)) {
              await workerPage.screenshot({
                path: join(process.env.REFLOW_SCREENSHOT_DIR, `reflow-${slug}-${width}.png`),
                fullPage: false,
                animations: 'disabled',
              })
            }
          }
        } finally {
          await workerPage.close()
        }
      }),
    )
    assert.equal(overflow.length, 0, overflow.join('\n'))
    assert.equal(
      collapsedPreviews.length,
      0,
      `Collapsed component previews: ${collapsedPreviews.join(', ')}`,
    )
  }
  console.log(
    `Hydrated ${crawlRoutes.length} routes (${docs.length} docs + ${appSlugs.length} apps) at both widths in ${((performance.now() - catalogStart) / 1000).toFixed(1)}s.`,
  )
  console.log(
    `Local Worker checks passed: ${crawlRoutes.length} routes, assets, 404s, hydration, previews, playgrounds, mobile, and SSR without JavaScript.`,
  )
} finally {
  await browser?.close()
  await worker.stop()
}
