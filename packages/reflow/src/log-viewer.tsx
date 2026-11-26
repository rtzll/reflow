import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { parseAnsiLine, stripAnsi } from './behaviors/ansi.ts'
import { parseFacetQuery, type FacetToken, type ParsedFacetQuery } from './behaviors/facet-query.ts'
import { Icon } from './icon.tsx'
import { Spinner } from './spinner.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'
export type LogStepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped'

export interface LogEntry {
  id?: string
  /** Raw text line; supports ANSI SGR color and style sequences. */
  text: string
  /** Severity level for visual emphasis and filtering. Default `'info'`. */
  level?: LogLevel
  /** Optional service/source tag chip (e.g. `'chromium'`, `'worker'`, `'pnpm'`). */
  source?: string
  /** Optional timestamp string (e.g. `'+00:14.2'` or `'09:05:12'`). */
  timestamp?: string
  /** Optional structured key-value attributes shown in an expandable inspector row. */
  fields?: Readonly<Record<string, string | number | boolean>>
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
  /** Controlled search query (supports free text, regex mode, and `key:value` facets). */
  query?: string
  /** Called when the search query changes. */
  onQueryChange?: (query: string) => void
  /** Shows a filter input with regex & case toggles in the toolbar. Default `true`. */
  searchable?: boolean
  /** Shows severity filter pills (All, Errors, Warnings) and error-jump controls. Default `true`. */
  filterable?: boolean
  /** Shows a compact log-volume & error-spike histogram bar above the stream. Defaults to `true` when multiple entries exist. */
  showHistogram?: boolean
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
  /** Maximum lines rendered per expanded group before showing a "Show more" control. Default `500`. */
  maxVisibleLines?: number
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
  source?: string
  timestamp?: string
  fields?: Readonly<Record<string, string | number | boolean>>
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

const LEVEL_ABBR: Record<LogLevel, string> = {
  error: 'ERR',
  warn: 'WRN',
  info: 'INF',
  debug: 'DBG',
}

function entryMatchesFacet(
  entry: NumberedEntry,
  facet: FacetToken,
  caseSensitive: boolean,
): boolean {
  const norm = (s: string) => (caseSensitive ? s : s.toLowerCase())
  const target = norm(facet.value)
  if (facet.key === 'level' || facet.key === 'status') {
    return norm(entry.level).includes(target)
  }
  if (facet.key === 'source' || facet.key === 'service') {
    return entry.source ? norm(entry.source).includes(target) : false
  }
  if (entry.fields) {
    for (const [k, v] of Object.entries(entry.fields)) {
      if (k.toLowerCase() === facet.key) {
        return norm(String(v)).includes(target)
      }
    }
  }
  return false
}

function entryMatchesQuery(
  entry: NumberedEntry,
  parsed: ParsedFacetQuery,
  caseSensitive: boolean,
): boolean {
  for (const facet of parsed.facets) {
    if (!entryMatchesFacet(entry, facet, caseSensitive)) return false
  }
  if (!parsed.freeText) return true
  if (parsed.regex) {
    parsed.regex.lastIndex = 0
    if (parsed.regex.test(entry.plain)) return true
    if (entry.source) {
      parsed.regex.lastIndex = 0
      if (parsed.regex.test(entry.source)) return true
    }
    if (entry.fields) {
      for (const [k, v] of Object.entries(entry.fields)) {
        parsed.regex.lastIndex = 0
        if (parsed.regex.test(`${k}=${String(v)}`)) return true
      }
    }
    return false
  }
  return false
}

function renderHighlightedText(text: string, regex: RegExp | null): RemixNode {
  if (!regex || !text) return text
  const parts: RemixNode[] = []
  regex.lastIndex = 0
  let lastIndex = 0
  let match: RegExpExecArray | null
  let guard = 0
  while ((match = regex.exec(text)) !== null && guard < 100) {
    guard += 1
    if (match[0].length === 0) {
      regex.lastIndex += 1
      continue
    }
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <mark key={`${match.index}-${guard}`} class="rf-log-match">
        {match[0]}
      </mark>,
    )
    lastIndex = match.index + match[0].length
  }
  if (parts.length === 0) return text
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
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
        source: entry.source,
        timestamp: entry.timestamp,
        fields: entry.fields,
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
 * Structured CI and runtime log explorer with collapsible step groups,
 * ANSI SGR colors, severity stripes & badges, inline match highlighting,
 * regex/case/facet (`key:value`) querying, log-volume histogram, expandable
 * structured attribute inspection, Shift+click line ranges, and follow-tail.
 */
export function LogViewer(handle: Handle<LogViewerProps>) {
  const seedGroups = normalizeGroups(handle.props)
  let internalExpanded = new Set<string>(initialExpanded(seedGroups))
  let userCollapsedAll = false
  let internalQuery = ''
  let regexMode = false
  let caseSensitive = false
  let levelFilter: 'all' | 'error' | 'warn' = 'all'
  let showTimestamps = handle.props.showTimestamps ?? true
  let wrapLines = handle.props.wrap ?? false
  let internalSelected: LogLineRange | null = null
  let expandedEntryKeys = new Set<string>()
  const groupLineLimits = new Map<string, number>()
  let selectionAnchor: number | null = null
  let focusedErrorIndex = -1
  let copyState: 'idle' | 'copied' | 'error' = 'idle'
  let copyTimer: ReturnType<typeof setTimeout> | undefined
  let pinnedToBottom = true
  let showJumpToLive = false
  let lastLineCount = 0
  let lastActiveGroupId: string | null | undefined = undefined
  let bodyNode: HTMLDivElement | undefined
  let searchInputNode: HTMLInputElement | undefined

  handle.signal.addEventListener('abort', () => clearTimeout(copyTimer), { once: true })

  function currentExpanded(groups: readonly NumberedGroup[]): Set<string> {
    if (handle.props.expandedGroups !== undefined) return new Set(handle.props.expandedGroups)
    const valid = new Set(groups.map((g) => g.id))
    const next = new Set([...internalExpanded].filter((id) => valid.has(id)))
    if (next.size === 0 && !userCollapsedAll && groups.length > 0) {
      for (const id of initialExpanded(groups)) next.add(id)
    }
    return next
  }

  function updateExpanded(next: Set<string>) {
    userCollapsedAll = next.size === 0
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

  const mountSearch = ref<HTMLInputElement>((node, signal) => {
    searchInputNode = node
    signal.addEventListener(
      'abort',
      () => {
        searchInputNode = undefined
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
      showHistogram,
      lineNumbers = true,
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
        userCollapsedAll = false
        if (props.expandedGroups === undefined) internalExpanded = next
        props.onExpandedGroupsChange?.([...next])
      }
      scrollToGroup(activeGroupId)
    }

    const queryValue = props.query !== undefined ? props.query : internalQuery
    const parsedQuery = parseFacetQuery(queryValue, regexMode, caseSensitive)
    const hasQuery = queryValue.trim().length > 0
    const hasAnyTimestamps = groups.some((g) => g.entries.some((e) => Boolean(e.timestamp)))
    const totalErrors = groups.reduce((sum, g) => sum + g.errorCount, 0)
    const totalWarnings = groups.reduce((sum, g) => sum + g.warnCount, 0)
    const allEntries = groups.flatMap((g) => g.entries)
    const allErrors = allEntries.filter((e) => e.level === 'error')
    const totalLines = allEntries.length
    const selected = currentSelected()

    const filteredGroups = groups
      .map((group) => {
        const entries = group.entries.filter((entry) => {
          if (levelFilter === 'error' && entry.level !== 'error') return false
          if (levelFilter === 'warn' && entry.level !== 'warn' && entry.level !== 'error') {
            return false
          }
          if (hasQuery && !entryMatchesQuery(entry, parsedQuery, caseSensitive)) return false
          return true
        })
        return { ...group, entries }
      })
      .filter((group) => {
        if (!hasQuery && levelFilter === 'all') return true
        return group.entries.length > 0
      })

    const matchedLineCount = filteredGroups.reduce((sum, g) => sum + g.entries.length, 0)

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

    function setQuery(next: string) {
      if (props.query === undefined) internalQuery = next
      props.onQueryChange?.(next)
      void handle.update()
    }

    function addFacetFilter(key: string, value: string) {
      const token = `${key}:${value}`
      const current = queryValue.trim()
      if (current.split(/\s+/).includes(token)) return
      setQuery(current ? `${current} ${token}` : token)
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

    async function copyText(payload: string) {
      clearTimeout(copyTimer)
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

    async function copyLogs() {
      const visible = filteredGroups.flatMap((g) => g.entries)
      const linesToCopy = selected
        ? visible.filter((e) => e.lineNumber >= selected.start && e.lineNumber <= selected.end)
        : visible
      await copyText(linesToCopy.map((e) => e.plain).join('\n'))
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

    function toggleEntryFields(key: string) {
      const next = new Set(expandedEntryKeys)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      expandedEntryKeys = next
      void handle.update()
    }

    const isGrouped = Boolean(props.groups?.length)
    const allOpen = isGrouped && groups.every((g) => expanded.has(g.id))
    const copyFeedback =
      copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : ''

    // Log-volume & error-spike histogram buckets (one bucket per group, or chunked lines).
    const renderHistogram = showHistogram ?? (groups.length > 1 || totalLines >= 6)
    const histogramBuckets = isGrouped
      ? groups.map((group) => ({
          id: group.id,
          label: group.title ?? group.id,
          total: group.entries.length,
          errors: group.errorCount,
          warns: group.warnCount,
          groupId: group.id,
          firstLine: group.entries[0]?.lineNumber ?? 1,
        }))
      : (() => {
          const count = Math.min(12, Math.max(1, totalLines))
          const step = Math.ceil(totalLines / count)
          const buckets = []
          for (let i = 0; i < totalLines; i += step) {
            const slice = allEntries.slice(i, i + step)
            buckets.push({
              id: `b-${i}`,
              label: `Lines ${slice[0]?.lineNumber}–${slice[slice.length - 1]?.lineNumber}`,
              total: slice.length,
              errors: slice.filter((e) => e.level === 'error').length,
              warns: slice.filter((e) => e.level === 'warn').length,
              groupId: slice[0]?.groupId ?? '__default__',
              firstLine: slice[0]?.lineNumber ?? 1,
            })
          }
          return buckets
        })()
    const maxBucketTotal = Math.max(1, ...histogramBuckets.map((b) => b.total))

    return (
      <section
        class={classList('rf-log-viewer', classProp)}
        aria-label={label ?? title ?? 'Log output'}
        data-status={status}
        data-density={size === 'compact' ? 'compact' : undefined}
        data-wrap={wrapLines || undefined}
        mix={on('keydown', (event) => {
          const target = event.target
          if (
            target instanceof HTMLElement &&
            (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
          ) {
            return
          }
          if (event.key === '/' && searchable && searchInputNode) {
            event.preventDefault()
            searchInputNode.focus()
          } else if (event.key === 'n') {
            event.preventDefault()
            jumpError(1)
          } else if (event.key === 'p') {
            event.preventDefault()
            jumpError(-1)
          } else if (event.key === 'w') {
            event.preventDefault()
            wrapLines = !wrapLines
            void handle.update()
          } else if (event.key === 't' && hasAnyTimestamps) {
            event.preventDefault()
            showTimestamps = !showTimestamps
            void handle.update()
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
            <span class="rf-log-match-summary">
              {hasQuery || levelFilter !== 'all'
                ? `${matchedLineCount} / ${totalLines} lines`
                : `${totalLines} lines`}
            </span>
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
                {focusedErrorIndex >= 0 && (
                  <span class="rf-log-error-counter">
                    {focusedErrorIndex + 1}/{allErrors.length}
                  </span>
                )}
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
              <div
                class="rf-log-search-group"
                data-invalid={parsedQuery.regexError ? 'true' : undefined}
              >
                <input
                  type="search"
                  class="rf-log-search"
                  aria-label="Filter log lines"
                  placeholder="Filter logs or key:value…"
                  value={queryValue}
                  mix={[
                    mountSearch,
                    on('input', (event) =>
                      setQuery((event.currentTarget as HTMLInputElement).value),
                    ),
                  ]}
                />
                <button
                  type="button"
                  class="rf-log-mode-btn"
                  aria-pressed={caseSensitive}
                  aria-label="Case sensitive search"
                  title="Match case"
                  mix={on('click', () => {
                    caseSensitive = !caseSensitive
                    void handle.update()
                  })}
                >
                  Aa
                </button>
                <button
                  type="button"
                  class="rf-log-mode-btn"
                  aria-pressed={regexMode}
                  aria-label="Regular expression search"
                  title="Use regular expression"
                  mix={on('click', () => {
                    regexMode = !regexMode
                    void handle.update()
                  })}
                >
                  .*
                </button>
              </div>
            )}

            {isGrouped && (
              <button
                type="button"
                class="rf-log-icon-btn"
                aria-label={allOpen ? 'Collapse all steps' : 'Expand all steps'}
                title={allOpen ? 'Collapse all steps' : 'Expand all steps'}
                mix={on('click', () => {
                  updateExpanded(allOpen ? new Set() : new Set(groups.map((g) => g.id)))
                })}
              >
                <Icon name="chevrons-up-down" size={13} />
              </button>
            )}

            <button
              type="button"
              class="rf-log-icon-btn"
              aria-pressed={wrapLines}
              aria-label="Toggle line wrap"
              title="Toggle line wrap (w)"
              mix={on('click', () => {
                wrapLines = !wrapLines
                void handle.update()
              })}
            >
              <Icon name="arrow-right" size={13} />
            </button>

            {hasAnyTimestamps && (
              <button
                type="button"
                class="rf-log-icon-btn"
                aria-pressed={showTimestamps}
                aria-label="Toggle timestamps"
                title="Toggle timestamps (t)"
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

        {parsedQuery.facets.length > 0 && (
          <div class="rf-log-active-facets" role="group" aria-label="Active log filters">
            {parsedQuery.facets.map((facet) => (
              <span key={`${facet.key}:${facet.value}`} class="rf-log-facet-chip">
                <span class="rf-log-facet-key">{facet.key}:</span>
                <span class="rf-log-facet-val">{facet.value}</span>
                <button
                  type="button"
                  class="rf-log-facet-remove"
                  aria-label={`Remove ${facet.key}:${facet.value} filter`}
                  mix={on('click', () => {
                    const target = `${facet.key}:${facet.value}`.toLowerCase()
                    const remaining = queryValue
                      .trim()
                      .split(/\s+/)
                      .filter((token) => token.toLowerCase() !== target)
                      .join(' ')
                    setQuery(remaining)
                  })}
                >
                  <Icon name="x" size={11} />
                </button>
              </span>
            ))}
            <button
              type="button"
              class="rf-log-facet-clear"
              mix={on('click', () => {
                levelFilter = 'all'
                setQuery('')
              })}
            >
              Clear filters
            </button>
          </div>
        )}

        {renderHistogram && histogramBuckets.length > 0 && (
          <div class="rf-log-histogram" role="group" aria-label="Log volume and severity density">
            {histogramBuckets.map((bucket) => {
              const heightPct = Math.max(20, Math.round((bucket.total / maxBucketTotal) * 100))
              const tone = bucket.errors > 0 ? 'error' : bucket.warns > 0 ? 'warn' : 'info'
              return (
                <button
                  key={bucket.id}
                  type="button"
                  class="rf-log-hist-bucket"
                  title={`${bucket.label} · ${bucket.total} lines${bucket.errors ? `, ${bucket.errors} errors` : ''}${bucket.warns ? `, ${bucket.warns} warnings` : ''}`}
                  aria-label={`Jump to ${bucket.label}`}
                  mix={on('click', () => {
                    if (!expanded.has(bucket.groupId)) {
                      const next = new Set(expanded)
                      next.add(bucket.groupId)
                      updateExpanded(next)
                    }
                    scrollToLine(bucket.firstLine)
                  })}
                >
                  <span
                    class="rf-log-hist-bar"
                    data-tone={tone}
                    style={{ blockSize: `${heightPct}%` }}
                  />
                </button>
              )
            })}
          </div>
        )}

        <div
          class="rf-log-body"
          style={maxHeight ? { maxBlockSize: maxHeight } : undefined}
          mix={mountBody}
        >
          {filteredGroups.length === 0 ? (
            <div class="rf-log-empty">
              {parsedQuery.regexError ? 'Invalid regular expression' : 'No matching log lines'}
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isOpen =
                !isGrouped || hasQuery || levelFilter !== 'all' || expanded.has(group.id)
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

                  {isOpen &&
                    (() => {
                      const baseLimit = Math.max(1, props.maxVisibleLines ?? 500)
                      const limit = groupLineLimits.get(group.id) ?? baseLimit
                      const hiddenCount = Math.max(0, group.entries.length - limit)
                      const visibleEntries =
                        hiddenCount > 0
                          ? follow
                            ? group.entries.slice(-limit)
                            : group.entries.slice(0, limit)
                          : group.entries
                      return (
                        <div class="rf-log-lines" role="log" aria-live={follow ? 'polite' : 'off'}>
                          {hiddenCount > 0 && follow && (
                            <div class="rf-log-load-more">
                              <button
                                type="button"
                                class="rf-log-load-btn"
                                mix={on('click', () => {
                                  groupLineLimits.set(group.id, limit + baseLimit)
                                  void handle.update()
                                })}
                              >
                                Show {Math.min(hiddenCount, baseLimit)} earlier lines ({hiddenCount}{' '}
                                hidden)
                              </button>
                              <button
                                type="button"
                                class="rf-log-load-btn"
                                mix={on('click', () => {
                                  groupLineLimits.set(group.id, group.entries.length)
                                  void handle.update()
                                })}
                              >
                                Show all
                              </button>
                            </div>
                          )}
                          {visibleEntries.map((entry) => {
                            const isSelected =
                              selected !== null &&
                              entry.lineNumber >= selected.start &&
                              entry.lineNumber <= selected.end
                            const hasFields =
                              entry.fields !== undefined && Object.keys(entry.fields).length > 0
                            const isEntryOpen = hasFields && expandedEntryKeys.has(entry.key)
                            const spans = parseAnsiLine(entry.raw)
                            return (
                              <div key={entry.key} class="rf-log-entry-wrap">
                                <div
                                  class="rf-log-line"
                                  data-log-line={entry.lineNumber}
                                  data-level={entry.level}
                                  data-selected={isSelected ? 'true' : undefined}
                                  data-expandable={hasFields ? 'true' : undefined}
                                  data-expanded={isEntryOpen ? 'true' : undefined}
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
                                  <span
                                    class="rf-log-level-tag"
                                    data-level={entry.level}
                                    aria-label={entry.level}
                                  >
                                    {LEVEL_ABBR[entry.level]}
                                  </span>
                                  {hasAnyTimestamps && showTimestamps && (
                                    <span class="rf-log-timestamp">{entry.timestamp ?? ''}</span>
                                  )}
                                  {entry.source && (
                                    <button
                                      type="button"
                                      class="rf-log-source-chip"
                                      title={`Filter source:${entry.source}`}
                                      mix={on('click', () =>
                                        addFacetFilter('source', entry.source!),
                                      )}
                                    >
                                      {entry.source}
                                    </button>
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
                                            {renderHighlightedText(span.text, parsedQuery.regex)}
                                          </span>
                                        ))}
                                  </span>
                                  {hasFields && (
                                    <button
                                      type="button"
                                      class="rf-log-fields-toggle"
                                      aria-expanded={isEntryOpen}
                                      aria-label={`Inspect structured fields for line ${entry.lineNumber}`}
                                      mix={on('click', () => toggleEntryFields(entry.key))}
                                    >
                                      <span>{Object.keys(entry.fields!).length} fields</span>
                                      <Icon name="chevron-right" size={11} />
                                    </button>
                                  )}
                                </div>

                                {isEntryOpen && entry.fields && (
                                  <div
                                    class="rf-log-fields-drawer"
                                    data-log-fields={entry.lineNumber}
                                  >
                                    <div class="rf-log-fields-head">
                                      <span>Structured attributes (click value to filter)</span>
                                      <button
                                        type="button"
                                        class="rf-log-fields-copy"
                                        mix={on(
                                          'click',
                                          () =>
                                            void copyText(
                                              JSON.stringify(
                                                {
                                                  line: entry.lineNumber,
                                                  level: entry.level,
                                                  source: entry.source,
                                                  timestamp: entry.timestamp,
                                                  message: entry.plain,
                                                  ...entry.fields,
                                                },
                                                null,
                                                2,
                                              ),
                                            ),
                                        )}
                                      >
                                        Copy JSON
                                      </button>
                                    </div>
                                    <dl class="rf-log-fields-grid">
                                      {Object.entries(entry.fields).map(
                                        ([fieldKey, fieldValue]) => (
                                          <div key={fieldKey} class="rf-log-field-row">
                                            <dt>{fieldKey}</dt>
                                            <dd>
                                              <button
                                                type="button"
                                                class="rf-log-field-chip"
                                                mix={on('click', () =>
                                                  addFacetFilter(fieldKey, String(fieldValue)),
                                                )}
                                              >
                                                {String(fieldValue)}
                                              </button>
                                            </dd>
                                          </div>
                                        ),
                                      )}
                                    </dl>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          {hiddenCount > 0 && !follow && (
                            <div class="rf-log-load-more">
                              <button
                                type="button"
                                class="rf-log-load-btn"
                                mix={on('click', () => {
                                  groupLineLimits.set(group.id, limit + baseLimit)
                                  void handle.update()
                                })}
                              >
                                Show {Math.min(hiddenCount, baseLimit)} more lines ({hiddenCount}{' '}
                                hidden)
                              </button>
                              <button
                                type="button"
                                class="rf-log-load-btn"
                                mix={on('click', () => {
                                  groupLineLimits.set(group.id, group.entries.length)
                                  void handle.update()
                                })}
                              >
                                Show all
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })()}
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
