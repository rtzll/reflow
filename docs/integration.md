# Integrate Reflow

Reflow uses Remix 3's component runtime. The package is available on [npm](https://www.npmjs.com/package/@rtzll/reflow).

## Compatibility

Use Node 26 LTS and the pnpm version pinned in the workspace's `package.json` for the documented workflow. Reflow requires `remix@3.3.0` as a peer dependency and includes `@remix-run/ui@0.14.0` as a dependency. Remix UI is independently versioned and unstable. Keep these pins when integrating; other version combinations have not been verified.

Use ESM (`"type": "module"`) and configure TypeScript with `"jsx": "react-jsx"` and `"jsxImportSource": "remix/component"`. The JSX compiler option does not introduce a React dependency. See the [starter tsconfig](../examples/starter/tsconfig.json) for the complete configuration.

## Install into an existing app

From your app's root, install Reflow and its Remix peer dependency:

```sh
pnpm add --save-exact @rtzll/reflow@0.22.0 remix@3.3.0
```

For a new project, `pnpm create @rtzll/reflow my-app` creates an app that is already set up this way. To try a local build of Reflow, use the [starter command](development.md#try-a-clean-install).

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
pnpm add ./vendor/rtzll-reflow.tgz remix@3.3.0 --save-exact
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

Render `<link rel="stylesheet" href={libraryStyles} />` in the document head, before your application stylesheet. If you want only the styles for domains you use, load `@rtzll/reflow/core.css` alongside any opt-in domain sheets you need:

| Stylesheet export | Size (raw / gzip) | Included components |
| --- | --- | --- |
| `@rtzll/reflow/styles.css` | ~492 KB / ~79 KB | All components (zero-config default) |
| `@rtzll/reflow/core.css` | ~292 KB / ~51 KB | Foundations, tokens, forms, overlays, navigation, charts, calendar, data table |
| `@rtzll/reflow/chat.css` | ~54 KB / ~11 KB | AI & chat (`ChatLayout`, `ChatMessage`, `InputMessage`, `ThinkingSteps`, `ToolCalls`, `AskUserQuestions`, etc.) |
| `@rtzll/reflow/code.css` | ~85 KB / ~12 KB | Code review & CI (`CodeBlock`, `CodeBrowser`, `Terminal`, `LogViewer`, `Waterfall`, `PipelineGraph`, `StackGraph`, `MergeReadiness`, `TestReport`, `MatrixGrid`, `MergeQueue`, etc.) |
| `@rtzll/reflow/projects.css` | ~41 KB / ~5 KB | Project tracking (`KanbanBoard`, `GroupedList`, `RoadmapTimeline`, `CycleOverview`, `TriageQueue`, `QuickCreateBar`, `ViewOptionsPopover`, `SavedViewTabs`, etc.) |
| `@rtzll/reflow/diffs.css` | ~7 KB / ~2 KB | `DiffView` |
| `@rtzll/reflow/trees.css` | ~3 KB / ~1 KB | `FileTree` |
| `@rtzll/reflow/diagrams.css` | ~4 KB / ~1 KB | `Diagram` |
| `@rtzll/reflow/markdown.css` | ~7 KB / ~2 KB | `Markdown`, `MarkdownEditor` |

Every stylesheet sits in the `reflow` cascade layer, so your CSS and `css()` styles override them; keep resets in a layer before it, as [customization](customization.md#cascade-layers) shows.

On phones, Reflow's controls keep their text at 16px or more so iOS does not zoom into a field, drop the browser's tap flash, and show hover states only on devices that can hover. Keep zoom enabled: do not add `user-scalable=no` or `maximum-scale=1` to the viewport tag. If your app draws edge to edge with `viewport-fit=cover`, Drawer and Toaster pad themselves clear of the notch and the home indicator; your own fixed headers and bars need `env(safe-area-inset-*)` padding too.

## Render and hydrate

Import components from `@rtzll/reflow`. Put interactive examples such as the [README's Dialog](../README.md#use-a-component) in a browser-reachable module, for example `app/public/example.tsx`, and render `<Example />` from your page. The named export and function passed to `clientEntry` must match.

Your document also needs a browser entry that calls `run()` from `remix/component` and loads client-entry modules. Resolve it with `assets.getScriptEntry(...)`, render its `ImportMap`, and load its module script. Reuse an existing Remix browser entry if your app has one. The starter's [browser entry](../examples/starter/app/public/entry.ts) and [document controller](../examples/starter/app/actions/controller.tsx) show the complete wiring.

Server-rendered markup alone does not enable interactive controls. Keep server and initial browser props consistent; apply persisted appearance preferences before the first render to avoid a theme flash.

## Highlight code

`CodeBlock` renders plain code with nothing but Reflow. To highlight it, install the optional peers and call `highlight()` from `@rtzll/reflow/highlight` where the code is known, ideally in a route handler, and pass the result to `CodeBlock`:

```sh
pnpm add shiki @shikijs/transformers
```

```tsx
import { CodeBlock } from '@rtzll/reflow'
import { highlight } from '@rtzll/reflow/highlight'

const code = await highlight(source, { lang: 'tsx' })
// <CodeBlock code={code} filename="Button.tsx" />
```

The result is plain data, so it can cross into a client entry as props, and the browser loads no highlighter. Highlight in the browser only for code that arrives later, such as a streamed reply. On platforms with a bundle size limit, such as Cloudflare Workers, highlight known code at build time; the showcase's [build](../apps/web/tools/build.ts) does this for its samples.

## Specialist component entry points

`Markdown`, `MarkdownEditor`, `DiffView`, `FileTree`, and `Diagram` ship on separate entry points so apps that do not use them never bundle their parsers or optional peer dependencies:

| Component(s) | Client entry | SSR helper | Standalone CSS | Dependency |
| --- | --- | --- | --- | --- |
| `Markdown`, `MarkdownEditor` | `@rtzll/reflow/markdown` | — | `@rtzll/reflow/markdown.css` | `marked` (bundled dependency) |
| `DiffView` | `@rtzll/reflow/diffs` | `@rtzll/reflow/diffs/ssr` (`prerenderDiff`) | `@rtzll/reflow/diffs.css` | `@pierre/diffs` (optional peer) |
| `FileTree` | `@rtzll/reflow/trees` | `@rtzll/reflow/trees/ssr` (`prerenderFileTree`) | `@rtzll/reflow/trees.css` | `@pierre/trees`, `preact` (optional peers) |
| `Diagram` | `@rtzll/reflow/diagrams` | `@rtzll/reflow/diagrams/ssr` (`prerenderDiagram`) | `@rtzll/reflow/diagrams.css` | `pele` (optional peer) |

When importing any optional-peer component in a Remix client entry under the source-mode asset server, add the corresponding peer package (`"@pierre/diffs"`, `"@pierre/trees"`, `"pele"`) to `assets.allowPackages` in `remix.json`.

## Check the integration

Run your app's typecheck and open a page using the installed package. Confirm that styles load, the Dialog opens with pointer and keyboard, Escape closes it, and focus returns to its trigger. Check the console and network panel for hydration errors and missing assets. For native `<form>` wiring, `FormData` keys, server validation, and reset behavior, see [forms & progressive enhancement](forms.md).

For component APIs, follow the [public exports](../packages/reflow/src/index.ts) to their prop types and read the [showcase examples](../apps/web/app/public/examples.tsx). These work as repository documentation without a running server. The [component catalog](components.md) lists what ships; run the showcase for interactive API tables and playgrounds.
