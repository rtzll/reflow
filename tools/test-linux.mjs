#!/usr/bin/env node
// Runs the tests on Linux, as CI does, in Playwright's image for the pinned
// version: fonts, rendering and timing there differ from macOS. Needs Docker
// (OrbStack locally). Meant for before a release; CI stays the gate.
//
//   pnpm test:linux                                   the whole suite
//   pnpm test:linux apps/web/test/drawer.test.e2e.ts  only these e2e files
//
// The checkout is mounted as it is; each package's node_modules lives in a
// named volume instead, so the Linux install never touches the macOS one.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const files = process.argv.slice(2).filter((arg) => arg !== '--')

const docker = spawnSync('docker', ['info'], { stdio: 'ignore' })
if (docker.status !== 0) {
  console.error('Docker is not running. Start OrbStack (orb start) and try again.')
  process.exit(1)
}

const workspace = JSON.parse(readFileSync(`${root}package.json`, 'utf8'))
const pnpm = /^pnpm@(\d+\.\d+\.\d+)$/.exec(workspace.packageManager ?? '')?.[1]
if (!pnpm) {
  console.error(`Expected packageManager pnpm@x.y.z, found ${workspace.packageManager}.`)
  process.exit(1)
}

const web = JSON.parse(readFileSync(`${root}apps/web/package.json`, 'utf8'))
const playwright = web.devDependencies?.playwright ?? web.dependencies?.playwright
if (!/^\d+\.\d+\.\d+$/.test(playwright ?? '')) {
  console.error(`Expected an exact playwright version in apps/web, found ${playwright}.`)
  process.exit(1)
}
const image = `mcr.microsoft.com/playwright:v${playwright}-noble`

// Every workspace package's node_modules, plus the root's.
const packages = ['.']
for (const group of ['apps', 'packages'])
  for (const name of readdirSync(`${root}${group}`))
    if (existsSync(`${root}${group}/${name}/package.json`)) packages.push(`${group}/${name}`)
const volumes = packages.flatMap((path) => [
  '-v',
  `reflow-linux-${path === '.' ? 'root' : path.replace('/', '-')}:/work/${path === '.' ? '' : `${path}/`}node_modules`,
])

const test =
  files.length > 0
    ? `pnpm build && ./apps/web/node_modules/.bin/remix test --type e2e --concurrency 3 ${files.map((file) => `'${file}'`).join(' ')}`
    : 'pnpm test'
const script = [
  'set -e',
  "node -e \"const [a,b]=process.versions.node.split('.').map(Number); if (a<24||(a===24&&b<3)) { console.error('The image has Node '+process.version+'; Reflow needs 24.3 or later.'); process.exit(1) }\"",
  `npm install --global --silent pnpm@${pnpm}`,
  'pnpm config set store-dir /pnpm-store',
  'pnpm install --frozen-lockfile',
  test,
].join(' && ')

const result = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--init',
    '--ipc=host',
    '-e',
    'CI=1',
    '-v',
    `${root}:/work`,
    '-v',
    'reflow-linux-pnpm-store:/pnpm-store',
    ...volumes,
    '-w',
    '/work',
    image,
    'bash',
    '-c',
    script,
  ],
  { stdio: 'inherit' },
)
process.exit(result.status ?? 1)
