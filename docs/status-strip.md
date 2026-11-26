# StatusStrip

Operators inspecting a CI run or deployment want immediate historical context: did the previous ten runs pass, fail, or regress in duration? `StatusStrip` renders recent runs or uptime intervals as compact, status-colored, duration-scaled vertical bars with an optional live readout on hover, focus, or selection.

## API

```tsx
import { StatusStrip } from '@rtzll/reflow'

<StatusStrip
  label="Recent CI runs"
  items={[
    { id: '4577', status: 'failed', label: 'Run #4577 · failed', value: 243_000, detail: '3bb2c29 · 4m 03s' },
    { id: '4578', status: 'passed', label: 'Run #4578 · passed', value: 222_000, detail: '8b55f19 · 3m 42s' },
  ]}
  value={activeRunId}
  onValueChange={setActiveRunId}
  showReadout
/>
```

- `items` accepts ordered `StatusStripItem` entries (`id`, `status`, `label`, optional numeric `value` for height scaling, and `detail`).
- `scaleHeight` (default `true`) scales each bar's inner fill proportionally to `value`, making slow or cancelled runs immediately recognizable.
- Hover scaling animates only the inner `.rf-status-strip-fill` (`transform-origin: bottom`) rather than the `<button>` hit target, keeping pointer hover completely stable without jitter.
- `showReadout` renders the hovered or selected item's label and detail beside the strip, updating via pointer hover or roving keyboard focus (`ArrowLeft` / `ArrowRight`).

## Verification

Browser tests (`status-strip.test.browser.tsx`) verify height scaling, hover/focus readout updates, and selection callbacks; `/apps/ci` E2E tests verify switching between failing and passing historical runs.
