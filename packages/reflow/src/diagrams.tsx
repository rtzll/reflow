import { on, ref, unsafeHTML, type Handle, type RemixNode } from 'remix/component'
import type * as PeleLazy from 'pele/lazy'
import type { DiagramType, MermaidType, Mounted, RenderResult, ZoomOptions } from 'pele'
import { Icon } from './icon.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type { DiagramType, MermaidType, RenderResult, ZoomOptions }

export interface DiagramProps {
  /** Mermaid diagram source (flowchart, sequence, state, ER, class, etc.). */
  code: string
  /** Pre-rendered SVG markup from `prerenderDiagram()` in `@rtzll/reflow/diagrams/ssr`. */
  prerenderedSVG?: string
  /** Optional title displayed in the header bar. */
  title?: string
  /** Accessible name for the diagram figure. Defaults to `title` or `'Mermaid diagram'`. */
  label?: string
  /** Enables Pele pan and zoom controls on the client. Default `false`. */
  zoom?: boolean | 'auto' | ZoomOptions
  /** Shows a button in the header to copy the Mermaid source. Default `false`. */
  copyable?: boolean
  /** Shows a toggle in the header to inspect the raw Mermaid source. Default `false`. */
  showSourceToggle?: boolean
  /** Scales the rendered SVG to fit its container width. Default `true`. */
  responsive?: boolean
  /** Lets Pele switch horizontal flowcharts to vertical on narrow viewports. Default `true`. */
  autoDirection?: boolean
  /** Controls padding density. */
  size?: ControlSize
  /** Trailing controls rendered in the header. */
  actions?: RemixNode
  /** Called after Pele finishes rendering on the client. */
  onRender?: (result: RenderResult) => void
  /** Called if Pele cannot parse or render the diagram. */
  onError?: (error: unknown) => void
  /** Additional class name on the outer figure. */
  class?: string
}

type PeleLazyModule = typeof PeleLazy

let peleLazyPromise: Promise<PeleLazyModule> | undefined

function loadPeleLazy(): Promise<PeleLazyModule> {
  peleLazyPromise ??= import('pele/lazy')
  return peleLazyPromise
}

/**
 * Mermaid diagram component powered by Pele, outputting themeable SVG styled
 * through Reflow's `--rf-*` design tokens. Supports zero-flash SSR via
 * `prerenderDiagram()` in `@rtzll/reflow/diagrams/ssr` and lazy client loading
 * via `pele/lazy`.
 *
 * Import from `@rtzll/reflow/diagrams` (requires optional peer `pele`).
 */
