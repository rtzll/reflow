# Scope

Reflow is a native Remix 3 component library and showcase inspired by Fluid Functionalism. The goal is upstream's behavior, visual restraint, and motion quality, expressed through Remix APIs rather than React compatibility, across upstream's catalog and the components Reflow adds.

Reflow started with the Fluid Functionalism catalog and adds components of its own. [Components](components.md) lists what ships, the criteria for new components, and the roadmap.

## Deliverables

1. A reusable component library covering the upstream catalog, plus shared systems and Reflow's own components. Upstream blocks map to components or examples.
2. A Remix showcase using those same components: an interactive overview, individual component documentation and playgrounds, and a focused demo carousel.
3. Behavioral and visual validation across keyboard, pointer, touch, light/dark themes, compact/default sizes, reduced motion, server rendering, and hydration.
4. A deployable showcase and a documented package installation workflow. Hosting is configured separately from source and package releases.

## Dependency policy

Use official Remix packages and standard platform APIs. The expected runtime foundation is `remix` plus the separately installed `@remix-run/ui`; this is an ecosystem constraint, not a literal single-package requirement. Inspect transitive dependencies when versions are pinned rather than claiming the entire dependency tree is empty.

- Components and rendering: Remix's own component model.
- Accessible behavior: official Remix UI primitives where available, native HTML where suitable, and small Reflow implementations for remaining gaps.
- Motion: Remix UI animation utilities, CSS, and the Web Animations API. Preserve interruption, exit cleanup, and reduced-motion behavior.
- Styling: CSS custom properties, plain CSS, and Remix's styling facilities. No Tailwind build requirement.
- Icons: a small set of local Lucide SVGs and consumer-supplied slots, without an icon runtime dependency. Use slots such as Button’s `leadingIcon` or Select options’ `icon` to supply any accessible SVG or Remix node.
- Dates, colors, clipboard, resizing, and file interactions: platform APIs and focused local logic.
- Development tooling is a separate category. Prefer Remix's own tools; add only necessary compilation or browser-testing tools.

No React runtime, Radix, Base UI, Motion, third-party calendar/editor package, or third-party runtime utility is part of the baseline.

Two kinds of exception exist, both for work a small local implementation cannot do well.

Markdown parsing is a required dependency. Parsing is the component's whole job, so there is no useful version without it, and a hand-written parser kept meeting CommonMark's edge cases. Markdown uses marked, pinned to an exact version, and renders its tokens with Reflow's own CodeBlock and Table. marked is a single ES module with no dependencies, so Remix's asset server serves it as it is, with no build step. Markdown lives at its own import path, `@rtzll/reflow/markdown`, and nothing else in Reflow imports marked, so a page loads it only when it renders Markdown in the browser. Server-rendered Markdown sends no parser to the browser. The package check fails if any other module imports marked.

Optional adapters are the other exception, for enhancements, such as highlighting every language. An adapter lives at its own import path, takes its library as an optional peer dependency, and is imported by nothing else in Reflow, so an app that does not import it never installs or loads the library. The component it serves keeps working without it. `@rtzll/reflow/highlight` wraps Shiki for CodeBlock this way, and the package check fails if any other module imports Shiki or if installing Reflow pulls it in.

## Architecture direction

