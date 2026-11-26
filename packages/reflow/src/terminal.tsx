import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { Icon } from './icon.tsx'
import { Spinner } from './spinner.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type TerminalStatus = 'idle' | 'running' | 'passed' | 'failed'

export interface AnsiSpan {
  text: string
  color?: string
  bold?: boolean
  dim?: boolean
  italic?: boolean
  underline?: boolean
}

export interface TerminalProps {
  /** Raw terminal output string or array of lines; supports ANSI SGR color/style codes. */
  output: string | readonly string[]
  /** Command displayed in the header (e.g. `pnpm test:e2e`). */
  command?: string
  /** Optional header title when `command` is omitted. */
  title?: string
  /** Execution status shown in the header. */
  status?: TerminalStatus
  /** Optional process exit code shown beside the status indicator. */
  exitCode?: number
  /** Numbers each rendered line in a quiet gutter. Default `false`. */
  lineNumbers?: boolean
  /** Wraps long lines instead of scrolling horizontally. Default `false`. */
  wrap?: boolean
  /** Shows a compact filter input in the header to narrow matching output lines. */
  searchable?: boolean
  /** Automatically scrolls to the newest line as output grows unless the user scrolls up. */
  follow?: boolean
  /** Caps the scrollable output height (e.g. `'320px'`). */
  maxHeight?: string
  /** Shows a copy button that copies ANSI-stripped plain text. Default `true`. */
  copyable?: boolean
  /** Called after the output text is copied. */
  onCopy?: () => void
  /** Called if copying fails. */
  onCopyError?: () => void
  /** Trailing controls rendered in the header. */
  actions?: RemixNode
  /** Controls text scale and header spacing. */
  size?: ControlSize
  /** Accessible name for the terminal figure. */
  label?: string
  class?: string
}

type CopyState = 'idle' | 'copied' | 'error'

const ANSI_COLORS: Record<number, string> = {
  30: 'black',
  31: 'red',
  32: 'green',
  33: 'yellow',
  34: 'blue',
  35: 'magenta',
  36: 'cyan',
  37: 'white',
  90: 'bright-black',
  91: 'red',
  92: 'green',
  93: 'yellow',
  94: 'blue',
  95: 'magenta',
  96: 'cyan',
  97: 'white',
}

// Matches ANSI CSI sequences (including SGR color codes) and OSC sequences.
// oxlint-disable-next-line no-control-regex
const ANSI_PATTERN = /\x1b(?:\[([0-9;]*)([A-Za-z])|\][^\x07\x1b]*(?:\x07|\x1b\\))/g

/** Removes ANSI escape codes so copied output or search queries match plain text. */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, '')
}

/** Parses one terminal line's ANSI SGR escape sequences into styled spans. */
export function parseAnsiLine(line: string): AnsiSpan[] {
  const spans: AnsiSpan[] = []
  let color: string | undefined
  let bold = false
  let dim = false
  let italic = false
  let underline = false
  let lastIndex = 0

  ANSI_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = ANSI_PATTERN.exec(line)) !== null) {
    if (match.index > lastIndex) {
      spans.push({
        text: line.slice(lastIndex, match.index),
        ...(color ? { color } : {}),
        ...(bold ? { bold } : {}),
        ...(dim ? { dim } : {}),
        ...(italic ? { italic } : {}),
        ...(underline ? { underline } : {}),
      })
    }
    lastIndex = match.index + match[0].length
    const params = match[1]
    const finalByte = match[2]
    if (finalByte !== 'm') continue
    const codes = params ? params.split(';').map((n) => (n === '' ? 0 : Number(n))) : [0]
    for (const code of codes) {
      if (code === 0) {
        color = undefined
        bold = false
        dim = false
        italic = false
        underline = false
      } else if (code === 1) {
        bold = true
      } else if (code === 2) {
        dim = true
      } else if (code === 3) {
        italic = true
      } else if (code === 4) {
        underline = true
      } else if (code === 22) {
        bold = false
        dim = false
      } else if (code === 23) {
        italic = false
      } else if (code === 24) {
        underline = false
      } else if (code === 39) {
        color = undefined
      } else if (code in ANSI_COLORS) {
        color = ANSI_COLORS[code]
      }
    }
  }

  if (lastIndex < line.length) {
    spans.push({
      text: line.slice(lastIndex),
      ...(color ? { color } : {}),
      ...(bold ? { bold } : {}),
      ...(dim ? { dim } : {}),
      ...(italic ? { italic } : {}),
      ...(underline ? { underline } : {}),
    })
  }
  return spans.length > 0 ? spans : [{ text: '' }]
}

