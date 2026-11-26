# MetricCard

Dashboards and CI workspaces pair a tabular KPI figure with a semantic trend delta, optional status badge, and compact sparkline. `MetricCard` packages that pattern using Reflow's surface tokens and `Sparkline` primitive.

## API

```tsx
import { Badge, MetricCard } from '@rtzll/reflow'

<MetricCard
  label="p95 Build Time"
  value="3m 42s"
  delta="−18% vs 7d"
  deltaTone="positive"
  detail="linux-x64-8vcpu"
  badge={<Badge color="green" variant="dot" size="compact">Healthy</Badge>}
  sparkline={{ values: [268, 255, 244, 232, 222], tone: 'success' }}
/>
```

- Values use `font-variant-numeric: tabular-nums` so live updates never cause horizontal layout jitter.
- `deltaTone` (`positive`, `negative`, `neutral`) styles the delta consistently with Reflow's semantic colors.
- Adopted directly inside `/apps/ci` for runner CPU, memory, and cache telemetry cards.

## Verification

Browser tests (`metric-card.test.browser.tsx`) verify KPI slots, delta tone attributes, and embedded sparkline rendering; `/apps/ci` E2E tests verify responsive layout at desktop and mobile widths.
