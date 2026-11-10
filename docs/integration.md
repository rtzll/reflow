# Integrate Reflow

Reflow uses Remix 3's component runtime. The package is available on [npm](https://www.npmjs.com/package/@rtzll/reflow).

## Compatibility

Use Node 24.3+ and pnpm 12.18.0 for the documented workflow. Reflow requires `remix@3.2.0` as a peer dependency and includes `@remix-run/ui@0.13.1` as a dependency. Remix UI is independently versioned and unstable. Keep these pins when integrating; other version combinations have not been verified.

Use ESM (`"type": "module"`) and configure TypeScript with `"jsx": "react-jsx"` and `"jsxImportSource": "remix/component"`. The JSX compiler option does not introduce a React dependency. See the [starter tsconfig](../examples/starter/tsconfig.json) for the complete configuration.

## Install into an existing app

From your app's root, install Reflow and its Remix peer dependency:

```sh
pnpm add --save-exact @rtzll/reflow@0.5.0 remix@3.2.0
```

For a new project, the [starter command](development.md#try-a-clean-install) generates an app wired up to a local build of Reflow.

### Test a local build

From the Reflow checkout, install dependencies, build, and create a tarball:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @rtzll/reflow pack --out /absolute/path/to/rtzll-reflow.tgz
```

From your app's root, copy that tarball into the project and install it alongside the compatible Remix version:

```sh
mkdir -p vendor
cp /absolute/path/to/rtzll-reflow.tgz vendor/rtzll-reflow.tgz
pnpm add ./vendor/rtzll-reflow.tgz remix@3.2.0 --save-exact
```

Keep the tarball and lockfile with the app so `pnpm install --frozen-lockfile` works in another checkout. Library edits require rebuilding, repacking, and reinstalling the tarball.

## Serve the library and stylesheet

Merge these entries into your app's existing Remix asset configuration; preserve its other allowlists and settings:

```json
{
  "assets": {
    "basePath": "/assets",
    "allowFiles": ["app/public/**"],
    "allowPackages": ["remix", "@rtzll/reflow"],
    "denyFiles": ["**/*.d.ts"]
  }
}
```

The asset server automatically allows dependencies of allowed packages, including Reflow's Remix UI dependency. Ensure your server loads this configuration into `createAssetServer` and routes `/assets/*` requests to `assets.fetch(request)`. See the starter's [asset server](../examples/starter/app/assets.ts), [routes](../examples/starter/app/routes.ts), and [controller](../examples/starter/app/actions/controller.tsx).

Resolve the CSS package export through that asset server in your document action:

```ts
const libraryStyles = await assets.getHref(import.meta.resolve('@rtzll/reflow/styles.css'))
```

Render `<link rel="stylesheet" href={libraryStyles} />` in the document head, before your application stylesheet. Serve the exported stylesheet through the asset server so its relative CSS imports resolve too.

## Render and hydrate

Import components from `@rtzll/reflow`. Put interactive examples such as the [README's Dialog](../README.md#use-a-component) in a browser-reachable module, for example `app/public/example.tsx`, and render `<Example />` from your page. The named export and function passed to `clientEntry` must match.

Your document also needs a browser entry that calls `run()` from `remix/component` and loads client-entry modules. Resolve it with `assets.getScriptEntry(...)`, render its `ImportMap`, and load its module script. Reuse an existing Remix browser entry if your app has one. The starter's [browser entry](../examples/starter/app/public/entry.ts) and [document controller](../examples/starter/app/actions/controller.tsx) show the complete wiring.

Server-rendered markup alone does not enable interactive controls. Keep server and initial browser props consistent; apply persisted appearance preferences before the first render to avoid a theme flash.

## Check the integration

Run your app's typecheck and open a page using the installed package. Confirm that styles load, the Dialog opens with pointer and keyboard, Escape closes it, and focus returns to its trigger. Check the console and network panel for hydration errors and missing assets. For forms, verify submitted values and reset behavior in your own composition.

For component APIs, follow the [public exports](../packages/reflow/src/index.ts) to their prop types and read the [showcase examples](../apps/web/app/public/examples.tsx). These work as repository documentation without a running server. The [component catalog](components.md) lists what ships; run the showcase for interactive API tables and playgrounds.
