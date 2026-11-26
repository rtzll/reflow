# DiffView

After `FileChanges` summarizes which files changed, the reader needs to inspect the actual lines added and removed. `DiffView` wraps [`@pierre/diffs`](https://diffs.com) inside `CodeBlock`'s quiet frame, inheriting Reflow's light/dark theme, accent, density, and `--rf-code-token-*` syntax palette into the Shadow DOM.

Import `DiffView` from `@rtzll/reflow/diffs`. `@pierre/diffs` is an optional peer dependency so apps that do not render diffs never install or load it.

For zero-flash server rendering, call `prerenderDiff()` from `@rtzll/reflow/diffs/ssr` on the server (or at build time) and pass its `prerenderedHTML` to `<DiffView>`:

```tsx
import { prerenderDiff } from '@rtzll/reflow/diffs/ssr'
import { DiffView } from '@rtzll/reflow/diffs'

const rendered = await prerenderDiff({ diff: unifiedDiff, wrap: true })

<DiffView
  diff={unifiedDiff}
  prerenderedHTML={rendered.prerenderedHTML}
  viewToggle
  wrap
  copyable
/>
```

## API

```tsx
import { DiffView } from '@rtzll/reflow/diffs'

<DiffView
  filename="packages/reflow/src/behaviors/shortcut.ts"
  diff={unifiedDiff}
  viewToggle
/>
```

- `diff` accepts a standard unified diff string (`git diff` / `@@ -a,b +c,d @@` hunks).
- `oldFile` and `newFile` accept full `{ name, contents, lang? }` file contents for computing diffs with expandable unchanged context.
- `fileDiff` accepts pre-parsed `@pierre/diffs` `FileDiffMetadata`.
- `prerenderedHTML` accepts pre-rendered Declarative Shadow DOM HTML from `prerenderDiff()` in `@rtzll/reflow/diffs/ssr` for zero-flash SSR hydration with `deferHydrationHighlight`.
- `filename` names the edited file in the header (muted folder path, foreground filename). Extracted from the diff or file inputs when omitted.
- `lang` overrides the syntax-highlighting language inferred from the filename.
- `view`, `defaultView`, and `onViewChange` choose between `"unified"` (default) and `"split"` (side-by-side).
- `viewToggle` shows a compact `SegmentedControl` in the header to switch between Unified and Split.
- `copyable`, `copyText`, `onCopy`, and `onCopyError` add a quiet copy icon button matching `CodeBlock`.
- `collapsible`, `collapsed`, `defaultCollapsed`, and `onCollapsedChange` let the reader fold and expand individual file diffs.
- `headerPrefix` places a leading badge or control (such as a file status indicator) before the file path.
- `lineNumbers`, `wrap`, `indicators`, `lineDiffType`, `hunkSeparators`, and `expandUnchanged` control layout, intraline word highlighting, and context expansion.
- `enableLineSelection`, `selectedLines`, `onLineSelected`, `enableGutterUtility`, `onGutterUtilityClick`, `lineAnnotations`, and `renderAnnotation` expose interactive line-range selection, hover `+` gutter triggers, and slotted Remix inline review annotations.
- `theme`, `themeType`, and `unsafeCSS` customize the underlying `@pierre/diffs` surface; by default Reflow registers a CSS-variable theme that matches `CodeBlock`.
- `actions` places app controls (such as Copy patch or Revert) at the end of the header; `size` overrides density.

## Behavior

On the server, `DiffView` renders the accessible `<figure>`, header path, `+added −removed` counts (written out for assistive technology as in `FileChanges`), optional view toggle, and either `prerenderedHTML` or a readable `<pre>` fallback. On the client, `@pierre/diffs` mounts lazily inside an isolated mount node, registers Reflow's CSS-variable syntax theme once, and renders syntax-highlighted unified or split diffs with intraline change spans.

## Reused pieces

`SegmentedControl` for the layout toggle, `CodeBlock`'s monospace and syntax token palette, `FileChanges`'s accessible count pattern, and `@pierre/diffs`'s `FileDiff` engine behind the optional `@rtzll/reflow/diffs` subpath.

## Verification

Browser tests cover unified diff parsing and automatic filename extraction, header counts and screen-reader labels, mounting `@pierre/diffs` inside Shadow DOM, switching between unified and split views (updating `data-diff-type`), computing diffs from `oldFile` / `newFile`, and propagating `lineNumbers` and `wrap` options. Package checks enforce that only `dist/diffs.js` imports `@pierre/diffs` and installing `@rtzll/reflow` never installs it.
