import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { Icon } from './icon.tsx'
import { Spinner } from './spinner.tsx'
import { classList, type ControlSize } from './systems/styling.ts'
import { parseAnsiLine, stripAnsi } from './terminal.tsx'

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'
export type LogStepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped'

export interface LogEntry {
  id?: string
  /** Raw text line; supports ANSI SGR color and style sequences. */
  text: string
  /** Severity level for visual emphasis and filtering. Default `'info'`. */
  level?: LogLevel
  /** Optional timestamp string (e.g. `'+00:14.2'` or `'09:05:12'`). */
  timestamp?: string
  /** Optional explicit 1-based line number; numbered sequentially when omitted. */
  line?: number
}

export interface LogGroup {
  id: string
  title: string
  status?: LogStepStatus
  duration?: string
  defaultOpen?: boolean
  entries: readonly LogEntry[]
}

export interface LogLineRange {
  start: number
  end: number
}

export interface LogViewerProps {
  /** Structured collapsible log groups (CI steps). */
  groups?: readonly LogGroup[]
  /** Flat log entries when step grouping is not needed. */
  entries?: readonly LogEntry[]
  /** Optional header title (such as the job name). */
  title?: string
  /** Overall execution status shown in the header. */
  status?: LogStepStatus
  /** Optional total duration displayed in the header. */
  duration?: string
  /** Controlled expanded group IDs. */
  expandedGroups?: readonly string[]
  /** Called when the set of expanded group IDs changes. */
  onExpandedGroupsChange?: (ids: string[]) => void
  /** Active group ID to expand and scroll into view. */
  activeGroupId?: string | null
  /** Controlled search query. */
  query?: string
  /** Called when the search query changes. */
  onQueryChange?: (query: string) => void
  /** Shows a filter input in the toolbar. Default `true`. */
  searchable?: boolean
  /** Shows severity filter pills (All, Errors, Warnings) and error-jump controls. Default `true`. */
  filterable?: boolean
  /** Shows timestamps when entries include them. Default `true`. */
  showTimestamps?: boolean
  /** Shows clickable line numbers with Shift+click range selection. Default `true`. */
  lineNumbers?: boolean
  /** Wraps long lines instead of horizontal scrolling. Default `false`. */
  wrap?: boolean
  /** Auto-scrolls to newest output unless the user scrolls up. */
  follow?: boolean
  /** Controlled selected line range (`start..end`). */
  selectedLines?: LogLineRange | null
  /** Called when the user selects or clears a line range. */
  onSelectedLinesChange?: (range: LogLineRange | null) => void
  /** Caps the scrollable log viewport height (e.g. `'420px'`). */
  maxHeight?: string
  /** Shows a copy button that copies ANSI-stripped visible or selected lines. Default `true`. */
  copyable?: boolean
  /** Called after log text is copied. */
  onCopy?: () => void
  /** Called if copying fails. */
  onCopyError?: () => void
  /** Trailing controls rendered in the header. */
  actions?: RemixNode
  /** Controls text scale and spacing density. */
  size?: ControlSize
  /** Accessible name for the log viewer region. */
  label?: string
  class?: string
}

interface NumberedEntry {
  key: string
  groupId: string
  lineNumber: number
  level: LogLevel
  timestamp?: string
  raw: string
  plain: string
}

interface NumberedGroup {
  id: string
  title?: string
  status?: LogStepStatus
  duration?: string
  defaultOpen?: boolean
  entries: NumberedEntry[]
  errorCount: number
  warnCount: number
}

function normalizeGroups(props: LogViewerProps): NumberedGroup[] {
  const sourceGroups: readonly {
    id: string
    title?: string
    status?: LogStepStatus
    duration?: string
    defaultOpen?: boolean
    entries: readonly LogEntry[]
  }[] = props.groups?.length
    ? props.groups
    : props.entries?.length
      ? [{ id: '__default__', entries: props.entries, defaultOpen: true }]
      : []

  let nextLine = 1
  return sourceGroups.map((group) => {
    let errorCount = 0
    let warnCount = 0
    const entries: NumberedEntry[] = group.entries.map((entry, idx) => {
      const lineNumber = entry.line ?? nextLine
      nextLine = Math.max(nextLine + 1, lineNumber + 1)
      const level = entry.level ?? 'info'
      if (level === 'error') errorCount += 1
      else if (level === 'warn') warnCount += 1
      return {
        key: entry.id ?? `${group.id}-${lineNumber}-${idx}`,
        groupId: group.id,
        lineNumber,
        level,
        timestamp: entry.timestamp,
        raw: entry.text,
        plain: stripAnsi(entry.text),
      }
    })
    return {
      id: group.id,
      title: group.title,
      status: group.status,
      duration: group.duration,
      defaultOpen: group.defaultOpen,
      entries,
      errorCount,
      warnCount,
    }
  })
}

