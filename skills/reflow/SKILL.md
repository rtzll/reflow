---
name: reflow
description: Build and refine Remix 3 interfaces with Reflow components, shared theme tokens, fluid hover, and restrained motion. Use when a project uses Reflow or asks to adopt its interaction patterns.
---

# Build with Reflow

Inspect the project's package manifest and existing UI before making changes. Use the installed Reflow exports and types as the API reference. In the Reflow workspace, read `packages/reflow/src/index.ts`, the relevant source module, and its examples in `apps/web/app/public/component-demos.tsx`.

Reflow uses the Remix 3 component runtime. Component setup runs once and returns a render function. Read changing props through `handle.props`, update local state in events, and call `handle.update()`. Browser interactions require a hydrated client entry. Follow the installed Remix documentation for unfamiliar APIs.

## Composition

Use `@rtzll/reflow` components and import `@rtzll/reflow/styles.css` once. Prefer the existing form-aware controls, dialogs, menu and combobox primitives. Preserve labels, field descriptions, reset behavior, disabled options, keyboard navigation and focus return when composing them. For one choice among a few short options in a row, such as a view or a time range, use SegmentedControl; Tabs switch between panels, and RadioGroup suits longer lists or options with descriptions. A Tooltip names a control in a few words, a HoverCard previews what a link or name points to without taking focus, and a Popover holds controls the user opens with a click. Confirm what just happened with a toast: place one Toaster in the app and call toast(), toast.success() or toast.promise() from anywhere; give it an action such as Undo rather than asking first, and keep lasting or blocking problems in a Banner or Dialog. A Drawer suits navigation on small screens, filters and details beside the page: it is a modal dialog that slides in from an edge and closes with a drag, so keep a footer action when it must not be dismissed. Show events in a conversation, such as a model switch or a resumed session, as ChatMessage role="system" rather than as a message from either side. Show people, teams and agents with Avatar, and several at once with AvatarGroup; mark an avatar decorative when the name is written beside it. Cite sources in generated text with Citation chips right after the claim they support; give each source a title and link, and an excerpt where you have one. Show code in a CodeBlock: highlight it with highlight() from @rtzll/reflow/highlight where the code is known, ideally in a route handler, and mark lines with // [!code highlight], ++, -- or focus comments instead of styling them yourself.

Apply theme settings on a common ancestor with `data-theme`, `data-accent`, `data-shape`, `data-density`, and `data-hover`. Use the `--rf-*` CSS properties from the installed stylesheet for surfaces, spacing, text and focus colors. Consumers can provide icons as slots without adding an icon runtime.

## Interaction craft

- Use one moving hover surface for a group. `fluidHover()` attaches to the host, rows use `data-rf-hover-item`, and its surface uses `data-rf-hover-layer`. A selection surface remains distinct from pointer hover. Do not move focus just because the pointer moved.
- Reserve the width of active labels so increasing their font weight does not move adjacent controls. Keep icons and success feedback in stable slots.
- Contract a button surface by a fixed pixel on press. Scaling the whole button distorts wide controls. Use the library's Button implementation.
- Let a transition reverse when input changes. Reuse the shared motion settings and respect reduced motion. Avoid adding bounce to quiet form controls.
- Keep clipboard feedback inside the existing field. Copy only after a user action. Report failure if access is denied.
- Pause explanatory demo loops when the user interacts, when off screen, and when reduced motion is requested. Keep all demonstrated controls usable with the keyboard.

When reviewing an interface, identify the concrete interactions that users will notice and improve those within the requested scope. Verify changes at their normal entry points, including keyboard, theme and density variants. Credit Fluid Functionalism when adapting its designs or source and preserve license notices.
