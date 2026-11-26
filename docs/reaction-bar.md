# ReactionBar

Discussions, PR reviews, and changelog entries need lightweight feedback without opening a reply box. `ReactionBar` renders active emoji reactions as pill buttons with a shared `fluidHover()` highlight, tabular counts, and an anchored `+` picker popover.

## API

```tsx
import { ReactionBar } from '@rtzll/reflow'

<ReactionBar
  reactions={[
    { emoji: '👍', label: 'Thumbs up', count: 6, reacted: true, users: ['Alex', 'Maya'] },
    { emoji: '🚀', label: 'Rocket', count: 3, reacted: false },
  ]}
  onToggle={(emoji, nextReacted) => toggleReaction(emoji, nextReacted)}
/>
```

- Each pill uses `aria-pressed={Boolean(item.reacted)}` and displays optional `users` context in its tooltip.
- Clicking `+` opens a lightweight anchored grid of `available` reactions (with sensible defaults) and closes on outside pointer-down or `Escape`.
- Shares `fluidHover()` across pills and the add button, and respects both `default` and `compact` density.

## Verification

Browser tests (`reaction-bar.test.browser.tsx`) verify toggling existing reaction pills, opening the `+` picker, adding a new reaction, and dismissing on `Escape`.
