# LogViewer

CI pipelines and runtime diagnostics produce grouped, noisy streams that need more than a plain `<pre>` block. `LogViewer` provides a Datadog-inspired log explorer built on `Terminal`'s zero-dependency ANSI SGR parser, adding collapsible step groups, a severity volume histogram, regex and structured `key:value` facet search with removable filter chips, expandable JSON/field inspection drawers, error jumping, Shift+click line range selection, and large-log windowing.

## API

```tsx
import { LogViewer } from '@rtzll/reflow'

<LogViewer
  title="E2E & browser · chromium"
  status="failed"
  duration="2m 11s"
  groups={stepGroups}
  maxHeight="460px"
  size="compact"
/>
```

- `groups` renders collapsible `LogGroup` sections with status icons, durations, and error/warning counters. Failed groups open automatically unless `defaultOpen` is explicitly set.
- `searchable`, `query`, and `onQueryChange` support plain text, `/regex/flags`, and structured `key:value` facets (`level:error`, `source:chromium`, or any structured `entry.fields` key). Clicking a source pill or field value appends a facet filter, and active facets appear as removable `×` chips above the stream.
- `showHistogram` (default `true`) renders a compact severity distribution bar per step group; clicking a bucket jumps directly to that group.
- `entries` support optional `level`, `timestamp`, `source`, and structured `fields` inspected via an inline drawer per row.
- `maxVisibleLines` (default `500`) windows very large groups with **Show N more lines** and **Show all** controls to keep DOM size bounded.
- Keyboard shortcuts: `/` focuses the search input, `n` / `p` jump to next/previous errors, and Shift+click selects contiguous line ranges for copying or linking.

## Verification

Browser tests (`log-viewer.test.browser.tsx`) verify auto-opened failure groups, severity/regex/facet filtering, removable facet chips, structured field drawers, Shift+click line ranges, and `maxVisibleLines` windowing. E2E coverage exercises the live explorer inside `/apps/ci`.
