import { on, type Handle, type RemixNode } from 'remix/component'
import { Button } from './button.tsx'
import type { HighlightedCode } from './code-block.tsx'
import { CopyChip } from './copy-chip.tsx'
import { Icon } from './icon.tsx'
import { RelativeTime } from './relative-time.tsx'
import { ScrollArea } from './scroll-area.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface CodeLineRange {
  start: number
  end: number
}

export interface CodeBlameLine {
  /** 1-based line number matching the rendered file. */
  line: number
  /** Short or full commit SHA. */
  sha: string
  /** Commit author name. */
  author: string
  /** Commit timestamp for relative display. */
  date: Date | string | number
  /** Optional commit subject shown on hover. */
  summary?: string
  /** Optional normalized recency weight in `[0, 1]` (`1` = most recent) for heat tinting. */
  heat?: number
}

export interface CodeBrowserProps {
  /** Plain source text or `highlight()` output from `@rtzll/reflow/highlight`. */
  code: string | HighlightedCode
  /** Repository file path (e.g. `packages/reflow/src/button.tsx`). */
  filename: string
  /** Optional branch, tag, or commit ref shown as a CopyChip in the header. */
  refName?: string
  /** Optional language label when `code` is plain text. */
  language?: string
  /** First line number. Default `1`. */
  startLine?: number
  /** Controlled selected line range (`#L42` or `#L42-L58`). */
  selectedRange?: CodeLineRange | null
  /** Uncontrolled initial selected range. */
  defaultSelectedRange?: CodeLineRange | null
  /** Called when the user selects or clears a line/range (Shift+Click extends). */
  onSelectRange?: (range: CodeLineRange | null) => void
  /** Optional git-blame annotations keyed by line number. */
  blame?: readonly CodeBlameLine[]
  /** Whether the blame gutter is shown initially when `blame` is provided. Default `false`. */
  defaultShowBlame?: boolean
  /** Wraps long lines instead of scrolling horizontally. Default `false`. */
  wrap?: boolean
  /** Extra trailing controls in the file header. */
  headerActions?: RemixNode
  /** Controls header and code row density. */
  size?: ControlSize
  class?: string
}

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

function normalizeCode(code: string | HighlightedCode): HighlightedCode {
  if (typeof code !== 'string') return code
  return {
    lang: 'text',
    code,
    flags: [],
    lines: code.split('\n').map((line) => ({ tokens: [{ content: line }] })),
  }
}

export function formatLineAnchor(range: CodeLineRange): string {
  const low = Math.min(range.start, range.end)
  const high = Math.max(range.start, range.end)
  return low === high ? `#L${low}` : `#L${low}-L${high}`
}

/**
 * Repository file viewer with Shiki-compatible syntax rendering, Shift+Click
 * line range selection (`#L42-L58`), copyable permalink anchor, and a
 * toggleable git-blame gutter with recency heat tinting.
 */
