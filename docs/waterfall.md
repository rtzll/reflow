# Waterfall

Understanding why a CI build or distributed trace took four minutes requires seeing concurrency, wait gaps, and the critical path at a glance. `Waterfall` renders a hierarchical Gantt timing breakdown with a sticky shared time ruler, collapsible parent spans, semantic status fills, critical-path outlines, and keyboard navigation.

## API

```tsx
import { Waterfall } from '@rtzll/reflow'

<Waterfall
  label="CI execution waterfall"
  spans={[
    { id: 'build', label: 'Build workspace', status: 'passed', startMs: 0, durationMs: 11400, critical: true },
    { id: 'e2e', label: 'E2E & browser', status: 'failed', startMs: 11400, durationMs: 131000, critical: true },
  ]}
  value={selectedSpan}
  onValueChange={setSelectedSpan}
  size="compact"
/>
```

- `spans` accepts nested `WaterfallSpan` trees (`startMs`, `durationMs`, `status`, `meta`, `critical`, `children`) with automatic total-duration calculation (overridable via `totalMs`).
- `highlightCriticalPath` (default `true`) outlines spans marked `critical: true` so bottlenecks stand out immediately.
- `value`, `defaultValue`, and `onValueChange` link clicked or keyboard-selected spans directly to companion log viewers or inspectors.
- Keyboard navigation supports `ArrowUp` / `ArrowDown` across visible rows and `ArrowLeft` / `ArrowRight` to collapse or expand parent spans.

## Verification

Browser tests (`waterfall.test.browser.tsx`) cover nested span expansion/collapse, time-axis scaling, critical-path attributes, and selection callbacks; `/apps/ci` E2E tests verify clicking spans updates the synced `LogViewer`.
