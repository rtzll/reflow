# Releases

Package publication is disabled until the public repository is ready.

## Before migration

Keep `packages/reflow/package.json` private and leave `RELEASE_ENABLED` and `RELEASE_REPOSITORY_ID` unset. The release workflow also requires a public `rtzll/reflow`, `main`, and a manual trigger. Pushes and pull requests only run checks.

1. Verify a clean export of the reviewed commit. Run the checks below and inspect the tracked files for local paths, credentials, and borrowed assets. Give the Fluid Functionalism maintainer a courtesy heads-up before launch.
2. Preserve the full history in the private archive. Rename the existing GitHub repository and update the archive checkout's remote before reusing its original name. GitHub's redirects stop working once the old name is reused.
3. Create the new `rtzll/reflow` from the reviewed tree as a fresh root commit. Start it privately and push only that new `main`. Earlier history contains local paths and comparison screenshots.
4. Verify Checks on the new repository. Set the `remix`, `ui`, `components`, and `motion` topics, and enable Issues. Add the showcase URL when it is hosted.
5. Make the new repository public. Require the `verify` check for pull requests to `main`, enable GitHub's private vulnerability reporting, and verify that the [report form](https://github.com/rtzll/reflow/security/advisories/new) opens.

## Enable only in the new repository

1. Confirm Checks pass on the public repository. Configure an `npm` GitHub environment restricted to `main`.
2. In a reviewed commit, remove `private` from **only** the published manifests, `packages/reflow/package.json` and `packages/create-reflow/package.json`. Keep the root, showcase, and starter private. Commit the intended version and update installation docs when npm installation becomes available.
3. Set repository variables `RELEASE_ENABLED=true` and `RELEASE_REPOSITORY_ID` to the **new** repository's numeric ID (`gh api repos/rtzll/reflow --jq .id`). The ID prevents the renamed archive from publishing even if its old name is reused.
4. Configure npm authentication as below. Do not enable or configure these settings in the archive.

## A new package name

The release publishes two packages with one version: `@rtzll/reflow`, then `@rtzll/create-reflow`. npm trusted publishing is configured on an existing package. `@rtzll/reflow` was created this way at 0.1.0; `@rtzll/create-reflow` is created the same way with its first release. To create a package through CI, use the release workflow's `bootstrap` mode:

1. Create a short-lived, stage-only granular npm token with access to create the new package. Save it as `NPM_BOOTSTRAP_TOKEN` in the new repository's `npm` environment.
2. Manually run **Release** on `main`, enter the committed version, and choose `bootstrap`. CI runs all checks and the isolated install smoke test. It publishes the packages that already exist on npm through trusted publishing, then stages the new package's exact tarball. npm creates a public placeholder; the staged version still needs your approval. This mode does not create a GitHub release, and it fails if every package already exists.
3. Review and approve the staged version on npm with 2FA. Revoke the bootstrap token and delete the environment secret.
4. Run **Release** in `publish` mode on the **same commit**. It verifies the approved tarballs' integrity, skips the existing npm versions, and creates the matching GitHub tag and release.
5. Before the next new version, configure the new package's GitHub trusted publisher for owner `rtzll`, repository `reflow`, workflow `release.yml`, environment `npm`, with publishing permission. Complete that publish within npm's two-day activation window; otherwise recreate the connection.

This one-time account setup uses [npm staged publishing](https://docs.npmjs.com/staged-publishing/). Later versions use [trusted publishing](https://docs.npmjs.com/trusted-publishers/) without a stored npm token. The workflow pins npm 12.2.3 on Node 26 LTS.

## Subsequent releases

1. Commit a new `X.Y.Z` version in both `packages/reflow/package.json` and `packages/create-reflow/package.json`, with relevant documentation and release notes. The workflow does not bump versions or commit changes.
2. Manually run **Release** on `main` in `publish` mode and enter that version. No push or tag automatically publishes. It stops before publishing anything if a package is not on npm yet.
3. CI verifies the code, packs each package once, and checks an app created by the packed create command with the packed library. It checks that the template installs the Reflow release with the same version. It publishes the library, then the create package, and creates `vX.Y.Z` and a GitHub release containing both archives.

If npm succeeds but the GitHub step fails, rerun the workflow on the same commit. It accepts an existing npm version only when the archive integrity matches and rejects a tag pointing at another commit. Never overwrite or reuse a released version for changed contents.

## Local validation

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm fmt:check
pnpm check
pnpm --filter @reflow/web exec playwright install chromium
pnpm --filter @reflow/web build
pnpm test:run
pnpm --filter @reflow/web exec remix doctor
node tools/check-package.ts
```

Before a release, also run `pnpm test:linux` to run the suite on Linux, as CI does. [Testing](testing.md)

`pnpm test:run` reuses the library and showcase builds. `node tools/check-package.ts` reuses both package builds. `pnpm test` and `pnpm test:package` build first for standalone local use. No local validation command publishes. The smoke test cleans up its temporary app, browser, and server even on failure.
