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

/** Structured prose with native headings, lists and links, CodeBlock fences, and pipe tables. */
export function Markdown(handle: Handle<MarkdownProps>) {
  return () => (
    <div
      class={classList('rf-markdown', handle.props.class)}
      data-slot="markdown"
      data-size={handle.props.size}
    >
      {renderMarkdown(handle.props.source, handle.props.size, handle.id)}
    </div>
  )
}

const wordChar = /[\p{L}\p{N}_]/u

function isSafeHref(href: string) {
  return (
    /^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href) &&
    !href.includes('\\') &&
    !Array.from(href).some((char) => {
      const code = char.charCodeAt(0)
      return code < 32 || code === 127
    })
  )
}

function findCodeSpanEnd(text: string, start: number, tickCount: number) {
  let i = start
  while (i < text.length) {
    if (text[i] === '`') {
      let run = 0
      while (i + run < text.length && text[i + run] === '`') run++
      if (run === tickCount) return i
      i += run
    } else {
      i++
    }
  }
  return -1
}

function findDelimiterEnd(text: string, from: number, delimiter: string, wordBounded: boolean) {
  let i = from
  while (i <= text.length - delimiter.length) {
    const ch = text[i]
    if (ch === '\\') {
      i += 2
      continue
    }
    if (ch === '`') {
      let ticks = 0
      while (i + ticks < text.length && text[i + ticks] === '`') ticks++
      const close = findCodeSpanEnd(text, i + ticks, ticks)
      i = close === -1 ? i + ticks : close + ticks
      continue
    }
    if (text.startsWith(delimiter, i)) {
      if (
        delimiter.length === 1 &&
        (text[i + 1] === delimiter || (i > from && text[i - 1] === delimiter))
      ) {
        i++
        continue
      }
      const after = text[i + delimiter.length]
      if (i > from && (!wordBounded || !after || !wordChar.test(after))) {
        return i
      }
    }
    i++
  }
  return -1
}

function parseLinkAt(text: string, openBracket: number) {
  let i = openBracket + 1
  let bracketDepth = 1
  while (i < text.length && bracketDepth > 0) {
    if (text[i] === '\\') {
      i += 2
      continue
    }
    if (text[i] === '`') {
      let ticks = 0
      while (i + ticks < text.length && text[i + ticks] === '`') ticks++
      const close = findCodeSpanEnd(text, i + ticks, ticks)
      i = close === -1 ? i + ticks : close + ticks
      continue
    }
    if (text[i] === '[') bracketDepth++
    else if (text[i] === ']') bracketDepth--
    i++
  }
  if (bracketDepth !== 0 || text[i] !== '(') return null
  const closeBracket = i - 1
  let destEnd = i + 1
  let parenDepth = 0
  while (destEnd < text.length) {
    const ch = text[destEnd]
    if (/\s/.test(ch)) return null
    if (ch === '(') parenDepth++
    else if (ch === ')') {
      if (parenDepth === 0) break
      parenDepth--
    }
    destEnd++
  }
  if (destEnd >= text.length || text[destEnd] !== ')' || destEnd === i + 1) return null
  return {
    label: text.slice(openBracket + 1, closeBracket),
    href: text.slice(i + 1, destEnd),
    end: destEnd + 1,
  }
}

