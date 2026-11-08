import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { alreadyPublished, checkTag, releaseDetails } from './release.mjs'

const checkedIn = JSON.parse(
  readFileSync(new URL('../packages/reflow/package.json', import.meta.url), 'utf8'),
)
const manifest = { ...checkedIn, private: false }
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
  assert.equal(releaseDetails(manifest, env, event).tag, `v${manifest.version}`)
})

for (const [label, change] of [
  ['disabled publishing', { RELEASE_ENABLED: '' }],
  ['missing migration configuration', { RELEASE_REPOSITORY_ID: '' }],
  ['the archived repository even if renamed back', { GITHUB_REPOSITORY_ID: 'old-repo-id' }],
  ['another repository', { GITHUB_REPOSITORY: 'rtzll/reflow-private' }],
  ['a push event', { GITHUB_EVENT_NAME: 'push' }],
  ['another branch', { GITHUB_REF: 'refs/heads/feature' }],
  ['a version that was not committed', { RELEASE_VERSION: '999.0.0' }],
]) {
  test(`rejects ${label}`, () => {
    assert.throws(() => releaseDetails(manifest, { ...env, ...change }, event))
  })
}

test('rejects private repositories and packages', () => {
  assert.throws(() => releaseDetails(manifest, env, { repository: { private: true } }))
  assert.throws(() => releaseDetails({ ...manifest, private: true }, env, event))
})

test('only treats an npm 404 as an unpublished version', async () => {
  const details = releaseDetails(manifest, env, event)
  assert.equal(
    await alreadyPublished(details, 'sha512-test', async () => new Response(null, { status: 404 })),
    false,
  )
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(
      alreadyPublished(details, 'sha512-test', async () => new Response(null, { status })),
    )
  }
})

test('resumes a release only when the registry tarball is identical', async () => {
  const details = releaseDetails(manifest, env, event)
  const request = async () => Response.json({ dist: { integrity: 'sha512-same' } })
  assert.equal(await alreadyPublished(details, 'sha512-same', request), true)
  await assert.rejects(alreadyPublished(details, 'sha512-different', request))
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
