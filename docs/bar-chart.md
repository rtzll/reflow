# BarChart

BarChart displays one series of nonnegative quantities on a shared zero baseline. Supply ordered items with stable IDs, short category labels, and numeric values. Additional fields pass through to the callbacks. Zero-only series stay on the baseline and empty collections display “No data”. The value axis rounds up so its three gridline steps are round numbers: a peak of 23 reads 8, 16 and 24. With `showAxes={false}`, the tallest bar fills the plot. [Build timings example](../apps/web/app/public/build-timings.tsx) (`/docs/bar-chart`)

Pass `href` to render native links to detailed views. Before hydration, all bars participate in normal tab order. Hydrated charts use a single tab stop and support Left, Right, Home, and End. Focus or hover reveals the category and formatted quantity. Passing only `onSelect` renders buttons for local actions. A chart with neither prop renders static, individually named bars and can sit inside a link.

Use `range` to highlight the inclusive interval between two IDs. Identical endpoints mark one current bar. Analytics builds dates from its activity records, stages the first endpoint, handles Escape, and navigates to a URL once the second endpoint is chosen. Its app directory preview reuses the same data and chart with axis labels hidden. [Analytics workspace](../apps/web/app/public/apps/analytics/index.tsx) (`/apps/analytics`)

Set `--rf-bar-chart-height` to fit the plot to its container, and `--rf-bar-chart-axis-width` to adjust the value-axis gutter. Override `--rf-bar-chart-color` and `--rf-bar-chart-peak` to change the active bar and peak colors.

## Negative values, series and horizontal bars

A value may now be negative: a balance, a change from last week. The value axis then spans from the lowest value to the highest with zero between them, its gridlines stay on round steps that include zero, and bars below zero grow downward from the zero line. A chart of nonnegative values looks exactly as before.

Pass `series`, a list of `{ id, label }`, to show several quantities per category, and give each item `values`, one number per series in the same order; `value` is then ignored. `layout="grouped"`, the default, puts each series' bar side by side in the category; `layout="stacked"` piles them into one bar, positive values upward and negative ones downward from zero, so the bar's height reads as the total. Series take the colors `--rf-bar-chart-series-1` to `--rf-bar-chart-series-4`, which default to the accent and three status colors, and a legend names them below the chart. With series there is no single peak, so no bar is marked as one.

`orientation="horizontal"` lays the categories out as rows, each label beside its bar, and the value axis along the bottom, which suits long category names and ranked lists. Up and Down Arrow move between rows instead of Left and Right.

Each category stays one focusable bar. Its accessible name and tooltip list the series, "Monday: Builds 4, Tests -2", using `formatValue` for every number. `range`, `href` and `onSelect` work as before.

### Verification

Browser tests cover the zero line and round axis with negative values, unchanged output for a nonnegative single series, grouped and stacked segment placement including negative stacks, the legend, the names listing each series, and arrow keys in horizontal charts. An end-to-end test checks the layout of a horizontal, stacked chart with the stylesheet loaded.
