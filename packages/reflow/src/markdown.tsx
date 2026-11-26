import { Lexer, type Token, type Tokens } from 'marked'
import type { Handle, RemixNode } from 'remix/component'
import { CodeBlock } from './code-block.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface MarkdownCodeBlock {
  /** Raw code inside the fenced or indented block. */
  code: string
  /** Optional language tag from the opening fence (e.g. `'ts'`, `'mermaid'`). */
  language?: string
  /** Surrounding density inherited from `Markdown`. */
  size?: ControlSize
}

export interface MarkdownProps {
  /** Markdown source, including partial text while a reply is streaming. */
  source: string
  /** Overrides the surrounding type density. */
  size?: ControlSize
  /** Additional class on the rendered container. */
  class?: string
  /**
   * Which images load inline. By default every image is a link, so rendering
   * loads nothing. `true` loads same-site paths; a function decides for each
   * safe source. Refused images stay links.
   */
  images?: boolean | ((src: string) => boolean)
  /**
   * Optional renderer for fenced code blocks (for example to render `mermaid`
   * fences with `<Diagram>` from `@rtzll/reflow/diagrams`). Returning `undefined`
   * falls back to the default `CodeBlock`.
   */
  renderCodeBlock?: (block: MarkdownCodeBlock) => RemixNode | undefined
}

/** CommonMark and GitHub Flavored Markdown, with CodeBlock fences and Table for pipe tables. */
export function Markdown(handle: Handle<MarkdownProps>) {
  return () => {
    const context: Context = {
      size: handle.props.size,
      prefix: handle.id,
      tasks: 0,
      images: handle.props.images,
      renderCodeBlock: handle.props.renderCodeBlock,
    }
    return (
      <div
        class={classList('rf-markdown', handle.props.class)}
        data-slot="markdown"
        data-size={handle.props.size}
      >
        {blocks(new Lexer({ gfm: true }).lex(handle.props.source), context)}
      </div>
    )
  }
}

// What every block needs from the instance: the density for CodeBlock and Table, and a
// prefix and counter for task label IDs, so several replies can share a page.
interface Context {
  size: ControlSize | undefined
  prefix: string
  tasks: number
  images: MarkdownProps['images']
  renderCodeBlock: MarkdownProps['renderCodeBlock']
}

// Whether a safe, decoded image source may load: same-site paths for `true`,
// the app's own rule for a function.
function loads(src: string, images: MarkdownProps['images']) {
  if (typeof images === 'function') return images(src)
  return images === true && src.startsWith('/')
}

// Only web, mail, same-site path and fragment links. marked leaves character references
// in destinations, so callers check the decoded URL: `/&#x2f;host` must not become `//host`.
function safeUrl(url: string) {
  return (
    /^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(url) &&
    !url.includes('\\') &&
    !Array.from(url).some((char) => {
      const code = char.charCodeAt(0)
      return code < 32 || code === 127
    })
  )
}

// marked decodes numeric character references but leaves named ones to an HTML parser.
// Remix renders text literally, so decode the common named references here.
const named: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  bull: '•',
  middot: '·',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  sect: '§',
  para: '¶',
  shy: '\u00ad',
  larr: '←',
  rarr: '→',
  uarr: '↑',
  darr: '↓',
  harr: '↔',
  check: '✓',
}
function decode(text: string) {
  return text.replace(/&(#\d+|#x[\da-f]+|[a-z][a-z\d]*);/gi, (reference, name: string) => {
    if (name[0] !== '#') return named[name] ?? reference
    const code = /^#x/i.test(name) ? Number.parseInt(name.slice(2), 16) : Number(name.slice(1))
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : reference
  })
}

// The decoded destination when it is safe to link to, otherwise undefined.
function href(url: string) {
  const decoded = decode(url)
  return safeUrl(decoded) ? decoded : undefined
}

function blocks(tokens: readonly Token[], context: Context): RemixNode[] {
  return tokens.map((token, key) => block(token, key, context))
}

