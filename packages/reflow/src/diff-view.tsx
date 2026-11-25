import type { Handle, RemixNode } from 'remix/component'
import type { CodeToken } from './code-block.tsx'
import { ScrollArea } from './scroll-area.tsx'
import { SegmentedControl } from './segmented-control.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type DiffLineType = 'context' | 'add' | 'remove'

export interface DiffLine {
  type: DiffLineType
  content: string
  oldLine?: number
  newLine?: number
  /** Optional syntax tokens, such as from `highlight()` in `@rtzll/reflow/highlight`. */
  tokens?: readonly CodeToken[]
}

export interface DiffHunk {
  /** Optional hunk heading, such as `@@ -12,6 +12,8 @@ function build()`. */
  header?: string
  lines: readonly DiffLine[]
}

export interface DiffViewProps {
  /** A standard unified diff string (`@@ -a,b +c,d @@` hunks). */
  diff?: string
  /** Structured diff hunks, used instead of `diff` when already parsed or highlighted. */
  hunks?: readonly DiffHunk[]
  /** File path shown in the header. Extracted from `+++ b/...` in `diff` when omitted. */
  filename?: string
  /** Names the diff region. Defaults to `filename` or `"Code diff"`. */
  label?: string
  /** Controlled layout: `"unified"` (default) or `"split"` (side-by-side). */
  view?: 'unified' | 'split'
  /** Initial layout when uncontrolled. Default `"unified"`. */
  defaultView?: 'unified' | 'split'
  onViewChange?: (view: 'unified' | 'split') => void
  /** Shows a Unified / Split switch in the header. Default `false`. */
  viewToggle?: boolean
  /** Shows old and new line number gutters. Default `true`. */
  lineNumbers?: boolean
  /** Wraps long lines instead of scrolling horizontally. Default `false`. */
  wrap?: boolean
  /** Trailing header controls, such as Revert or Open file. */
  actions?: RemixNode
  size?: ControlSize
  class?: string
}

interface ParsedDiff {
  filename?: string
  hunks: DiffHunk[]
}

interface SplitRow {
  left?: DiffLine
  right?: DiffLine
}

const hunkPattern = /^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@(.*)$/

/** Parse a unified diff string into structured hunks with old/new line numbers. */
export function parseUnifiedDiff(diff: string): ParsedDiff {
  const rawLines = diff.replace(/\r\n/g, '\n').split('\n')
  if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') rawLines.pop()

  let filename: string | undefined
  const hunks: DiffHunk[] = []
  let current: DiffHunk | undefined
  let oldLine = 1
  let newLine = 1

  for (const raw of rawLines) {
    if (!current && raw.startsWith('+++ ')) {
      const target = raw.slice(4).trim().replace(/^b\//, '')
      if (target && target !== '/dev/null') filename = target
      continue
    }
    if (
      !current &&
      (raw.startsWith('diff ') || raw.startsWith('index ') || raw.startsWith('--- '))
    ) {
      continue
    }
    const headerMatch = hunkPattern.exec(raw)
    if (headerMatch) {
      oldLine = Number(headerMatch[1])
      newLine = Number(headerMatch[2])
      current = { header: raw, lines: [] }
      hunks.push(current)
      continue
    }
    if (raw.startsWith('\\ No newline')) continue
    if (!current) {
      current = { lines: [] }
      hunks.push(current)
    }
    const lines = current.lines as DiffLine[]
    if (raw.startsWith('+')) {
      lines.push({ type: 'add', content: raw.slice(1), newLine: newLine++ })
    } else if (raw.startsWith('-')) {
      lines.push({ type: 'remove', content: raw.slice(1), oldLine: oldLine++ })
    } else {
      const content = raw.startsWith(' ') ? raw.slice(1) : raw
      lines.push({ type: 'context', content, oldLine: oldLine++, newLine: newLine++ })
    }
  }

  return { filename, hunks }
}

function pairSplitLines(lines: readonly DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (line.type === 'context') {
      rows.push({ left: line, right: line })
      index++
      continue
    }
    const removed: DiffLine[] = []
    const added: DiffLine[] = []
    while (index < lines.length && lines[index].type === 'remove') {
      removed.push(lines[index++])
    }
    while (index < lines.length && lines[index].type === 'add') {
      added.push(lines[index++])
    }
    const count = Math.max(removed.length, added.length)
    for (let i = 0; i < count; i++) {
      rows.push({ left: removed[i], right: added[i] })
    }
  }
  return rows
}

