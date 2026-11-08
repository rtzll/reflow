import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)))
const template = join(root, 'examples/starter')
const library = join(root, 'packages/reflow')
const [target, flag, archive, ...extra] = process.argv.slice(2)
const tarball = flag === '--tarball' && archive ? resolve(archive) : undefined

if (!target || extra.length || (flag && !tarball)) {
  console.error('Usage: pnpm starter <new-directory-outside-the-workspace> [--tarball <file>]')
  process.exit(1)
}

const requested = resolve(target)
const destination = join(realpathSync(dirname(requested)), basename(requested))
const fromRoot = relative(root, destination)
if (fromRoot !== '..' && !fromRoot.startsWith(`..${sep}`)) {
  console.error('Choose a new directory outside the Reflow workspace.')
  process.exit(1)
}

const readManifest = (directory) =>
  JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
const manifest = readManifest(template)
const workspace = readManifest(root)
manifest.packageManager = workspace.packageManager
manifest.engines = workspace.engines
manifest.dependencies.remix = readManifest(library).peerDependencies.remix
manifest.devDependencies = {
  '@types/node': workspace.devDependencies['@types/node'],
  typescript: workspace.devDependencies.typescript,
}

function pnpm(args, cwd) {
  execFileSync('pnpm', args, { cwd, stdio: 'inherit' })
}

mkdirSync(destination)
cpSync(template, destination, {
  recursive: true,
  filter: (path) => !['node_modules', '.git', 'pnpm-lock.yaml'].includes(basename(path)),
})
writeFileSync(join(destination, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
mkdirSync(join(destination, 'vendor'))

const vendor = join(destination, 'vendor/rtzll-reflow.tgz')
if (tarball) {
  cpSync(tarball, vendor)
} else {
  pnpm(['build'], library)
  pnpm(['pack', '--silent', '--out', vendor], library)
}
pnpm(['install'], destination)

console.log(`\nStarter ready at ${destination}`)
console.log('From that directory, run pnpm check and pnpm dev.')
