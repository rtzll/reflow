# CommentThread

Reviewers discuss specific lines in a diff or decisions on an issue in compact, resolvable threads. `CommentThread` renders ordered comments with `Avatar` and role `Badge` metadata, optional inline code suggestion blocks with an Apply action, a reply composer (`⌘↵` / `Ctrl+Enter`), and a spring-collapsed **Resolve / Reopen** bar.

It works standalone and projected directly inside `DiffView`'s slotted `renderAnnotation` callback.

## API

```tsx
import { CommentThread } from '@rtzll/reflow'

<CommentThread
  context="src/diffs.tsx:148"
  comments={[
    {
      id: 'c1',
      author: { name: 'Noah', role: 'Reviewer' },
      timestamp: '12m ago',
      body: 'Strip leading a/ and b/ prefixes before returning the filename.',
      suggestion: {
        removed: 'return { prerenderedHTML, filename: fileDiff.name }',
        added: 'return { prerenderedHTML, filename: fileDiff.name.replace(/^[ab]\\//, "") }',
        onApply: applySuggestion,
      },
    },
  ]}
  onReply={appendReply}
  onResolvedChange={setResolved}
/>
```

- `comments` lists each `CommentEntry` (`id`, `author`, `timestamp`, `body`, and optional `suggestion`). Pass plain text or rich Remix nodes such as `<Markdown />` in `body`.
- `context` names the file or line range in the thread header.
- `outdated` shows a warning badge when the underlying diff hunk has shifted.
- `resolved`, `defaultResolved`, and `onResolvedChange` control thread resolution; resolved threads fold into a one-line summary with **Show thread** and **Reopen** buttons.
- `onReply`, `replyable`, and `replyPlaceholder` power the inline reply composer.

## Verification

Browser tests cover thread rendering, suggestion application, inline reply submission (button and `⌘↵`), resolving and collapsing into the summary bar, peeking with Show thread, and reopening.
