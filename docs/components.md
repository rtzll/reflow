# Components

Reflow started as a native Remix port of the [Fluid Functionalism](https://github.com/mickadesign/fluid-functionalism) catalog and now adds components of its own. This page lists what ships, what every component needs before it ships, and what comes next. How Reflow follows upstream, and where it differs on purpose, is in [scope](scope.md#relationship-to-fluid-functionalism).

## Catalog

- **Forms** · `Button`, `Checkbox`, `CheckboxGroup`, `Combobox`, `Field`, `Input`, `InputCopy`, `InputGroup`, `RadioGroup`, `SegmentedControl`, `Select`, `Slider`, `Switch`, `Textarea`
- **Date and color** · `Calendar`, `ColorPicker`, `DatePicker`
- **Navigation and disclosure** · `Accordion`, `Breadcrumb`, `CarouselDots`, `Sidebar`, `Tabs`
- **Menus and overlays** · `CommandMenu`, `Dialog`, `Dropdown`, `Tooltip`
- **Display and feedback** · `Badge`, `Banner`, `Card`, `Table`
- **Conversation** · `AskUserQuestions`, `ChatMessage`, `InputMessage`, `QueuedStack`, `ThinkingIndicator`, `ThinkingSteps`

Every component has a docs page with a live preview, highlighted code and an API table; most also have a playground. Run the showcase and open `/docs`, or read the [usage examples](../apps/web/app/public/examples.tsx).

## Definition of done

A new component, or a new upstream one, is done when it has all of the following.

**Behavior**

- Built on native elements or Remix UI primitives, with Reflow code only for the gaps. No new runtime dependency (see the [dependency policy](scope.md#dependency-policy)).
- Keyboard operation, visible focus, and correct roles and names. Form controls take part in forms: values, `name`, reset and validation.
- Server rendering works without JavaScript where it makes sense, and hydration does not shift the layout.

**Look and motion**

- Reflow's own style: surfaces, radius, type and color come from the shared CSS variables. A reference library informs concepts and parameters, never styling.
- Shared systems before new code: fluid hover and its selection and focus layers, the `--rf-spring-*` tiers and `motion` in `systems.ts`, ScrollArea, Tooltip, Dropdown.
- Default and compact sizes, light and dark themes, every shape, forced colors, and reduced motion, which keeps fades and drops movement.
- Pieces that look alike stay in line: a pile of toasts and QueuedStack share their stacking values.

**Code and tests**

- Exported from [`index.ts`](../packages/reflow/src/index.ts) with typed, documented props, and styles in the package stylesheet.
- Tests for every behavior. Styling and layout checks go in `*.test.e2e.ts`, because browser tests load no CSS. Write the failing test first.
- `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm test:run` and `pnpm test:deployment` pass; run `pnpm test:package` after export changes.

**Showcase and docs**

- A catalog entry, a docs page with examples and an API table, a playground where the component has options, and a gallery card and demo slide where it reads well at that size. Keep the gallery's small and wide cards balanced.
- The docs preview follows the stage rules: content starts 48px below the header and stays put as it grows; examples that open popups get room to open into.
- The [Reflow skill](../skills/reflow/SKILL.md) and this page mention it.

**Commits**

Small commits on `main`, one per change, each with its tests. Nothing is pushed without asking.

## Roadmap

Built in this order, one component at a time, with a short design note (API, behavior, keyboard and accessibility, motion, reused pieces) reviewed before the code. A release follows each wave.

| Wave | Component | Conceptual references | Builds on |
| --- | --- | --- | --- |
| 1 | `SegmentedControl` (shipped) | Apple's segmented control | Tabs and RadioGroup's moving fill; native radios for forms |
| 1 | `Popover`, then `HoverCard` | Radix and Astryx concepts | Tooltip's anchoring; Dropdown's hover intent and safe pointer travel |
| 2 | `Toaster` and `toast()` | [sonner](https://github.com/emilkowalski/sonner) | QueuedStack's pile; Banner's status icons |
| 2 | `Drawer` | [vaul](https://github.com/emilkowalski/vaul) | Dialog's native `<dialog>` and focus return; the Sidebar's mobile drawer can move onto it |
| 3 | `ChatLayout`, `Citation`, `CodeBlock`, and a `system` role for ChatMessage | Astryx's chat set | The InputMessage docs layout, ChatMessage's glide, ThinkingStepSource chips, the docs' code panel |
| 4 | `Avatar` and `AvatarGroup`, `Skeleton`, `Spinner`, `Progress`, `NumberField` | — | ThinkingIndicator's shimmer, Button's loading state, CarouselDots' progress fill, ColorPicker's scrub fields |

### Decisions so far

- **Toasts** are raised with a `toast()` function and shown by one `<Toaster>` placed in the app, as in sonner: no provider, and nothing renders on the server. They support all six positions. The stack peeks and spreads like QueuedStack, which keeps its own behavior; the two only share stacking values.
- **Drawer** slides in from any of the four sides, closes on drag past a threshold or a fast flick, and has an optional handle. Snap points, background scaling and nested drawers come later.
- **ChatLayout** owns the conversation screen: a transcript that fills the space and stays pinned to the newest message, with the composer docked at the bottom.
- **CodeBlock** (proposed, to confirm) comes from the docs' own code panel: a language or filename label, a copy button with feedback, scrolling through ScrollArea, and the small dependency-free highlighter for JavaScript and TypeScript. Other languages render plain, and a slot takes markup highlighted elsewhere. The docs then use it for their Code tab.
- **Upstream** stays a source: new Fluid Functionalism components are adopted as they appear, as Breadcrumb was.
