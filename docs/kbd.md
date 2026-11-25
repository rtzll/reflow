# Kbd

Keyboard shortcuts show up in command triggers, tooltips, menus, and prose. Kbd draws one key or a chord of keycaps with consistent sizing and platform-aware labels.

## API

```tsx
<Kbd keys="mod+k" />
<Kbd keys={['g', 'i']} separator="then" variant="outline" />
<Kbd>Esc</Kbd>
```

- `keys` accepts a shortcut string (`"mod+shift+p"`, `"⌘K"`) or a sequence of key strings (`["g", "i"]`). Each key is formatted with `formatShortcut()` from `behaviors/shortcut.ts`.
- `children` renders a single keycap when `keys` is omitted.
- `platform` pins `"mac"` or `"other"` rendering instead of detecting the browser platform after mount.
- `variant` selects `"subtle"` (the quiet surface fill used in menus and command triggers, default) or `"outline"` (a crisp bordered keycap for prose and help panels).
- `size` selects `"default"` or `"compact"` (also follows surrounding `data-density="compact"`).
- `separator` inserts a visual separator (such as `"+"` or `"then"`) between keycaps in a chord or sequence.

## Behavior

On the server, `keys` renders the non-Mac labels (`Ctrl`, `Alt`, `Shift`) so initial HTML stays deterministic; once mounted in the browser on macOS/iOS, it updates to `⌘`, `⌥`, `⇧` unless `platform` is fixed. Each keycap is a semantic `<kbd>` element; separators are `aria-hidden`.

## Reused pieces

`formatShortcut()` and `isMacPlatform()` from `src/behaviors/shortcut.ts`; the keycap metrics from `CommandMenu`; the shared `--rf-hover`, `--rf-border`, `--rf-muted`, and `--rf-text-micro` tokens.

## Verification

Browser tests cover single children, shortcut chords, platform switching (`mac` vs `other`), multi-key sequences with separators, variants, compact sizing, and forced-colors/theme styling via the showcase.
