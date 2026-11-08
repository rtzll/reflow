# Scope

Reflow is a native Remix 3 component library and showcase inspired by Fluid Functionalism. The target is comparable component coverage, behavior, visual restraint, and motion quality, expressed through Remix APIs rather than React compatibility.

The initial library and website are running, with examples for all 33 components. [Component coverage](coverage.md) tracks remaining behavior and visual differences.

## Deliverables

1. A reusable component library covering all 33 components in the initial upstream catalog, plus shared systems and composed blocks.
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

The pnpm workspace has two packages. `packages/reflow` exports ESM components, TypeScript declarations, and a stylesheet as `@rtzll/reflow`. `apps/web` uses those public exports for the gallery, documentation, and focused demo. The package is not published to npm yet.

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

- Refine motion and composed blocks listed in [component coverage](coverage.md).
- Keep keyboard, touch, reduced motion, SSR, and hydration behavior covered by regression checks.
- Validate changes through the showcase and the independently installed starter.
- Prepare source, package, and showcase releases separately; see [release preparation](releasing.md).

## Implementation boundaries

The approach is feasible, but full equivalence is a library project, not a mechanical conversion. Remix UI currently supplies accordion, anchor, combobox, form, listbox, menu, popover, select, tabs, toggle, and animation modules. It does not expose a ready-made counterpart for every upstream component.

Calendars, rich editing within composed experiences, attachment previews, color manipulation, drag/reorder interactions, and nested popup edge cases need deeper audit. If an upstream feature depends on a substantial external subsystem, record its exact behavior and implementation cost; do not silently remove it or add an unapproved runtime dependency. Native HTML alone does not guarantee equivalent behavior.

The workspace pins Remix 3.2.0 and Remix UI 0.13.1. Reflow wraps the independently versioned Remix UI primitives so its app and consumers can use the same component API. The committed lockfile pins transitive packages.

## References

- [Fluid Functionalism source](https://github.com/mickadesign/fluid-functionalism), initial inspected commit `7e6ae290dd8f5a7657ae4a433a42e165bac3ece4`.
- [Upstream showcase](https://www.fluidfunctionalism.com/) and [focused demo](https://www.fluidfunctionalism.com/demo).
- [Upstream MIT license](https://github.com/mickadesign/fluid-functionalism/blob/main/LICENSE) is included in `packages/reflow/NOTICE`. The Inter font used by the website has a separate SIL Open Font License notice next to its asset.
- [Remix rendering guide](https://docs.remix.run/rendering-ui/).
- [Remix UI source and documentation](https://github.com/remix-run/remix/tree/main/packages/ui).
- [Remix UI animation exports](https://github.com/remix-run/remix/blob/main/packages/ui/src/animation.ts).
