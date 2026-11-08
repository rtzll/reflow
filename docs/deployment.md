# Website build and deployment

The Cloudflare target hosts the existing `apps/web` showcase: `/` for the gallery, `/docs` and `/docs/:slug` for documentation, and `/demo` for focused examples. It needs no database, account binding, or application secret. The library package and the generated starter remain independent of Cloudflare.

## Build and preview locally

Use the Node and pnpm versions described in [development](development.md).

```sh
pnpm install --frozen-lockfile
pnpm preview:web
```

Open `http://127.0.0.1:44101`. This builds the library and website, then runs Wrangler with `--local`. It does not upload a Worker or change DNS. Stop it with Ctrl+C. For a different port, build first and run `pnpm --filter @reflow/web preview --port 44102`.

The existing `pnpm dev` command still uses Remix's Node asset server for development. Changes to source require rebuilding before testing the production preview.

## Production build

`pnpm build:web` creates these ignored files under `apps/web/build`:

- `client/`: bundled JavaScript, CSS, fonts, explicitly copied public images, and license notices. This is the only directory uploaded as public static assets.
- `worker/index.js`: the server bundle, containing the existing router, server rendering, and an embedded asset manifest.
- `manifest.json` and `metadata.json`: local build inspection data, outside the public assets directory.

The build discovers modules under `app/public` that call `clientEntry(...)`. Keep those calls in browser modules, use `import.meta.url` as the source ID, and export the named component. The build replaces those source URLs with stable, project-relative IDs in both bundles. Function names are preserved because Remix uses them to resolve hydration exports.

For the Worker bundle only, the build replaces `app/assets.ts` with `worker/assets.ts`. This resolves script entries from the generated manifest instead of compiling files at request time. Development continues to use the original asset server. A shared browser module graph keeps the Remix runtime consistent across hydrated entries.

Cloudflare serves static files before invoking the Worker. Hashed assets use immutable caching; server-rendered responses use `private, no-store` because appearance settings can come from cookies. Missing routes and assets return 404, without an SPA fallback. Source maps are disabled. No environment variables are injected into browser code other than the constant production mode.

## Local validation

```sh
pnpm check
pnpm lint
pnpm format:check
pnpm --filter @reflow/web exec playwright install chromium
pnpm test:deployment
pnpm --filter @reflow/web deploy:dry-run
pnpm --filter @reflow/web exec remix doctor
```

`test:deployment` rebuilds and starts a temporary local Worker. It checks documentation routes, asset content types and caching, missing and private-file URLs, browser hydration, playground edits, mobile composition, and server rendering with JavaScript disabled. It also inspects the bundles for local filesystem paths and verifies that the Node asset compiler is absent from the Worker. The browser and Worker are stopped afterward. CI runs the same checks without Cloudflare credentials.

The dry run checks packaging without uploading anything. These checks do not establish live account permissions, hostname availability, DNS, or TLS behavior.

Run `pnpm --filter @reflow/web types` after changing Wrangler bindings. Generated `worker/env.d.ts` is ignored; the current site has no bindings.

## Keep operator configuration private

The checked-in `apps/web/wrangler.jsonc` has a generic Worker name, no account ID, and no custom domain. Both `workers.dev` and preview URLs are disabled. The repository has no deployment workflow or live deploy script.

When preparing an actual deployment, copy that complete configuration to `apps/web/wrangler.local.jsonc`. This filename is ignored. Change the Worker name there and add the custom domain there, using the Cloudflare `routes` array with `custom_domain: true`. Keep the file beside the generic configuration so its relative build paths still resolve. Wrangler does not merge these two files: refresh the private copy when the generic configuration changes.

Select the account through private configuration or `CLOUDFLARE_ACCOUNT_ID`. Keep authentication in Wrangler's local credential storage or a CI secret store. Never put tokens, account details, or personal hostnames in source, package scripts, committed examples, or browser build definitions. `.dev.vars`, `.env` files, `.wrangler` state, build output, and the private config are ignored. Review the staged diff before committing; ignore rules do not protect files already tracked by Git.

After a separate decision to publish, rebuild, validate the private configuration with a dry run, and explicitly deploy with that same configuration. No command above publishes the website. Configure automated deployment separately if desired; the current CI only tests locally.

References: [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/).
