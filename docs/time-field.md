# TimeField

Typing or picking a wall-clock time shows up in meeting editors, scheduling forms, and quiet-hours settings, not only beside a calendar. TimeField promotes Reflow's existing time combobox out of DatePicker into a standalone, form-aware control.

## API

```tsx
<TimeField
  label="Start time"
  name="start"
  defaultValue="09:30"
  step={15}
  onValueChange={(value) => console.log(value)}
/>
```

- `label` names the combobox and its slot listbox.
- `value`, `defaultValue`, and `onValueChange` hold canonical 24-hour `HH:mm` strings (such as `"09:30"` or `"14:45"`).
- `name` submits the canonical `HH:mm` value with a surrounding form and restores `defaultValue` on form reset.
- `after` sets a lower bound in `HH:mm`; only later slots appear, each showing its duration from `after`.
- `step` sets the minutes between slots (default `15`).
- `hourCycle` chooses `12` (default) or `24` hour display, formatted with `locale` (default `"en-US"` for deterministic server rendering).
- `variant` selects `"outline"` (standalone bordered field, default) or `"ghost"` (borderless, used inside `DatePicker`).
- `size`, `disabled`, `required`, `end`, `duration`, `id`, `aria-describedby`, and `aria-invalid` integrate with `Field` and range pairs.

## Behavior

Clicking or typing opens a popover listbox of slots scrolled to the closest match. Flexible input such as `9`, `230p`, `14.15`, or `9:45am` parses into `HH:mm` on Enter, Tab, or blur; invalid or too-early text restores the committed value. Arrow keys step through slots and preview them in the field; Escape cancels the draft and closes the popover without closing an enclosing Dialog or Drawer.

## Reused pieces

`@remix-run/ui/popover` and `@remix-run/ui/listbox`; `fluidHover` for the slot list; `navigationIndex`, `onFormReset`, and `containEscape` from `src/behaviors/`; `Icon` (`clock` / `arrow-right`).

## Verification

Browser tests cover flexible parsing, listbox selection, arrow-key navigation, Escape cancellation, `after` slot filtering and durations, 24-hour display, form submission and reset, controlled updates, and `Field` wiring, alongside existing DatePicker tests.
