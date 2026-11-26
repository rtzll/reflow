# Terminal

Code reviews and agent runs produce command logs: test runners, linters, typecheckers, and build scripts. `Terminal` renders monospace output in `CodeBlock`'s quiet frame with zero-dependency ANSI SGR color parsing, status badges, optional line filtering, follow-tail scrolling, and plain-text copy.

## API

```tsx
import { Terminal } from '@rtzll/reflow'

<Terminal
  command="pnpm verify"
  status="passed"
  exitCode={0}
  searchable
  output={[
    '\x1b[2m$ pnpm check\x1b[0m',
    '\x1b[32m✓\x1b[0m packages/reflow check (610ms)',
    '\x1b[32m✓\x1b[0m apps/web check (920ms)',
  ]}
/>
```

- `output` accepts a raw string or array of lines, with optional ANSI SGR escape sequences (`\x1b[32m`, `\x1b[1m`, `\x1b[2m`, etc.).
- `command` or `title` names the run in the header.
- `status` (`'idle' | 'running' | 'passed' | 'failed'`) and `exitCode` show the run state.
- `searchable` adds an inline filter field with live match counts (`matched/total`).
- `lineNumbers`, `wrap`, and `maxHeight` control reading layout.
- `follow` keeps the viewport pinned to the newest line while streaming and shows a **Follow output** button if the reader scrolls up.
- `copyable` (default `true`), `onCopy`, and `onCopyError` copy ANSI-stripped plain text to the clipboard.

## Verification

Browser tests cover ANSI parsing and stripping (`parseAnsiLine`, `stripAnsi`), status and exit-code badges, live search filtering, line numbers, and clipboard copy.
