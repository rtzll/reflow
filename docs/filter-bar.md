# FilterBar

Structured queues — discussions, issues, logs, and deployments — benefit from mixing `key:value` facets with free-text search in a single compact input. `FilterBar` renders active facets as removable chips, offers keyboard-navigable key and value autocomplete, and supports one-click query presets.

## API

```tsx
import { FilterBar } from '@rtzll/reflow'

<FilterBar
  label="Filter discussions"
  defaultValue="status:open label:ssr"
  suggestions={[
    { key: 'status', description: 'Thread state', values: ['open', 'resolved', 'draft'] },
    { key: 'author', description: 'Author handle', values: ['alex', 'maya', 'noah'] },
  ]}
  presets={[{ id: 'open-ssr', label: 'Open SSR', query: 'status:open label:ssr' }]}
  onValueChange={(value, parsed) => applyFilter(value, parsed)}
/>
```

- Built on the pure `parseFacetQuery()` helper in `behaviors/facet-query.ts` (shared with `LogViewer`), so `onValueChange` returns both the serialized string and structured `facets` + `freeText`.
- Typing `key:` switches the autocomplete menu from facet keys to that key's suggested `values`; `ArrowDown`/`ArrowUp` and `Enter` commit tokens, and `Backspace` on an empty input removes the last facet chip.
- Presets render as compact buttons below the bar, highlighting when the current query matches the preset.

## Verification

Unit property tests (`behaviors.test.ts`) verify `parseFacetQuery` never throws across fuzz inputs; browser tests (`filter-bar.test.browser.tsx`) verify autocomplete key→value completion, `Backspace` chip removal, and preset application.
