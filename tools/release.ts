import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

export interface Manifest {
  name: string
  version: string
  private?: boolean
  license?: string
  repository?: { url?: string }
  [key: string]: unknown
}
export type Env = Record<string, string | undefined>
export interface ReleaseEvent {
  repository?: { private?: boolean }
}
export interface ReleaseDetails {
  name: string
  version: string
  tag: string
}

// Published in this order, so the create package never points at a Reflow
// version that is not on npm yet. Both share one version.
export const releasePackages = [
  {
    name: '@rtzll/reflow',
    directory: 'packages/reflow',
    tarball: '.artifacts/rtzll-reflow.tgz',
  },
  {
    name: '@rtzll/create-reflow',
    directory: 'packages/create-reflow',
    tarball: '.artifacts/rtzll-create-reflow.tgz',
  },
] as const

type Request = (url: string) => Promise<Response>

// Keep the publication policy testable without credentials or network calls.
export function releaseDetails(
  manifest: Manifest,
  env: Env,
  event: ReleaseEvent,
  name: string,
): ReleaseDetails {
  assert.equal(env.RELEASE_ENABLED, 'true', 'Publishing is disabled')
  assert.ok(env.RELEASE_REPOSITORY_ID, 'Set the NEW repository ID after migration')
  assert.equal(env.GITHUB_REPOSITORY_ID, env.RELEASE_REPOSITORY_ID, 'Wrong repository ID')
  assert.equal(env.GITHUB_REPOSITORY, 'rtzll/reflow', 'Wrong repository')
  assert.equal(event.repository?.private, false, 'The release repository must be public')
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch', 'Releases must be manually triggered')
  assert.equal(env.GITHUB_REF, 'refs/heads/main', 'Release from main')
  assert.match(env.GITHUB_SHA ?? '', /^[a-f0-9]{40}$/, 'Missing release commit')
  assert.equal(manifest.name, name)
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
  assert.equal(manifest.repository?.url, 'git+https://github.com/rtzll/reflow.git')
  assert.equal(manifest.license, 'MIT')
  return { name: manifest.name, version: manifest.version, tag: `v${manifest.version}` }
}

// The apps it creates must install the Reflow release with the same version.
export function checkTemplate(template: Manifest, version: string) {
  assert.equal(
    template.dependencies && (template.dependencies as Record<string, string>)['@rtzll/reflow'],
    version,
    'The create package must install the Reflow release with the same version',
  )
}

// A package that npm does not know yet needs the bootstrap mode.
export async function packageExists(name: string, request: Request = fetch) {
  const response = await request(`https://registry.npmjs.org/${encodeURIComponent(name)}`)
  if (response.status === 404) return false
  assert.ok(response.ok, `Cannot check ${name} on npm: HTTP ${response.status}`)
  return true
}

export async function alreadyPublished(
  details: ReleaseDetails,
  integrity: string,
  request: Request = fetch,
) {
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

export function checkTag(refs: string, tag: string, sha: string | undefined) {
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
  const { GITHUB_EVENT_PATH, GITHUB_SHA } = process.env
  assert.ok(GITHUB_EVENT_PATH && GITHUB_SHA, 'Run this in the release workflow')
  const event = JSON.parse(readFileSync(GITHUB_EVENT_PATH, 'utf8'))
  const extract = (tarball: string, file: string) =>
    execFileSync('tar', ['-xOzf', tarball, `package/${file}`], { encoding: 'utf8' })

  const releases = releasePackages.map((target) => {
    const manifest = JSON.parse(readFileSync(`${target.directory}/package.json`, 'utf8'))
    const details = releaseDetails(manifest, process.env, event, target.name)
    assert.deepEqual(
      JSON.parse(extract(target.tarball, 'package.json')),
      manifest,
      `The tested ${target.name} tarball must match this commit’s package manifest`,
    )
    const integrity = `sha512-${createHash('sha512').update(readFileSync(target.tarball)).digest('base64')}`
    return { ...target, details, integrity }
  })
  const { tag, version } = releases[0].details
  checkTemplate(JSON.parse(extract(releasePackages[1].tarball, 'template/package.json')), version)
  const refs = execFileSync(
    'git',
    ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`, `refs/tags/${tag}^{}`],
    { encoding: 'utf8' },
  )
  checkTag(refs, tag, GITHUB_SHA)

  // Check before publishing anything, so a release never stops halfway.
  const missing: string[] = []
  for (const { name } of releases) if (!(await packageExists(name))) missing.push(name)
  if (mode === 'publish') {
    assert.deepEqual(missing, [], `Run bootstrap first to create ${missing.join(', ')} on npm`)
  } else {
    assert.notDeepEqual(missing, [], 'Every package exists on npm; use publish')
    assert.ok(
      process.env.NPM_BOOTSTRAP_TOKEN,
      'Set the temporary npm environment NPM_BOOTSTRAP_TOKEN',
    )
  }

  for (const { name, tarball, details, integrity } of releases) {
    if (await alreadyPublished(details, integrity)) {
      console.log(`${name}@${version} is already on npm with these contents.`)
    } else if (missing.includes(name)) {
      execFileSync(
        'npm',
        ['stage', 'publish', tarball, '--access', 'public', '--provenance', '--ignore-scripts'],
        // Only staging gets the token. With it, npm stages a publish too.
        {
          stdio: 'inherit',
          env: { ...process.env, NODE_AUTH_TOKEN: process.env.NPM_BOOTSTRAP_TOKEN },
        },
      )
    } else {
      // Trusted publishing, as in publish mode: no token, the workflow's OIDC identity.
      execFileSync(
        'npm',
        ['publish', tarball, '--access', 'public', '--provenance', '--ignore-scripts'],
        { stdio: 'inherit' },
      )
    }
  }

  if (mode === 'bootstrap') {
    console.log(
      `Staged ${missing.join(', ')}. Approve on npm, revoke the bootstrap token, and run publish on this same commit to create the GitHub release.`,
    )
  } else {
    const response = await fetch(`https://api.github.com/repos/rtzll/reflow/releases/tags/${tag}`, {
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    })
    if (response.status === 404) {
      execFileSync(
        'gh',
        [
          'release',
          'create',
          tag,
          ...releases.map((release) => release.tarball),
          '--repo',
          'rtzll/reflow',
          '--target',
          GITHUB_SHA,
          '--title',
          tag,
          '--generate-notes',
        ],
        { stdio: 'inherit' },
      )
    } else {
      assert.ok(response.ok, `Cannot check GitHub release: HTTP ${response.status}`)
      console.log(`${tag} is already released; the package contents and tag were verified.`)
    }
  }
}
