# LineChart

Continuous time-series metrics — p95/p50 latency, throughput, build duration, and error rates — need multi-series comparison, subtle Y-axis gridlines, and responsive crosshair inspection. `LineChart` renders crisp responsive SVG series with optional area fills, dashed comparison baselines, and pointer/keyboard scrubbing.

## API

```tsx
import { LineChart } from '@rtzll/reflow'

<LineChart
  label="Edge Worker response latency"
  labels={['09:00', '10:00', '11:00', '12:00', '13:00']}
  series={[
    { id: 'p95', label: 'p95 latency', values: [142, 136, 158, 194, 176], area: true },
    { id: 'p50', label: 'p50 baseline', values: [68, 64, 72, 81, 75], dashed: true },
  ]}
  formatValue={(v) => `${Math.round(v)}ms`}
/>
```

- Plots each series with `vector-effect="non-scaling-stroke"` so strokes stay crisp at any viewport width.
- Hovering or pressing `ArrowLeft`/`ArrowRight`/`Home`/`End` moves a vertical crosshair across buckets, highlights each series marker, and updates the header readout without layout shift.
- Respects `showGrid`, `showLegend`, explicit `min`/`max` bounds, and both `default` and `compact` density.

## Verification

Browser tests (`line-chart.test.browser.tsx`) verify multi-series rendering, selective `area` fills, dashed baselines, and keyboard crosshair navigation.
