# Development

Use Node 24.3 or newer and pnpm 12.18.0. Install the workspace and start the app from the repository root.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the address printed in the terminal: `/` for the gallery, `/docs` for documentation, and `/demo` for the focused demo. The default bind address is `127.0.0.1`, with port `44100` for the showcase and `44103` for the generated starter. Override these with `HOST` and `PORT`; for example, `PORT=3000 pnpm dev`. If the port is occupied, choose another; the server does not automatically select the next port.

`pnpm dev` builds the library before starting the server. Run `pnpm build` after editing library source or styles. The website loads the library through the workspace package's public exports.

```sh
pnpm lint
pnpm format:check
pnpm check
pnpm --filter @reflow/web exec playwright install chromium
pnpm test
pnpm test:deployment
pnpm test:package
pnpm --filter @reflow/web exec remix doctor
```

`pnpm format` and `pnpm lint:fix` apply the Oxfmt and OXLint fixes. Formatting follows the Remix repository: 100 columns, single quotes, and no semicolons. Markdown is left as written.

CI runs the Reflow checks and browser tests with no reference server. For a visual comparison, open the same component, theme, density, viewport, and interaction state in the built-in browser. [Pinned Fluid Functionalism source](https://github.com/mickadesign/fluid-functionalism/tree/7e6ae290dd8f5a7657ae4a433a42e165bac3ece4)

## Verification

The test suite covers keyboard and focus behavior, form values and resets, popup interactions, composer attachments and queued sends, settings, and showcase layout. The docs sweep checks hydration and horizontal overflow in desktop dark and mobile light, and documentation examples are typechecked against the public API.

When changing an interaction, verify the component where the showcase uses it. Check pointer, keyboard, touch, reduced motion and form behavior where they apply, and use the built-in browser for visual checks. For a component that follows upstream, compare the same state with Fluid Functionalism when changing its motion or presentation.

Checks run on pull requests and pushes to `main`; superseded check runs are cancelled. CI reuses the build from `pnpm check` by running `pnpm test:run`. The install smoke test then checks the packed artifact. The catalog's HTTP rendering is covered by a server test, and `pnpm test:deployment` checks hydration and overflow on every docs page at desktop and mobile widths. Showcase tests import the router from `apps/web/test/showcase-router.ts`, which closes asset watchers after each suite so workers exit promptly. [Release preparation and enablement](releasing.md) are separate and require a manual trigger after migration.

## Try a clean install

Run `pnpm starter /absolute/path/to/my-app` from an installed Reflow checkout. The destination must be a new directory with an existing parent outside the workspace. The command builds and packs `@rtzll/reflow`, copies the starter, and installs dependencies in the new directory. The resulting app has its own lockfile and depends on `file:vendor/rtzll-reflow.tgz`. Keep that tarball with the app to reinstall with `pnpm install --frozen-lockfile`.

From the generated directory:

```sh
pnpm check
pnpm dev
```

Open the address printed in the terminal. Toggle the sidebar, select Dark, switch on Compact layout, and open and dismiss Preview alert. Use Apply settings and reload to confirm the URL restores both appearance and notification choices. Reset restores the choices from the last page load.

The starter imports components through `@rtzll/reflow`. Its asset server allows `remix` and `@rtzll/reflow`, and resolves `@rtzll/reflow/styles.css` through the package export. The installed tarball supplies the JavaScript, declarations, and styles. `pnpm test:package` checks those files, installs a temporary starter outside the workspace, and exercises its production UI. It closes the browser and server and deletes the temporary app afterward. To check an existing archive without rebuilding, run `node tools/check-package.mjs /absolute/path/to/package.tgz`. Use the starter when you need to check that those files work in an independent Remix project. [Starter source](../examples/starter/app/actions/controller.tsx)
