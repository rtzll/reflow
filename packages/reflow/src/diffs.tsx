import { ref, unsafeHTML, type Handle, type RemixNode } from 'remix/component'
import type * as PierreDiffs from '@pierre/diffs'
import type {
  DiffIndicators,
  DiffLineAnnotation,
  FileContents,
  FileDiff as PierreFileDiff,
  FileDiffMetadata,
  FileDiffOptions,
  HunkSeparators,
  LineDiffTypes,
  SelectedLineRange,
  ThemeTypes,
} from '@pierre/diffs'
import { SegmentedControl } from './segmented-control.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type DiffFile = FileContents
export type {
  DiffIndicators,
  DiffLineAnnotation,
  FileDiffMetadata,
  HunkSeparators,
  LineDiffTypes,
  SelectedLineRange,
}

export interface DiffViewProps {
  /** Unified diff string (e.g. `git diff` output). */
  diff?: string
  /** Previous version of the file when computing a diff from full file contents. */
  oldFile?: DiffFile | null
  /** Next version of the file when computing a diff from full file contents. */
  newFile?: DiffFile | null
  /** Pre-parsed `@pierre/diffs` metadata. */
  fileDiff?: FileDiffMetadata
  /** Pre-rendered Shadow DOM HTML from `@pierre/diffs/ssr` for zero-flash SSR hydration. */
  prerenderedHTML?: string
  /** File path shown in the header; overrides the path extracted from the diff or file inputs. */
  filename?: string
  /** Explicit language override for syntax highlighting; defaults to filename inference. */
  lang?: string
  /** Controlled layout view. */
  view?: 'unified' | 'split'
  /** Initial layout view when uncontrolled. Default `'unified'`. */
  defaultView?: 'unified' | 'split'
  /** Called when the user switches between `'unified'` and `'split'`. */
  onViewChange?: (view: 'unified' | 'split') => void
  /** Shows a Unified / Split segmented toggle in the header. */
  viewToggle?: boolean
  /** Shows line numbers in the gutter. Default `true`. */
  lineNumbers?: boolean
  /** Wraps long code lines instead of scrolling horizontally. */
  wrap?: boolean
  /** Change indicator style in the gutter. Default `'classic'`. */
  indicators?: DiffIndicators
  /** Intraline diff granularity. Default `'word-alt'`. */
  lineDiffType?: LineDiffTypes
  /** Separator style between hunks. Default `'line-info'`. */
  hunkSeparators?: Exclude<HunkSeparators, 'custom'>
  /** Expands unchanged context regions when full file contents are provided. */
  expandUnchanged?: boolean
  /** Enables interactive clicking/dragging to select line ranges. */
  enableLineSelection?: boolean
  /** Controlled selected line range. */
  selectedLines?: SelectedLineRange | null
  /** Called when the user selects or clears a line range. */
  onLineSelected?: (range: SelectedLineRange | null) => void
  /** Inline annotations attached to specific diff lines. */
  lineAnnotations?: DiffLineAnnotation<unknown>[]
  /** Renders the DOM element for an inline line annotation. */
  renderAnnotation?: (
    annotation: DiffLineAnnotation<unknown>,
    fileDiff: FileDiffMetadata,
  ) => HTMLElement | undefined
  /** Syntax theme name or `{ light, dark }` pair. Defaults to Reflow's CSS-variable theme. */
  theme?: string | { light: string; dark: string }
  /** Color scheme mode inside the diff surface. Default `'system'` (inherits Reflow theme). */
  themeType?: ThemeTypes
  /** Extra CSS injected inside the `@pierre/diffs` Shadow DOM. */
  unsafeCSS?: string
  /** Controls text scale and header spacing. */
  size?: ControlSize
  /** Trailing controls rendered in the header (e.g. Copy patch). */
  actions?: RemixNode
  /** Accessible name for the diff figure. Defaults to `filename` or `'Code diff'`. */
  label?: string
  class?: string
}

type PierreModule = typeof PierreDiffs

let pierrePromise: Promise<PierreModule> | undefined
let reflowThemeRegistered = false

function loadPierre(): Promise<PierreModule> {
  pierrePromise ??= import('@pierre/diffs')
  return pierrePromise
}

