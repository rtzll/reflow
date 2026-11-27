# create-reflow

Creates a Remix 3 app that uses [Reflow](https://github.com/rtzll/reflow) components.

```sh
pnpm create @rtzll/reflow my-app
cd my-app
pnpm dev
```

`npm create @rtzll/reflow my-app` works too. The app is a pnpm project, so the installer needs pnpm 12 and Node 26.

Options:

- `-t, --template <starter|form|minimal>`:
  - `starter` (default) — settings workspace with Sidebar, Select, Switch, CheckboxGroup, and Dialog.
  - `form` — native Remix 3 `POST` action with `FormData` validation, `Field`/`FieldSet` errors, masked `InputCopy`, and `@rtzll/reflow/core.css`.
  - `minimal` — lean single-page Remix 3 shell using `@rtzll/reflow/core.css`.
- `--css <styles|core>` — pick the full stylesheet (`styles.css`) or the smaller core bundle (`core.css`).
- `--no-install` — copy files without running `pnpm install`.

Each release of this package creates apps for the Reflow version with the same number.

MIT. See LICENSE.
