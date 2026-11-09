# Customize Reflow

Load `@rtzll/reflow/styles.css` first, then your application CSS. Reflow uses inherited CSS variables and data attributes; no theme provider or Tailwind setup is required.

## Appearance

Set attributes on the document's `<html>` element for app-wide defaults, or on a container for a local example:

```html
<html lang="en" data-theme="dark" data-density="compact" data-shape="rounded">
```

| Attribute | Values | Default |
| --- | --- | --- |
| `data-theme` | `system`, `light`, `dark` | System color scheme |
| `data-density` | `default`, `compact` | Default |
| `data-shape` | `rounded`, `pill`, `sharp` | Rounded |
| `data-hover` | `fluid`, `standard` | Fluid moving highlights |

An explicit component size overrides inherited density where supported. Keep application layout responsive independently of control density.

Set accent and font tokens in your stylesheet:

```css
:root {
  --rf-accent: #9061f9;
  --rf-font: system-ui, sans-serif;
  --rf-heading-font: var(--rf-font);
}

body {
  background: var(--rf-bg);
  color: var(--rf-fg);
  font-family: var(--rf-font);
}
```

The library declares an Inter-first font stack but does not bundle the showcase's font assets in the package. Supply your own fonts or use the system stack above. Accent affects accent treatments such as focus rings; it does not recolor every component. The [foundation stylesheet](../packages/reflow/src/foundations.css) defines surface, spacing, typography, radius, and motion tokens.

## Motion and application state

Components respond to `prefers-reduced-motion`. Reduced motion limits movement; it does not promise that all color and opacity transitions disappear. Keep that preference intact when overriding motion tokens.

The showcase's preference panel, cookies, and share links belong to the app. Library consumers own preference controls and persistence. Apply saved values in the server-rendered document and use the same initial values in the browser. The [starter settings page](../examples/starter/app/public/settings.tsx) demonstrates the controls; its [controller](../examples/starter/app/actions/controller.tsx) reads URL preferences.

See [integration](integration.md) for stylesheet and browser-runtime setup, and [coverage](coverage.md) for component-specific differences and remaining refinements.
