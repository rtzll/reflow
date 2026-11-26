import {
  getSingularPatch,
  parseDiffFromFile,
  registerCustomCSSVariableTheme,
  setLanguageOverride,
  type DiffIndicators,
  type DiffLineAnnotation,
  type FileContents,
  type FileDiffMetadata,
  type HunkSeparators,
  type LineDiffTypes,
  type ThemeTypes,
} from '@pierre/diffs'
import { preloadDiffHTML } from '@pierre/diffs/ssr'

export interface PrerenderDiffOptions {
  /** Unified diff string (e.g. `git diff` output). */
  diff?: string
  /** Previous version of the file when computing a diff from full file contents. */
  oldFile?: FileContents | null
  /** Next version of the file when computing a diff from full file contents. */
  newFile?: FileContents | null
  /** Pre-parsed `@pierre/diffs` metadata. */
  fileDiff?: FileDiffMetadata
  /** Explicit language override for syntax highlighting; defaults to filename inference. */
  lang?: string
  /** Initial layout view. Default `'unified'`. */
  view?: 'unified' | 'split'
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
  /** Inline annotations attached to specific diff lines. */
  lineAnnotations?: DiffLineAnnotation<unknown>[]
  /** Syntax theme name or `{ light, dark }` pair. Defaults to Reflow's CSS-variable theme. */
  theme?: string | { light: string; dark: string }
  /** Color scheme mode inside the diff surface. Default `'system'`. */
  themeType?: ThemeTypes
  /** Extra CSS injected inside the `@pierre/diffs` Shadow DOM. */
  unsafeCSS?: string
}

export interface PrerenderedDiff {
  /** Declarative Shadow DOM inner HTML to pass to `<DiffView prerenderedHTML={...} />`. */
  prerenderedHTML: string
  /** Resolved file path, if present on the diff or file inputs. */
  filename?: string
  /** Total added lines across hunks. */
  added: number
  /** Total removed lines across hunks. */
  removed: number
}

const HOST_THEME_CSS = ':host { color-scheme: inherit; }'

let reflowThemeRegistered = false

function ensureReflowTheme() {
  if (reflowThemeRegistered) return
  reflowThemeRegistered = true
  registerCustomCSSVariableTheme(
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

function resolveMetadata(input: PrerenderDiffOptions): FileDiffMetadata {
  let meta: FileDiffMetadata | undefined
  if (input.fileDiff) {
    meta = input.fileDiff
  } else if (input.oldFile !== undefined || input.newFile !== undefined) {
    meta = parseDiffFromFile(input.oldFile ?? null, input.newFile ?? null)
  } else if (input.diff) {
    meta = getSingularPatch(input.diff)
  }
  if (!meta) {
    throw new Error('prerenderDiff: pass diff, fileDiff, oldFile, or newFile')
  }
  if (input.lang) {
    meta = setLanguageOverride(meta, input.lang)
  }
  return meta
}

/**
 * Pre-renders a diff on the server into Declarative Shadow DOM HTML matching
 * Reflow's `DiffView` options and CSS-variable syntax theme. Pass the returned
 * `prerenderedHTML` straight to `<DiffView>` for zero-flash SSR hydration.
 *
 * Import from `@rtzll/reflow/diffs/ssr` (server / build time only).
 */
export async function prerenderDiff(input: PrerenderDiffOptions): Promise<PrerenderedDiff> {
  ensureReflowTheme()
  const fileDiff = resolveMetadata(input)
  const unsafeCSS = input.unsafeCSS ? `${HOST_THEME_CSS}\n${input.unsafeCSS}` : HOST_THEME_CSS

  const prerenderedHTML = await preloadDiffHTML({
    fileDiff,
    annotations: input.lineAnnotations,
    options: {
      disableFileHeader: true,
      diffStyle: input.view ?? 'unified',
      diffIndicators: input.indicators ?? 'classic',
      disableLineNumbers: input.lineNumbers === false,
      overflow: input.wrap ? 'wrap' : 'scroll',
      lineDiffType: input.lineDiffType ?? 'word-alt',
      hunkSeparators: input.hunkSeparators ?? 'line-info',
      expandUnchanged: input.expandUnchanged,
      theme: input.theme ?? 'reflow',
      themeType: input.themeType ?? 'system',
      unsafeCSS,
    },
  })

  let added = 0
  let removed = 0
  for (const hunk of fileDiff.hunks) {
    added += hunk.additionLines
    removed += hunk.deletionLines
  }

  const rawFilename = fileDiff.name || fileDiff.prevName || undefined
  const filename = rawFilename?.replace(/^[ab]\//, '')

  return {
    prerenderedHTML,
    filename,
    added,
    removed,
  }
}
