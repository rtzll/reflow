// Builds the template this package ships from examples/starter, with the
// versions of the Reflow release it belongs to.
import { cpSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../', import.meta.url))

type Manifest = Record<string, any>
const readManifest = (directory: string): Manifest =>
  JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))

export function buildTemplate(destination: string) {
  const workspace = readManifest(root)
  const library = readManifest(join(root, 'packages/reflow'))
  const own = readManifest(join(root, 'packages/create-reflow'))
  if (own.version !== library.version) {
    throw new Error(
      `@rtzll/create-reflow ${own.version} must match @rtzll/reflow ${library.version}`,
    )
  }

  rmSync(destination, { recursive: true, force: true })
  cpSync(join(root, 'examples/starter'), destination, {
    recursive: true,
    filter: (path) =>
      !['node_modules', '.git', 'pnpm-lock.yaml', 'vendor'].includes(basename(path)),
  })
  // npm leaves .gitignore files out of published packages.
  renameSync(join(destination, '.gitignore'), join(destination, '_gitignore'))

  const manifest = readManifest(destination)
  manifest.packageManager = workspace.packageManager
  manifest.engines = workspace.engines
  manifest.dependencies = {
    '@rtzll/reflow': library.version,
    remix: library.peerDependencies.remix,
  }
  manifest.devDependencies = {
    '@types/node': workspace.devDependencies['@types/node'],
    typescript: workspace.devDependencies.typescript,
  }
  writeFileSync(join(destination, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
}

if (import.meta.main) {
  const destination = fileURLToPath(new URL('../template/', import.meta.url))
  buildTemplate(destination)
  console.log(
    `Built the template for @rtzll/reflow ${readManifest(destination).dependencies['@rtzll/reflow']}.`,
  )
}
