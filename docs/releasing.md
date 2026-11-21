# Releases

The release workflow publishes `@rtzll/reflow` and `@rtzll/create-reflow` from `main`. It runs only when triggered by hand, in the public `rtzll/reflow`, with the repository variables `RELEASE_ENABLED=true` and `RELEASE_REPOSITORY_ID` set to that repository's numeric ID. The ID stops the renamed private archive from publishing even though it once had the same name. Pushes and pull requests only run checks.

Only the two published manifests omit `private`. The root, showcase, and starter stay private. Publishing runs in an `npm` GitHub environment restricted to `main`.

## Releasing a version

1. Commit a new `X.Y.Z` version in both `packages/reflow/package.json` and `packages/create-reflow/package.json`, with relevant documentation and release notes. The workflow does not bump versions or commit changes.
2. Manually run **Release** on `main` in `publish` mode and enter that version. No push or tag automatically publishes. It stops before publishing anything if a package is not on npm yet.
3. CI verifies the code, packs each package once, and checks an app created by the packed create command with the packed library. It checks that the template installs the Reflow release with the same version. It publishes the library, then the create package, and creates `vX.Y.Z` and a GitHub release containing both archives.

If npm succeeds but the GitHub step fails, rerun the workflow on the same commit. It accepts an existing npm version only when the archive integrity matches and rejects a tag pointing at another commit. Never overwrite or reuse a released version for changed contents.

## A new package name

The release publishes two packages with one version: `@rtzll/reflow`, then `@rtzll/create-reflow`. npm trusted publishing is configured on an existing package. `@rtzll/reflow` was created this way at 0.1.0; `@rtzll/create-reflow` is created the same way with its first release. To create a package through CI, use the release workflow's `bootstrap` mode:

1. Create a short-lived, stage-only granular npm token with access to create the new package. Save it as `NPM_BOOTSTRAP_TOKEN` in the repository's `npm` environment.
2. Manually run **Release** on `main`, enter the committed version, and choose `bootstrap`. CI runs all checks and the isolated install smoke test. It publishes the packages that already exist on npm through trusted publishing, then stages the new package's exact tarball. npm creates a public placeholder; the staged version still needs your approval. This mode does not create a GitHub release, and it fails if every package already exists.
3. Review and approve the staged version on npm with 2FA. Revoke the bootstrap token and delete the environment secret.
4. Run **Release** in `publish` mode on the **same commit**. It verifies the approved tarballs' integrity, skips the existing npm versions, and creates the matching GitHub tag and release.
5. Before the next new version, configure the new package's GitHub trusted publisher for owner `rtzll`, repository `reflow`, workflow `release.yml`, environment `npm`, with publishing permission. Complete that publish within npm's two-day activation window; otherwise recreate the connection.

This one-time account setup uses [npm staged publishing](https://docs.npmjs.com/staged-publishing/). Later versions use [trusted publishing](https://docs.npmjs.com/trusted-publishers/) without a stored npm token. The workflow pins npm 12.2.3 on Node 26 LTS.

## Local validation

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium   # once per Playwright version
pnpm verify
pnpm test:linux
```

`pnpm verify` runs lint, the format check, type checks, every test suite, and the package check, building what each needs. `pnpm test:linux` runs the suite on Linux, as CI does. [Testing](testing.md) No local validation command publishes. The smoke test cleans up its temporary app, browser, and server even on failure.