export function Diagram(handle: Handle<DiagramProps>) {
  const initialCode = handle.props.code
  const initialPrerendered = handle.props.prerenderedSVG
  let canvas: HTMLDivElement | undefined
  let mounted: Mounted | undefined
  let mountSeq = 0
  let ready = Boolean(initialPrerendered)
  let diagramType: DiagramType | undefined
  let errorMessage: string | undefined
  let showingSource = false
  let copyState: 'idle' | 'copied' | 'error' = 'idle'
  let copyTimer: number | undefined

  function clearCopyTimer() {
    if (copyTimer !== undefined) {
      window.clearTimeout(copyTimer)
      copyTimer = undefined
    }
  }

  async function copySource() {
    clearCopyTimer()
    try {
      await navigator.clipboard.writeText(handle.props.code)
      copyState = 'copied'
    } catch {
      copyState = 'error'
    }
    void handle.update()
    copyTimer = window.setTimeout(() => {
      copyState = 'idle'
      void handle.update()
    }, 1800)
  }

  async function renderClient(target: HTMLDivElement) {
    const props = handle.props
    const seq = ++mountSeq
    const canKeepPrerendered =
      Boolean(props.prerenderedSVG) &&
      props.code === initialCode &&
      !props.zoom &&
      !mounted &&
      target.querySelector('svg') !== null

    if (canKeepPrerendered) {
      if (!ready) {
        ready = true
        void handle.update()
      }
      return
    }

    try {
      const pele = await loadPeleLazy()
      if (seq !== mountSeq || canvas !== target) return

      const options = {
        responsive: props.responsive ?? true,
        autoDirection: props.autoDirection ?? true,
        zoom: props.zoom ?? false,
        onRender(result: RenderResult) {
          if (seq !== mountSeq) return
          diagramType = result.type
          errorMessage = undefined
          ready = true
          props.onRender?.(result)
          void handle.update()
        },
        onError(error: unknown) {
          if (seq !== mountSeq) return
          errorMessage = error instanceof Error ? error.message : String(error)
          ready = true
          props.onError?.(error)
          void handle.update()
        },
      }

      if (mounted) {
        mounted.update(props.code, options)
        return
      }

      target.innerHTML = ''
      mounted = await pele.mountAsync(target, props.code, options)
      if (seq !== mountSeq) {
        mounted.destroy()
        mounted = undefined
        return
      }
      if (mounted.result) {
        diagramType = mounted.result.type
        errorMessage = undefined
        ready = true
        void handle.update()
      } else if (mounted.error) {
        errorMessage =
          mounted.error instanceof Error ? mounted.error.message : String(mounted.error)
        ready = true
        void handle.update()
      }
    } catch (error) {
      if (seq !== mountSeq) return
      errorMessage = error instanceof Error ? error.message : String(error)
      ready = true
      props.onError?.(error)
      void handle.update()
    }
  }

  const mountCanvas = ref<HTMLDivElement>((node, signal) => {
    canvas = node
    signal.addEventListener(
      'abort',
      () => {
        mountSeq += 1
        clearCopyTimer()
        mounted?.destroy()
        mounted = undefined
        canvas = undefined
      },
      { once: true },
    )
    void renderClient(node)
  })

  return () => {
    const props = handle.props
    const {
      code,
      prerenderedSVG,
      title,
      label,
      copyable = false,
      showSourceToggle = false,
      size,
      actions,
      class: classProp,
    } = props

    const showHeader = Boolean(title || copyable || showSourceToggle || actions)
    const isServer = typeof window === 'undefined'
    const isReady = ready || Boolean(prerenderedSVG)
    const copyFeedback =
      copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : ''

    if (!isServer && canvas && !showingSource) {
      const target = canvas
      handle.queueTask(() => {
        if (canvas === target && !showingSource) void renderClient(target)
      })
    }

    return (
      <figure
        class={classList('rf-diagram', classProp)}
        aria-label={label ?? title ?? 'Mermaid diagram'}
        data-density={size === 'compact' ? 'compact' : undefined}
        data-diagram-type={diagramType}
        data-rf-diagram-ready={isReady ? '' : undefined}
      >
        {showHeader && (
          <figcaption class="rf-diagram-header">
            {title && <span class="rf-diagram-title">{title}</span>}
            {!title && diagramType && <span class="rf-diagram-type">{diagramType}</span>}
            {(showSourceToggle || copyable || actions) && (
              <div class="rf-diagram-controls">
                {actions}
                {showSourceToggle && (
                  <button
                    type="button"
                    class="rf-diagram-action"
                    aria-pressed={showingSource}
                    mix={on('click', () => {
                      showingSource = !showingSource
                      if (showingSource) {
                        mounted?.destroy()
                        mounted = undefined
                      }
                      void handle.update()
                    })}
                  >
                    <Icon name="file" size={14} />
                    <span>{showingSource ? 'Diagram' : 'Source'}</span>
                  </button>
                )}
                {copyable && (
                  <>
                    <button
                      type="button"
                      class="rf-diagram-action"
                      aria-label={copyFeedback || 'Copy Mermaid source'}
                      mix={on('click', () => void copySource())}
                    >
                      <Icon name={copyState === 'copied' ? 'check' : 'copy'} size={14} />
                    </button>
                    <span class="rf-basic-sr-only" aria-live="polite">
                      {copyFeedback}
                    </span>
                  </>
                )}
              </div>
            )}
          </figcaption>
        )}
        {showingSource ? (
          <pre class="rf-diagram-source">
            <code>{code}</code>
          </pre>
        ) : (
          <div class="rf-diagram-stage">
            {errorMessage ? (
              <div class="rf-diagram-error" role="alert">
                <span>Could not render Mermaid diagram: {errorMessage}</span>
                <pre>
                  <code>{code}</code>
                </pre>
              </div>
            ) : (
              <div
                class="rf-diagram-canvas"
                mix={mountCanvas}
                innerHTML={
                  prerenderedSVG && code === initialCode ? unsafeHTML(prerenderedSVG) : undefined
                }
              />
            )}
          </div>
        )}
      </figure>
    )
  }
}
