# ToolCalls

An assistant that reads files, runs commands or searches before it answers does work the reader may want to check but rarely wants in full. ToolCalls folds that work into one quiet line above the reply that opens to the individual calls, and while the work is running it says what is happening and for how long.

## API

```tsx
<ToolCalls
  calls={[
    { id: '1', label: 'Read the style guide', status: 'done' },
    { id: '2', label: 'Ran the checks', status: 'done', detail: <CodeBlock code="pnpm test" /> },
  ]}
  startedAt={started}
  endedAt={ended}
/>
```

- `calls` lists the work in order. Each call has an `id`, a `label`, a `status` of `running`, `done` or `failed` (default `done`), and an optional `detail` shown under it when the line is open, such as a command and its output.
- `startedAt` and `endedAt` are times in milliseconds. With both, the summary reads "Worked for 1m 12s".
- `summary` replaces the closed line's text, such as "Read 2 files, ran a command".
- `open`, `defaultOpen` and `onOpenChange` control the disclosure.

## Behavior

Closed, the line is a button with the summary and a chevron. Open, the calls follow in a list, each with a status mark: a Spinner while running, a check when done, a cross when it failed. Without a `summary` or times, the line counts the calls.

While any call runs, the line shows a Spinner, that call's label and, with `startedAt`, the elapsed time, counting each second. The elapsed time starts once the component is in the browser, so the server and the first render agree. The line is a status region, so the running call is announced as it changes, politely.

The line is a disclosure button with `aria-expanded` and `aria-controls`; the list is an ordered list. A failed call's mark is named "failed" for assistive technology.

## Motion

The list opens and closes on the shared spring by animating its row height, and the chevron turns. With reduced motion both change at once.

## Reused pieces

Spinner for running calls; the `check` and `x` icons; the grid-row reveal InputMessage uses for its attachment row.

## Verification

Browser tests cover the counted and timed summaries, the custom summary, opening and closing, each status mark, the running line with its label and its elapsed time after mount, and the disclosure's attributes.