function initialExpanded(groups: readonly NumberedGroup[]): string[] {
  const explicit = groups.filter(
    (g) => g.defaultOpen || g.status === 'failed' || g.status === 'running' || g.errorCount > 0,
  )
  if (explicit.length > 0) return explicit.map((g) => g.id)
  return groups[0] ? [groups[0].id] : []
}

function statusIcon(status?: LogStepStatus) {
  if (status === 'running') return <Spinner size="12px" label="Running" />
  if (status === 'passed') return <Icon name="check" size={12} />
  if (status === 'failed') return <Icon name="x" size={12} />
  return <Icon name="circle" size={10} />
}

/**
 * Structured CI and runtime log viewer with collapsible step groups, ANSI SGR
 * color rendering, toggleable timestamps, severity filtering, error jumping,
 * line-range selection, and follow-tail scrolling.
 */
export function LogViewer(handle: Handle<LogViewerProps>) {
  const seedGroups = normalizeGroups(handle.props)
  let internalExpanded = new Set<string>(initialExpanded(seedGroups))
  let internalQuery = ''
  let levelFilter: 'all' | 'error' | 'warn' = 'all'
  let showTimestamps = handle.props.showTimestamps ?? true
  let internalSelected: LogLineRange | null = null
  let selectionAnchor: number | null = null
  let focusedErrorIndex = -1
  let copyState: 'idle' | 'copied' | 'error' = 'idle'
  let copyTimer: ReturnType<typeof setTimeout> | undefined
  let pinnedToBottom = true
  let showJumpToLive = false
  let lastLineCount = 0
  let lastActiveGroupId: string | null | undefined = undefined
  let bodyNode: HTMLDivElement | undefined

  handle.signal.addEventListener('abort', () => clearTimeout(copyTimer), { once: true })

  function currentExpanded(groups: readonly NumberedGroup[]): Set<string> {
    if (handle.props.expandedGroups !== undefined) return new Set(handle.props.expandedGroups)
    // Auto-open newly failing or running groups unless user explicitly interacted.
    const valid = new Set(groups.map((g) => g.id))
    const next = new Set([...internalExpanded].filter((id) => valid.has(id)))
    if (next.size === 0 && groups.length > 0) {
      for (const id of initialExpanded(groups)) next.add(id)
    }
    return next
  }

  function updateExpanded(next: Set<string>) {
    const ids = [...next]
    if (handle.props.expandedGroups === undefined) internalExpanded = next
    handle.props.onExpandedGroupsChange?.(ids)
    void handle.update()
  }

  function currentSelected(): LogLineRange | null {
    return handle.props.selectedLines !== undefined ? handle.props.selectedLines : internalSelected
  }

  function setSelected(range: LogLineRange | null) {
    if (handle.props.selectedLines === undefined) internalSelected = range
    handle.props.onSelectedLinesChange?.(range)
    void handle.update()
  }

  function scrollToLine(lineNumber: number) {
    handle.queueTask(() => {
      const row = bodyNode?.querySelector<HTMLElement>(`[data-log-line="${lineNumber}"]`)
      row?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }

  function scrollToGroup(groupId: string) {
    handle.queueTask(() => {
      const node = bodyNode?.querySelector<HTMLElement>(`[data-log-group="${CSS.escape(groupId)}"]`)
      node?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
  }

  const mountBody = ref<HTMLDivElement>((node, signal) => {
    bodyNode = node
    const onScroll = () => {
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight
      pinnedToBottom = distance <= 24
      const nextJump = Boolean(handle.props.follow) && !pinnedToBottom
      if (nextJump !== showJumpToLive) {
        showJumpToLive = nextJump
        void handle.update()
      }
    }
    node.addEventListener('scroll', onScroll, { passive: true, signal })
    signal.addEventListener(
      'abort',
      () => {
        bodyNode = undefined
      },
      { once: true },
    )
  })

  return () => {
    const props = handle.props
    const {
      title,
      status,
      duration,
      activeGroupId,
      searchable = true,
      filterable = true,
      lineNumbers = true,
      wrap = false,
      follow = false,
      maxHeight,
      copyable = true,
      actions,
      size,
      label,
      class: classProp,
    } = props

    const groups = normalizeGroups(props)
    const expanded = currentExpanded(groups)

    if (activeGroupId && activeGroupId !== lastActiveGroupId) {
      lastActiveGroupId = activeGroupId
      if (!expanded.has(activeGroupId)) {
        const next = new Set(expanded)
        next.add(activeGroupId)
        if (props.expandedGroups === undefined) internalExpanded = next
        props.onExpandedGroupsChange?.([...next])
      }
      scrollToGroup(activeGroupId)
    }

    const queryValue = props.query !== undefined ? props.query : internalQuery
    const needle = queryValue.trim().toLowerCase()
    const hasAnyTimestamps = groups.some((g) => g.entries.some((e) => Boolean(e.timestamp)))
    const totalErrors = groups.reduce((sum, g) => sum + g.errorCount, 0)
    const totalWarnings = groups.reduce((sum, g) => sum + g.warnCount, 0)
    const allErrors = groups.flatMap((g) => g.entries.filter((e) => e.level === 'error'))
    const totalLines = groups.reduce((sum, g) => sum + g.entries.length, 0)
    const selected = currentSelected()

    const filteredGroups = groups
      .map((group) => {
        const entries = group.entries.filter((entry) => {
          if (levelFilter === 'error' && entry.level !== 'error') return false
          if (levelFilter === 'warn' && entry.level !== 'warn' && entry.level !== 'error') {
            return false
          }
          if (needle && !entry.plain.toLowerCase().includes(needle)) return false
          return true
        })
        return { ...group, entries }
      })
      .filter((group) => {
        if (!needle && levelFilter === 'all') return true
        return group.entries.length > 0
      })

    if (follow && totalLines !== lastLineCount) {
      lastLineCount = totalLines
      if (pinnedToBottom && bodyNode) {
        const target = bodyNode
        handle.queueTask(() => {
          target.scrollTop = target.scrollHeight
        })
      }
    } else {
      lastLineCount = totalLines
    }

    function jumpError(delta: 1 | -1) {
      if (allErrors.length === 0) return
      focusedErrorIndex =
        focusedErrorIndex < 0
          ? delta > 0
            ? 0
            : allErrors.length - 1
          : (focusedErrorIndex + delta + allErrors.length) % allErrors.length
      const target = allErrors[focusedErrorIndex]!
      if (!expanded.has(target.groupId)) {
        const next = new Set(expanded)
        next.add(target.groupId)
        updateExpanded(next)
      }
      setSelected({ start: target.lineNumber, end: target.lineNumber })
      scrollToLine(target.lineNumber)
    }

    async function copyLogs() {
      clearTimeout(copyTimer)
      const visible = filteredGroups.flatMap((g) => g.entries)
      const linesToCopy = selected
        ? visible.filter((e) => e.lineNumber >= selected.start && e.lineNumber <= selected.end)
        : visible
      const payload = linesToCopy.map((e) => e.plain).join('\n')
      try {
        await navigator.clipboard.writeText(payload)
        copyState = 'copied'
        props.onCopy?.()
      } catch {
        copyState = 'error'
        props.onCopyError?.()
      }
      void handle.update()
      copyTimer = setTimeout(() => {
        copyState = 'idle'
        void handle.update()
      }, 1800)
    }

    function handleLineClick(lineNumber: number, shiftKey: boolean) {
      if (shiftKey && selectionAnchor !== null) {
        setSelected({
          start: Math.min(selectionAnchor, lineNumber),
          end: Math.max(selectionAnchor, lineNumber),
        })
      } else if (selected && selected.start === lineNumber && selected.end === lineNumber) {
        selectionAnchor = null
        setSelected(null)
      } else {
        selectionAnchor = lineNumber
        setSelected({ start: lineNumber, end: lineNumber })
      }
    }

    const isGrouped = Boolean(props.groups?.length)
    const copyFeedback =
      copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : ''

    return (
      <section
        class={classList('rf-log-viewer', classProp)}
        aria-label={label ?? title ?? 'Log output'}
        data-status={status}
        data-density={size === 'compact' ? 'compact' : undefined}
        data-wrap={wrap || undefined}
        mix={on('keydown', (event) => {
          const target = event.target
          if (
            target instanceof HTMLElement &&
            (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
          ) {
            return
          }
          if (event.key === 'n') {
            event.preventDefault()
            jumpError(1)
          } else if (event.key === 'p') {
            event.preventDefault()
            jumpError(-1)
          }
        })}
      >
        <header class="rf-log-header">
          <div class="rf-log-heading">
            {status && (
              <span class="rf-log-status-dot" data-status={status} aria-hidden="true">
                {statusIcon(status)}
              </span>
            )}
            {title && <span class="rf-log-title">{title}</span>}
            {duration && <span class="rf-log-duration">{duration}</span>}
            {selected && (
              <span class="rf-log-selection-pill">
                {selected.start === selected.end
                  ? `L${selected.start}`
                  : `L${selected.start}–L${selected.end}`}
                <button
                  type="button"
                  class="rf-log-selection-clear"
                  aria-label="Clear line selection"
                  mix={on('click', () => {
                    selectionAnchor = null
                    setSelected(null)
                  })}
                >
                  <Icon name="x" size={11} />
                </button>
              </span>
            )}
          </div>

          <div class="rf-log-toolbar">
            {filterable && (
              <div class="rf-log-filters" role="group" aria-label="Filter by severity">
                <button
                  type="button"
                  class="rf-log-pill"
                  aria-pressed={levelFilter === 'all'}
                  mix={on('click', () => {
                    levelFilter = 'all'
                    void handle.update()
                  })}
                >
                  All
                </button>
                <button
                  type="button"
                  class="rf-log-pill"
                  data-level="error"
                  aria-pressed={levelFilter === 'error'}
                  mix={on('click', () => {
                    levelFilter = levelFilter === 'error' ? 'all' : 'error'
                    void handle.update()
                  })}
                >
                  Errors <span class="rf-log-pill-count">{totalErrors}</span>
                </button>
                <button
                  type="button"
                  class="rf-log-pill"
                  data-level="warn"
                  aria-pressed={levelFilter === 'warn'}
                  mix={on('click', () => {
                    levelFilter = levelFilter === 'warn' ? 'all' : 'warn'
                    void handle.update()
                  })}
                >
                  Warnings <span class="rf-log-pill-count">{totalWarnings}</span>
                </button>
              </div>
            )}

            {filterable && allErrors.length > 0 && (
              <div class="rf-log-jump-errors" role="group" aria-label="Jump between errors">
                <button
                  type="button"
                  class="rf-log-icon-btn"
                  aria-label="Previous error"
                  title="Previous error (p)"
                  mix={on('click', () => jumpError(-1))}
                >
                  <Icon name="chevron-down" size={13} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button
                  type="button"
                  class="rf-log-icon-btn"
                  aria-label="Next error"
                  title="Next error (n)"
                  mix={on('click', () => jumpError(1))}
                >
                  <Icon name="chevron-down" size={13} />
                </button>
              </div>
            )}

            {searchable && (
              <input
                type="search"
                class="rf-log-search"
                aria-label="Filter log lines"
                placeholder="Filter logs…"
                value={queryValue}
                mix={on('input', (event) => {
                  const next = (event.currentTarget as HTMLInputElement).value
                  if (props.query === undefined) internalQuery = next
                  props.onQueryChange?.(next)
                  void handle.update()
                })}
              />
            )}

            {hasAnyTimestamps && (
              <button
                type="button"
                class="rf-log-icon-btn"
                aria-pressed={showTimestamps}
                aria-label="Toggle timestamps"
                title="Toggle timestamps"
                mix={on('click', () => {
                  showTimestamps = !showTimestamps
                  void handle.update()
                })}
              >
                <Icon name="clock" size={13} />
              </button>
            )}

            {actions}

            {copyable && (
              <>
                <button
                  type="button"
                  class="rf-log-icon-btn"
                  aria-label={copyFeedback || (selected ? 'Copy selected lines' : 'Copy logs')}
                  title={selected ? 'Copy selected lines' : 'Copy logs'}
                  mix={on('click', () => void copyLogs())}
                >
                  <Icon name={copyState === 'copied' ? 'check' : 'copy'} size={13} />
                </button>
                <span class="rf-basic-sr-only" aria-live="polite">
                  {copyFeedback}
                </span>
              </>
            )}
          </div>
        </header>

        <div
          class="rf-log-body"
          style={maxHeight ? { maxBlockSize: maxHeight } : undefined}
          mix={mountBody}
        >
          {filteredGroups.length === 0 ? (
            <div class="rf-log-empty">No matching log lines</div>
          ) : (
            filteredGroups.map((group) => {
              const isOpen =
                !isGrouped || Boolean(needle) || levelFilter !== 'all' || expanded.has(group.id)
              return (
                <div
                  key={group.id}
                  class="rf-log-group"
                  data-log-group={group.id}
                  data-open={isOpen ? 'true' : 'false'}
                  data-status={group.status}
                >
                  {isGrouped && (
                    <button
                      type="button"
                      class="rf-log-group-header"
                      aria-expanded={isOpen}
                      mix={on('click', () => {
                        const next = new Set(expanded)
                        if (next.has(group.id)) next.delete(group.id)
                        else next.add(group.id)
                        updateExpanded(next)
                      })}
                    >
                      <span class="rf-log-group-chevron" aria-hidden="true">
                        <Icon name="chevron-right" size={12} />
                      </span>
                      {group.status && (
                        <span
                          class="rf-log-status-dot"
                          data-status={group.status}
                          aria-hidden="true"
                        >
                          {statusIcon(group.status)}
                        </span>
                      )}
                      <span class="rf-log-group-title">{group.title}</span>
                      {group.errorCount > 0 && (
                        <span class="rf-log-group-badge" data-level="error">
                          {group.errorCount} {group.errorCount === 1 ? 'error' : 'errors'}
                        </span>
                      )}
                      {group.warnCount > 0 && (
                        <span class="rf-log-group-badge" data-level="warn">
                          {group.warnCount} {group.warnCount === 1 ? 'warning' : 'warnings'}
                        </span>
                      )}
                      {group.duration && (
                        <span class="rf-log-group-duration">{group.duration}</span>
                      )}
                    </button>
                  )}

                  {isOpen && (
                    <div class="rf-log-lines" role="log" aria-live={follow ? 'polite' : 'off'}>
                      {group.entries.map((entry) => {
                        const isSelected =
                          selected !== null &&
                          entry.lineNumber >= selected.start &&
                          entry.lineNumber <= selected.end
                        const spans = parseAnsiLine(entry.raw)
                        return (
                          <div
                            key={entry.key}
                            class="rf-log-line"
                            data-log-line={entry.lineNumber}
                            data-level={entry.level}
                            data-selected={isSelected ? 'true' : undefined}
                          >
                            {lineNumbers && (
                              <button
                                type="button"
                                class="rf-log-gutter"
                                aria-label={`Line ${entry.lineNumber}`}
                                aria-pressed={isSelected}
                                mix={on('click', (event) =>
                                  handleLineClick(entry.lineNumber, event.shiftKey),
                                )}
                              >
                                {entry.lineNumber}
                              </button>
                            )}
                            {hasAnyTimestamps && showTimestamps && (
                              <span class="rf-log-timestamp">{entry.timestamp ?? ''}</span>
                            )}
                            <span class="rf-log-text">
                              {spans.length === 0
                                ? '\u200b'
                                : spans.map((span, idx) => (
                                    <span
                                      key={idx}
                                      class={classList(
                                        span.color ? `rf-term-ansi-${span.color}` : undefined,
                                        span.bold ? 'rf-term-bold' : undefined,
                                        span.dim ? 'rf-term-dim' : undefined,
                                        span.italic ? 'rf-term-italic' : undefined,
                                        span.underline ? 'rf-term-underline' : undefined,
                                      )}
                                    >
                                      {span.text}
                                    </span>
                                  ))}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {showJumpToLive && (
          <button
            type="button"
            class="rf-log-jump-live"
            mix={on('click', () => {
              pinnedToBottom = true
              showJumpToLive = false
              if (bodyNode) bodyNode.scrollTop = bodyNode.scrollHeight
              void handle.update()
            })}
          >
            <Icon name="chevron-down" size={12} />
            <span>Jump to live</span>
          </button>
        )}
      </section>
    )
  }
}
