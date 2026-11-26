# FileTree

Code reviews, artifact browsers, and repository explorers need a path-first tree that scales to large directories without layout shift. `FileTree` wraps [`@pierre/trees`](https://trees.software) behind an optional peer entry point (`@rtzll/reflow/trees`, `@rtzll/reflow/trees/ssr`, and `@rtzll/reflow/trees.css`), adding Reflow token theming, automatic viewport sizing, git status indicators, multi-color trailing decorations, and zero-flash Declarative Shadow DOM SSR.

## API

```tsx
import { FileTree } from '@rtzll/reflow/trees'

<FileTree
  label="Changed files"
  paths={[
    'packages/reflow/src/diffs.tsx',
    'packages/reflow/src/trees.tsx',
    'apps/web/test/app-review.test.e2e.ts',
  ]}
  gitStatus={[{ path: 'packages/reflow/src/trees.tsx', status: 'added' }]}
  rowDecorations={{
    'packages/reflow/src/trees.tsx': {
      text: '+184',
      parts: [{ text: '+184', color: 'var(--rf-success)' }],
    },
  }}
  size="compact"
/>
```

- `paths` accepts canonical slash-separated paths; single-child directory chains compact automatically unless `flattenEmptyDirectories={false}`.
- `value`, `defaultValue`, `onValueChange`, and `onSelectionChange` support controlled and uncontrolled selection.
- `gitStatus` renders per-file git status indicators (`added`, `modified`, `deleted`, `renamed`, `untracked`, `ignored`).
- `rowDecorations` and `renderRowDecoration` attach trailing metadata such as colored `+loc` / `−loc` counts or bundle sizes.
- `search`, `searchQuery`, and `searchMode` enable inline or externally controlled tree filtering.
- `height` and `maxHeight` (default `360px`) size the virtualized `<file-tree-container>` viewport automatically so it never collapses to `0px`.
- `prerenderFileTree()` in `@rtzll/reflow/trees/ssr` produces a Declarative Shadow DOM payload for `prerendered` so pages paint with zero flash before client hydration.

## Isolation & Styling

`@pierre/trees` and `preact` stay optional peers isolated to `@rtzll/reflow/trees` and `@rtzll/reflow/trees/ssr`. Apps that do not import `FileTree` never install or bundle them. Import `@rtzll/reflow/trees.css` (or the umbrella `@rtzll/reflow/styles.css`) for styling inside `@layer reflow`.

## Verification

Server tests verify Declarative Shadow DOM output and row decorations (`trees-ssr.test.tsx`), browser tests cover hydration and selection (`file-tree.test.browser.tsx`), and E2E tests verify `/apps/review` and `/apps/ci` artifact browsing.
