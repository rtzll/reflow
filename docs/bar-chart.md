# BarChart

BarChart displays one series of nonnegative quantities on a shared zero baseline. Supply ordered items with stable IDs, short category labels, and numeric values. Additional fields pass through to the callbacks. Zero-only series stay on the baseline and empty collections display “No data”. The value axis rounds up so its three gridline steps are round numbers: a peak of 23 reads 8, 16 and 24. With `showAxes={false}`, the tallest bar fills the plot. [Build timings example](/docs/bar-chart)

Pass `href` to render native links to detailed views. Before hydration, all bars participate in normal tab order. Hydrated charts use a single tab stop and support Left, Right, Home, and End. Focus or hover reveals the category and formatted quantity. Passing only `onSelect` renders buttons for local actions. A chart with neither prop renders static, individually named bars and can sit inside a link.

Use `range` to highlight the inclusive interval between two IDs. Identical endpoints mark one current bar. Analytics builds dates from its activity records, stages the first endpoint, handles Escape, and navigates to a URL once the second endpoint is chosen. Its app directory preview reuses the same data and chart with axis labels hidden. [Analytics workspace](/apps/analytics)

Set `--rf-bar-chart-height` to fit the plot to its container. Override `--rf-bar-chart-color` and `--rf-bar-chart-peak` to change the active bar and peak colors.
