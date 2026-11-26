# Development

Use Node 26 LTS and the pnpm version pinned in `package.json`. Install the workspace and start the app from the repository root.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the address printed in the terminal: `/` for the gallery, `/docs` for documentation, and `/apps` for the example apps. The default bind address is `127.0.0.1`, with port `44100` for the showcase and `44103` for the generated starter. Override these with `HOST` and `PORT`; for example, `PORT=3000 pnpm dev`. If the port is occupied, choose another; the server does not automatically select the next port.

`pnpm dev` builds the library before starting the server. Run `pnpm build` after editing library source or styles. The website loads the library through the workspace package's public exports.

Every page shares one link preview image, `apps/web/app/public/og.png`: the gallery's first band with the HoverCard open. After changing those components or the gallery's first band, start `pnpm dev` and run `pnpm --filter @reflow/web og:image` to capture it again.

```sh
pnpm check:fast          # ~5s Tier 0 loop: Oxlint, Oxfmt, TypeScript, unit/invariants, server/SSR/property/dev-assets
pnpm --filter @reflow/web exec playwright install chromium
pnpm test                # full server + browser + E2E suites
pnpm test:deployment     # Worker peer isolation, zero-flash SSR, preview heights, desktop/mobile overflow across all routes
pnpm test:package        # packed tarball contents, create-reflow, isolated install, starter checks
pnpm --filter @reflow/web exec remix doctor
pnpm bump <X.Y.Z>        # align version across manifests, install docs, and showcase prompt
```

`pnpm lint` runs Oxlint and `pnpm lint:fix` applies its fixes. `pnpm fmt` formats files with Oxfmt and `pnpm fmt:check` checks formatting. Formatting follows the Remix repository: 100 columns, single quotes, and no semicolons. Markdown is left as written.

CI runs the Reflow checks and browser tests with no reference server. For a visual comparison, open the same component, theme, density, viewport, and interaction state in the built-in browser. [Pinned Fluid Functionalism source](https://github.com/mickadesign/fluid-functionalism/tree/7e6ae290dd8f5a7657ae4a433a42e165bac3ece4)

## Showcase sound

The showcase loads recordings on first use and shares one mute preference across pages. The audio dependency belongs to the web app. Its build copies the selected MP3s and their license from Josh W. Comeau’s Button Sounds package. [Sound collection](https://buttons.joshwcomeau.com/) · [Recording selection](../apps/web/app/sound-assets.ts)

Sliders tick as their value changes, and calendar events tick as their length snaps to a new time slot or day. Popovers and accordions click on open. Drawers use an original swoosh on open and close. Dismissing a banner plays the same closing swoosh at the same volume. Moving a carousel forward by hand plays the rising swoosh, and moving back plays the falling one. Autoplay stays silent. Both the clicks and the swooshes use `surfaceVolume`, currently `0.2`. [Showcase sound settings](../apps/web/app/public/showcase-sound.ts)

## Verification

The test suite covers keyboard and focus behavior, form values and resets, popup interactions, composer attachments and queued sends, settings, and showcase layout. The docs sweep checks hydration and horizontal overflow in desktop dark and mobile light, and documentation examples are typechecked against the public API.

How to write and run tests, including motion and timers, and what to do when one flakes: [Testing](testing.md).

When changing an interaction, verify the component where the showcase uses it. Check pointer, keyboard, touch, reduced motion and form behavior where they apply, and use the built-in browser for visual checks. For a component that follows upstream, compare the same state with Fluid Functionalism when changing its motion or presentation.

Checks run on pull requests and pushes to `main`; superseded check runs are cancelled. CI runs `pnpm test:run` against the artifacts built during the library and deployment checks. The install smoke test then checks the packed artifact. The catalog's HTTP rendering is covered by a server test, and `pnpm test:deployment` checks hydration and overflow on every docs page at desktop and mobile widths. The E2E suite serves the production showcase build from one local Cloudflare Worker. Each test opens a fresh browser context. Running an E2E file directly through Remix starts a development server for that file. [Release preparation and enablement](releasing.md) are separate and require a manual trigger after migration.

## Try a clean install

`pnpm create @rtzll/reflow my-app` creates an app from the Reflow release on npm. To create the same app with this checkout's Reflow, run `pnpm starter /absolute/path/to/my-app` from an installed checkout. The destination must be a new directory with an existing parent outside the workspace. The command builds both packages, packs `@rtzll/reflow`, and runs the create command from `packages/create-reflow` with that archive. The resulting app has its own lockfile and depends on `file:vendor/rtzll-reflow.tgz`. Keep that tarball with the app to reinstall with `pnpm install --frozen-lockfile`.

The create package's template is built from `examples/starter`, so change the starter there. Its build pins the Reflow version from `packages/reflow`; both packages always share one version.

From the generated directory:

```sh
pnpm check
pnpm dev
```

Open the address printed in the terminal. Toggle the sidebar, select Dark, switch on Compact layout, and open and dismiss Preview alert. Use Apply settings and reload to confirm the URL restores both appearance and notification choices. Reset restores the choices from the last page load.

The starter imports components through `@rtzll/reflow`. Its asset server allows `remix` and `@rtzll/reflow`, and resolves `@rtzll/reflow/styles.css` through the package export. The installed tarball supplies the JavaScript, declarations, and styles. `pnpm test:package` packs both packages and checks their files. It runs the packed create command the way `npm create` does, installs the packed library in a temporary app outside the workspace, and exercises its production UI. It closes the browser and server and deletes the temporary app afterward. To check existing archives without rebuilding, run `node tools/check-package.ts /absolute/path/to/rtzll-reflow.tgz /absolute/path/to/rtzll-create-reflow.tgz`. Use the starter when you need to check that those files work in an independent Remix project. [Starter source](../examples/starter/app/actions/controller.tsx)
