# ObjectInspector

Inspecting webhook payloads, structured log metadata, tool-call arguments, or API responses in a raw `<pre>` quickly becomes unreadable. `ObjectInspector` renders arbitrary JSON and JavaScript values as a collapsible ARIA `tree` with type-colored primitives, circular-reference protection, and one-click JSON copy.

## API

```tsx
import { ObjectInspector } from '@rtzll/reflow'

<ObjectInspector
  name="webhook"
  data={eventPayload}
  expandLevel={1}
  sortKeys
  copyable
/>
```

- `expandLevel` controls initial open depth (`0` collapses the root, `1` expands direct children), while individual nodes keep local toggle overrides.
- Tracks the ancestor object chain per branch using a `ReadonlySet<object>` so direct and multi-level circular references (`a -> b -> a`) render safely as `[Circular]` while non-cyclic shared sibling references still expand normally.
- Header includes an accessible Copy JSON action backed by circular-safe `JSON.stringify` with `bigint` handling.

## Verification

Browser tests (`object-inspector.test.browser.tsx`) verify primitive type coloring, expand/collapse state updates, direct self-cycles, and 2-level grandparent cycles.
