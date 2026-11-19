import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

export const usage = `Usage: create-reflow <directory> [--no-install]

Creates a Remix 3 app that uses Reflow components.

  --no-install  Copy the files without running pnpm install
  --help        Show this message`

export interface Options {
  directory: string
  install: boolean
  /** A packed @rtzll/reflow to use instead of the npm release, for testing. */
  tarball?: string
}

export function readOptions(args: string[]): Options | 'help' {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    allowNegative: true,
    options: {
      install: { type: 'boolean', default: true },
      tarball: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  })
  if (values.help) return 'help'
  if (positionals.length !== 1) throw new Error('Name one directory to create.')
  return {
    directory: positionals[0],
    install: values.install,
    tarball: values.tarball && resolve(values.tarball),
  }
}

// A valid npm package name from the directory, such as "my-app".
export function packageName(directory: string) {
  const name = basename(resolve(directory))
    .toLowerCase()
    .replace(/[^a-z0-9._~-]+/g, '-')
    .replace(/^[._-]+|[-]+$/g, '')
  return name || 'reflow-app'
}

export type Installer = (cwd: string) => 'installed' | 'missing'

const pnpmInstall: Installer = (cwd) => {
  const result = spawnSync('pnpm', ['install'], { cwd, stdio: 'inherit' })
  if ((result.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') return 'missing'
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error('pnpm install failed.')
  return 'installed'
}

export function create(
  options: Options,
  template: string,
  installer: Installer = pnpmInstall,
): { destination: string; installed: boolean } {
  const destination = resolve(options.directory)
  if (existsSync(destination)) {
    if (!statSync(destination).isDirectory() || readdirSync(destination).length > 0) {
      throw new Error(`${options.directory} already exists. Choose a new or empty directory.`)
    }
  }
  if (options.tarball && !existsSync(options.tarball)) {
    throw new Error(`${options.tarball} does not exist.`)
  }

  mkdirSync(destination, { recursive: true })
  cpSync(template, destination, { recursive: true })
  renameSync(join(destination, '_gitignore'), join(destination, '.gitignore'))

  const file = join(destination, 'package.json')
  const manifest = JSON.parse(readFileSync(file, 'utf8'))
  manifest.name = packageName(destination)
  if (options.tarball) {
    mkdirSync(join(destination, 'vendor'))
    cpSync(options.tarball, join(destination, 'vendor/rtzll-reflow.tgz'))
    manifest.dependencies['@rtzll/reflow'] = 'file:vendor/rtzll-reflow.tgz'
  }
  writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n')

  const installed = options.install && installer(destination) === 'installed'
  return { destination, installed }
}
