# Scope

Reflow is a native Remix 3 component library and showcase inspired by Fluid Functionalism. The goal is upstream's behavior, visual restraint, and motion quality, expressed through Remix APIs rather than React compatibility, across upstream's catalog and the components Reflow adds.

The library covers the Fluid Functionalism catalog and now grows beyond it. [Components](components.md) lists the catalog, what every component needs before it ships, and the roadmap.

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

## Architecture direction

The pnpm workspace has two packages. `packages/reflow` exports ESM components, TypeScript declarations, and a stylesheet as [`@rtzll/reflow` on npm](https://www.npmjs.com/package/@rtzll/reflow). `apps/web` uses those public exports for the gallery, documentation, and focused demo.

Separate reusable geometry, color, date, and state logic from DOM measurement and Remix component lifecycle integration. Share hover, motion, focus, density, and surface behavior instead of reimplementing it in every component.

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

The approach is feasible, but full equivalence is a library project, not a mechanical conversion. Remix UI currently supplies accordion, anchor, combobox, form, listbox, menu, popover, select, tabs, toggle, and animation modules. It does not expose a ready-made counterpart for every upstream component.

Calendars, rich editing within composed experiences, attachment previews, color manipulation, drag/reorder interactions, and nested popup edge cases need deeper audit. If an upstream feature depends on a substantial external subsystem, record its exact behavior and implementation cost; do not silently remove it or add an unapproved runtime dependency. Native HTML alone does not guarantee equivalent behavior.

The workspace pins Remix 3.2.0 and Remix UI 0.13.1. Reflow wraps the independently versioned Remix UI primitives so its app and consumers can use the same component API. The committed lockfile pins transitive packages.

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

- [Fluid Functionalism source](https://github.com/mickadesign/fluid-functionalism), initial inspected commit `7e6ae290dd8f5a7657ae4a433a42e165bac3ece4`. Breadcrumb and Dropdown's `openOnHover` follow commit `2bfb830023e46ea9bcf5d326e015d4511ab9ef38`.
- [Upstream showcase](https://www.fluidfunctionalism.com/) and [focused demo](https://www.fluidfunctionalism.com/demo).
- [Upstream MIT license](https://github.com/mickadesign/fluid-functionalism/blob/main/LICENSE) is included in `packages/reflow/NOTICE`. The Inter font used by the website has a separate SIL Open Font License notice next to its asset.
- [Remix rendering guide](https://docs.remix.run/rendering-ui/).
- [Remix UI source and documentation](https://github.com/remix-run/remix/tree/main/packages/ui).
- [Remix UI animation exports](https://github.com/remix-run/remix/blob/main/packages/ui/src/animation.ts).
