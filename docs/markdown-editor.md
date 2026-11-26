# MarkdownEditor

Long-form engineering discussions, RFCs, and PR reviews need more than a single-line chat composer: authors switch between raw Markdown and rendered preview, insert fenced code or Mermaid diagrams, and mention teammates without losing their caret. `MarkdownEditor` lives in `@rtzll/reflow/markdown` alongside `Markdown` so pages that do not author Markdown never bundle `marked`.

## API

```tsx
import { Diagram } from '@rtzll/reflow/diagrams'
import { MarkdownEditor } from '@rtzll/reflow/markdown'

<MarkdownEditor
  label="Discussion reply"
  defaultMode="write"
  triggers={mentionTriggers}
  renderCodeBlock={({ code, language }) =>
    language === 'mermaid' ? <Diagram code={code} size="compact" /> : undefined
  }
  onSubmit={(markdown) => postReply(markdown)}
/>
```

- `SegmentedControl` switches between **Write**, **Preview**, and **Split** (controlled via `mode`/`onModeChange` or uncontrolled via `defaultMode`).
- The formatting toolbar delegates pure text-selection edits to `applyMarkdownFormat()` in `behaviors/markdown-format.ts`, supporting bold, italic, inline code, fenced code, Mermaid blocks, code suggestions, links, and bullet lists while restoring the selection cleanly.
- Optional `triggers` compose `TriggerMenu` directly on the editor textarea, and `Mod+Enter` submits non-empty content via `onSubmit`.

## Verification

Property tests (`behaviors.test.ts`) verify `applyMarkdownFormat` always returns valid in-bounds selections across 200 randomized inputs; browser tests (`markdown-editor.test.browser.tsx`) verify toolbar formatting, Write/Preview/Split transitions, and `Mod+Enter` submission.