function normalizeLines(output: string | readonly string[]): string[] {
  if (typeof output !== 'string') return [...output]
  if (output === '') return []
  return output.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n')
}

const statusLabels: Record<Exclude<TerminalStatus, 'idle'>, string> = {
  running: 'Running',
  passed: 'Passed',
  failed: 'Failed',
}

/**
 * Monospace command and CI log viewer in CodeBlock's quiet frame, with zero-dep
 * ANSI color parsing, line filtering, follow-tail scrolling, and plain-text copy.
 * See docs/terminal.md.
 */
export function Terminal(handle: Handle<TerminalProps>) {
  let query = ''
  let pinned = true
  let scroller: HTMLElement | undefined
  let lastLineCount = 0

  let copyState: CopyState = 'idle'
  let copyGlyph: CopyState = 'idle'
  let copyGlyphKey = 0
  let copyPhase: 'exit' | 'enter' | undefined
  let copyRequest = 0
  let copyReset: ReturnType<typeof setTimeout> | undefined
  let copySwapTimer: ReturnType<typeof setTimeout> | undefined

  handle.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(copyReset)
      clearTimeout(copySwapTimer)
    },
    { once: true },
  )

  function swapCopyGlyph() {
    clearTimeout(copySwapTimer)
    if (
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      copyGlyph = copyState
      copyGlyphKey++
      copyPhase = undefined
      void handle.update()
      return
    }
    copyPhase = 'exit'
    void handle.update()
    copySwapTimer = setTimeout(() => {
      copyGlyph = copyState
      copyGlyphKey++
      copyPhase = 'enter'
      void handle.update()
    }, 115)
  }

  async function copyOutput(text: string) {
    const operation = ++copyRequest
    clearTimeout(copyReset)
    let copied = false
    try {
      await navigator.clipboard.writeText(text)
      copied = true
    } catch {
      // Clipboard unavailable.
    }
    if (handle.signal.aborted || operation !== copyRequest) return
    copyState = copied ? 'copied' : 'error'
    swapCopyGlyph()
    copyReset = setTimeout(() => {
      copyState = 'idle'
      swapCopyGlyph()
    }, 2000)
    if (copied) handle.props.onCopy?.()
    else handle.props.onCopyError?.()
  }

  const mountScroller = ref<HTMLElement>((node, signal) => {
    scroller = node
    const onScroll = () => {
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight
      const nextPinned = distance <= 24
      if (nextPinned !== pinned) {
        pinned = nextPinned
        void handle.update()
      }
    }
    node.addEventListener('scroll', onScroll, { passive: true, signal })
    signal.addEventListener(
      'abort',
      () => {
        scroller = undefined
      },
      { once: true },
    )
  })

  return () => {
    const props = handle.props
    const {
      output,
      command,
      title,
      status = 'idle',
      exitCode,
      lineNumbers = false,
      wrap = false,
      searchable = false,
      follow = false,
      maxHeight,
      copyable = true,
      actions,
      size,
      label,
      class: classProp,
    } = props

    const rawLines = normalizeLines(output)
    const needle = query.trim().toLowerCase()
    const visibleLines = rawLines
      .map((raw, index) => ({ number: index + 1, raw, plain: stripAnsi(raw) }))
      .filter((entry) => !needle || entry.plain.toLowerCase().includes(needle))

    if (follow && pinned && scroller && rawLines.length !== lastLineCount) {
      const target = scroller
      handle.queueTask(() => {
        target.scrollTop = target.scrollHeight
      })
    }
    lastLineCount = rawLines.length

    const plainText = rawLines.map(stripAnsi).join('\n')
    const showHeader = Boolean(
      command ||
      title ||
      status !== 'idle' ||
      exitCode !== undefined ||
      searchable ||
      actions ||
      copyable,
    )
    const copyFeedback =
      copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : ''
    const digits = String(Math.max(1, rawLines.length)).length

    return (
      <figure
        class={classList('rf-terminal', classProp)}
        aria-label={label ?? command ?? title ?? 'Terminal output'}
        data-status={status}
        data-state={copyState}
        data-density={size === 'compact' ? 'compact' : undefined}
        data-wrap={wrap || undefined}
        data-line-numbers={lineNumbers || undefined}
        style={
          {
            '--rf-term-digits': String(digits),
            ...(maxHeight ? { '--rf-term-max-height': maxHeight } : {}),
          } as Record<string, string>
        }
      >
        {showHeader && (
          <figcaption class="rf-terminal-header">
            <div class="rf-terminal-heading">
              {status !== 'idle' && (
                <span class="rf-terminal-status" data-status={status}>
                  {status === 'running' ? (
                    <Spinner size="12px" />
                  ) : (
                    <Icon name={status === 'passed' ? 'check' : 'x'} size={12} />
                  )}
                  <span class="rf-terminal-status-label">
                    {statusLabels[status]}
                    {exitCode !== undefined && status !== 'running' ? ` (${exitCode})` : ''}
                  </span>
                </span>
              )}
              {command ? (
                <code class="rf-terminal-command" title={command}>
                  <span class="rf-terminal-prompt" aria-hidden="true">
                    $
                  </span>{' '}
                  {command}
                </code>
              ) : (
                title && <span class="rf-terminal-title">{title}</span>
              )}
            </div>
            <div class="rf-terminal-controls">
              {searchable && (
                <div class="rf-terminal-search">
                  <Icon name="search" size={13} />
                  <input
                    type="search"
                    class="rf-terminal-search-input"
                    aria-label="Filter terminal output"
                    placeholder="Filter output…"
                    value={query}
                    mix={on('input', (event) => {
                      query = (event.currentTarget as HTMLInputElement).value
                      void handle.update()
                    })}
                  />
                  {needle && (
                    <span class="rf-terminal-match-count" aria-live="polite">
                      {visibleLines.length}/{rawLines.length}
                    </span>
                  )}
                </div>
              )}
              {actions}
              {copyable && (
                <>
                  <button
                    type="button"
                    class="rf-terminal-copy"
                    aria-label={copyFeedback || 'Copy output'}
                    mix={on('click', () => void copyOutput(plainText))}
                  >
                    <span class="rf-copy-action" aria-hidden="true">
                      <span
                        class="rf-copy-glyph"
                        key={copyGlyphKey}
                        data-glyph={copyGlyph}
                        data-phase={copyPhase}
                      >
                        {copyGlyph === 'idle' ? (
                          <Icon name="copy" size={14} />
                        ) : (
                          <svg viewBox="2 4 20 16" width="14" height="14" fill="none" data-result>
                            <path
                              d={
                                copyGlyph === 'copied' ? 'M6 12L10 16L18 8' : 'M9 9L15 15M15 9L9 15'
                              }
                              pathLength="1"
                            />
                          </svg>
                        )}
                      </span>
                    </span>
                  </button>
                  <span class="rf-basic-sr-only" aria-live="polite">
                    {copyFeedback}
                  </span>
                </>
              )}
            </div>
          </figcaption>
        )}
        <div class="rf-terminal-body">
          <div
            class="rf-terminal-scroll"
            tabIndex={0}
            role="log"
            aria-label={label ?? command ?? title ?? 'Terminal output'}
            aria-live={status === 'running' ? 'polite' : 'off'}
            mix={mountScroller}
          >
            {visibleLines.length > 0 ? (
              <pre class="rf-terminal-pre">
                <code>
                  {visibleLines.map((line) => (
                    <span key={line.number} class="rf-terminal-line" data-line={line.number}>
                      {lineNumbers && (
                        <span class="rf-terminal-gutter" aria-hidden="true">
                          {line.number}
                        </span>
                      )}
                      <span class="rf-terminal-text">
                        {parseAnsiLine(line.raw).map((span, spanIndex) =>
                          span.color || span.bold || span.dim || span.italic || span.underline ? (
                            <span
                              key={spanIndex}
                              class="rf-term-span"
                              data-color={span.color}
                              data-bold={span.bold ? '' : undefined}
                              data-dim={span.dim ? '' : undefined}
                              data-italic={span.italic ? '' : undefined}
                              data-underline={span.underline ? '' : undefined}
                            >
                              {span.text}
                            </span>
                          ) : (
                            span.text
                          ),
                        )}
                      </span>
                    </span>
                  ))}
                </code>
              </pre>
            ) : (
              <p class="rf-terminal-empty">
                {needle ? `No lines matching “${query.trim()}”.` : 'No output.'}
              </p>
            )}
          </div>
          {follow && !pinned && (
            <button
              type="button"
              class="rf-terminal-follow"
              mix={on('click', () => {
                pinned = true
                if (scroller) scroller.scrollTop = scroller.scrollHeight
                void handle.update()
              })}
            >
              Follow output
            </button>
          )}
        </div>
      </figure>
    )
  }
}
