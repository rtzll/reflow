import { BarChart } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const series = [
  { id: 'added', label: 'Added' },
  { id: 'removed', label: 'Removed' },
]

// Lines changed per package this week: added lines up, removed lines down.
const packages = [
  { id: 'reflow', label: 'reflow', values: [420, -180] },
  { id: 'web', label: 'web', values: [260, -310] },
  { id: 'starter', label: 'starter', values: [40, -12] },
  { id: 'create', label: 'create-reflow', values: [18, -26] },
]

const balance = [
  { id: 'mon', label: 'Mon', value: 12 },
  { id: 'tue', label: 'Tue', value: -8 },
  { id: 'wed', label: 'Wed', value: 21 },
  { id: 'thu', label: 'Thu', value: -14 },
  { id: 'fri', label: 'Fri', value: 6 },
]

/** BarChart with series, negative values and horizontal rows. */
export function BarChartVariants(handle: Handle<{ variant: string }>) {
  return () =>
    handle.props.variant === 'negative' ? (
      <div class="doc-bar-chart">
        <BarChart label="Daily balance" items={balance} formatValue={(value) => `${value} h`} />
      </div>
    ) : (
      <div class="doc-bar-chart">
        <BarChart
          label="Lines changed by package"
          items={packages}
          series={series}
          layout="stacked"
          orientation="horizontal"
        />
      </div>
    )
}