function splitPath(path: string) {
  const slash = path.lastIndexOf('/')
  if (slash < 0) return { folder: '', name: path }
  return { folder: path.slice(0, slash + 1), name: path.slice(slash + 1) }
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

function renderContent(line: DiffLine) {
  if (!line.tokens) return line.content || ' '
  if (line.tokens.length === 0) return ' '
  return line.tokens.map((token, index) => (
    <span key={index} class={token.class} style={styleObject(token.style)}>
      {token.content}
    </span>
  ))
}

function countLabel(count: number, verb: string) {
  return count === 0 ? `none ${verb}` : `${count} ${count === 1 ? 'line' : 'lines'} ${verb}`
}

const viewOptions = [
  { value: 'unified', label: 'Unified' },
  { value: 'split', label: 'Split' },
] as const

/**
 * Renders a unified or side-by-side code diff with dual line numbers,
 * accessible change counts, and optional syntax tokens. See docs/diff-view.md.
 */
export function DiffView(handle: Handle<DiffViewProps>) {
  let internalView: 'unified' | 'split' = handle.props.defaultView ?? 'unified'

  return () => {
    const {
      diff,
      hunks: providedHunks,
      filename: providedFilename,
      label,
      view: controlledView,
      onViewChange,
      viewToggle = false,
      lineNumbers = true,
      wrap = false,
      actions,
      size,
      class: classProp,
    } = handle.props

    const parsed = providedHunks
      ? undefined
      : diff !== undefined
        ? parseUnifiedDiff(diff)
        : undefined
    const hunks = providedHunks ?? parsed?.hunks ?? []
    const filename = providedFilename ?? parsed?.filename
    const view = controlledView ?? internalView

    let added = 0
    let removed = 0
    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'add') added++
        else if (line.type === 'remove') removed++
      }
    }

    const regionName = label ?? filename ?? 'Code diff'
    const parts = filename ? splitPath(filename) : undefined
    const hasHeader = Boolean(filename || added || removed || viewToggle || actions != null)

    return (
      <figure
        class={classList('rf-diff-view', classProp)}
        data-view={view}
        data-line-numbers={lineNumbers || undefined}
        data-wrap={wrap || undefined}
        data-density={size}
        role="region"
        aria-label={regionName}
      >
        {hasHeader && (
          <figcaption class="rf-diff-header">
            {parts && (
              <span class="rf-diff-path" title={filename}>
                {parts.folder && <span class="rf-diff-folder">{parts.folder}</span>}
                <span class="rf-diff-file">{parts.name}</span>
              </span>
            )}
            <span class="rf-diff-counts">
              <span aria-hidden="true">
                <span class="rf-diff-added">+{added}</span>{' '}
                <span class="rf-diff-removed">−{removed}</span>
              </span>
              <span class="rf-basic-sr-only">
                {countLabel(added, 'added')}, {countLabel(removed, 'removed')}
              </span>
            </span>
            {(viewToggle || actions != null) && (
              <div class="rf-diff-controls">
                {viewToggle && (
                  <SegmentedControl
                    label="Diff layout"
                    size="compact"
                    options={viewOptions}
                    value={view}
                    onValueChange={(next) => {
                      const mode = next === 'split' ? 'split' : 'unified'
                      if (controlledView === undefined) {
                        internalView = mode
                        void handle.update()
                      }
                      onViewChange?.(mode)
                    }}
                  />
                )}
                {actions}
              </div>
            )}
          </figcaption>
        )}

        <ScrollArea
          label={regionName}
          orientation={wrap ? 'vertical' : 'horizontal'}
          tabIndex={0}
          className="rf-diff-scroll"
          viewportClassName="rf-diff-viewport"
          fade={false}
        >
          <div class="rf-diff-body" role="code">
            {hunks.map((hunk, hunkIndex) => (
              <div key={hunkIndex} class="rf-diff-hunk">
                {hunk.header && <div class="rf-diff-hunk-header">{hunk.header}</div>}
                {view === 'unified'
                  ? hunk.lines.map((line, lineIndex) => (
                      <div key={lineIndex} class="rf-diff-line" data-type={line.type}>
                        {lineNumbers && (
                          <>
                            <span class="rf-diff-num" aria-hidden="true">
                              {line.oldLine ?? ''}
                            </span>
                            <span class="rf-diff-num" aria-hidden="true">
                              {line.newLine ?? ''}
                            </span>
                          </>
                        )}
                        <span class="rf-diff-sign" aria-hidden="true">
                          {line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' '}
                        </span>
                        {line.type !== 'context' && (
                          <span class="rf-basic-sr-only">
                            {line.type === 'add' ? 'Added: ' : 'Removed: '}
                          </span>
                        )}
                        <span class="rf-diff-code">{renderContent(line)}</span>
                      </div>
                    ))
                  : pairSplitLines(hunk.lines).map((row, rowIndex) => (
                      <div key={rowIndex} class="rf-diff-split-row">
                        <div
                          class="rf-diff-split-cell"
                          data-side="old"
                          data-type={row.left?.type ?? 'empty'}
                        >
                          {lineNumbers && (
                            <span class="rf-diff-num" aria-hidden="true">
                              {row.left?.oldLine ?? ''}
                            </span>
                          )}
                          <span class="rf-diff-sign" aria-hidden="true">
                            {row.left?.type === 'remove' ? '−' : ' '}
                          </span>
                          {row.left?.type === 'remove' && (
                            <span class="rf-basic-sr-only">Removed: </span>
                          )}
                          <span class="rf-diff-code">
                            {row.left ? renderContent(row.left) : ' '}
                          </span>
                        </div>
                        <div
                          class="rf-diff-split-cell"
                          data-side="new"
                          data-type={row.right?.type ?? 'empty'}
                        >
                          {lineNumbers && (
                            <span class="rf-diff-num" aria-hidden="true">
                              {row.right?.newLine ?? ''}
                            </span>
                          )}
                          <span class="rf-diff-sign" aria-hidden="true">
                            {row.right?.type === 'add' ? '+' : ' '}
                          </span>
                          {row.right?.type === 'add' && (
                            <span class="rf-basic-sr-only">Added: </span>
                          )}
                          <span class="rf-diff-code">
                            {row.right ? renderContent(row.right) : ' '}
                          </span>
                        </div>
                      </div>
                    ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </figure>
    )
  }
}
