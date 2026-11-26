import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

function walkFiles(dir: string, predicate: (name: string) => boolean): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, predicate))
    } else if (predicate(entry.name)) {
      out.push(full)
    }
  }
  return out
}

test('release version stays aligned across manifests, install docs, and showcase prompt', () => {
  const reflowPkg = JSON.parse(read('packages/reflow/package.json')) as { version: string }
  const createPkg = JSON.parse(read('packages/create-reflow/package.json')) as { version: string }
  const version = reflowPkg.version

  assert.equal(
    createPkg.version,
    version,
    'packages/create-reflow version must match @rtzll/reflow',
  )
  assert.ok(
    read('README.md').includes(`@rtzll/reflow@${version}`),
    `README.md must reference @rtzll/reflow@${version}`,
  )
  assert.ok(
    read('docs/integration.md').includes(`@rtzll/reflow@${version}`),
    `docs/integration.md must reference @rtzll/reflow@${version}`,
  )
  assert.ok(
    read('apps/web/app/public/install-prompt.tsx').includes(`@rtzll/reflow@${version}`),
    `install-prompt.tsx must reference @rtzll/reflow@${version}`,
  )
})

test('every @rtzll/reflow export is documented in docs/integration.md and skills/reflow/SKILL.md', () => {
  const pkg = JSON.parse(read('packages/reflow/package.json')) as {
    exports: Record<string, unknown>
  }
  const integrationDoc = read('docs/integration.md')
  const skillDoc = read('skills/reflow/SKILL.md')

  const missingIntegration: string[] = []
  const missingSkill: string[] = []
  for (const key of Object.keys(pkg.exports)) {
    if (key === '.') continue
    const suffix = key.slice(1) // e.g. "/diffs.css", "/trees/ssr"
    if (!integrationDoc.includes(suffix)) missingIntegration.push(key)
    if (!skillDoc.includes(suffix)) missingSkill.push(key)
  }

  assert.deepEqual(missingIntegration, [], 'Missing exports in docs/integration.md')
  assert.deepEqual(missingSkill, [], 'Missing exports in skills/reflow/SKILL.md')
})

test('every catalog component appears in README.md, docs/components.md, and skills/reflow/SKILL.md', async () => {
  const { components } = await import('../apps/web/app/public/catalog-entries.ts')
  const readme = read('README.md')
  const componentsDoc = read('docs/components.md')
  const skillDoc = read('skills/reflow/SKILL.md')

  const missingReadme: string[] = []
  const missingComponents: string[] = []
  const missingSkill: string[] = []
  for (const [, name] of components) {
    const pattern = new RegExp(`\\b${name}\\b`)
    if (!pattern.test(readme)) missingReadme.push(name)
    if (!pattern.test(componentsDoc)) missingComponents.push(name)
    if (!pattern.test(skillDoc)) missingSkill.push(name)
  }

  assert.deepEqual(missingReadme, [], 'Missing components in README.md')
  assert.deepEqual(missingComponents, [], 'Missing components in docs/components.md')
  assert.deepEqual(missingSkill, [], 'Missing components in skills/reflow/SKILL.md')
})

test('packages/reflow/src/index.ts uses explicit named exports (never export *)', () => {
  const source = read('packages/reflow/src/index.ts')
  assert.doesNotMatch(
    source,
    /^\s*export\s*\*/m,
    'packages/reflow/src/index.ts must use explicit named re-exports',
  )
})

test('every CSS file in packages/reflow/src is imported by styles.css', () => {
  const stylesEntry = read('packages/reflow/src/styles.css')
  const imported = new Set(
    [...stylesEntry.matchAll(/^@import\s+'\.\/([^']+)'\s+layer\(reflow\)\s*;$/gm)].map(
      ([, file]) => file,
    ),
  )
  const srcCss = readdirSync(join(root, 'packages/reflow/src')).filter(
    (name) => name.endsWith('.css') && name !== 'styles.css',
  )
  const orphaned = srcCss.filter((file) => !imported.has(file))
  assert.deepEqual(
    orphaned,
    [],
    'Orphaned CSS files in packages/reflow/src not listed in styles.css',
  )
})

test('specialist domains align with package.json exports and Remix dev allowPackages', () => {
  interface DomainConfig {
    entry: string
    ssrEntry?: string
    css?: string
    peers: readonly string[]
    optionalPeer?: boolean
    workerStub?: boolean
  }
  const domains = JSON.parse(read('packages/reflow/domains.json')) as Record<string, DomainConfig>
  const pkg = JSON.parse(read('packages/reflow/package.json')) as {
    exports: Record<string, unknown>
  }
  const remixConfig = JSON.parse(read('apps/web/remix.json')) as {
    assets?: { allowPackages?: string[] }
  }
  const allowPackages = new Set(remixConfig.assets?.allowPackages ?? [])

  for (const [name, domain] of Object.entries(domains)) {
    assert.ok(`./${domain.entry}` in pkg.exports, `Missing ./${domain.entry} export for ${name}`)
    if (domain.ssrEntry) {
      assert.ok(
        `./${domain.entry}/ssr` in pkg.exports,
        `Missing ./${domain.entry}/ssr export for ${name}`,
      )
    }
    if (domain.css) {
      assert.ok(`./${domain.css}` in pkg.exports, `Missing ./${domain.css} export for ${name}`)
    }
    if (domain.workerStub && domain.optionalPeer) {
      const primaryPeer = domain.peers[0]!
      assert.ok(
        allowPackages.has(primaryPeer),
        `apps/web/remix.json assets.allowPackages must include "${primaryPeer}" for ${name}`,
      )
    }
  }
})

test('every example app is documented in docs/example-apps.md and covered by an E2E suite', () => {
  const appsDir = join(root, 'apps/web/app/public/apps')
  const exampleAppsDoc = read('docs/example-apps.md')
  const slugs = readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'directory')
    .map((entry) => entry.name)
    .sort()

  for (const slug of slugs) {
    assert.ok(
      exampleAppsDoc.includes(`/apps/${slug}`),
      `docs/example-apps.md must document /apps/${slug}`,
    )
    const e2ePath = join(root, `apps/web/test/app-${slug}.test.e2e.ts`)
    assert.ok(existsSync(e2ePath), `Missing E2E test file apps/web/test/app-${slug}.test.e2e.ts`)
  }
})

test('JSX uses Remix canonical class attribute instead of className=', () => {
  const dirs = [resolve(root, 'packages/reflow/src'), resolve(root, 'apps/web/app')]
  const offenders: string[] = []
  for (const dir of dirs) {
    for (const file of walkFiles(dir, (name) => name.endsWith('.tsx'))) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, index) => {
        if (/\bclassName=/.test(line)) {
          offenders.push(`${file.slice(root.length)}:${index + 1}`)
        }
      })
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `Use class= instead of className= in JSX: ${offenders.join(', ')}`,
  )
})

test('all test files under apps/web/test match remix test discovery glob', () => {
  const testFiles = readdirSync(join(root, 'apps/web/test')).filter((name) =>
    name.includes('.test.'),
  )
  const validPattern = /\.test(?:\.(?:browser|e2e))?\.tsx?$/
  const invalid = testFiles.filter((name) => !validPattern.test(name))
  assert.deepEqual(
    invalid,
    [],
    `Unrecognized test filenames skipped by remix test (use .test.ts(x), .test.browser.tsx, or .test.e2e.ts): ${invalid.join(', ')}`,
  )
})
