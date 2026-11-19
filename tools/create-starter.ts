// pnpm starter <directory>: creates a starter app that installs this
// checkout's Reflow, through the same command as pnpm create @rtzll/reflow.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)))
const [target, ...extra] = process.argv.slice(2).filter((arg) => arg !== '--')

if (!target || extra.length) {
  console.error('Usage: pnpm starter <new-directory-outside-the-workspace>')
  process.exit(1)
}

const requested = resolve(target)
const destination = join(realpathSync(dirname(requested)), basename(requested))
const fromRoot = relative(root, destination)
if (fromRoot !== '..' && !fromRoot.startsWith(`..${sep}`)) {
  console.error('Choose a new directory outside the Reflow workspace.')
  process.exit(1)
}

const run = (command: string, args: string[], cwd = root) =>
  execFileSync(command, args, { cwd, stdio: 'inherit' })

const temporary = mkdtempSync(join(tmpdir(), 'reflow-starter-'))
try {
  const tarball = join(temporary, 'rtzll-reflow.tgz')
  run('pnpm', ['build'])
  run('pnpm', ['pack', '--silent', '--out', tarball], join(root, 'packages/reflow'))
  run(process.execPath, [
    join(root, 'packages/create-reflow/dist/index.js'),
    destination,
    '--tarball',
    tarball,
  ])
  console.log('Keep vendor/rtzll-reflow.tgz with the app; it installs from that file.')
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
