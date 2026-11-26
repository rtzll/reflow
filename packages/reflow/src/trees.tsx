import { createElement, ref, unsafeHTML, type Handle } from 'remix/component'
import type * as PierreTrees from '@pierre/trees'
import type {
  FileTree as PierreFileTree,
  FileTreeIcons,
  FileTreeInitialExpansion,
  FileTreeOptions,
  FileTreeRowDecoration,
  FileTreeRowDecorationContext,
  FileTreeRowDecorationRenderer,
  FileTreeSearchMode,
  FileTreeSsrPayload,
  GitStatus,
  GitStatusEntry,
} from '@pierre/trees'
import { classList, type ControlSize } from './systems/styling.ts'

export type {
  FileTreeIcons,
  FileTreeInitialExpansion,
  FileTreeRowDecoration,
  FileTreeRowDecorationContext,
  FileTreeRowDecorationRenderer,
  FileTreeSearchMode,
  FileTreeSsrPayload,
  GitStatus,
  GitStatusEntry,
}

export interface FileTreeProps {
  /** Canonical slash-separated file and directory paths. */
  paths: readonly string[]
  /** Accessible name for the file tree region. Default `'Files'`. */
  label?: string
  /** Controlled selected path. */
  value?: string | null
  /** Initial selected path when uncontrolled. */
  defaultValue?: string
  /** Called when the active selection changes to a path. */
  onValueChange?: (path: string) => void
  /** Called with the full array of selected paths whenever selection changes. */
  onSelectionChange?: (paths: readonly string[]) => void
  /** Git status indicators per path (added, modified, deleted, renamed, untracked, ignored). */
  gitStatus?: readonly GitStatusEntry[]
  /** Declarative per-path trailing decorations (SSR-safe, supports multi-color parts). */
  rowDecorations?: Readonly<Record<string, FileTreeRowDecoration>>
  /** Dynamic per-row decoration renderer; falls back to `rowDecorations[item.path]` when omitted. */
  renderRowDecoration?: FileTreeRowDecorationRenderer
  /** Compacts single-child folder chains (e.g. `packages/reflow/src`). Default `true`. */
  flattenEmptyDirectories?: boolean
  /** Initial folder expansion state. Default `'open'`. */
  initialExpansion?: FileTreeInitialExpansion
  /** Specific folder paths to start expanded. */
  initialExpandedPaths?: readonly string[]
  /** Enables `@pierre/trees`'s built-in search bar. Default `false`. */
  search?: boolean
  /** External controlled search/filter query applied to the tree. */
  searchQuery?: string | null
  /** How search filters non-matching items. Default `'hide-non-matches'`. */
  searchMode?: FileTreeSearchMode
  /** Built-in icon set (`'standard'`, `'minimal'`, `'complete'`, or a `FileTreeIconConfig`). Default `{ set: 'standard', colored: true }`. */
  icons?: FileTreeIcons
  /** Pins open ancestor folder rows while scrolling inside a fixed-height tree. Default `false`. */
  stickyFolders?: boolean
  /** Row height in pixels. */
  itemHeight?: number
  /** Explicit height for the virtualized viewport (number in px or CSS length). When omitted, auto-fits visible rows up to `maxHeight`. */
  height?: number | string
  /** Maximum auto-fitted height in pixels when `height` is omitted. Default `360`. */
  maxHeight?: number
  /** Hint for how many rows render during SSR and first paint before viewport measurement. */
  initialVisibleRowCount?: number
  /** Pre-rendered Declarative Shadow DOM payload from `prerenderFileTree()` in `@rtzll/reflow/trees/ssr`. */
  prerendered?: FileTreeSsrPayload
  /** Controls spacing and font scale (`'compact'` maps to `@pierre/trees` compact density). */
  size?: ControlSize
  /** Extra CSS injected inside the `@pierre/trees` Shadow DOM. */
  unsafeCSS?: string
  /** Additional class name on the outer container. */
  class?: string
}

type PierreTreesModule = typeof PierreTrees

const HOST_THEME_CSS = [
  ':host { color-scheme: inherit; }',
  '[data-item-section="decoration"] { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; font-variant-numeric: tabular-nums; }',
].join('\n')

let treesPromise: Promise<PierreTreesModule> | undefined

function loadPierreTrees(): Promise<PierreTreesModule> {
  treesPromise ??= import('@pierre/trees')
  return treesPromise
}

