# DiffView

After `FileChanges` summarizes which files changed, the reader needs to inspect the actual lines added and removed. DiffView renders a unified or side-by-side diff in the same quiet frame as `CodeBlock`, with dual line numbers, change counts, and optional view switching.

## API

```tsx
<DiffView
  filename="packages/reflow/src/kbd.tsx"
  diff={unifiedDiff}
  viewToggle
/>
```

- `diff` accepts a standard unified diff string (`@@ -a,b +c,d @@` hunks with `+`, `-`, and space-prefixed lines).
- `hunks` accepts structured `{ header?, lines }` data directly, including optional `tokens` from `CodeBlock` / `@rtzll/reflow/highlight`.
- `filename` names the edited file in the header (muted folder path, foreground filename). When omitted with a `diff` string containing `+++ b/...`, the path is extracted automatically.
- `label` sets the accessible name of the diff region (defaults to `filename` or `"Code diff"`).
- `view`, `defaultView`, and `onViewChange` choose between `"unified"` (default) and `"split"` (side-by-side).
- `viewToggle` shows a compact `SegmentedControl` in the header to switch between Unified and Split.
- `lineNumbers` (default `true`) toggles the old/new line-number gutters; `wrap` (default `false`) wraps long lines instead of scrolling sideways.
- `actions` places app controls (such as Revert or Open) at the end of the header; `size` overrides density.

## Behavior

The header shows the file path, total `+added −removed` counts (written out for assistive technology as in `FileChanges`), and optional view toggle and actions. In unified mode, each line shows old and new line numbers, a `+`/`−` sign in a non-selectable gutter, and screen-reader prefixes for added and removed lines. In split mode, adjacent removed and added blocks pair side by side, padding uneven runs with empty cells while keeping context lines aligned.

## Reused pieces

`ScrollArea` for overflow scrolling, `SegmentedControl` for the layout toggle, `CodeBlock`'s monospace and diff color tokens, and `FileChanges`'s accessible count pattern.

## Verification

Browser tests cover unified diff parsing and automatic filename extraction, dual line numbers, added/removed counts and screen-reader labels, switching between unified and split views (controlled and uncontrolled), pairing uneven remove/add runs in split view, structured `hunks` with highlighted tokens, and `lineNumbers` / `wrap` toggles.
