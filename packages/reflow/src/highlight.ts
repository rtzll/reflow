/**
 * `@rtzll/reflow/highlight`: Shiki behind one function, for CodeBlock.
 *
 * This entry is optional. It needs the `shiki` and `@shikijs/transformers`
 * peer dependencies, and nothing else in Reflow imports it, so an app that
 * never imports it never installs or loads Shiki.
 */
import {
  bundledLanguages,
  bundledLanguagesAlias,
  createCssVariablesTheme,
  createHighlighter,
  createJavaScriptRegexEngine,
  type BundledTheme,
  type Highlighter,
  type ShikiTransformer,
  type ThemeRegistrationAny,
} from 'shiki'
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from '@shikijs/transformers'
import type { CodeLine, CodeToken, HighlightedCode } from './code-block.tsx'

export type { CodeLine, CodeToken, HighlightedCode } from './code-block.tsx'

type Theme = BundledTheme | ThemeRegistrationAny

export interface HighlightOptions {
  /** Any language Shiki bundles, or one of its aliases. Unknown languages render as plain text. Default text. */
  lang?: string
  /** A Shiki theme, by name or definition. Defaults to Reflow's, which colours tokens with `--rf-code-token-*` variables. */
  theme?: Theme
  /** A light and a dark theme; the block follows the page's color scheme between them. */
  themes?: { light: Theme; dark: Theme }
  /**
   * Reads `// [!code highlight]`, `[!code ++]`, `[!code --]`, `[!code focus]`,
   * `[!code error]`, `[!code warning]` and `[!code word:name]` comments into
   * line and word marks, and removes them from the code. Default true.
   */
  notation?: boolean
  /** More Shiki transformers, run after the notation ones. */
  transformers?: ShikiTransformer[]
}

// Reflow's theme: every colour is a CSS variable, set in code-block.css for
// the light and dark themes, so highlighted code follows the page.
const reflowTheme = createCssVariablesTheme({
  name: 'reflow',
  variablePrefix: '--rf-code-',
  fontStyle: true,
})

let shared: Promise<Highlighter> | undefined

// One highlighter for the process or page, with the JavaScript regex engine,
// which needs no WebAssembly. Languages and themes load as they are first used.
function highlighter() {
  shared ??= createHighlighter({
    themes: [reflowTheme],
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  })
  return shared
}

function bundled(lang: string) {
  return lang in bundledLanguages || lang in bundledLanguagesAlias
}

function themeName(theme: Theme) {
  return typeof theme === 'string' ? theme : (theme.name ?? 'custom')
}

interface HastNode {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

function classes(node: HastNode) {
  const value = node.properties?.class ?? node.properties?.className
  return Array.isArray(value) ? value.join(' ') : typeof value === 'string' ? value : ''
}

// Flattens a line into runs of text, each with the innermost style and
// every class around it, such as a token inside a highlighted word.
function tokens(node: HastNode, style = '', classList: string[] = []): CodeToken[] {
  if (node.type === 'text') {
    if (!node.value) return []
    const token: CodeToken = { content: node.value }
    if (style) token.style = style
    if (classList.length) token.class = classList.join(' ')
    return [token]
  }
  const own = typeof node.properties?.style === 'string' ? node.properties.style : ''
  const name = classes(node)
  const nested = name ? [...classList, name] : classList
  return (node.children ?? []).flatMap((child) => tokens(child, own || style, nested))
}

function trimEnd(list: CodeToken[]) {
  while (list.length) {
    const last = list[list.length - 1]!
    last.content = last.content.replace(/[ \t]+$/, '')
    if (last.content) return
    list.pop()
  }
}

/**
 * Highlights code for CodeBlock. Call it where the code is known: in a route
 * handler, so the page arrives highlighted and the browser loads nothing, or
 * in the browser for code that arrives later, such as a streamed reply.
 */
export async function highlight(
  code: string,
  options: HighlightOptions = {},
): Promise<HighlightedCode> {
  const instance = await highlighter()
  const requested = options.lang ?? 'text'
  const lang = bundled(requested) ? requested : 'text'
  if (lang !== 'text' && !instance.getLoadedLanguages().includes(lang))
    await instance.loadLanguage(lang as keyof typeof bundledLanguages)
  const themes = options.themes ? [options.themes.light, options.themes.dark] : [options.theme]
  for (const theme of themes)
    if (theme && !instance.getLoadedThemes().includes(themeName(theme)))
      await instance.loadTheme(theme)

  const transformers = [
    ...(options.notation === false
      ? []
      : [
          transformerNotationHighlight(),
          transformerNotationDiff(),
          transformerNotationFocus(),
          transformerNotationErrorLevel(),
          transformerNotationWordHighlight(),
        ]),
    ...(options.transformers ?? []),
  ]
  const root = instance.codeToHast(
    code,
    options.themes
      ? {
          lang,
          themes: {
            light: themeName(options.themes.light),
            dark: themeName(options.themes.dark),
          },
          defaultColor: false,
          transformers,
        }
      : { lang, theme: options.theme ? themeName(options.theme) : 'reflow', transformers },
  ) as HastNode

  const pre = root.children?.find((node) => node.tagName === 'pre')
  const body = pre?.children?.find((node) => node.tagName === 'code')
  const lines: CodeLine[] = (body?.children ?? [])
    .filter((node) => node.type === 'element')
    .map((node) => {
      const mark = classes(node)
        .split(/\s+/)
        .filter((name) => name && name !== 'line')
        .join(' ')
      const line: CodeLine = { tokens: tokens({ ...node, properties: {} }) }
      // Removing a notation comment leaves the space before it.
      if (options.notation !== false) trimEnd(line.tokens)
      if (mark) line.class = mark
      return line
    })
  const flags = classes(pre ?? { type: 'element' })
    .split(/\s+/)
    .filter((name) => name.startsWith('has-'))
  const style = typeof pre?.properties?.style === 'string' ? pre.properties.style : undefined
  const result: HighlightedCode = {
    lang: requested === 'text' || lang === 'text' ? 'text' : requested,
    code: lines.map((line) => line.tokens.map((token) => token.content).join('')).join('\n'),
    lines,
    flags,
  }
  // Reflow's own theme takes its colours from CSS; others bring theirs inline.
  if (style && (options.theme || options.themes)) result.style = style
  return result
}
