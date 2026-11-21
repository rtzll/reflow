# Components

Reflow started as a native Remix port of the [Fluid Functionalism](https://github.com/mickadesign/fluid-functionalism) catalog and now adds components of its own. This page lists what ships, what every component needs before it ships, and what comes next. How Reflow follows upstream, and where it differs on purpose, is in [scope](scope.md#relationship-to-fluid-functionalism).

## Catalog

- **Forms** · `Button`, `Checkbox`, `CheckboxGroup`, `Combobox`, `Field`, `FileInput`, `Input`, `InputCopy`, `InputGroup`, `NumberField`, `RadioGroup`, `SegmentedControl`, `Select`, `Slider`, `Switch`, `Textarea`
- **Date and color** · `Calendar`, `ColorPicker`, `DatePicker`, `TimeGrid`
- **Navigation and disclosure** · `Accordion`, `Breadcrumb`, `Carousel`, `CarouselDots`, `Pagination`, `Resizable`, `Sidebar`, `Tabs`, `Toolbar`, `Tree`
- **Menus and overlays** · `AlertDialog`, `CommandMenu`, `ContextMenu`, `Dialog`, `Drawer`, `Dropdown`, `HoverCard`, `Popover`, `Tooltip`
- **Display and feedback** · `Avatar`, `AvatarGroup`, `Badge`, `Banner`, `BarChart`, `Card`, `CodeBlock`, `DataTable`, `RoutedDataTable`, `Markdown`, `Progress`, `Skeleton`, `Spinner`, `Table`, `Toaster`
- **Conversation** · `AskUserQuestions`, `ChatLayout`, `ChatMessage`, `Citation`, `InputMessage`, `QueuedStack`, `ThinkingIndicator`, `ThinkingSteps`, `TriggerMenu`

Every component has a docs page with a live preview, highlighted code and an API table; most also have a playground. Run the showcase and open `/docs`, or read the [usage examples](../apps/web/app/public/examples.tsx).

## Definition of done

A new component, or a new upstream one, is done when it has all of the following.

**Behavior**

- Built on native elements, Remix UI primitives and Reflow's behaviors, placed as [code structure](scope.md#code-structure) describes. Logic for a gap that another component also needs becomes a behavior. No new runtime dependency (see the [dependency policy](scope.md#dependency-policy)).
- Keyboard operation, visible focus, and correct roles and names. Form controls take part in forms: values, `name`, reset and validation.
- Server rendering works without JavaScript where it makes sense, and hydration does not shift the layout.

**Look and motion**

- Reflow's own style: surfaces, radius, type and color come from the shared CSS variables. A reference library informs concepts and parameters, never styling.
- Systems and existing components before new code: fluid hover and its selection and focus layers, the `--rf-spring-*` tiers and `motion` in `src/systems/`, and components such as ScrollArea, Tooltip and Dropdown.
- Default and compact sizes, light and dark themes, every shape, forced colors, and reduced motion, which keeps fades and drops movement.
- Pieces that look alike stay in line: a pile of toasts and QueuedStack share their stacking values.

**Code and tests**

- Exported from [`index.ts`](../packages/reflow/src/index.ts) with typed, documented props, and styles in the package stylesheet.
- Tests for every behavior. Styling and layout checks go in `*.test.e2e.ts`, because browser tests load no CSS. Write the failing test first.
- `pnpm fmt:check`, `pnpm lint`, `pnpm check`, `pnpm test:run` and `pnpm test:deployment` pass; run `pnpm test:package` after export changes.

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
| 1 | `Popover` and `HoverCard` (shipped) | Radix and Astryx concepts | Tooltip's anchoring; Dropdown's hover intent and safe pointer travel |
| 2 | `Toaster` and `toast()` (shipped) | [sonner](https://github.com/emilkowalski/sonner) | QueuedStack's pile; Banner's status icons |
| 2 | `Drawer` (shipped) | [vaul](https://github.com/emilkowalski/vaul) | Dialog's native `<dialog>` and focus return; the Sidebar's mobile drawer uses it |
| 3 | `CodeBlock`, a `system` role for ChatMessage, `Citation` and `ChatLayout` (shipped) | Astryx's chat set | The InputMessage docs layout, ChatMessage's glide, ThinkingStepSource chips, the docs' code panel |
| 4 | `Avatar` and `AvatarGroup` (shipped), `Skeleton` (shipped), `Spinner` (shipped), `Progress` (shipped), `NumberField` (shipped) | — | ThinkingIndicator's shimmer, Button's loading state, CarouselDots' progress fill, ColorPicker's scrub fields |
| 5 | `Carousel` (shipped) | [Blossom Carousel](https://github.com/jespervos/blossom-carousel) | CarouselDots, native scroll snap, the `--rf-spring-*` tiers |
| 6 | `TriggerMenu` (shipped) | [UI SDK](https://ui-sdk.dev/docs/react/components/trigger-menu) | InputMessage, anchored positioning, fluid hover |
| 6 | `FileInput` (shipped) | [UI SDK](https://ui-sdk.dev/docs/react/components/file-input) | Native file input, Field, InputMessage file filtering |
| 6 | `Resizable` (shipped) | [UI SDK](https://ui-sdk.dev/docs/react/components/resizable) | Sidebar grip interaction |
| 6 | `AlertDialog` (shipped) | [UI SDK](https://ui-sdk.dev/docs/react/components/alert-dialog) | Dialog, destructive Button |
| 7 | `Pagination` (shipped) | [UI SDK](https://ui-sdk.dev/docs/react/components/pagination) | Native links, Table |
| 7 | `Toolbar` (shipped) | [UI SDK](https://ui-sdk.dev/docs/react/components/toolbar) | Button, keyboard focus navigation |
| 7 | `Tree` (shipped) | [UI SDK](https://ui-sdk.dev/docs/react/components/tree) | Fluid hover, Resizable, CodeBlock |
| 8 | [`ContextMenu` (shipped)](context-menu.md) | [Fluid Functionalism ContextMenu](https://github.com/mickadesign/fluid-functionalism/blob/13fef6966428b5b16952f1609aa3814e9bdf115b/registry/default/context-menu.tsx) | Dropdown's menu surface and Remix UI's menu primitive, demonstrated in the project tree |
| 8 | [`DataTable` (shipped)](data-table.md) | [Fluid Functionalism DataTable](https://github.com/mickadesign/fluid-functionalism/blob/13fef6966428b5b16952f1609aa3814e9bdf115b/registry/default/data-table.tsx) | Table, Pagination, ContextMenu, Dropdown, Input, and Skeleton |
| 8 | `Markdown` (shipped) | — | CodeBlock and Table, used in Typography and the Chat workspace |
| 8 | [`TimeGrid` (shipped)](time-grid.md) | — | Controlled timed layout, pointer/keyboard moves and resizes, used in the Calendar workspace |
| 8 | [`BarChart` (shipped)](bar-chart.md) | — | Tooltip and roving list navigation, used in Build timings and the Analytics workspace |

### Decisions so far

- **Toasts** are raised with a `toast()` function and shown by one `<Toaster>` placed in the app, as in sonner: no provider, and nothing renders on the server. They support all six positions. The stack peeks and spreads like QueuedStack, which keeps its own behavior; the two only share stacking values. Remix UI's `toast` primitive supplies the region, announcements, keyboard movement and timers.
- **Drawer** slides in from any of the four sides, closes on drag past a threshold or a fast flick, and has an optional handle. Snap points, background scaling and nested drawers come later.
- **Markdown** renders notes and streaming replies from a string. Import it from `@rtzll/reflow/markdown`, its own entry, so only pages that render Markdown in the browser load the parser; rendered on the server, it sends none. It parses CommonMark and GitHub Flavored Markdown with marked. The typography specimen and the chat workspace use the same renderer. It supports headings, paragraphs, strong and emphasized text, strike-through, links and bare URLs, nested and loose lists, read-only tasks, quotes, rules, inline code, fenced CodeBlock examples and pipe tables. Numeric and common named character references are decoded. Raw HTML stays text and images appear as links. Local paths beginning with a slash, fragments, HTTP(S) links and email links are clickable. An unfinished fence renders the code received so far.
- **ChatLayout** owns the conversation screen: a transcript that fills the space and stays pinned to the newest message, with the composer docked at the bottom.
- **CodeBlock** builds on Shiki rather than a highlighter of its own: accurate grammars for every language, line marks written as `// [!code …]` comments, and any Shiki theme. The component lives in the main package with no dependencies and renders plain code by itself; `highlight()` lives at `@rtzll/reflow/highlight`, with Shiki as an optional peer, and returns plain data, so code is highlighted on the server and the browser loads no highlighter. Reflow owns the frame: the header, copy, line numbers, wrapping, folding, scrolling and the look of every line mark. Reflow's own theme colours tokens with CSS variables, so code follows the theme and the accent.
- **Carousel** keeps a real scroll container, as Blossom does: touch, keyboard and screen readers scroll it natively, and CSS scroll snap configures it. Reflow adds a small drag with momentum for mice only, on its springs; previous and next buttons and CarouselDots that follow the scroll position; the carousel pattern's semantics, a labelled region whose slides read as "3 of 7"; and reduced motion. CarouselDots stays a separate, controlled indicator: Carousel renders it by default, follows the slide in view with it, and scrolls when a dot is chosen, and its `index` and `onIndexChange` let any other indicator take its place. Autoplay is a Carousel prop that it hands to its dots, which keep owning the timing and the progress fill; the carousel scrolls as they advance and pauses while pointed at or focused. Unlike Blossom, it patches nothing outside its own element, adds no global listeners, and leaves text in slides selectable.
- **Upstream** stays a source: new Fluid Functionalism components are adopted as they appear, as Breadcrumb was.
