import { on, type Handle, type RemixNode } from 'remix/component'
import { Icon } from './icon.tsx'
import { ScrollArea } from './scroll-area.tsx'

/** One run of text in a highlighted line, with the inline style and classes the highlighter gave it. */
export interface CodeToken {
  content: string
  style?: string
  class?: string
}

/** A highlighted line: its tokens, and marks such as `highlighted`, `diff add`, `diff remove` or `focused`. */
export interface CodeLine {
  class?: string
  tokens: CodeToken[]
}

/**
 * Code ready to render, as `highlight()` from `@rtzll/reflow/highlight`
 * returns it. It is plain data, so a route handler can highlight on the
 * server and hand it to a client entry.
 */
export interface HighlightedCode {
  lang: string
  /** The code as shown, with any notation removed. Copy copies this. */
  code: string
  lines: CodeLine[]
  /** Marks for the whole block: `has-diff`, `has-highlighted`, `has-focused`. */
  flags: string[]
  /** The theme's inline style for the block, such as the colours of a light and dark pair. */
  style?: string
}

export interface CodeBlockProps {
  /** Plain code, or code from `highlight()`. */
  code: string | HighlightedCode
  /** Shown in the header when there is no filename. Defaults to the highlighted language. */
  language?: string
  filename?: string
  /** Names the code region. Defaults to the filename, or the language followed by "code". */
  label?: string
  /** Numbers the lines. Default false. */
  lineNumbers?: boolean
  /** The first line's number. Default 1. */
  startLine?: number
  /** Wraps long lines instead of scrolling them. Default false. */
  wrap?: boolean
  /** Folds longer code to this many lines behind a Show all button. */
  maxLines?: number
  /** Shows the copy button. Default true. */
  copyable?: boolean
  /** Called after the code is copied. */
  onCopy?: () => void
  size?: 'default' | 'compact'
  class?: string
}

type CopyState = 'idle' | 'copied' | 'error'

// Highlighters hand over inline styles as text, such as "color:var(--x)".
function styleObject(style: string | undefined) {
  if (!style) return undefined
  const result: Record<string, string> = {}
  for (const declaration of style.split(';')) {
    const colon = declaration.indexOf(':')
    if (colon < 1) continue
    result[declaration.slice(0, colon).trim()] = declaration.slice(colon + 1).trim()
  }
  return result
}

function plain(code: string): HighlightedCode {
  return {
    lang: 'text',
    code,
    flags: [],
    lines: code.split('\n').map((line) => ({ tokens: [{ content: line }] })),
  }
}

/**
 * Code in a frame with its filename or language, a copy button, and optional
 * line numbers, wrapping and folding. It renders plain code as it is, and
 * code from `highlight()` in `@rtzll/reflow/highlight` with its colours and
 * line marks: highlighted lines, added and removed lines, focused lines and
 * highlighted words. It has no dependencies of its own; highlighting runs
 * wherever you call `highlight()`, ideally on the server.
 */
