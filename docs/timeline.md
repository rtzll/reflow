# Timeline

Pull requests, issue threads, and deployment logs tell their story in chronological order. `Timeline` renders a vertical connected list of events with semantic markers, inline metadata (such as commit SHAs or status badges), timestamps, optional actions, and supporting detail blocks.

## API

```tsx
import { Badge, Icon, Timeline } from '@rtzll/reflow'

<Timeline
  label="Review activity"
  items={[
    {
      id: 'commit',
      icon: <Icon name="file" size={12} />,
      title: <><strong>Maya</strong> pushed 2 commits</>,
      meta: <Badge size="compact">a84c1bb</Badge>,
      timestamp: '14m ago',
      detail: 'Add zero-flash Declarative Shadow DOM hydration to DiffView.',
    },
    {
      id: 'checks',
      tone: 'success',
      icon: <Icon name="check" size={12} />,
      title: 'All 4 checks passed',
      timestamp: '9m ago',
    },
  ]}
/>
```

- `items` lists each event with `id`, `title`, and optional `timestamp`, `icon`, `tone` (`'neutral' | 'accent' | 'success' | 'warning' | 'danger'`), `meta`, `detail`, and `action`.
- `label` names the `<ol>` list for assistive technology (default `'Timeline'`).
- `size` switches between `'default'` and `'compact'` spacing and marker sizing.

## Verification

Browser tests cover ordered list semantics, semantic marker tones, custom icons, metadata/timestamps, detail blocks, trailing actions, and compact density.
