# Reflow

Reflow is a native Remix 3 UI library. It brings spring motion, shared hover highlights, and keyboard-friendly controls to Remix’s component model. The showcase includes interactive examples, playgrounds, and copyable usage code. [Inspired by Fluid Functionalism](https://github.com/mickadesign/fluid-functionalism)

Reflow is in early development and tracks unstable Remix APIs. [npm package](https://www.npmjs.com/package/@rtzll/reflow) · [GitHub releases](https://github.com/rtzll/reflow/releases)

## Install

```sh
pnpm add --save-exact @rtzll/reflow@0.7.1 remix@3.2.0
```

Reflow includes `@remix-run/ui@0.13.1`. See the [integration guide](docs/integration.md) for compatibility, styles, and browser setup.

## Try it

Use Node 24.3+ and pnpm 12.18.0. From this checkout, run the following commands.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the address printed in the terminal. The gallery is at `/`, component docs at `/docs`, and focused demos at `/demo`.

To test the production website locally on Cloudflare's runtime, run `pnpm preview:web` and open the address printed in the terminal. [Website build and deployment](docs/deployment.md)

## Start a fresh app

```sh
pnpm starter /absolute/path/to/my-app
cd /absolute/path/to/my-app
pnpm check
pnpm dev
```

Choose a new directory outside this checkout. The starter installs a local tarball of Reflow. Open the address printed by `pnpm dev`. It includes a sidebar, appearance controls, a notification form, and a dialog. [Clean install guide](docs/development.md#try-a-clean-install)

## Use a component

```tsx
import { Dialog } from '@rtzll/reflow'
import { clientEntry } from 'remix/component'

export const Example = clientEntry(import.meta.url, function Example() {
  return () => (
    <Dialog title="Welcome" trigger="Open dialog">
      <p>Your first Reflow component.</p>
    </Dialog>
  )
})
```

Load `@rtzll/reflow/styles.css` in the page and enable Remix’s browser runtime. The starter includes both; for an existing app, follow the [integration guide](docs/integration.md).

Theme, density, accent, shape, typography, and hover behavior are configurable through attributes and CSS variables. [Customization](docs/customization.md)

## Components

- **Forms** · `Button`, `Checkbox`, `CheckboxGroup`, `Combobox`, `Field`, `FileInput`, `Input`, `InputCopy`, `InputGroup`, `NumberField`, `RadioGroup`, `SegmentedControl`, `Select`, `Slider`, `Switch`, `Textarea`
- **Date and color** · `Calendar`, `ColorPicker`, `DatePicker`
- **Navigation and disclosure** · `Accordion`, `Breadcrumb`, `Carousel`, `CarouselDots`, `Pagination`, `Resizable`, `Sidebar`, `Tabs`
- **Menus and overlays** · `AlertDialog`, `CommandMenu`, `Dialog`, `Drawer`, `Dropdown`, `HoverCard`, `Popover`, `Tooltip`
- **Display and feedback** · `Avatar`, `AvatarGroup`, `Badge`, `Banner`, `Card`, `CodeBlock`, `Progress`, `Skeleton`, `Spinner`, `Table`, `Toaster`
- **Conversation** · `AskUserQuestions`, `ChatLayout`, `ChatMessage`, `Citation`, `InputMessage`, `QueuedStack`, `ThinkingIndicator`, `ThinkingSteps`, `TriggerMenu`

Browse the [component catalog and roadmap](docs/components.md) and [usage examples](apps/web/app/public/examples.tsx) directly in the repository, or run the showcase and visit `/docs` for props, examples, and playgrounds.

Keyboard navigation, focus management, form behavior, reduced motion, server rendering, and hydration are part of the implementation and regression checks. See [verification](docs/development.md#verification) and the [known gap and deliberate differences](docs/scope.md#relationship-to-fluid-functionalism).

## Use and change Reflow

- Use the installed types and component docs for props and examples. For integrating Reflow into an app, see the [Reflow skill](skills/reflow/SKILL.md) and the [starter settings page](examples/starter/app/public/settings.tsx).
- Run `pnpm check` and `pnpm test` for library changes. [Development guide](docs/development.md) · [Scope](docs/scope.md) · [Components](docs/components.md)

[MIT license](LICENSE) · [Third-party notices](packages/reflow/NOTICE)