export function CodeBlock(handle: Handle<CodeBlockProps>) {
  let expanded = false
  let state: CopyState = 'idle'
  // The glyph lags the state by one exit, as InputCopy's does.
  let glyph: CopyState = 'idle'
  let glyphKey = 0
  let phase: 'exit' | 'enter' | undefined
  let request = 0
  let reset: ReturnType<typeof setTimeout> | undefined
  let swapTimer: ReturnType<typeof setTimeout> | undefined
  handle.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(reset)
      clearTimeout(swapTimer)
    },
    { once: true },
  )

  function swap() {
    clearTimeout(swapTimer)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      glyph = state
      glyphKey++
      phase = undefined
      void handle.update()
      return
    }
    phase = 'exit'
    void handle.update()
    swapTimer = setTimeout(() => {
      glyph = state
      glyphKey++
      phase = 'enter'
      void handle.update()
    }, 115)
  }

  async function copy(text: string) {
    const operation = ++request
    clearTimeout(reset)
    let copied = false
    try {
      await navigator.clipboard.writeText(text)
      copied = true
    } catch {
      // The code stays selectable when clipboard access is unavailable.
    }
    if (handle.signal.aborted || operation !== request) return
    state = copied ? 'copied' : 'error'
    swap()
    reset = setTimeout(() => {
      state = 'idle'
      swap()
    }, 2000)
    if (copied) handle.props.onCopy?.()
  }

  return () => {
    const props = handle.props
    const source = typeof props.code === 'string' ? plain(props.code) : props.code
    const language = props.language ?? (source.lang === 'text' ? undefined : source.lang)
    const label = props.label ?? props.filename ?? (language ? `${language} code` : 'Code')
    const copyable = props.copyable ?? true
    const folds = props.maxLines !== undefined && source.lines.length > props.maxLines
    const collapsed = folds && !expanded
    const hasDiff = source.flags.includes('has-diff')
    const style: Record<string, string> = {}
    if (props.startLine !== undefined) style['--rf-code-start'] = String(props.startLine - 1)
    if (props.lineNumbers)
      style['--rf-code-digits'] = String(
        String((props.startLine ?? 1) + source.lines.length - 1).length,
      )
    if (folds) style['--rf-code-max-lines'] = String(props.maxLines)
    const feedback = state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : ''

    return (
      <figure
        class={props.class ? `rf-code-block ${props.class}` : 'rf-code-block'}
        data-slot="code-block"
        data-state={state}
        data-density={props.size}
        data-line-numbers={props.lineNumbers || undefined}
        data-wrap={props.wrap || undefined}
        data-collapsed={folds ? String(collapsed) : undefined}
        data-has-diff={hasDiff || undefined}
        data-has-highlighted={source.flags.includes('has-highlighted') || undefined}
        data-has-focused={source.flags.includes('has-focused') || undefined}
        data-themed={source.style ? '' : undefined}
        style={style}
      >
        {(props.filename || language || copyable) && (
          <figcaption class="rf-code-header">
            {props.filename ? (
              <span class="rf-code-filename">{props.filename}</span>
            ) : (
              language && <span class="rf-code-language">{language}</span>
            )}
            {copyable && (
              <button
                type="button"
                class="rf-code-copy"
                aria-label={feedback || 'Copy code'}
                mix={on('click', () => void copy(source.code))}
              >
                <span class="rf-copy-action" aria-hidden="true">
                  <span class="rf-copy-glyph" key={glyphKey} data-glyph={glyph} data-phase={phase}>
                    {glyph === 'idle' ? (
                      <Icon name="copy" size={14} />
                    ) : (
                      <svg viewBox="2 4 20 16" width="14" height="14" fill="none" data-result>
                        <path
                          d={glyph === 'copied' ? 'M6 12L10 16L18 8' : 'M9 9L15 15M15 9L9 15'}
                          pathLength="1"
                        />
                      </svg>
                    )}
                  </span>
                </span>
              </button>
            )}
            <span class="rf-basic-sr-only" aria-live="polite">
              {feedback}
            </span>
          </figcaption>
        )}
        <ScrollArea
          label={label}
          orientation="horizontal"
          tabIndex={0}
          className="rf-code-scroll"
          viewportClassName="rf-code-viewport"
          fade={false}
        >
          <pre class="rf-code" style={styleObject(source.style)}>
            <code>
              {source.lines.flatMap((line, index) => {
                const node: RemixNode = (
                  <span
                    key={index}
                    class={line.class ? `rf-code-line ${line.class}` : 'rf-code-line'}
                  >
                    {hasDiff && (
                      <span class="rf-code-mark" aria-hidden="true">
                        {/\badd\b/.test(line.class ?? '')
                          ? '+'
                          : /\bremove\b/.test(line.class ?? '')
                            ? '-'
                            : ' '}
                      </span>
                    )}
                    <span class="rf-code-text">
                      {line.tokens.map((token, tokenIndex) =>
                        token.style || token.class ? (
                          <span
                            key={tokenIndex}
                            style={styleObject(token.style)}
                            class={token.class}
                          >
                            {token.content}
                          </span>
                        ) : (
                          token.content
                        ),
                      )}
                    </span>
                  </span>
                )
                return index < source.lines.length - 1 ? [node, '\n'] : [node]
              })}
            </code>
          </pre>
        </ScrollArea>
        {folds && (
          <button
            type="button"
            class="rf-code-toggle"
            aria-expanded={!collapsed}
            mix={on('click', () => {
              expanded = !expanded
              void handle.update()
            })}
          >
            {collapsed ? `Show all ${source.lines.length} lines` : 'Show less'}
          </button>
        )}
      </figure>
    )
  }
}
