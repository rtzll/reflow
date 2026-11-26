import { preloadFileTree } from '@pierre/trees/ssr'
import type {
  FileTreeIcons,
  FileTreeInitialExpansion,
  FileTreeRowDecoration,
  FileTreeRowDecorationRenderer,
  FileTreeSearchMode,
  FileTreeSsrPayload,
  GitStatusEntry,
} from '@pierre/trees'
import type { ControlSize } from './systems/styling.ts'

export interface PrerenderFileTreeOptions {
  /** Stable host element ID shared between SSR and hydration. */
  id?: string
  /** Canonical slash-separated file and directory paths. */
  paths: readonly string[]
  /** Initial selected path. */
  defaultValue?: string
  /** Git status indicators per path. */
  gitStatus?: readonly GitStatusEntry[]
  /** Declarative per-path trailing decorations (supports multi-color parts). */
  rowDecorations?: Readonly<Record<string, FileTreeRowDecoration>>
  /** Dynamic per-row decoration renderer. */
  renderRowDecoration?: FileTreeRowDecorationRenderer
  /** Compacts single-child folder chains. Default `true`. */
  flattenEmptyDirectories?: boolean
  /** Initial folder expansion state. Default `'open'`. */
  initialExpansion?: FileTreeInitialExpansion
  /** Specific folder paths to start expanded. */
  initialExpandedPaths?: readonly string[]
  /** Enables `@pierre/trees`'s built-in search bar. Default `false`. */
  search?: boolean
  /** Initial search filter query. */
  searchQuery?: string | null
  /** How search filters non-matching items. Default `'hide-non-matches'`. */
  searchMode?: FileTreeSearchMode
  /** Built-in icon set. Default `'colored'`. */
  icons?: FileTreeIcons
  /** Pins open ancestor folder rows inside a scrollable tree. Default `false`. */
  stickyFolders?: boolean
  /** Row height in pixels. */
  itemHeight?: number
  /** Hint for how many rows render on SSR. Defaults to covering the whole tree. */
  initialVisibleRowCount?: number
  /** Controls spacing and font scale (`'compact'` maps to compact density). */
  size?: ControlSize
  /** Extra CSS injected inside the `@pierre/trees` Shadow DOM. */
  unsafeCSS?: string
}

export type PrerenderedFileTree = FileTreeSsrPayload

const HOST_THEME_CSS = [
  ':host { color-scheme: inherit; }',
  '[data-item-section="decoration"] { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; font-variant-numeric: tabular-nums; }',
].join('\n')

/**
 * Pre-renders a `@pierre/trees` file tree on the server into a Declarative
 * Shadow DOM payload matching Reflow's `FileTree` options and token theme.
 * Pass the returned payload straight to `<FileTree prerendered={...} />`
 * for zero-flash SSR hydration.
 *
 * Import from `@rtzll/reflow/trees/ssr` (server / build time only).
 */
export function prerenderFileTree(options: PrerenderFileTreeOptions): PrerenderedFileTree {
  const unsafeCSS = options.unsafeCSS ? `${HOST_THEME_CSS}\n${options.unsafeCSS}` : HOST_THEME_CSS
  const renderRowDecoration =
    options.renderRowDecoration ??
    (options.rowDecorations ? ({ item }) => options.rowDecorations?.[item.path] ?? null : undefined)

  return preloadFileTree({
    id: options.id,
    paths: options.paths,
    flattenEmptyDirectories: options.flattenEmptyDirectories ?? true,
    initialExpansion: options.initialExpansion ?? 'open',
    initialExpandedPaths: options.initialExpandedPaths,
    initialSelectedPaths: options.defaultValue ? [options.defaultValue] : undefined,
    gitStatus: options.gitStatus,
    icons: options.icons ?? { set: 'standard', colored: true },
    density: options.size === 'compact' ? 'compact' : 'default',
    itemHeight: options.itemHeight,
    initialVisibleRowCount: options.initialVisibleRowCount ?? Math.max(8, options.paths.length * 2),
    stickyFolders: options.stickyFolders ?? false,
    search: options.search ?? false,
    fileTreeSearchMode: options.searchMode ?? 'hide-non-matches',
    initialSearchQuery: options.searchQuery ?? undefined,
    renderRowDecoration,
    unsafeCSS,
  })
}