The pnpm workspace has two packages. `packages/reflow` exports ESM components, TypeScript declarations, and a stylesheet as [`@rtzll/reflow` on npm](https://www.npmjs.com/package/@rtzll/reflow). `apps/web` uses those public exports for the gallery, documentation, and focused demo.

Separate reusable geometry, color, date, and state logic from DOM measurement and Remix component lifecycle integration. Share hover, motion, focus, density, and surface behavior instead of reimplementing it in every component.

### Code structure

To anyone using the package, everything it exports is a component, however many other components it is built from. Inside `packages/reflow/src`, code that is not a component sits in one of three layers, and components build on them:

| Layer | What it is | Where |
| --- | --- | --- |
| Primitive | Headless, accessible behavior from `@remix-run/ui`. Only Remix UI's modules are called primitives. | `@remix-run/ui/*` |
| Behavior | Reflow's headless code for a gap in Remix UI: keyboard, focus, pointer or timing logic with no markup and no styles. Each one says which gap it fills, so it can be replaced when Remix UI covers it. | `src/behaviors/` |
| System | The look and motion shared across components: fluid hover, the motion tiers, reveal, colors. The showcase documents these under Systems. | `src/systems/` |
| Component | What the package exports and the docs list: markup, styles and behavior, built from the layers above and from other components. | `src/<component>.tsx` |

Where code goes:

- A component lives in its own file, named after it. Parts of one component, such as `CardTitle` or `FieldLabel`, stay in their component's file.
- When a component builds on another's internals, as AlertDialog does on Dialog's surface or DatePicker on Calendar's date inputs, the internals stay in the first component's file and are exported from it. `index.ts` then lists that file's public names instead of re-exporting all of it, so the internals stay private to the package.
- A component's styles live beside it in a stylesheet of the same name, such as `button.css`. `foundations.css` holds the tokens, and styles several components share sit in a stylesheet named for what they style, such as `menu-surface.css` or `fluid-hover.css`. `styles.css` imports them in cascade order.
- A component does not write keyboard, focus or hover-timing logic inline when a primitive or behavior covers it. If two components need the same logic and neither covers it, it becomes a behavior.
- A helper used by one component stays next to that component. Only helpers shared by two or more components move into a layer.
- Imports point down: components import systems, behaviors and primitives; systems and behaviors never import components.

Primitives Reflow checked and does not use, and why:

- **`combobox` for Combobox.** The primitive holds one value and clears unmatched text on blur. Combobox also selects several values as chips and creates new options from the typed text.
- **`toggle` for Switch.** Switch is a native checkbox that can be dragged. The primitive reads the checked state during the click, before a drag that settles on the current value cancels it, and drops `defaultChecked` from the input, so a form reset no longer restores it.
- **`listbox` for CommandMenu.** The primitive marks the committed value as selected and clears the highlight when the pointer leaves. CommandMenu runs commands, so it has no committed value, and it keeps the highlighted command marked selected for the input's `aria-activedescendant`.
- **`form` for Field.** The module is a validation layer, not markup, and it is marked experimental: its API may change in patch releases. Field stays presentational, so its controls can take the module's mixins.

Tabs uses the `tabs` primitive but handles its arrow keys first: the primitive selects the tab an arrow moves to, and Reflow's Tabs moves focus only, selecting on Enter, Space or a click.

Toaster uses the `toast` primitive for the region, the dialog semantics of each toast, announcements, F6 and Tab movement, focus recovery and the close timers. Its `toast()` store stays the source of truth: each Toaster mirrors the open toasts into a manager and keeps closed ones rendered until their exit ends. It handles Escape first, so a toast that cannot be dismissed stays and the close reaches `onDismiss`; a toast the primitive closes on its own has timed out and reaches `onAutoClose`. Swipes, the pile and the hotkey stay Reflow's.

Check again when Remix UI updates.

## Showcase requirements

- Overview: left navigation grouped into systems and components, central interactive preview cards, and a customization rail.
- Controls: light/dark/system theme, accent, shape/radius, density, typography, icon family, and hover mode. Persist applicable preferences. Lucide, Tabler, Phosphor, and HugeIcons use local SVG geometry. Alternate icon families are showcase assets; applications using the package can provide their own icons through the component slots.
- Detail pages: working examples, variants, editable options, concise API guidance, and copyable usage code.
- Focused demo: a large interactive example with previous/next controls, component navigation dots, scale-to-fit, and customization where relevant. Upstream navigation was observed changing the URL to `/demo?c=accordion`; Reflow should likewise support direct links.
- Responsive navigation and controls must remain usable on mobile. Avoid simply squeezing the desktop columns.
- Every delivered component must have a discoverable working demonstration. Preview state and settings must affect real library components.
- Use Reflow branding and acknowledge the upstream project. The Radix/Base UI selector has no role in a single native Remix implementation.

## Next work

- Build the components in the [roadmap](components.md#roadmap), one at a time.
- Keep keyboard, touch, reduced motion, SSR, and hydration behavior covered by regression checks.
- Validate changes through the showcase and the independently installed starter.
- Prepare source, package, and showcase releases separately; see [release preparation](releasing.md).

## Implementation boundaries

The approach is feasible, but full equivalence is a library project, not a mechanical conversion. Remix UI currently supplies accordion, anchor, combobox, form, listbox, menu, popover, select, tabs, toast, toggle, and animation modules. It does not expose a ready-made counterpart for every upstream component.

Calendars, rich editing within composed experiences, attachment previews, color manipulation, drag/reorder interactions, and nested popup edge cases need deeper audit. If an upstream feature depends on a substantial external subsystem, record its exact behavior and implementation cost; do not silently remove it or add an unapproved runtime dependency. Native HTML alone does not guarantee equivalent behavior.

The workspace pins Remix 3.3.0 and Remix UI 0.14.0. Reflow wraps the independently versioned Remix UI primitives so its app and consumers can use the same component API. The committed lockfile pins transitive packages.

## Relationship to Fluid Functionalism

Fluid Functionalism stays a source. New upstream components are adopted as they appear, as Breadcrumb was, and existing ones are kept close to upstream's look and motion. The pinned commits are listed under [references](#references). Components Reflow adds on its own follow its [definition of done](components.md#definition-of-done) instead.

### Deliberate differences

- **Keyboard and touch.** Carousel autoplay pauses on keyboard focus. InputMessage can expose a visible attach button, and clickable cards require an accessible label.
- **Sidebar.** Parent rows can be links with separate expanders. On mobile the rail opens as a viewport-height modal drawer with Escape and focus return. The workspace and profile menus mark keyboard focus with a row highlight rather than the moving ring.
- **Forms and surfaces.** AskUserQuestions can submit through a surrounding form and optionally show a completion screen. Field choice cards keep the stronger checked border. CommandMenu's shortcut footer is opt-in.
- **CommandMenu.** The header line strengthens once rows scroll under it, as upstream's code intends; upstream's own line never strengthens because its scroll root clips it.

### Known gap

PDF attachments show a document glyph. Upstream renders the first page, which needs a separate PDF subsystem.

### Upstream blocks

The upstream registry also installs seven blocks: compositions copied into an app. Reflow's docs have no Blocks section; every page documents something imported from `@rtzll/reflow`, and each block maps to a component or an example:

| Upstream block | In Reflow |
| --- | --- |
| `queued-stack` | The QueuedStack component, exported from the package. |
| `sidebar-app` | The Sidebar page. Its examples show workspace switching, nested projects, search and profile controls. |
| `dialog-sidebar` | The Dialog page's "With a sidebar" example, also used on the Sidebar page, in the gallery and in the focused demo. Its sections and fields are app-specific, so it stays in the showcase. |
| `sidebar-workspace-header`, `sidebar-user-footer` | The Sidebar page's Header & footer example, whose code includes both menus as Dropdowns with a bare `rf-sidebar-row` trigger. |
| `sidebar-search-field`, `sidebar-inset-topbar` | Built into Sidebar: the `searchable` filter field and the collapse/mobile toolbar. Supply breadcrumbs and trailing actions through the toolbar slot. |

The former `/docs/app-sidebar` and `/docs/settings-dialog` pages redirect to Sidebar and to Dialog's "With a sidebar" example.

## References

- The [ContextMenu design note](context-menu.md) follows the upstream catalog at `13fef6966428b5b16952f1609aa3814e9bdf115b`. [Pinned registry](https://github.com/mickadesign/fluid-functionalism/blob/13fef6966428b5b16952f1609aa3814e9bdf115b/registry.json) · [ContextMenu source](https://github.com/mickadesign/fluid-functionalism/blob/13fef6966428b5b16952f1609aa3814e9bdf115b/registry/default/context-menu.tsx)
- [Fluid Functionalism source](https://github.com/mickadesign/fluid-functionalism), initial inspected commit `7e6ae290dd8f5a7657ae4a433a42e165bac3ece4`. Breadcrumb, Dropdown's `openOnHover`, and the demo deck follow `2bfb830023e46ea9bcf5d326e015d4511ab9ef38`. The showcase shape default follows `7f5601a` and the Button spinner follows `cc276ca`.
- [Upstream showcase](https://www.fluidfunctionalism.com/) and [focused demo](https://www.fluidfunctionalism.com/demo).
- [Upstream MIT license](https://github.com/mickadesign/fluid-functionalism/blob/main/LICENSE) is included in `packages/reflow/NOTICE`. The Inter font used by the website has a separate SIL Open Font License notice next to its asset.
- [Remix rendering guide](https://docs.remix.run/rendering-ui/).
- [Remix UI source and documentation](https://github.com/remix-run/remix/tree/main/packages/ui).
- [Remix UI animation exports](https://github.com/remix-run/remix/blob/main/packages/ui/src/animation.ts).
