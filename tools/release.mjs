import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Keep the publication policy testable without credentials or network calls.
export function releaseDetails(manifest, env, event) {
  assert.equal(env.RELEASE_ENABLED, 'true', 'Publishing is disabled')
  assert.ok(env.RELEASE_REPOSITORY_ID, 'Set the NEW repository ID after migration')
  assert.equal(env.GITHUB_REPOSITORY_ID, env.RELEASE_REPOSITORY_ID, 'Wrong repository ID')
  assert.equal(env.GITHUB_REPOSITORY, 'rtzll/reflow', 'Wrong repository')
  assert.equal(event.repository?.private, false, 'The release repository must be public')
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch', 'Releases must be manually triggered')
  assert.equal(env.GITHUB_REF, 'refs/heads/main', 'Release from main')
  assert.match(env.GITHUB_SHA ?? '', /^[a-f0-9]{40}$/, 'Missing release commit')
  assert.equal(manifest.name, '@rtzll/reflow')
  assert.notEqual(manifest.private, true, 'Remove the package private flag only after migration')
  assert.match(
    manifest.version,
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,
    'Use an X.Y.Z version',
  )
  assert.equal(
    env.RELEASE_VERSION,
    manifest.version,
    'Release input must match the committed version',
  )
  assert.equal(manifest.repository.url, 'git+https://github.com/rtzll/reflow.git')
  assert.equal(manifest.license, 'MIT')
  return { name: manifest.name, version: manifest.version, tag: `v${manifest.version}` }
}

export async function alreadyPublished(details, integrity, request = fetch) {
  const response = await request(
    `https://registry.npmjs.org/${encodeURIComponent(details.name)}/${details.version}`,
  )
  if (response.status === 404) return false
  assert.ok(response.ok, `Cannot check npm version: HTTP ${response.status}`)
  const published = await response.json()
  assert.equal(
    published.dist?.integrity,
    integrity,
    'This npm version exists with different contents',
  )
  return true
}

export function checkTag(refs, tag, sha) {
  const lines = refs
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
  const commit =
    lines.find(([, ref]) => ref === `refs/tags/${tag}^{}`) ??
    lines.find(([, ref]) => ref === `refs/tags/${tag}`)
  if (commit) assert.equal(commit[0], sha, 'The release tag already points to another commit')
}

if (import.meta.main) {
  const mode = process.argv[2]
  assert.ok(mode === 'publish' || mode === 'bootstrap', 'Use publish or bootstrap')
  const manifest = JSON.parse(readFileSync('packages/reflow/package.json', 'utf8'))
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
  const details = releaseDetails(manifest, process.env, event)
  const tarball = '.artifacts/rtzll-reflow.tgz'
  const packed = JSON.parse(
    execFileSync('tar', ['-xOzf', tarball, 'package/package.json'], { encoding: 'utf8' }),
  )
  assert.deepEqual(packed, manifest, 'The tested tarball must match this commit’s package manifest')
  const integrity = `sha512-${createHash('sha512').update(readFileSync(tarball)).digest('base64')}`
  const refs = execFileSync(
    'git',
    ['ls-remote', '--tags', 'origin', `refs/tags/${details.tag}`, `refs/tags/${details.tag}^{}`],
    { encoding: 'utf8' },
  )
  checkTag(refs, details.tag, process.env.GITHUB_SHA)

  if (mode === 'bootstrap') {
    assert.ok(process.env.NODE_AUTH_TOKEN, 'Set the temporary npm environment NPM_BOOTSTRAP_TOKEN')
    assert.equal(
      await alreadyPublished(details, integrity),
      false,
      'The first version is already published',
    )
    execFileSync(
      'npm',
      ['stage', 'publish', tarball, '--access', 'public', '--provenance', '--ignore-scripts'],
      { stdio: 'inherit' },
    )
    console.log(
      'Approve the staged version on npm, revoke the bootstrap token, and run publish on this same commit to create the GitHub release.',
    )
  } else {
    if (!(await alreadyPublished(details, integrity))) {
      execFileSync(
        'npm',
        ['publish', tarball, '--access', 'public', '--provenance', '--ignore-scripts'],
        { stdio: 'inherit' },
      )
    }
    const response = await fetch(
      `https://api.github.com/repos/rtzll/reflow/releases/tags/${details.tag}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GH_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      },
    )
    if (response.status === 404) {
      execFileSync(
        'gh',
        [
          'release',
          'create',
          details.tag,
          tarball,
          '--repo',
          'rtzll/reflow',
          '--target',
          process.env.GITHUB_SHA,
          '--title',
          details.tag,
          '--generate-notes',
        ],
        { stdio: 'inherit' },
      )
    } else {
      assert.ok(response.ok, `Cannot check GitHub release: HTTP ${response.status}`)
      console.log(`${details.tag} is already released; the package contents and tag were verified.`)
    }
  }
}
