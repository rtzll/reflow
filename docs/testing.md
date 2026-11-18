# Testing

Tests say what a component does in terms a user would notice: its roles, states, focus and values, and its layout and motion where those are the point. They run the same way on a fast laptop and on a busy CI runner. A test that only passes when the machine is quick is a broken test.

## Layers

- **Server tests** (`*.test.ts`) run in Node: the catalog's HTTP rendering, and data such as icon sets, motion tokens and highlighting.
- **Browser tests** (`*.test.browser.tsx`) mount a component in a real browser without the stylesheet. Behaviour goes here: keyboard and focus, form values and resets, state after an action.
- **End-to-end tests** (`apps/web/test/*.test.e2e.ts`) drive the showcase in Playwright. Use them only for what needs CSS and real input: layout, geometry, pointer and touch gestures, motion, and pages working together.

Each test checks one behaviour, with its own setup, and its name says which. Prefer state and roles over pixels. Where geometry is the point, compare with a tolerance of a pixel or two, not exact values.

## Opening pages

End-to-end tests open pages only through `open(page, url)` from `apps/web/test/showcase-router.ts`. It waits until the page has hydrated, so no test acts on markup before its scripts are wired. `tools/check-tests.test.mjs` fails the run if a test calls `page.goto` directly.

`open()` emulates reduced motion, so a test of behaviour is not timed against animations. A test of the motion itself passes `{ motion: true }`. Pass `{ hydrate: false }` only to check the server's HTML before scripts run.

## Motion

Never sample frames over real time: a busy machine skips frames, so a sample taken "at 120ms" can land anywhere. Freeze the motion and seek it instead, with `apps/web/test/motion.ts`:

```ts
await open(page, '/docs/drawer', { motion: true })
await holdMotion(page) // pause each animation that starts from now on
await trigger.click()
await seekMotion(panel, 0.25) // the panel's animations, a quarter of the way through
// measure, seek again, measure…
await releaseMotion(page) // let them finish
```

`seekMotion` waits for the element's own animations, including those on its pseudo-elements, to start. Springs cover most of their distance early, so check a point such as 0.2 rather than the middle. Where motion drives behaviour, such as an autoplay fill that moves to the next slide when it ends, `finishMotion(element)` skips it to its end.

## Timers

For behaviour on a timer, such as streaming, resets and delays, install Playwright's fake clock before opening the page and move it on yourself:

```ts
await page.clock.install()
await open(page, '/docs/thinking-steps', { motion: true })
await pauseClock(page) // from apps/web/test/clock.ts: only runFor() moves time now
await page.clock.runFor(1500)
```

On a fake clock, exact times are fine: the ThinkingSteps test expects steps at exactly 400, 1800, 3200 and 4200ms. On the real clock, never assert milliseconds. Don't use `waitForTimeout` to wait for something to happen. A short one is acceptable only to give something the chance to happen wrongly, such as a menu that must stay open.

## Running tests

```sh
pnpm test                 # build, then everything CI runs
./apps/web/node_modules/.bin/remix test --type e2e apps/web/test/drawer.test.e2e.ts
```

Before pushing, run the suites your change touches. CI runs everything on Linux and is the gate. End-to-end tests run three at a time, and nothing is retried: a test that fails once has failed.

## When a test flakes

1. Reproduce it: `pnpm test:stress apps/web/test/<file>.test.e2e.ts --runs 10` runs the file ten times, five at once, which loads the machine like a CI runner.
2. Decide whether the component or the test is wrong. A component bug gets fixed in the component, with a test that would have caught it.
3. Fix the cause in the test. Usually it acts before hydration, depends on real time, or shares state with another test.
4. Never add waits or retries to make a failure go away.

## Before a release

`pnpm test:linux` runs the suite in Playwright's Linux image for the pinned version, as CI does, through Docker (start OrbStack with `orb start`). Pass e2e files to run only those. Linux renders fonts and schedules frames differently from macOS, so run it before a release; CI stays the gate for every push.
