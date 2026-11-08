# Reflow Starter

A small Remix workspace settings page. The Sidebar, theme selector, compact layout switch, notification form, and preview dialog use the installed Reflow package.

```sh
pnpm check
pnpm dev
```

Open the address printed in the terminal. Set `PORT` to use a different port, for example `PORT=3000 pnpm dev`.

Edit `app/public/settings.tsx` to change the settings page. `app/actions/controller.tsx` serves the document and resolves the package stylesheet. Appearance controls update the page immediately. Apply settings keeps the appearance and notification choices in the URL, including when all notification choices are cleared.

Keep `vendor/rtzll-reflow.tgz` with the app. The lockfile and tarball let you reinstall with `pnpm install --frozen-lockfile`.