function ensureReflowTheme(pierre: PierreModule) {
  if (reflowThemeRegistered) return
  reflowThemeRegistered = true
  pierre.registerCustomCSSVariableTheme(
    'reflow',
    {
      foreground: 'var(--rf-fg)',
      background: 'var(--rf-surface-2)',
      'token-keyword': 'var(--rf-diff-token-keyword)',
      'token-string': 'var(--rf-diff-token-string)',
      'token-string-expression': 'var(--rf-diff-token-string)',
      'token-function': 'var(--rf-diff-token-function)',
      'token-constant': 'var(--rf-diff-token-constant)',
      'token-parameter': 'var(--rf-diff-token-parameter)',
      'token-comment': 'var(--rf-diff-token-comment)',
      'token-punctuation': 'var(--rf-diff-token-punctuation)',
      'token-link': 'var(--rf-diff-token-link)',
      'token-inserted': 'var(--rf-diff-token-inserted)',
      'token-deleted': 'var(--rf-diff-token-deleted)',
    },
    true,
  )
}

function cleanDiffPath(raw: string) {
  return raw
    .trim()
    .replace(/\t.*$/, '')
    .replace(/^[ab]\//, '')
}

function splitPath(path: string) {
  const slash = path.lastIndexOf('/')
  return slash < 0
    ? { folder: '', name: path }
    : { folder: path.slice(0, slash + 1), name: path.slice(slash + 1) }
}

function summarizePatch(patch: string) {
  let filename: string | undefined
  let added = 0
  let removed = 0
  let inHunk = false
  for (const raw of patch.replace(/\r\n?/g, '\n').split('\n')) {
    if (raw.startsWith('--- ')) {
      const candidate = cleanDiffPath(raw.slice(4))
      if (candidate !== '/dev/null' && !filename) filename = candidate
      inHunk = false
      continue
    }
    if (raw.startsWith('+++ ')) {
      const candidate = cleanDiffPath(raw.slice(4))
      if (candidate !== '/dev/null') filename = candidate
      inHunk = false
      continue
    }
    if (raw.startsWith('@@ ')) {
      inHunk = true
      continue
    }
    if (!inHunk) continue
    if (raw.startsWith('+')) added++
    else if (raw.startsWith('-')) removed++
  }
  return { filename, added, removed }
}

function summarizeMetadata(meta: FileDiffMetadata) {
  let added = 0
  let removed = 0
  for (const hunk of meta.hunks) {
    added += hunk.additionLines
    removed += hunk.deletionLines
  }
  return { filename: meta.name || meta.prevName || undefined, added, removed }
}

interface FallbackBlock {
  kind: 'hunk' | 'code'
  text: string
}

function fallbackBlocks(props: DiffViewProps): FallbackBlock[] {
  if (props.diff) {
    const blocks: FallbackBlock[] = []
    let code: string[] = []
    const flush = () => {
      if (!code.length) return
      blocks.push({ kind: 'code', text: code.join('\n') })
      code = []
    }
    for (const line of props.diff.replace(/\r\n?/g, '\n').trimEnd().split('\n')) {
      if (
        line.startsWith('diff --git ') ||
        line.startsWith('index ') ||
        line.startsWith('--- ') ||
        line.startsWith('+++ ')
      )
        continue
      if (line.startsWith('@@ ')) {
        flush()
        blocks.push({ kind: 'hunk', text: line })
        continue
      }
      code.push(line)
    }
    flush()
    return blocks
  }
  if (props.newFile?.contents) return [{ kind: 'code', text: props.newFile.contents }]
  if (props.oldFile?.contents) return [{ kind: 'code', text: props.oldFile.contents }]
  if (props.fileDiff) {
    const lines = props.fileDiff.additionLines.length
      ? props.fileDiff.additionLines
      : props.fileDiff.deletionLines
    return [{ kind: 'code', text: lines.join('\n') }]
  }
  return []
}

const HOST_THEME_CSS = ':host { color-scheme: inherit; }'

/**
 * Interactive unified and side-by-side code diff viewer powered by `@pierre/diffs`,
 * wrapped in Reflow's frame, header, and CSS-variable syntax theme.
 *
 * Import from `@rtzll/reflow/diffs`. Requires the optional `@pierre/diffs` peer dependency.
 * See docs/diff-view.md.
 */
export function DiffView(handle: Handle<DiffViewProps>) {
  let internalView: 'unified' | 'split' = handle.props.defaultView ?? 'unified'
  let ready = false
  let computedCounts: { filename?: string; added: number; removed: number } | undefined

  let pierre: PierreModule | undefined
  let instance: PierreFileDiff<unknown> | undefined
  let stage: HTMLElement | undefined
  let hydrated = false

  function currentView() {
    return handle.props.view ?? internalView
  }

  function buildOptions(props: DiffViewProps): FileDiffOptions<unknown, undefined> {
    const unsafeCSS = props.unsafeCSS ? `${HOST_THEME_CSS}\n${props.unsafeCSS}` : HOST_THEME_CSS
    return {
      disableFileHeader: true,
      diffStyle: currentView(),
      diffIndicators: props.indicators ?? 'classic',
      disableLineNumbers: props.lineNumbers === false,
      overflow: props.wrap ? 'wrap' : 'scroll',
      lineDiffType: props.lineDiffType ?? 'word-alt',
      hunkSeparators: props.hunkSeparators ?? 'line-info',
      expandUnchanged: props.expandUnchanged,
      enableLineSelection: props.enableLineSelection,
      onLineSelected: props.onLineSelected,
      renderAnnotation: props.renderAnnotation,
      theme: props.theme ?? 'reflow',
      themeType: props.themeType ?? 'system',
      deferHydrationHighlight: Boolean(props.prerenderedHTML),
      unsafeCSS,
      onPostRender(node, _instance, phase) {
        if (phase === 'unmount' || ready) return
        if (!node.shadowRoot?.querySelector('[data-line]')) return
        ready = true
        void handle.update()
      },
    }
  }

  function resolveFileDiff(mod: PierreModule, props: DiffViewProps): FileDiffMetadata | undefined {
    let meta: FileDiffMetadata | undefined
    if (props.fileDiff) {
      meta = props.fileDiff
    } else if (props.oldFile !== undefined || props.newFile !== undefined) {
      meta = mod.parseDiffFromFile(props.oldFile ?? null, props.newFile ?? null)
    } else if (props.diff) {
      meta = mod.getSingularPatch(props.diff)
    }
    if (meta && props.lang) {
      meta = mod.setLanguageOverride(meta, props.lang)
    }
    return meta
  }

  function syncInstance() {
    if (!pierre || !stage) return
    const props = handle.props
    const fileDiff = resolveFileDiff(pierre, props)
    if (!fileDiff) return

    const nextCounts = summarizeMetadata(fileDiff)
    const countsChanged =
      !computedCounts ||
      computedCounts.added !== nextCounts.added ||
      computedCounts.removed !== nextCounts.removed ||
      computedCounts.filename !== nextCounts.filename
    computedCounts = nextCounts

    const options = buildOptions(props)
    if (!instance) {
      instance = new pierre.FileDiff(options)
      const existingContainer = stage.querySelector<HTMLElement>('diffs-container')
      if (props.prerenderedHTML && existingContainer && !hydrated) {
        hydrated = true
        instance.hydrate({
          fileContainer: existingContainer,
          fileDiff,
          prerenderedHTML: props.prerenderedHTML,
          lineAnnotations: props.lineAnnotations,
        })
      } else {
        instance.render({
          containerWrapper: stage,
          fileDiff,
          lineAnnotations: props.lineAnnotations,
        })
      }
      if (props.selectedLines !== undefined) instance.setSelectedLines(props.selectedLines)
      if (
        !ready &&
        stage.querySelector('diffs-container')?.shadowRoot?.querySelector('[data-line]')
      ) {
        ready = true
        void handle.update()
      } else if (countsChanged) {
        void handle.update()
      }
      return
    }

    const forceRender = !pierre.areOptionsEqual(instance.options, options)
    instance.setOptions(options)
    instance.render({
      forceRender,
      fileDiff,
      lineAnnotations: props.lineAnnotations,
    })
    if (props.selectedLines !== undefined) instance.setSelectedLines(props.selectedLines)
    if (countsChanged) void handle.update()
  }

  const mountStage = ref<HTMLElement>((node, signal) => {
    stage = node
    let disposed = false
    signal.addEventListener(
      'abort',
      () => {
        disposed = true
        instance?.cleanUp()
        instance = undefined
        stage = undefined
        hydrated = false
      },
      { once: true },
    )
    void loadPierre().then((mod) => {
      if (disposed || signal.aborted) return
      ensureReflowTheme(mod)
      pierre = mod
      syncInstance()
    })
  })

  return () => {
    const props = handle.props
    const {
      filename: filenameProp,
      viewToggle = false,
      lineNumbers = true,
      wrap = false,
      size,
      actions,
      label,
      prerenderedHTML,
      class: classProp,
    } = props

    const summary = props.fileDiff
      ? summarizeMetadata(props.fileDiff)
      : props.diff
        ? summarizePatch(props.diff)
        : (computedCounts ?? {
            filename: props.newFile?.name ?? props.oldFile?.name,
            added: 0,
            removed: 0,
          })

    const activeView = currentView()
    const path = filenameProp ?? summary.filename
    const parts = path ? splitPath(path) : undefined
    const showHeader = Boolean(path || summary.added || summary.removed || viewToggle || actions)
    const countLabel = `${summary.added} added, ${summary.removed} removed`

    if (pierre && stage) {
      handle.queueTask(() => syncInstance())
    }

    return (
      <figure
        class={classList('rf-diff-view', classProp)}
        aria-label={label ?? path ?? 'Code diff'}
        data-view={activeView}
        data-density={size === 'compact' ? 'compact' : undefined}
        data-wrap={wrap || undefined}
        data-line-numbers={lineNumbers ? undefined : 'false'}
        data-rf-diffs-ready={ready ? '' : undefined}
      >
        {showHeader && (
          <figcaption class="rf-diff-header">
            {parts && (
              <span class="rf-diff-path" title={path}>
                {parts.folder && <span class="rf-diff-folder">{parts.folder}</span>}
                <span class="rf-diff-file">{parts.name}</span>
              </span>
            )}
            {(summary.added > 0 || summary.removed > 0) && (
              <span class="rf-diff-counts">
                <span class="rf-basic-sr-only">{countLabel}</span>
                <span aria-hidden="true">
                  {summary.added > 0 && <span class="rf-diff-added">+{summary.added}</span>}
                  {summary.added > 0 && summary.removed > 0 && ' '}
                  {summary.removed > 0 && <span class="rf-diff-removed">−{summary.removed}</span>}
                </span>
              </span>
            )}
            {(viewToggle || actions) && (
              <div class="rf-diff-controls">
                {viewToggle && (
                  <SegmentedControl
                    label="Diff view"
                    size="compact"
                    value={activeView}
                    options={[
                      { value: 'unified', label: 'Unified' },
                      { value: 'split', label: 'Split' },
                    ]}
                    onValueChange={(next) => {
                      const nextView = next === 'split' ? 'split' : 'unified'
                      if (props.view === undefined) internalView = nextView
                      props.onViewChange?.(nextView)
                      void handle.update()
                    }}
                  />
                )}
                {actions}
              </div>
            )}
          </figcaption>
        )}
        <div class="rf-diff-stage">
          {!ready && !prerenderedHTML && (
            <div class="rf-diff-fallback">
              {fallbackBlocks(props).map((block, index) =>
                block.kind === 'hunk' ? (
                  <div key={index} class="rf-diff-fallback-hunk">
                    {block.text}
                  </div>
                ) : (
                  <pre key={index} class="rf-diff-fallback-code">
                    <code>{block.text}</code>
                  </pre>
                ),
              )}
            </div>
          )}
          {prerenderedHTML ? (
            <div
              class="rf-diff-mount"
              mix={mountStage}
              innerHTML={unsafeHTML(
                `<diffs-container><template shadowrootmode="open">${prerenderedHTML}</template></diffs-container>`,
              )}
            />
          ) : (
            <div class="rf-diff-mount" mix={mountStage} />
          )}
        </div>
      </figure>
    )
  }
}
