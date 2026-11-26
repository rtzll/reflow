# Diagram

Architecture reviews and engineering discussions often pair prose with Mermaid flowcharts or sequence diagrams. `Diagram` renders Mermaid definitions to SVG via [`pele`](https://pele.run) behind an optional peer entry point (`@rtzll/reflow/diagrams`, `@rtzll/reflow/diagrams/ssr`, and `@rtzll/reflow/diagrams.css`). Because Pele emits CSS custom property hooks (`--pele-*`), Reflow maps its live `--rf-*` theme, accent, surface, border, and font tokens directly onto the SVG so diagrams adapt immediately when themes or accents change with zero JavaScript re-render.

## API

```tsx
import { Diagram } from '@rtzll/reflow/diagrams'

<Diagram
  title="Zero-flash SSR pipeline"
  code={`flowchart LR
  Build[Build step] --> SSR[prerenderDiagram]
  SSR --> Paint[First paint · 0ms flash]`}
  copyable
  showSourceToggle
  size="compact"
/>
```

- `code` accepts Mermaid diagram source (`flowchart`, `sequenceDiagram`, etc.) and renders via `pele/lazy` in the browser.
- `prerenderedSVG` accepts pre-rendered SVG output from `prerenderDiagram()` in `@rtzll/reflow/diagrams/ssr` for zero-flash SSR and Cloudflare Worker deployments.
- `title`, `copyable`, `showSourceToggle`, `onCopy`, and `onCopyError` mirror `CodeBlock`'s quiet header frame and clipboard controls.
- `Markdown` integrates cleanly via `renderCodeBlock`: intercept `language === 'mermaid'` fences and return `<Diagram code={code} prerenderedSVG={cache[code]} />`.

## Isolation & Styling

`pele` is an optional peer isolated to `@rtzll/reflow/diagrams` and `@rtzll/reflow/diagrams/ssr`. Import `@rtzll/reflow/diagrams.css` (or `@rtzll/reflow/styles.css`) for the framed canvas and token bridge inside `@layer reflow`.

## Verification

Server tests verify deterministic SVG output (`diagrams-ssr.test.server.tsx`), browser tests verify lazy client rendering, source toggling, and `Markdown` Mermaid fence integration (`diagram.test.browser.tsx`), and E2E tests verify live diagrams in `/apps/review`.
