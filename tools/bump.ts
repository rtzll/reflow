import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const nextVersion = process.argv[2]

if (!nextVersion || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(nextVersion)) {
  console.error('Usage: pnpm bump <X.Y.Z>')
  process.exit(1)
}

const reflowPkgPath = join(root, 'packages/reflow/package.json')
const currentVersion = (JSON.parse(readFileSync(reflowPkgPath, 'utf8')) as { version: string })
  .version

const jsonTargets = ['packages/reflow/package.json', 'packages/create-reflow/package.json']
for (const rel of jsonTargets) {
  const file = join(root, rel)
  const raw = readFileSync(file, 'utf8')
  const updated = raw.replace(`"version": "${currentVersion}"`, `"version": "${nextVersion}"`)
  if (updated === raw) throw new Error(`Failed to update version in ${rel}`)
  writeFileSync(file, updated)
}

const textTargets = ['README.md', 'docs/integration.md', 'apps/web/app/public/install-prompt.tsx']
for (const rel of textTargets) {
  const file = join(root, rel)
  const raw = readFileSync(file, 'utf8')
  const updated = raw.replaceAll(`@rtzll/reflow@${currentVersion}`, `@rtzll/reflow@${nextVersion}`)
  if (updated === raw) throw new Error(`Failed to update install version in ${rel}`)
  writeFileSync(file, updated)
}

console.log(`Bumped Reflow version from ${currentVersion} to ${nextVersion} across 5 files.`)
