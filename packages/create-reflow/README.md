# create-reflow

Creates a Remix 3 app that uses [Reflow](https://github.com/rtzll/reflow) components.

```sh
pnpm create @rtzll/reflow my-app
cd my-app
pnpm dev
```

`npm create @rtzll/reflow my-app` works too. The app is a pnpm project, so the installer needs pnpm 12 and Node 26. Pass `--no-install` to copy the files without installing.

The app is a small settings page with a Sidebar, theme selector, switch, form, and dialog. Each release of this package creates apps for the Reflow version with the same number.

MIT. See LICENSE.
