# DataTable

The team directory and the longer component API references both need to search a collection, sort it, and page through the results. The directory also needs actions on a person. A short prop reference or a hand-authored layout can continue to use a plain table.

## Rows and state

Give `DataTable` a table label, rows, a stable string key for each row, and columns. Each column supplies a label and a string or numeric value. The value drives filtering and comparison even when a custom cell renders code or other markup. A column can opt out of sorting or serve as the row header.

Filter across columns, sort the full result, then take the requested page. Equal values keep their input order. Typing a filter or changing the sort starts at page one. Clicking a sorted header reverses its direction. A shrinking collection clamps the visible page. Zero matches show an empty state with the filter still in reach.

The table can own its state or receive `state` and `onStateChange`. A screen that owns its URL supplies `href` for native sort and page links. It can associate the search input with a GET form through `filterInput`. Both showcase screens let visitors press Enter to filter before hydration, and update results as they type after hydration.

Import `RoutedDataTable` from `@rtzll/reflow` to bind a table to the request URL. It accepts the same rows and columns and a `route` prop, for example `{ path: url.pathname, search: url.search, prefix: 'team', anchor: 'team-table' }`. Give each table a unique prefix and attach the anchor ID to its section. The wrapper supplies the native GET form, sort and page links, and history updates.

The team directory uses `teamFilter`, `teamSort`, `teamDir`, and `teamPage`, preserving the gallery search and the `#team-table` anchor. Component API references with more than twelve primary props use the same controls with an `api` prefix. They retain row headers, the required marker, type, default, and description. The standalone example at `/docs/data-table` demonstrates local state and configurable page size.

## Interaction and verification

Use native column headers with `aria-sort` on the active column. Sorting controls, search, and pagination work from the keyboard. When row actions are supplied, a visible menu button and ContextMenu both act on the same record after filtering or sorting. Present the loaded row count to assistive technology, use Table’s density and surface styles, and keep skeleton rows aligned while loading.

Verify the row order, sort announcement, filter reset, empty state, action target, and controlled updates through the public component. Exercise deep links, Back, server-rendered pagination, and mobile overflow in the showcase.
