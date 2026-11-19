import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { buildTemplate } from '../scripts/template.ts'
import { create, packageName, readOptions } from '../src/create.ts'
import type { Installer } from '../src/create.ts'

const temporary = mkdtempSync(join(tmpdir(), 'create-reflow-'))
after(() => rmSync(temporary, { recursive: true, force: true }))
const template = join(temporary, 'template')
buildTemplate(template)
const library = JSON.parse(
  readFileSync(new URL('../../reflow/package.json', import.meta.url), 'utf8'),
)
const noInstall: Installer = () => assert.fail('must not install')
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'))

test('reads the directory and flags', () => {
  assert.deepEqual(readOptions(['my-app']), {
    directory: 'my-app',
    install: true,
    tarball: undefined,
  })
  assert.deepEqual(readOptions(['my-app', '--no-install']), {
    directory: 'my-app',
    install: false,
    tarball: undefined,
  })
  assert.equal(readOptions(['--help']), 'help')
  assert.throws(() => readOptions([]), /one directory/)
  assert.throws(() => readOptions(['a', 'b']), /one directory/)
  assert.throws(() => readOptions(['a', '--unknown']))
})

test('names the package after the directory', () => {
  assert.equal(packageName('apps/My App'), 'my-app')
  assert.equal(packageName('.hidden'), 'hidden')
  assert.equal(packageName('_'), 'reflow-app')
})

test('creates an app for the matching Reflow release', () => {
  const directory = join(temporary, 'My App')
  const result = create({ directory, install: false }, template, noInstall)
  assert.deepEqual(result, { destination: directory, installed: false })
  const manifest = read(join(directory, 'package.json'))
  assert.equal(manifest.name, 'my-app')
  assert.equal(manifest.private, true)
  assert.deepEqual(manifest.dependencies, {
    '@rtzll/reflow': library.version,
    remix: library.peerDependencies.remix,
  })
  assert.ok(existsSync(join(directory, '.gitignore')))
  assert.ok(!existsSync(join(directory, '_gitignore')))
  assert.ok(existsSync(join(directory, 'app/public/settings.tsx')))
  assert.ok(!existsSync(join(directory, 'node_modules')))
  assert.match(
    readFileSync(join(directory, 'pnpm-workspace.yaml'), 'utf8'),
    new RegExp(`- '@rtzll/reflow@${library.version.replaceAll('.', '\\.')}'`),
  )
})

test('installs with pnpm unless asked not to', () => {
  const calls: string[] = []
  const directory = join(temporary, 'installed')
  const result = create({ directory, install: true }, template, (cwd) => {
    calls.push(cwd)
    return 'installed'
  })
  assert.deepEqual(calls, [directory])
  assert.equal(result.installed, true)
  const missing = create(
    { directory: join(temporary, 'no-pnpm'), install: true },
    template,
    () => 'missing',
  )
  assert.equal(missing.installed, false)
})

test('uses a packed Reflow when given one', () => {
  const tarball = join(temporary, 'rtzll-reflow.tgz')
  writeFileSync(tarball, 'packed')
  const directory = join(temporary, 'packed')
  create({ directory, install: false, tarball }, template, noInstall)
  assert.equal(
    read(join(directory, 'package.json')).dependencies['@rtzll/reflow'],
    'file:vendor/rtzll-reflow.tgz',
  )
  assert.equal(readFileSync(join(directory, 'vendor/rtzll-reflow.tgz'), 'utf8'), 'packed')
  assert.throws(
    () =>
      create(
        { directory: join(temporary, 'gone'), install: false, tarball: `${tarball}x` },
        template,
        noInstall,
      ),
    /does not exist/,
  )
})

test('accepts an empty directory but never overwrites files', () => {
  const empty = join(temporary, 'empty')
  mkdirSync(empty)
  create({ directory: empty, install: false }, template, noInstall)
  assert.throws(
    () => create({ directory: empty, install: false }, template, noInstall),
    /already exists/,
  )
  const file = join(temporary, 'file')
  writeFileSync(file, '')
  assert.throws(
    () => create({ directory: file, install: false }, template, noInstall),
    /already exists/,
  )
})