function inline(text: string, depth = 0): RemixNode[] {
  if (depth > 8) return [text]
  const nodes: RemixNode[] = []
  let buffer = ''
  let i = 0
  let noLinks = false
  const exhausted = new Set<string>()
  const flush = () => {
    if (buffer) {
      nodes.push(buffer)
      buffer = ''
    }
  }

  while (i < text.length) {
    const ch = text[i]
    if (ch === '\\' && i + 1 < text.length && /[\\`*_~[\]!]/.test(text[i + 1])) {
      buffer += text[i + 1]
      i += 2
      continue
    }
    if (ch === '`') {
      let ticks = 0
      while (i + ticks < text.length && text[i + ticks] === '`') ticks++
      const close = findCodeSpanEnd(text, i + ticks, ticks)
      if (close !== -1) {
        flush()
        let content = text.slice(i + ticks, close)
        if (
          content.length >= 2 &&
          content.startsWith(' ') &&
          content.endsWith(' ') &&
          /[^ ]/.test(content)
        ) {
          content = content.slice(1, -1)
        }
        nodes.push(<code key={i}>{content}</code>)
        i = close + ticks
        continue
      }
      buffer += text.slice(i, i + ticks)
      i += ticks
      continue
    }
    if (!noLinks && (ch === '[' || (ch === '!' && text[i + 1] === '['))) {
      const isImage = ch === '!'
      const openBracket = isImage ? i + 1 : i
      if (text.indexOf('](', openBracket + 1) === -1) {
        noLinks = true
      } else {
        const link = parseLinkAt(text, openBracket)
        if (link) {
          flush()
          if (isImage) {
            nodes.push(...inline(link.label, depth + 1))
          } else if (isSafeHref(link.href)) {
            nodes.push(
              <a key={i} href={link.href}>
                {inline(link.label, depth + 1)}
              </a>,
            )
          } else {
            nodes.push(...inline(link.label, depth + 1))
          }
          i = link.end
          continue
        }
      }
    }
    if (ch === '*' || ch === '_' || ch === '~') {
      const two = text.slice(i, i + 2)
      const prev = i > 0 ? text[i - 1] : ''
      if ((two === '**' || two === '__' || two === '~~') && !exhausted.has(two)) {
        const wordBounded = two === '__'
        if (!wordBounded || !prev || !wordChar.test(prev)) {
          const close = findDelimiterEnd(text, i + 2, two, wordBounded)
          if (close !== -1) {
            flush()
            const inner = inline(text.slice(i + 2, close), depth + 1)
            nodes.push(two === '~~' ? <s key={i}>{inner}</s> : <strong key={i}>{inner}</strong>)
            i = close + 2
            continue
          }
          exhausted.add(two)
        }
      }
      if ((ch === '*' || ch === '_') && !exhausted.has(ch)) {
        const wordBounded = ch === '_'
        if (!wordBounded || !prev || !wordChar.test(prev)) {
          const close = findDelimiterEnd(text, i + 1, ch, wordBounded)
          if (close !== -1) {
            flush()
            nodes.push(<em key={i}>{inline(text.slice(i + 1, close), depth + 1)}</em>)
            i = close + 1
            continue
          }
          exhausted.add(ch)
        }
      }
    }
    buffer += ch
    i++
  }
  flush()
  return nodes
}

function cells(line: string) {
  const trimmed = line.trim()
  const parts: string[] = []
  let current = ''
  let backslashes = 0
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (ch === '\\') {
      backslashes++
      current += ch
      continue
    }
    if (ch === '|' && backslashes % 2 === 0) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
    backslashes = 0
  }
  parts.push(current)
  if (trimmed.startsWith('|')) parts.shift()
  if (parts.length > 1 && trimmed.endsWith('|')) {
    let trailingBackslashes = 0
    for (let i = trimmed.length - 2; i >= 0 && trimmed[i] === '\\'; i--) trailingBackslashes++
    if (trailingBackslashes % 2 === 0) parts.pop()
  }
  return parts.map((value) => value.trim().replace(/\\\|/g, '|'))
}

function isTableSeparator(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line)
}

function matchFence(line: string) {
  return /^(\s*)(`{3,})([^`]*)$/.exec(line) ?? /^(\s*)(~{3,})(.*)$/.exec(line)
}