export function CodeBrowser(handle: Handle<CodeBrowserProps>) {
  let internalRange: CodeLineRange | null = handle.props.defaultSelectedRange ?? null
  let anchorLine: number | null = internalRange?.start ?? null
  let showBlame = Boolean(handle.props.defaultShowBlame)

  function currentRange(): CodeLineRange | null {
    return handle.props.selectedRange !== undefined ? handle.props.selectedRange : internalRange
  }

  function selectLine(lineNumber: number, shiftKey: boolean) {
    const active = currentRange()
    let next: CodeLineRange | null
    if (shiftKey && anchorLine !== null) {
      next = {
        start: Math.min(anchorLine, lineNumber),
        end: Math.max(anchorLine, lineNumber),
      }
    } else if (active && active.start === lineNumber && active.end === lineNumber) {
      anchorLine = null
      next = null
    } else {
      anchorLine = lineNumber
      next = { start: lineNumber, end: lineNumber }
    }
    if (handle.props.selectedRange === undefined) {
      internalRange = next
      void handle.update()
    }
    handle.props.onSelectRange?.(next)
  }

  function toggleBlame() {
    showBlame = !showBlame
    void handle.update()
  }

  return () => {
    const props = handle.props
    const highlighted = normalizeCode(props.code)
    const startLine = props.startLine ?? 1
    const range = currentRange()
    const hasBlame = Boolean(props.blame && props.blame.length > 0)
    const blameByLine = new Map<number, CodeBlameLine>()
    if (props.blame) {
      for (const entry of props.blame) blameByLine.set(entry.line, entry)
    }
    const lineCount = highlighted.lines.length
    const anchorText = range ? `${props.filename}${formatLineAnchor(range)}` : undefined

    return (
      <section
        class={classList('rf-code-browser', props.class)}
        data-size={props.size}
        data-blame={hasBlame && showBlame ? 'true' : undefined}
        data-wrap={props.wrap ? 'true' : undefined}
        aria-label={props.filename}
      >
        <header class="rf-code-browser-header">
          <div class="rf-code-browser-identity">
            <Icon name="file" size={14} class="rf-code-browser-file-icon" />
            <span class="rf-code-browser-filename">{props.filename}</span>
            {props.refName && <CopyChip value={props.refName} size="compact" />}
            <span class="rf-code-browser-meta">
              {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              {props.language
                ? ` · ${props.language}`
                : highlighted.lang !== 'text'
                  ? ` · ${highlighted.lang}`
                  : ''}
            </span>
          </div>

          <div class="rf-code-browser-actions">
            {anchorText && (
              <CopyChip
                value={anchorText}
                display={formatLineAnchor(range!)}
                label={`Copy link ${anchorText}`}
                size="compact"
              />
            )}
            {hasBlame && (
              <Button
                variant={showBlame ? 'primary' : 'secondary'}
                size="compact"
                aria-pressed={showBlame ? 'true' : 'false'}
                mix={on('click', toggleBlame)}
              >
                Blame
              </Button>
            )}
            {props.headerActions}
          </div>
        </header>

        <ScrollArea orientation={props.wrap ? 'vertical' : 'both'} class="rf-code-browser-scroll">
          <div class="rf-code-browser-body" style={styleObject(highlighted.style)}>
            {highlighted.lines.map((line, index) => {
              const lineNumber = startLine + index
              const selected =
                range !== null &&
                lineNumber >= Math.min(range.start, range.end) &&
                lineNumber <= Math.max(range.start, range.end)
              const blameEntry = hasBlame && showBlame ? blameByLine.get(lineNumber) : undefined
              const prevBlame = hasBlame && showBlame ? blameByLine.get(lineNumber - 1) : undefined
              const sameCommitAsPrev =
                blameEntry !== undefined &&
                prevBlame !== undefined &&
                prevBlame.sha === blameEntry.sha
              const heat = Math.max(0, Math.min(1, blameEntry?.heat ?? 0.25))

              return (
                <div
                  key={lineNumber}
                  class={classList('rf-code-browser-row', line.class)}
                  data-line={lineNumber}
                  data-selected={selected ? 'true' : undefined}
                >
                  {hasBlame && showBlame && (
                    <div
                      class="rf-code-browser-blame"
                      data-continued={sameCommitAsPrev ? 'true' : undefined}
                      style={{ '--rf-blame-heat': String(heat) }}
                      title={
                        blameEntry
                          ? `${blameEntry.sha.slice(0, 7)} · ${blameEntry.author}${blameEntry.summary ? `: ${blameEntry.summary}` : ''}`
                          : undefined
                      }
                    >
                      {blameEntry && !sameCommitAsPrev ? (
                        <>
                          <span class="rf-code-browser-sha">{blameEntry.sha.slice(0, 7)}</span>
                          <span class="rf-code-browser-author">{blameEntry.author}</span>
                          <RelativeTime
                            date={blameEntry.date}
                            live={false}
                            class="rf-code-browser-age"
                          />
                        </>
                      ) : (
                        <span class="rf-code-browser-blame-cont" aria-hidden="true" />
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    class="rf-code-browser-ln"
                    aria-pressed={selected ? 'true' : 'false'}
                    aria-label={`Select line ${lineNumber}`}
                    mix={on('click', (event) => selectLine(lineNumber, event.shiftKey))}
                  >
                    {lineNumber}
                  </button>

                  <code class="rf-code-browser-code">
                    {line.tokens.length === 0 ||
                    (line.tokens.length === 1 && line.tokens[0]?.content === '')
                      ? '\u200b'
                      : line.tokens.map((token, tokenIndex) => (
                          <span
                            key={tokenIndex}
                            class={token.class}
                            style={styleObject(token.style)}
                          >
                            {token.content}
                          </span>
                        ))}
                  </code>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </section>
    )
  }
}
