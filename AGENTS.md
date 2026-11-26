# AGENTS.md

Native Remix 3 UI library (`@rtzll/reflow`), starter generator (`@rtzll/create-reflow`), and Cloudflare showcase (`@reflow/web`).

## Layout

- `packages/reflow/src/` — components, pure headless logic in `behaviors/`, styling/motion in `systems/`. Specialist optional-peer domains live in `packages/reflow/domains.json`.
- `apps/web/` — showcase, docs, playgrounds, example apps (`app/public/apps/<slug>/`), and tests (`apps/web/test/`).
- `tools/` — structural invariants (`invariants.test.ts`), package verification (`check-package.ts`), version bump (`bump.ts`), and release automation (`release.ts`).

## Verification Tiers

- **Fast loop (~5s, run after edits):** `pnpm check:fast` (Oxlint, Oxfmt, TypeScript, unit/invariants, server/SSR/property/dev-assets tests).
- **Targeted component:** `./apps/web/node_modules/.bin/remix test --type browser apps/web/test/<name>.test.browser.tsx` (or `--type e2e` for layout/CSS).
- **Worker & geometry (~15s):** `pnpm test:deployment` (Worker peer isolation, zero-flash SSR, preview heights, desktop/mobile overflow across all docs and apps).
- **Full pre-release:** `pnpm verify && pnpm test:deployment && pnpm --filter @reflow/web exec remix doctor`.

## Conventions Not Enforced by Lints

- **Remix 3 runtime:** Components take `handle: Handle<Props>` and return `() => (<jsx />)`. Read changing props via `handle.props`, update local state, call `handle.update()`, and tie timers/listeners to `handle.signal`.
- **Craft:** Prefer extending existing primitives, `fluidHover()`, and `--rf-spring-*` / `--rf-*` tokens over hand-rolling app widgets. Keep motion interruptible, restrained, and reduced-motion safe.
- **Keep prose lean:** If you catch a recurring mistake, prefer fixing the API/architecture, adding a lint rule (`.oxlintrc.json`), or adding a test (`tools/invariants.test.ts`) over adding rules here.
- **Releases & git:** Make small conventional commits on `main`. Use `pnpm bump <X.Y.Z>` for version bumps. Never force-push; only push or trigger `release.yml` when asked.
