# Component coverage

All 33 components from the initial Fluid Functionalism catalog have a Reflow implementation, a docs page, and an interactive demo. Fluid Functionalism remains the design reference. [Pinned upstream source](https://github.com/mickadesign/fluid-functionalism/tree/7e6ae290dd8f5a7657ae4a433a42e165bac3ece4)

## Current work and remaining refinements

QueuedStack now expands on hover, keyboard focus, and tap, with live pointer reordering. Dropdown menus cap long lists and follow the resolved placement when they animate. Tabs, CheckboxGroup, RadioGroup, and Accordion share a moving keyboard focus ring. RadioGroup also moves the selection fill. Calendar has month transitions, a moving range endpoint, and navigation hints. DatePicker’s Clearable setting is available in the playground and copied code.

Remaining visual refinements include moving checkbox selection surfaces, CommandMenu scroll dividers, ColorPicker scrub feedback, Accordion first-open motion, and ChatMessage append motion. PDF attachments use a document glyph. First-page rendering depends on a separate PDF subsystem in the reference.

Grouped controls and inline Dropdowns share a fast focus ring with the same 2px outer spacing as the reference. Keyboard focus remains separate from selection, and forced-colors mode uses row outlines. Most triggered Dropdowns use a static inset outline. The Sidebar's workspace and profile menus fit within the rail and show keyboard focus with a row highlight or a forced-colors outline.

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
| Button | Variants, density, loading, icons, hover weight and press feedback | Native button/link |
| Calendar | Single date/range, multiple months, disabled dates, week numbers, hover/range bands | Local date logic and accessible grid |
| Card | Composable layouts, slots, dividers, two-dimensional hover | Markup and shared hover |
| CarouselDots | Selected position, autoplay progress, pointer and keyboard operation | Native buttons and local state |
| ChatMessage | Conversation layout, entry motion, attachments | Conversation rows, spring entry, and 64px image or document thumbnails |
| Checkbox | Checked/mixed/disabled behavior, form participation, animated check | Native checkbox |
| CheckboxGroup | Multiple selection and merged adjacent selection surfaces | Checkbox plus shared group logic |
| ColorPicker | Color formats (hex, RGB, HSL, OKLCH), alpha, swatches, pointer/keyboard editing of the square and rails, scrubbable channel fields, format menu, eyedropper where supported, popover trigger with optional remove | Local color logic with shared Slider and menu. Channel scrubbing uses pointer capture. |
| Combobox | Filtering, keyboard navigation, multiple chips, create option | Remix popover with Reflow filtering, listbox semantics, keyboard navigation, and form values. One implementation covers single selection, multiple chips, and option creation. The pinned Remix Combobox primitive commits a single value. |
| CommandMenu | Search, grouped commands, keyboard selection, shortcuts, modal presentation | Remix primitives and Reflow dialog |
| DatePicker | Single/range selection, presets, optional time selection | Calendar plus popover |
| Dialog | Modal/nonmodal behavior, focus return, dismissal, sizes, animated exit cleanup | Native dialog and local integration |
| Dropdown | Actions, selection, search, submenus and safe pointer travel | Remix menu/popover |
| Field | Labels, descriptions, errors, fieldsets, choice-card layouts | Semantic HTML and Remix form utilities |
| Input | Text/number behavior as applicable, disabled/error states and focus styling | Native input |
| InputCopy | Read-only value, clipboard action and feedback | Input, button, Clipboard API |
| InputGroup | Group hover, label transitions, validation states | Field/input composition |
| InputMessage | Resizing composer, attachments/drop, actions, send behavior and upstream variants | Native editing and file APIs with keyboard prompts, an optional attachment control, and queued message transitions |
| RadioGroup | Exclusive selection, keyboard/form behavior, hover and selection motion | Native radios and shared hover |
| Select | Keyboard/typeahead behavior, controlled selection, icons and visual variants | Remix select |
| Sidebar | Sections, resizing, collapse, keyboard shortcuts, mobile drawer | Reflow composition with roving focus, pointer and keyboard resizing, animated collapse and peek, and a modal mobile drawer |
| Slider | Steps, range values, pointer/keyboard editing, editable readout and motion | Native ranges with editable values and pointer previews |
| Switch | Form-aware toggle with animated thumb and label | Native checkbox or Remix toggle |
| Table | Semantic table structure with row hover | Native table and shared hover |
| Tabs | Accessible tab relationships, keyboard navigation and moving indicator | Remix tabs |
| Textarea | Multiline input with automatic sizing | Native textarea |
| ThinkingIndicator | Accessible status, animated SVG and rotating text | SVG, Remix animation and local state |
| ThinkingSteps | Expandable progress steps, nested disclosures, sources, images and sequential presentation | Accordion and timeline variants, reusable step content, and controlled outer disclosure |
| Tooltip | Pointer/focus trigger, placement, dismissal and accessible association | Remix positioning plus local tooltip behavior |

## Shared systems

- Fluid hover measures rows or grids and moves one highlight between enabled items, with grouped gap targeting and popup lifecycle handling.
- Motion includes shared spring curves, interruptible sliding indicators, faster exits, and reduced motion behavior.
- Reveal supports viewport entry and scroll-linked progress. ScrollArea uses native scrolling with custom desktop thumbs, keyboard and drag input, dynamic edge fades, and native coarse-pointer scrolling.
- Sizes, surfaces, and typography use shared CSS variables. Inter and Geist Serif are bundled locally. The optional searchable Google Fonts catalog loads only the selected family; custom weights persist with the other preferences. The typography page includes an editable Markdown specimen.
- Theme, accent, heading font, shape, density, and hover mode update immediately across the website. Cookies preserve preferences across navigation, and URLs carry explicit settings. Keyboard accelerators and global command search operate on the same settings.

The eighth system is the bundled `skills/reflow/SKILL.md`. Its documentation includes four cursor-driven comparisons that pause for pointer and keyboard interaction and can be replayed.

## Composed blocks and groups

The pinned upstream registry lists seven blocks. Reflow's catalog lists three. The four other blocks appear as parts of examples or the Sidebar library, with different levels of reuse.

| Group or block | What Reflow has | Remaining gap |
| --- | --- | --- |
| ThinkingSteps | A timeline with pending/active/complete states, controlled outer disclosure, nested details that retain their state, linked source badges, images with captions, and pausable demos. | The disclosure accepts a custom heading and body alongside the array-based API. Stream timing and compact geometry still differ from or have not been measured against the reference. |
| QueuedStack | Reorder by drag or keyboard, edit/remove/send actions, and a native view transition into a sent bubble. | Reflow now uses a compact pile with hover, keyboard focus, and tap expansion. The queue reorders during a pointer drag. |
| App Sidebar / `sidebar-app` | Workspace switching, nested projects, search, profile controls and an inset main area are demonstrated. | Use Sidebar’s header, footer, and toolbar slots for workspace and user controls, breadcrumbs, and actions. The showcase demonstrates the shell with app-owned workspace state. |
| Settings Dialog / `dialog-sidebar` | Sidebar docs, Dialog docs, gallery and focused demo share the five-section Settings example. | The shared composition stays in the showcase because its sections and form fields are app-specific. Library consumers can compose their own with Dialog, Sidebar, and form controls. |
| `sidebar-workspace-header`, `sidebar-user-footer` | The docs and playground reuse a workspace header and a user footer with dropdowns. | Separate installable blocks and standalone catalog examples are missing. |
| `sidebar-search-field`, `sidebar-inset-topbar` | Sidebar provides a filter field and collapse/mobile toolbar. | Supply breadcrumbs and trailing actions through the toolbar slot. The filter field is part of Sidebar navigation. |

## Showcase

- Overview grid with 29 preview cards, docs index and detail pages, and a focused demo with direct component links.
- Responsive layout, copyable usage examples, URL settings, and Reflow branding with upstream attribution.
- All 33 component pages include live playground controls, multiple working examples, replay, inspection, highlighted code, and public API tables.
- Installation prompts include the active preferences and direct agents to the bundled Reflow skill.
- Global command search opens with Cmd/Ctrl K. Shortcut help uses individual keycaps and labeled icons.

## Verification

Use `pnpm test` for regressions in Reflow. The suite covers keyboard and focus behavior, form values and resets, popup interactions, composer attachments and queued sends, settings, and showcase overflow. The docs sweep checks hydration and horizontal overflow in desktop dark and mobile light. Documentation examples are typechecked against the public API.

When changing an interaction, verify the component in the affected showcase context. Check pointer, keyboard, touch, reduced motion, and form behavior where applicable. Use the built-in browser for visual checks. Compare the relevant state with the upstream design when changing motion or presentation.
