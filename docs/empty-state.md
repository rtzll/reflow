# EmptyState

When a file filter matches nothing, every review file has been marked viewed, or a comment queue is cleared, the workspace needs a quiet explanation and a clear next step. `EmptyState` centers an optional icon tile, heading, concise description, and action row without pulling attention away from the surrounding controls.

## API

```tsx
import { Button, EmptyState, Icon } from '@rtzll/reflow'

<EmptyState
  surface="outlined"
  icon={<Icon name="search" size={18} />}
  title="No matching files"
  description="No changed files match “router.css”. Clear the filter to inspect all 5 files."
  actions={
    <Button size="compact" variant="secondary">
      Clear filter
    </Button>
  }
/>
```

- `title` names the empty state as an accessible heading.
- `description` explains why the view is empty or how to recover, constrained to a readable line length.
- `icon` renders inside a quiet framed tile above the title.
- `actions` arranges one or more recovery buttons beneath the copy.
- `surface` switches between `'plain'` (default, blends into an existing pane) and `'outlined'` (dashed border on `--rf-surface-2`).
- `size` switches between `'default'` and `'compact'` spacing.
- `label` overrides the accessible region label when the heading alone is not enough.

## Verification

Browser tests cover title/description/icon/actions rendering, `aria-labelledby`, outlined and compact modes, and action button callbacks.
