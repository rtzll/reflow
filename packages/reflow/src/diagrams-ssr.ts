import { render } from 'pele'
import type { DiagramType, MermaidType, RenderOptions, RenderResult } from 'pele'

export type { DiagramType, MermaidType, RenderOptions, RenderResult }

export interface PrerenderDiagramOptions extends RenderOptions {}

export interface PrerenderedDiagram {
  /** Themeable SVG markup to pass to `<Diagram prerenderedSVG={...} />`. */
  svg: string
  width: number
  height: number
  type: DiagramType
  mermaidType: MermaidType
}

/**
 * Synchronously pre-renders a Mermaid diagram into themeable SVG using Pele.
 * Pass the returned `svg` straight to `<Diagram prerenderedSVG={...} />` for
 * zero-flash SSR with live CSS-variable theming and zero client JS needed
 * until the diagram source changes.
 *
 * Import from `@rtzll/reflow/diagrams/ssr` (server / build time or eager render).
 */
export function prerenderDiagram(
  code: string,
  options: PrerenderDiagramOptions = {},
): PrerenderedDiagram {
  const result = render(code, {
    responsive: true,
    autoDirection: true,
    ...options,
  })
  return {
    svg: result.svg,
    width: result.width,
    height: result.height,
    type: result.type,
    mermaidType: result.mermaidType,
  }
}
