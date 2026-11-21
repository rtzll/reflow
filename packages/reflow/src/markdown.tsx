import { Lexer, type Token, type Tokens } from 'marked'
import type { Handle, RemixNode } from 'remix/component'
import { CodeBlock } from './code-block.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface MarkdownProps {
  /** Markdown source, including partial text while a reply is streaming. */
  source: string
  /** Overrides the surrounding type density. */
  size?: ControlSize
  /** Additional class on the rendered container. */
  class?: string
}

/** CommonMark and GitHub Flavored Markdown, with CodeBlock fences and Table for pipe tables. */
export function Markdown(handle: Handle<MarkdownProps>) {
  return () => {
    const context: Context = { size: handle.props.size, prefix: handle.id, tasks: 0 }
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
      return <Heading key={key}>{inline(token.tokens ?? [])}</Heading>
    }
    case 'paragraph':
      return <p key={key}>{inline(token.tokens ?? [])}</p>
    // Unwrapped text in a tight list item.
    case 'text':
      return token.tokens ? inline(token.tokens) : decode(token.text)
    case 'code':
      return (
        <CodeBlock
          key={key}
          size={context.size}
          code={token.text}
          language={(token.lang ?? '').trim().split(/\s+/)[0] || undefined}
        />
      )
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
        {inline(first.tokens ?? [])}
      </p>
    ) : first?.type === 'text' ? (
      <span key={0} id={id}>
        {first.tokens ? inline(first.tokens) : decode(first.text)}
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
              {inline(cell.tokens)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {token.rows.map((row, index) => (
          <TableRow key={index} hover={false}>
            {row.map((cell, column) => (
              <TableCell key={column} style={style(column)}>
                {inline(cell.tokens)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function inline(tokens: readonly Token[]): RemixNode[] {
  return tokens.map((token, key): RemixNode => {
    switch (token.type) {
      case 'text':
        return token.tokens ? inline(token.tokens) : decode(token.text)
      case 'escape':
        return token.text
      case 'strong':
        return <strong key={key}>{inline(token.tokens ?? [])}</strong>
      case 'em':
        return <em key={key}>{inline(token.tokens ?? [])}</em>
      case 'del':
        return <del key={key}>{inline(token.tokens ?? [])}</del>
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
            {inline(token.tokens ?? [])}
          </a>
        ) : (
          inline(token.tokens ?? [])
        )
      }
      // Images show as links, so Markdown never loads remote images.
      case 'image': {
        const label = decode(token.text) || token.href
        const url = href(token.href)
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
