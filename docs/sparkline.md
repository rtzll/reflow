# Sparkline

Compact trend indicators let operators scan CPU, memory, latency, or build-time drift inside tables and telemetry cards without the chrome of a full chart. `Sparkline` renders a lightweight inline SVG stroke with an optional translucent area fill and pointer/keyboard sample scrubbing.

## API

```tsx
import { Sparkline } from '@rtzll/reflow'

<Sparkline
  label="Runner CPU utilization"
  values={[28, 34, 42, 58, 79, 86, 72]}
  labels={['12:00', '12:05', '12:10', '12:15', '12:20', '12:25', '12:30']}
  tone="accent"
  interactive
  onActiveIndexChange={setSample}
/>
```

- Semantic `tone` values (`accent`, `info`, `success`, `warning`, `danger`, `neutral`) map directly to Reflow CSS custom properties.
- Decorative by default (`aria-hidden="true"` when `label` is omitted); pass `label` for meaningful standalone sparklines.
- Enabling `interactive` adds pointer-move and `ArrowLeft`/`ArrowRight` scrubbing with a live active marker dot and `onActiveIndexChange` callback.

## Verification

Browser tests (`metric-card.test.browser.tsx`) verify SVG path geometry, semantic tones, and keyboard/pointer active-index callbacks.
