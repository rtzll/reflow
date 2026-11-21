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
      {renderMarkdown(handle.props.source)}
    </div>
  )
}

function inline(text: string, depth = 0): RemixNode[] {
  if (depth > 8) return [text]
  const nodes: RemixNode[] = []
  const pattern =
    /\\([\\`*_~\[\]])|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|\*([^*]+)\*|_([^_]+)_|\[([^\]]+)\]\(([^\s)]+)\)/g
  let offset = 0
  for (const match of text.matchAll(pattern)) {
    nodes.push(text.slice(offset, match.index))
    if (match[1]) nodes.push(match[1])
    else if (match[2]) nodes.push(<code key={match.index}>{match[2]}</code>)
    else if (match[3] || match[4])
      nodes.push(<strong key={match.index}>{inline(match[3] ?? match[4], depth + 1)}</strong>)
    else if (match[5]) nodes.push(<s key={match.index}>{inline(match[5], depth + 1)}</s>)
    else if (match[6] || match[7])
      nodes.push(<em key={match.index}>{inline(match[6] ?? match[7], depth + 1)}</em>)
    else {
      const href = match[9]
      const safe =
        /^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href) &&
        !href.includes('\\') &&
        !Array.from(href).some((char) => char.charCodeAt(0) < 32)
      nodes.push(
        safe ? (
          <a key={match.index} href={href}>
            {inline(match[8], depth + 1)}
          </a>
        ) : (
          match[8]
        ),
      )
    }
    offset = match.index! + match[0].length
  }
  nodes.push(text.slice(offset))
  return nodes
}

function cells(line: string) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((value) => value.trim().replace(/\\\|/g, '|'))
}

// Reparse the available text on each revision, including an unfinished last block.
function renderMarkdown(source: string, depth = 0): RemixNode[] {
  if (depth >= 24) return [source]
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: RemixNode[] = []
  let index = 0
  const blockStart = (line: string) =>
    /^(?:#{1,6}\s|```|~~~|>\s?|\s*(?:[-+*]|\d+[.)])\s|(?:---+|___+|\*\*\*+)\s*$)/.test(line)
  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index++
      continue
    }
    const key = index
    const fence = /^(\s*)(```+|~~~+)(.*)$/.exec(line)
    if (fence) {
      index++
      const code: string[] = []
      const closingFence = new RegExp('^\\s*' + fence[2][0] + '{' + fence[2].length + ',}\\s*$')
      while (index < lines.length && !closingFence.test(lines[index])) code.push(lines[index++])
      if (index < lines.length) index++
      blocks.push(
        <CodeBlock key={key} code={code.join('\n')} language={fence[3].trim().split(/\s+/)[0]} />,
      )
      continue
    }
    const heading = /^(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/.exec(line)
    if (heading) {
      const text = inline(heading[2])
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
      blocks.push(<blockquote key={key}>{renderMarkdown(quote.join('\n'), depth + 1)}</blockquote>)
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
        while (
          index < lines.length &&
          lines[index].trim() &&
          lines[index].match(/^\s*/)![0].length > indentation
        ) {
          content.push(lines[index++].slice(indentation + 2))
        }
        const task = /^\[([ xX])\]\s+(.*)$/.exec(content[0])
        if (task) {
          content[0] = task[2]
          items.push(
            <li key={itemKey} class="rf-markdown-task">
              <input
                type="checkbox"
                key={task[1]}
                aria-label={task[2]}
                defaultChecked={task[1].toLowerCase() === 'x'}
              />
              <div>{renderMarkdown(content.join('\n'), depth + 1)}</div>
            </li>,
          )
        } else items.push(<li key={itemKey}>{renderMarkdown(content.join('\n'), depth + 1)}</li>)
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
    if (
      line.includes('|') &&
      index + 1 < lines.length &&
      /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1])
    ) {
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
      while (index < lines.length && lines[index].includes('|') && lines[index].trim())
        rows.push(cells(lines[index++]))
      blocks.push(
        <Table key={key} fluidHover={false}>
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
      if (lines[index].includes('|') && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1] ?? '')) break
      paragraph.push(lines[index++])
    }
    blocks.push(<p key={key}>{inline(paragraph.join('\n'))}</p>)
  }
  return blocks
}
