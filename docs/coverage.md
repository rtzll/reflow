# Component coverage

All 33 components from the initial Fluid Functionalism catalog have a Reflow implementation, a docs page, and an interactive demo. Breadcrumb, added upstream in commit `2bfb830023e46ea9bcf5d326e015d4511ab9ef38`, is the 34th; it has a docs page, playground, gallery card and focused demo slide. QueuedStack, a block upstream, is the 35th: the package exports it, so the docs list it as a component. Fluid Functionalism remains the design reference. [Pinned upstream source](https://github.com/mickadesign/fluid-functionalism/tree/7e6ae290dd8f5a7657ae4a433a42e165bac3ece4)

## Current work and remaining refinements

QueuedStack now expands on hover, keyboard focus, and tap, with live pointer reordering. Dropdown menus cap long lists and follow the resolved placement when they animate. Tabs, CheckboxGroup, RadioGroup, and Accordion share a moving keyboard focus ring. RadioGroup also moves the selection fill. Calendar has month transitions, a moving range endpoint, and navigation hints. DatePicker’s Clearable setting is available in the playground and copied code.

Remaining visual refinements include moving checkbox selection surfaces, ColorPicker scrub feedback, and ChatMessage append motion. PDF attachments use a document glyph. First-page rendering depends on a separate PDF subsystem in the reference.

Grouped controls and inline Dropdowns share a fast focus ring with the same 2px outer spacing as the reference. Keyboard focus remains separate from selection, and forced-colors mode uses row outlines. Triggered Dropdown menus move the same focus ring between rows; the ColorPicker format menu also marks the current format with a selection fill. The Sidebar's workspace and profile menus fit within the rail and show keyboard focus with a row highlight or a forced-colors outline.

## Intentional differences

- **Keyboard and touch.** Carousel autoplay pauses on keyboard focus. InputMessage can expose a visible attach button, and clickable cards require an accessible label.
- **Sidebar.** Parent rows can be links with separate expanders. On mobile the rail opens as a viewport-height modal drawer with Escape and focus return.
- **Forms and surfaces.** AskUserQuestions can submit through a surrounding form and optionally show a completion screen. Field choice cards keep the stronger checked border. CommandMenu’s shortcut footer is opt-in.

## Components

| Component | Functional target | Implementation |
| --- | --- | --- |
| Accordion | Expand/collapse, grouped hover, animated content size | Remix accordion with spring-driven panel height and a shared moving focus ring |
| AskUserQuestions | Multi-step questions, single/multiple choices, custom answer, skip and navigation, submit shortcut | Reflow composition. Single choices advance, multi-select and free text use Continue, and digits select options. Hidden inputs integrate with forms, and the completion screen is opt-in. |
| Badge | Status/color treatments and both densities | Markup and CSS |
| Banner | Status variants, actions, dismiss/collapse, fixed placement | Reflow composition |
| Breadcrumb | Trail to the current page, shared hover, step menus, truncation with the full name, collapse on overflow | Native nav, ordered list and links, with Dropdown for step and ellipsis menus. A cut step shows its full name in a Tooltip under it, closed while its menu is open. |
| Button | Variants, density, loading, icons, hover weight and press feedback | Native button/link |
| Calendar | Single date/range, multiple months, disabled dates, week numbers, hover/range bands | Local date logic and accessible grid |
| Card | Composable layouts, slots, dividers, two-dimensional hover | Markup and shared hover |
| CarouselDots | Selected position, autoplay progress, pointer and keyboard operation | Native buttons and local state |
| ChatMessage | Conversation layout, entry motion, attachments | Conversation rows, spring entry, and 64px image or document thumbnails |
| Checkbox | Checked/mixed/disabled behavior, form participation, animated check | Native checkbox |
| CheckboxGroup | Multiple selection and merged adjacent selection surfaces | Checkbox plus shared group logic |
| ColorPicker | Color formats (hex, RGB, HSL, OKLCH), alpha, swatches, pointer/keyboard editing of the square and rails, scrubbable channel fields, format menu, eyedropper where supported, popover trigger with optional remove | Local color logic with shared Slider and menu. Channel scrubbing uses pointer capture. |
| Combobox | Filtering, keyboard navigation, multiple chips, create option | Remix popover with Reflow filtering, listbox semantics, keyboard navigation, and form values. One implementation covers single selection, multiple chips, and option creation. The pinned Remix Combobox primitive commits a single value. |
| CommandMenu | Search, grouped commands, keyboard selection, shortcuts, modal presentation, scroll-linked list dividers | Remix primitives and Reflow dialog. The dividers use CSS scroll-driven animations where supported. |
| DatePicker | Single/range selection, presets, optional time selection | Calendar plus popover |
| Dialog | Modal/nonmodal behavior, focus return, dismissal, sizes, animated exit cleanup | Native dialog and local integration |
| Dropdown | Actions, selection, search, submenus, safe pointer travel and open on hover | Remix menu/popover |
| Field | Labels, descriptions, errors, fieldsets, choice-card layouts | Semantic HTML and Remix form utilities |
| Input | Text/number behavior as applicable, disabled/error states and focus styling | Native input |
| InputCopy | Read-only value, clipboard action and feedback | Input, button, Clipboard API |
| InputGroup | Group hover, label transitions, validation states | Field/input composition |
| InputMessage | Resizing composer, attachments/drop, actions, send behavior and upstream variants | Native editing and file APIs with keyboard prompts, an optional attachment control, and queued message transitions |
| QueuedStack | Reorder by drag or keyboard, edit/remove/send actions, and a transition into the sent bubble | Compact pile that expands on hover, keyboard focus and tap, reorders during a pointer drag, and uses a native view transition into the sent bubble |
| RadioGroup | Exclusive selection, keyboard/form behavior, hover and selection motion | Native radios and shared hover |
| Select | Keyboard/typeahead behavior, controlled selection, icons and visual variants | Remix select |
| Sidebar | Sections, resizing, collapse, keyboard shortcuts, mobile drawer | Reflow composition with roving focus, pointer and keyboard resizing, animated collapse and peek, and a modal mobile drawer |
| Slider | Steps, range values, pointer/keyboard editing, editable readout and motion | Native ranges with editable values and pointer previews |
| Switch | Form-aware toggle with animated thumb and label | Native checkbox or Remix toggle |
| Table | Semantic table structure with row hover | Native table and shared hover |
| Tabs | Accessible tab relationships, keyboard navigation and moving indicator | Remix tabs |
| Textarea | Multiline input with automatic sizing | Native textarea |
| ThinkingIndicator | Accessible status, animated SVG and rotating text | SVG, Remix animation and local state |
| ThinkingSteps | Expandable progress steps, nested disclosures, sources, images and sequential presentation | Accordion and timeline variants, reusable step content, and controlled outer disclosure. Stream timing and compact geometry have not been measured against the reference. |
| Tooltip | Pointer/focus trigger, placement, dismissal and accessible association | Remix positioning plus local tooltip behavior |

## Shared systems

- Fluid hover measures rows or grids and moves one highlight between enabled items, with grouped gap targeting and popup lifecycle handling.
- Motion includes shared spring curves, interruptible sliding indicators, faster exits, and reduced motion behavior.
- Reveal supports viewport entry and scroll-linked progress. ScrollArea uses native scrolling with custom desktop thumbs, keyboard and drag input, dynamic edge fades, and native coarse-pointer scrolling.
- Sizes, surfaces, and typography use shared CSS variables. Inter and Geist Serif are bundled locally. The optional searchable Google Fonts catalog loads only the selected family; custom weights persist with the other preferences. The typography page includes an editable Markdown specimen.
- Theme, accent, heading font, shape, density, and hover mode update immediately across the website. Cookies preserve preferences, so internal links and the address bar stay clean. A copied share link carries the settings that differ from the defaults. Opening it saves them as the visitor's own and redirects to the clean URL. Keyboard accelerators and global command search operate on the same settings.

The eighth system is the bundled `skills/reflow/SKILL.md`. Its documentation includes four cursor-driven comparisons that pause for pointer and keyboard interaction and can be replayed.

## Upstream blocks

The upstream registry also installs seven blocks: compositions copied into an app. Reflow's docs have no Blocks section. Every page documents something imported from `@rtzll/reflow`, and each block maps to a component or an example:

| Upstream block | In Reflow |
| --- | --- |
| `queued-stack` | The QueuedStack component, exported from the package. |
| `sidebar-app` | The Sidebar page. Its examples show workspace switching, nested projects, search and profile controls. |
| `dialog-sidebar` | The Dialog page's "With a sidebar" example, also used on the Sidebar page, in the gallery and in the focused demo. Its sections and fields are app-specific, so it stays in the showcase. |
| `sidebar-workspace-header`, `sidebar-user-footer` | The Sidebar page's Header & footer example, whose code includes both menus as Dropdowns with a bare `rf-sidebar-row` trigger. |
| `sidebar-search-field`, `sidebar-inset-topbar` | Built into Sidebar: the `searchable` filter field and the collapse/mobile toolbar. Supply breadcrumbs and trailing actions through the toolbar slot. |

The former `/docs/app-sidebar` and `/docs/settings-dialog` pages redirect to Sidebar and to Dialog's "With a sidebar" example.

## Showcase

- Overview grid with 30 preview cards, docs index and detail pages, and a focused demo with direct component links.
- Responsive layout, copyable usage examples, shareable settings links, and Reflow branding with upstream attribution.
- All 35 component pages include a live preview, replay, inspection, highlighted code, and public API tables. All but QueuedStack also have playground controls and further examples.
- Installation prompts include the active preferences and direct agents to the bundled Reflow skill.
- Global command search opens with Cmd/Ctrl K. Shortcut help uses individual keycaps and labeled icons.

## Verification

Use `pnpm test` for regressions in Reflow. The suite covers keyboard and focus behavior, form values and resets, popup interactions, composer attachments and queued sends, settings, and showcase overflow. The docs sweep checks hydration and horizontal overflow in desktop dark and mobile light. Documentation examples are typechecked against the public API.

When changing an interaction, verify the component in the affected showcase context. Check pointer, keyboard, touch, reduced motion, and form behavior where applicable. Use the built-in browser for visual checks. Compare the relevant state with the upstream design when changing motion or presentation.