// Reparse the available text on each revision, including an unfinished last block.
function renderMarkdown(
  source: string,
  size: ControlSize | undefined,
  idPrefix: string,
  depth = 0,
): RemixNode[] {
  if (depth >= 24) return [source]
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: RemixNode[] = []
  let index = 0
  const blockStart = (line: string) =>
    Boolean(matchFence(line)) ||
    /^(?:#{1,6}\s|>\s?|\s*(?:[-+*]|\d+[.)])\s|(?:---+|___+|\*\*\*+)\s*$)/.test(line)
  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index++
      continue
    }
    const key = index
    const fence = matchFence(line)
    if (fence) {
      index++
      const code: string[] = []
      const closingFence = new RegExp('^\\s*' + fence[2][0] + '{' + fence[2].length + ',}\\s*$')
      while (index < lines.length && !closingFence.test(lines[index])) code.push(lines[index++])
      if (index < lines.length) index++
      blocks.push(
        <CodeBlock
          key={key}
          size={size}
          code={code.join('\n')}
          language={fence[3].trim().split(/\s+/)[0] || undefined}
        />,
      )
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      const headingText = heading[2].replace(/\s+#+\s*$/, '').trim()
      const text = inline(headingText)
      const Heading = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)[heading[1].length - 1]
      blocks.push(<Heading key={key}>{text}</Heading>)
      index++
      continue
    }
    if (/^(?:---+|___+|\*\*\*+)\s*$/.test(line)) {
      blocks.push(<hr key={key} />)
      index++
      continue
    }
    if (/^>/.test(line)) {
      const quote: string[] = []
      while (index < lines.length && /^>/.test(lines[index]))
        quote.push(lines[index++].replace(/^>\s?/, ''))
      blocks.push(
        <blockquote key={key}>
          {renderMarkdown(quote.join('\n'), size, idPrefix, depth + 1)}
        </blockquote>,
      )
      continue
    }
    const list = /^(\s*)([-+*]|\d+[.)])\s+(.*)$/.exec(line)
    if (list) {
      const indentation = list[1].length
      const ordered = /^\d/.test(list[2])
      const items: RemixNode[] = []
      while (index < lines.length) {
        const item = /^(\s*)([-+*]|\d+[.)])\s+(.*)$/.exec(lines[index])
        if (!item || item[1].length !== indentation || /^\d/.test(item[2]) !== ordered) break
        const itemKey = index++
        const content = [item[3]]
        let openFence: RegExp | undefined
        const firstFence = matchFence(item[3])
        if (firstFence) {
          openFence = new RegExp(
            '^\\s*' + firstFence[2][0] + '{' + firstFence[2].length + ',}\\s*$',
          )
        }
        while (index < lines.length) {
          const current = lines[index]
          if (!current.trim()) {
            let lookahead = index + 1
            while (lookahead < lines.length && !lines[lookahead].trim()) lookahead++
            if (
              openFence ||
              (lookahead < lines.length && lines[lookahead].match(/^\s*/)![0].length > indentation)
            ) {
              content.push('')
              index++
              continue
            }
            break
          }
          const leadingSpaces = current.match(/^\s*/)![0].length
          if (leadingSpaces <= indentation && !openFence) break
          const stripped = current.slice(Math.min(leadingSpaces, indentation + 2))
          content.push(stripped)
          if (openFence) {
            if (openFence.test(stripped)) openFence = undefined
          } else {
            const nestedFence = matchFence(stripped)
            if (nestedFence) {
              openFence = new RegExp(
                '^\\s*' + nestedFence[2][0] + '{' + nestedFence[2].length + ',}\\s*$',
              )
            }
          }
          index++
        }
        const task = !ordered ? /^\[([ xX])\]\s+(.*)$/.exec(content[0]) : null
        if (task) {
          content[0] = task[2]
          const taskId = `${idPrefix}-task-${depth}-${itemKey}`
          items.push(
            <li key={itemKey} class="rf-markdown-task">
              <input
                type="checkbox"
                disabled
                aria-labelledby={taskId}
                checked={task[1].toLowerCase() === 'x'}
              />
              <div id={taskId}>{renderMarkdown(content.join('\n'), size, idPrefix, depth + 1)}</div>
            </li>,
          )
        } else {
          items.push(
            <li key={itemKey}>{renderMarkdown(content.join('\n'), size, idPrefix, depth + 1)}</li>,
          )
        }
      }
      blocks.push(
        ordered ? (
          <ol key={key} start={Number.parseInt(list[2], 10)}>
            {items}
          </ol>
        ) : (
          <ul key={key}>{items}</ul>
        ),
      )
      continue
    }
    if (line.includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const headers = cells(line)
      const alignments = cells(lines[index + 1]).map((value) =>
        value.startsWith(':') && value.endsWith(':')
          ? 'center'
          : value.endsWith(':')
            ? 'right'
            : 'left',
      )
      index += 2
      const rows: string[][] = []
      while (
        index < lines.length &&
        lines[index].trim() &&
        lines[index].includes('|') &&
        !blockStart(lines[index])
      )
        rows.push(cells(lines[index++]))
      blocks.push(
        <Table key={key} size={size} fluidHover={false}>
          <TableHeader>
            <TableRow hover={false}>
              {headers.map((header, column) => (
                <TableHead key={column} style={{ textAlign: alignments[column] }}>
                  {inline(header)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} hover={false}>
                {headers.map((_, column) => (
                  <TableCell key={column} style={{ textAlign: alignments[column] }}>
                    {inline(row[column] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>,
      )
      continue
    }
    const paragraph = [line]
    index++
    while (index < lines.length && lines[index].trim() && !blockStart(lines[index])) {
      if (lines[index].includes('|') && isTableSeparator(lines[index + 1] ?? '')) break
      paragraph.push(lines[index++])
    }
    blocks.push(<p key={key}>{inline(paragraph.join('\n'))}</p>)
  }
  return blocks
}
