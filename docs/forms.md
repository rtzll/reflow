# Forms & Progressive Enhancement

Reflow form controls are built on native HTML `<form>` semantics so they work with standard Remix 3 server actions, `FormData`, `<button type="reset">`, and keyboard submission without a separate form library.

## Native `FormData` support by control

| Component | `name` prop | Submitted `FormData` key(s) & format |
| --- | --- | --- |
| `Input`, `Textarea`, `NumberField` | `name="email"` | `email` (string) |
| `Checkbox`, `Switch` | `name="digest"` | `digest` (`"on"` or custom `value` when checked; omitted when unchecked) |
| `CheckboxGroup` | `name="topics"` | Repeated `topics` entries — read with `formData.getAll('topics')` |
| `RadioGroup`, `SegmentedControl` | `name="layout"` | `layout` (selected option value) |
| `Select` | `name="role"` | `role` (selected option value via hidden `<input>`) |
| `Combobox` | `name="tags"` | Single `tags`, or repeated `tags` entries when `multiple` (`formData.getAll('tags')`) |
| `Slider` | `name="volume"` or `name={['min', 'max']}` | Single key or tuple keys for range sliders |
| `FileInput` | `name="attachments"` | Native `File` / `File[]` entries (`formData.getAll('attachments')`) |
| `Calendar` | `name="date"` | `date` (`YYYY-MM-DD`), or `date.start` + `date.end` in `mode="range"` |
| `DatePicker` | `name="window"` | `window` (or `window.start` / `window.end`), plus `window.time` (with `time`) or `window.startTime` / `window.endTime` (with `timeRange`) |
| `TimeField` | `name="start"` | `start` (`HH:mm` 24-hour wall-clock time) |
| `ColorPicker` | `name="accent"` | `accent` (uppercase `#RRGGBB` or `#RRGGBBAA`) |
| `Confirmation` | `name="decision"` | `decision` (`"approved"` or `"denied"` once decided) |

Callback-driven workspace controls (`InlineEdit`, `LabelPicker`, `QuickCreateBar`, `FilterBar`) emit structured values (`onCommit`, `onChange`, `onCreate`, `onValueChange`) rather than rendering hidden inputs. When submitting them inside a `<form>`, mirror their state into a `<input type="hidden" name="..." value={...} />` or post directly to a Remix action.

## Accessible labels, descriptions, and server errors

Wrap controls in `Field` (or `FieldSet` for groups) so `aria-describedby`, `aria-invalid`, and error announcements stay synchronized automatically:

```tsx
import { Button, Field, Input, Select, Switch } from '@rtzll/reflow'

export function ProjectSettingsForm(props: {
  values: { name: string; visibility: string; publicIssues: boolean }
  errors?: { name?: string }
}) {
  return (
    <form method="post" action="/projects/settings">
      <Field
        label="Project name"
        description="Shown in breadcrumbs and pull request headers."
        error={props.errors?.name}
        required
      >
        <Input
          name="name"
          defaultValue={props.values.name}
          aria-invalid={props.errors?.name ? 'true' : undefined}
        />
      </Field>

      <Field label="Visibility">
        <Select
          name="visibility"
          label="Visibility"
          defaultValue={props.values.visibility}
          options={[
            { value: 'private', label: 'Private' },
            { value: 'internal', label: 'Internal' },
            { value: 'public', label: 'Public' },
          ]}
        />
      </Field>

      <Switch
        name="publicIssues"
        label="Allow external issue reports"
        defaultChecked={props.values.publicIssues}
      />

      <div style={{ display: 'flex', gap: '8px' }}>
        <Button type="reset" variant="secondary">
          Reset
        </Button>
        <Button type="submit">Save settings</Button>
      </div>
    </form>
  )
}
```

## Parsing `FormData` in a Remix 3 action

```ts
export async function action({ request }: { request: Request }) {
  const form = await request.formData()
  const name = String(form.get('name') ?? '').trim()
  const visibility = String(form.get('visibility') ?? 'private')
  const publicIssues = form.get('publicIssues') === 'on'
  const tags = form.getAll('tags').map(String)

  if (!name) {
    return { errors: { name: 'Enter a project name.' } }
  }
  await saveProject({ name, visibility, publicIssues, tags })
  return Response.redirect(new URL('/projects', request.url), 303)
}
```

## Validation & reset conventions

- **Validate on blur or submit, clear on edit:** Avoid flashing an error while a user is mid-keystroke; once a field has an error, clear it as soon as the value becomes valid.
- **Native `<form>` reset:** `Select`, `Combobox`, `Calendar`, `DatePicker`, `TimeField`, `ColorPicker`, `Slider`, `NumberField`, `Checkbox`, `Switch`, and `RadioGroup` all listen to their ancestor form's `reset` event and return to their initial default values.
- **Keep GET filters bookmarkable:** For table filters, pagination, and view switches (`RoutedDataTable`, `Pagination`, `FilterBar`), prefer `<form method="get">` or URL search parameters over POST so links remain shareable and browser Back/Forward works naturally.
- **Touch & mobile ergonomics:** Reflow inputs stay at `>= 16px` font size on touch viewports so iOS Safari does not zoom on focus. Never disable pinch-zoom in the `<meta name="viewport">` tag.