function sameStringArray(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function serializeGitStatus(entries?: readonly GitStatusEntry[]) {
  if (!entries?.length) return ''
  return entries.map((entry) => `${entry.path}:${entry.status}`).join('|')
}

function estimateRowCount(paths: readonly string[]): number {
  const dirs = new Set<string>()
  for (const path of paths) {
    const slash = path.lastIndexOf('/')
    if (slash > 0) dirs.add(path.slice(0, slash))
  }
  return Math.max(1, paths.length + dirs.size)
}

function resolveHeight(props: FileTreeProps, visibleRows?: number): string {
  if (props.height !== undefined) {
    return typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  const rowHeight = props.itemHeight ?? (props.size === 'compact' ? 28 : 30)
  const rows = visibleRows ?? estimateRowCount(props.paths)
  const extra = props.search ? 44 : 12
  const maxHeight = props.maxHeight ?? 360
  return `${Math.min(maxHeight, Math.max(rowHeight + extra, rows * rowHeight + extra))}px`
}

function serializeDecorations(decorations?: Readonly<Record<string, FileTreeRowDecoration>>) {
  if (!decorations) return ''
  return JSON.stringify(decorations)
}

/**
 * Virtualized, path-first file tree powered by `@pierre/trees`, themed with
 * Reflow's `--rf-*` design tokens and supporting zero-flash Declarative Shadow DOM SSR.
 *
 * Import from `@rtzll/reflow/trees` (requires optional peer `@pierre/trees`).
 */
export function FileTree(handle: Handle<FileTreeProps>) {
  let mod: PierreTreesModule | undefined
  let instance: PierreFileTree | undefined
  let hostElement: HTMLElement | undefined
  let hydrated = false
  let ready = Boolean(handle.props.prerendered)
  let syncingSelection = false
  let lastPaths: readonly string[] = []
  let lastGitKey = ''
  let lastDecorationsKey = ''
  let lastSearchQuery: string | null | undefined = undefined
  let lastValue: string | null | undefined = undefined

  function resolveDecoration(context: FileTreeRowDecorationContext): FileTreeRowDecoration | null {
    const props = handle.props
    if (props.renderRowDecoration) return props.renderRowDecoration(context)
    return props.rowDecorations?.[context.item.path] ?? null
  }

  function buildOptions(props: FileTreeProps): FileTreeOptions {
    const unsafeCSS = props.unsafeCSS ? `${HOST_THEME_CSS}\n${props.unsafeCSS}` : HOST_THEME_CSS
    const initialSelected =
      props.value !== undefined
        ? props.value
          ? [props.value]
          : []
        : props.defaultValue
          ? [props.defaultValue]
          : undefined
    return {
      id: props.prerendered?.id,
      paths: props.paths,
      flattenEmptyDirectories: props.flattenEmptyDirectories ?? true,
      initialExpansion: props.initialExpansion ?? 'open',
      initialExpandedPaths: props.initialExpandedPaths,
      initialSelectedPaths: initialSelected,
      gitStatus: props.gitStatus,
      icons: props.icons ?? { set: 'standard', colored: true },
      density: props.size === 'compact' ? 'compact' : 'default',
      itemHeight: props.itemHeight,
      initialVisibleRowCount: props.initialVisibleRowCount ?? Math.max(8, props.paths.length * 2),
      stickyFolders: props.stickyFolders ?? false,
      search: props.search ?? false,
      fileTreeSearchMode: props.searchMode ?? 'hide-non-matches',
      initialSearchQuery: props.searchQuery ?? undefined,
      searchBlurBehavior: props.searchQuery !== undefined ? 'retain' : undefined,
      renderRowDecoration:
        props.renderRowDecoration || props.rowDecorations ? resolveDecoration : undefined,
      unsafeCSS,
      onSelectionChange(selectedPaths) {
        if (syncingSelection) return
        handle.props.onSelectionChange?.(selectedPaths)
        const next = selectedPaths[0]
        if (next) {
          lastValue = next
          handle.props.onValueChange?.(next)
        }
      },
    }
  }

  function syncSelection(target: PierreFileTree, value: string | null | undefined) {
    if (value === undefined || value === lastValue) return
    lastValue = value
    const current = target.getSelectedPaths()
    if (value === null) {
      if (current.length === 0) return
      syncingSelection = true
      try {
        for (const path of current) target.getItem(path)?.deselect()
      } finally {
        syncingSelection = false
      }
      return
    }
    if (current.length === 1 && current[0] === value) return
    const item = target.getItem(value)
    if (!item) return
    syncingSelection = true
    try {
      for (const path of current) {
        if (path !== value) target.getItem(path)?.deselect()
      }
      item.select()
    } finally {
      syncingSelection = false
    }
  }

  function syncInstance() {
    if (!mod || !hostElement) return
    const props = handle.props

    if (!instance) {
      const options = buildOptions(props)
      instance = new mod.FileTree(options)
      lastPaths = [...props.paths]
      lastGitKey = serializeGitStatus(props.gitStatus)
      lastDecorationsKey = serializeDecorations(props.rowDecorations)
      lastSearchQuery = props.searchQuery ?? null
      lastValue = props.value ?? props.defaultValue ?? null

      if (props.prerendered && !hydrated && hostElement.shadowRoot) {
        instance.hydrate({ fileTreeContainer: hostElement })
        hydrated = true
      } else {
        instance.render({ fileTreeContainer: hostElement })
      }
      if (!ready) {
        ready = true
        void handle.update()
      }
      return
    }

    let needsRender = false

    if (!sameStringArray(lastPaths, props.paths)) {
      lastPaths = [...props.paths]
      instance.resetPaths(props.paths)
    }

    const nextGitKey = serializeGitStatus(props.gitStatus)
    if (nextGitKey !== lastGitKey) {
      lastGitKey = nextGitKey
      instance.setGitStatus(props.gitStatus)
    }

    const nextSearch = props.searchQuery ?? null
    if (props.searchQuery !== undefined && nextSearch !== lastSearchQuery) {
      lastSearchQuery = nextSearch
      instance.setSearch(nextSearch)
    }

    const nextDecorationsKey = serializeDecorations(props.rowDecorations)
    if (nextDecorationsKey !== lastDecorationsKey) {
      lastDecorationsKey = nextDecorationsKey
      needsRender = true
    }

    syncSelection(instance, props.value)

    if (needsRender) {
      instance.render({ fileTreeContainer: hostElement })
    }
  }

  const mountContainer = ref<HTMLElement>((node, signal) => {
    hostElement = node
    let disposed = false
    signal.addEventListener(
      'abort',
      () => {
        disposed = true
        instance?.cleanUp()
        instance = undefined
        hostElement = undefined
        hydrated = false
      },
      { once: true },
    )
    void loadPierreTrees().then((loaded) => {
      if (disposed || signal.aborted) return
      mod = loaded
      syncInstance()
    })
  })

  return () => {
    const props = handle.props
    const isServer = typeof window === 'undefined'
    const isReady = ready || Boolean(props.prerendered)

    if (mod && hostElement) {
      handle.queueTask(() => syncInstance())
    }

    const shadowTemplate =
      isServer && props.prerendered
        ? createElement('template', {
            shadowrootmode: 'open',
            innerHTML: unsafeHTML(props.prerendered.shadowHtml),
          })
        : null

    const resolvedHeight = resolveHeight(props, instance?.getVisibleCount())

    return (
      <div
        class={classList('rf-file-tree', props.class)}
        role="region"
        aria-label={props.label ?? 'Files'}
        data-density={props.size === 'compact' ? 'compact' : undefined}
        data-rf-trees-ready={isReady ? '' : undefined}
        style={{ blockSize: resolvedHeight }}
      >
        {!isReady && (
          <ul class="rf-file-tree-fallback" role="list">
            {props.paths.map((path) => {
              const decoration = props.rowDecorations?.[path]
              return (
                <li key={path} class="rf-file-tree-fallback-item">
                  <span class="rf-file-tree-fallback-path">{path}</span>
                  {decoration && 'text' in decoration && (
                    <span class="rf-file-tree-fallback-meta">
                      {decoration.parts
                        ? decoration.parts.map((part, index) => (
                            <span
                              key={index}
                              style={part.color ? { color: part.color } : undefined}
                            >
                              {part.text}
                            </span>
                          ))
                        : decoration.text}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <div class="rf-file-tree-mount" style={{ blockSize: '100%' }}>
          {createElement(
            'file-tree-container',
            {
              id: props.prerendered?.id,
              'data-file-tree-virtualized': 'true',
              style: { display: 'block', inlineSize: '100%', blockSize: '100%' },
              mix: mountContainer,
            },
            shadowTemplate,
          )}
        </div>
      </div>
    )
  }
}
