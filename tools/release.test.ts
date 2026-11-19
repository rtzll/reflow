import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  alreadyPublished,
  checkTag,
  checkTemplate,
  packageExists,
  releaseDetails,
} from './release.ts'
import type { Env, Manifest, ReleaseEvent } from './release.ts'

const checkedIn = JSON.parse(
  readFileSync(new URL('../packages/reflow/package.json', import.meta.url), 'utf8'),
)
const manifest = { ...checkedIn, private: false }
const createManifest = JSON.parse(
  readFileSync(new URL('../packages/create-reflow/package.json', import.meta.url), 'utf8'),
)
const details = (value: Manifest, environment: Env, releaseEvent: ReleaseEvent) =>
  releaseDetails(value, environment, releaseEvent, '@rtzll/reflow')
const sha = 'a'.repeat(40)
const env = {
  RELEASE_ENABLED: 'true',
  RELEASE_REPOSITORY_ID: 'new-repo-id',
  GITHUB_REPOSITORY_ID: 'new-repo-id',
  GITHUB_REPOSITORY: 'rtzll/reflow',
  GITHUB_EVENT_NAME: 'workflow_dispatch',
  GITHUB_REF: 'refs/heads/main',
  GITHUB_SHA: sha,
  RELEASE_VERSION: manifest.version,
}
const event = { repository: { private: false } }

test('allows the explicitly enabled new public repository and committed version', () => {
  assert.equal(details(manifest, env, event).tag, `v${manifest.version}`)
})

const rejected: [string, Env][] = [
  ['disabled publishing', { RELEASE_ENABLED: '' }],
  ['missing migration configuration', { RELEASE_REPOSITORY_ID: '' }],
  ['the archived repository even if renamed back', { GITHUB_REPOSITORY_ID: 'old-repo-id' }],
  ['another repository', { GITHUB_REPOSITORY: 'rtzll/reflow-private' }],
  ['a push event', { GITHUB_EVENT_NAME: 'push' }],
  ['another branch', { GITHUB_REF: 'refs/heads/feature' }],
  ['a version that was not committed', { RELEASE_VERSION: '999.0.0' }],
]
for (const [label, change] of rejected) {
  test(`rejects ${label}`, () => {
    assert.throws(() => details(manifest, { ...env, ...change }, event))
  })
}

test('releases the create package with the same version', () => {
  assert.equal(
    releaseDetails(createManifest, env, event, '@rtzll/create-reflow').tag,
    `v${manifest.version}`,
  )
  assert.throws(() => releaseDetails(createManifest, env, event, '@rtzll/reflow'))
  assert.throws(() =>
    releaseDetails({ ...createManifest, version: '999.0.0' }, env, event, '@rtzll/create-reflow'),
  )
})

test('requires the template to install the matching Reflow release', () => {
  const template = (version: string) => ({
    name: 'reflow-starter',
    version: '0.0.0',
    dependencies: { '@rtzll/reflow': version },
  })
  checkTemplate(template(manifest.version), manifest.version)
  assert.throws(() => checkTemplate(template('0.0.1'), manifest.version))
  assert.throws(() => checkTemplate(template('file:vendor/rtzll-reflow.tgz'), manifest.version))
})

test('only treats an npm 404 as a package that does not exist yet', async () => {
  assert.equal(await packageExists('x', async () => new Response(null, { status: 404 })), false)
  assert.equal(await packageExists('x', async () => Response.json({})), true)
  await assert.rejects(packageExists('x', async () => new Response(null, { status: 500 })))
})

test('rejects private repositories and packages', () => {
  assert.throws(() => details(manifest, env, { repository: { private: true } }))
  assert.throws(() => details({ ...manifest, private: true }, env, event))
})

test('only treats an npm 404 as an unpublished version', async () => {
  const release = details(manifest, env, event)
  assert.equal(
    await alreadyPublished(release, 'sha512-test', async () => new Response(null, { status: 404 })),
    false,
  )
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(
      alreadyPublished(release, 'sha512-test', async () => new Response(null, { status })),
    )
  }
})

test('resumes a release only when the registry tarball is identical', async () => {
  const release = details(manifest, env, event)
  const request = async () => Response.json({ dist: { integrity: 'sha512-same' } })
  assert.equal(await alreadyPublished(release, 'sha512-same', request), true)
  await assert.rejects(alreadyPublished(release, 'sha512-different', request))
})

test('rejects existing lightweight or annotated tags for other commits', () => {
  checkTag('', 'v0.1.0', sha)
  checkTag(`${sha}\trefs/tags/v0.1.0`, 'v0.1.0', sha)
  checkTag(`${'b'.repeat(40)}\trefs/tags/v0.1.0\n${sha}\trefs/tags/v0.1.0^{}`, 'v0.1.0', sha)
  assert.throws(() => checkTag(`${'b'.repeat(40)}\trefs/tags/v0.1.0`, 'v0.1.0', sha))
  assert.throws(() =>
    checkTag(`${sha}\trefs/tags/v0.1.0\n${'b'.repeat(40)}\trefs/tags/v0.1.0^{}`, 'v0.1.0', sha),
  )
})
