# FileChanges

When an assistant edits files, the reader wants the size of the change at a glance and a way into it. FileChanges summarises the edit as a card: how many files changed, lines added and removed, the files themselves, and the actions an app offers.

## API

```tsx
<FileChanges
  files={[
    { path: 'src/cooldown.ts', added: 157, removed: 0, href: '/diff/cooldown' },
    { path: 'src/engine.ts', added: 4, removed: 1 },
  ]}
  actions={<Button size="compact" variant="secondary">View changes</Button>}
/>
```

- `files` lists the changed files, each with a `path`, the lines `added` and `removed`, and an optional `href` that makes the row a link.
- `title` replaces the heading, which by default reads "Edited 2 files".
- `actions` sits at the end of the header, such as Undo and View changes.
- `visible` is how many rows show before the rest fold behind "Show N more files". Default 3.

## Behavior

The header names the edit and totals the lines across files. Each row shows the file's folder muted and its name in the foreground, then its counts, added in the success colour and removed in the danger colour. The counts are written out for assistive technology, as "157 lines added, none removed", while the visible text stays "+157 −0".

Past `visible` rows, a button reveals the rest and turns into "Show fewer files"; it is a disclosure with `aria-expanded`. The rows are a list named "Changed files". A path too long for its row is cut at the start, so the file name stays visible, and the full path is its title.

## Motion

The extra rows grow in on the shared spring, as ToolCalls' list does, and the chevron turns. With reduced motion they appear at once.

## Reused pieces

The grid-row reveal from ToolCalls and InputMessage; Button for actions; the success and danger tokens.

## Verification

Browser tests cover the heading and totals, the custom title, the rows and their written counts, links, folding past the visible count and the toggle's label and state.