function block(token: Token, key: number, context: Context): RemixNode {
  switch (token.type) {
    case 'space':
      return null
    // marked has no footnotes and reads `[^1]: Note` as a link definition. Keep the note
    // visible as text instead of dropping it.
    case 'def':
      return (token as Tokens.Def).tag.startsWith('^') ? (
        <p key={key}>{token.raw.replace(/\n+$/, '')}</p>
      ) : null
    case 'heading': {
      const Heading = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)[token.depth - 1]!
      return <Heading key={key}>{inline(token.tokens ?? [], context)}</Heading>
    }
    case 'paragraph': {
      const only = token.tokens?.length === 1 ? token.tokens[0] : undefined
      // An image alone in its paragraph shows as a block.
      const image =
        only?.type === 'image' &&
        !!context.images &&
        !!href(only.href) &&
        loads(href(only.href)!, context.images)
      return (
        <p key={key} data-image={image || undefined}>
          {inline(token.tokens ?? [], context)}
        </p>
      )
    }
    // Unwrapped text in a tight list item.
    case 'text':
      return token.tokens ? inline(token.tokens, context) : decode(token.text)
    case 'code': {
      const language = (token.lang ?? '').trim().split(/\s+/)[0] || undefined
      const custom = context.renderCodeBlock?.({
        code: token.text,
        language,
        size: context.size,
      })
      if (custom !== undefined) return <div key={key}>{custom}</div>
      return <CodeBlock key={key} size={context.size} code={token.text} language={language} />
    }
    case 'blockquote':
      return <blockquote key={key}>{blocks(token.tokens ?? [], context)}</blockquote>
    case 'list': {
      const list = token as Tokens.List
      const items = list.items.map((entry, index) => item(entry, index, context))
      return list.ordered ? (
        <ol key={key} start={list.start === '' || list.start === 1 ? undefined : list.start}>
          {items}
        </ol>
      ) : (
        <ul key={key}>{items}</ul>
      )
    }
    case 'hr':
      return <hr key={key} />
    case 'table':
      return table(token as Tokens.Table, key, context)
    // Raw HTML stays visible as text. An HTML block reads as its own paragraph.
    case 'html':
      return <p key={key}>{token.text.replace(/\n+$/, '')}</p>
    default:
      return 'raw' in token ? token.raw : null
  }
}

// Tasks get a read-only checkbox beside the item's content, labelled by the item's first
// line: a paragraph in a loose list, a span around the bare text in a tight one.
function item(entry: Tokens.ListItem, key: number, context: Context): RemixNode {
  const tokens = entry.tokens.filter((token) => token.type !== 'checkbox')
  if (!entry.task) return <li key={key}>{blocks(tokens, context)}</li>
  const id = `${context.prefix}-task-${context.tasks++}`
  const first = tokens[0]
  const label =
    first?.type === 'paragraph' ? (
      <p key={0} id={id}>
        {inline(first.tokens ?? [], context)}
      </p>
    ) : first?.type === 'text' ? (
      <span key={0} id={id}>
        {first.tokens ? inline(first.tokens, context) : decode(first.text)}
      </span>
    ) : null
  return (
    <li key={key} class="rf-markdown-task">
      <input type="checkbox" disabled checked={entry.checked === true} aria-labelledby={id} />
      <div id={label ? undefined : id}>
        {tokens.map((token, index) =>
          index === 0 && label ? label : block(token, index, context),
        )}
      </div>
    </li>
  )
}

function table(token: Tokens.Table, key: number, context: Context): RemixNode {
  const style = (column: number) => {
    const align = token.align[column]
    return align ? { textAlign: align } : undefined
  }
  return (
    <Table key={key} size={context.size} fluidHover={false}>
      <TableHeader>
        <TableRow hover={false}>
          {token.header.map((cell, column) => (
            <TableHead key={column} style={style(column)}>
              {inline(cell.tokens, context)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {token.rows.map((row, index) => (
          <TableRow key={index} hover={false}>
            {row.map((cell, column) => (
              <TableCell key={column} style={style(column)}>
                {inline(cell.tokens, context)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function inline(tokens: readonly Token[], context: Context): RemixNode[] {
  return tokens.map((token, key): RemixNode => {
    switch (token.type) {
      case 'text':
        return token.tokens ? inline(token.tokens, context) : decode(token.text)
      case 'escape':
        return token.text
      case 'strong':
        return <strong key={key}>{inline(token.tokens ?? [], context)}</strong>
      case 'em':
        return <em key={key}>{inline(token.tokens ?? [], context)}</em>
      case 'del':
        return <del key={key}>{inline(token.tokens ?? [], context)}</del>
      // Code spans are literal, character references included.
      case 'codespan':
        return <code key={key}>{token.text}</code>
      case 'br':
        return <br key={key} />
      case 'link': {
        // A footnote reference, `[^1]`, stays literal like its note.
        if (/^\[\^[^\]]+\]$/.test(token.raw)) return token.raw
        const url = href(token.href)
        return url ? (
          <a key={key} href={url} title={token.title ? decode(token.title) : undefined}>
            {inline(token.tokens ?? [], context)}
          </a>
        ) : (
          inline(token.tokens ?? [], context)
        )
      }
      // Images show as links unless the app lets their source load, so by
      // default Markdown loads nothing.
      case 'image': {
        const alt = decode(token.text)
        const label = alt || token.href
        const url = href(token.href)
        if (url && context.images && loads(url, context.images))
          return (
            <img
              key={key}
              src={url}
              alt={alt}
              title={token.title ? decode(token.title) : undefined}
              aria-hidden={alt ? undefined : 'true'}
              loading="lazy"
              decoding="async"
            />
          )
        return url ? (
          <a key={key} href={url}>
            {label}
          </a>
        ) : (
          label
        )
      }
      // Inline raw HTML stays visible as text.
      case 'html':
        return token.text
      // A loose task's marker sits in its first paragraph; item() renders the checkbox.
      case 'checkbox':
        return null
      default:
        return 'raw' in token ? token.raw : null
    }
  })
}
