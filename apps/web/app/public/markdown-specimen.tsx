import { Button, Switch, Textarea } from '@rtzll/reflow'
import { on, type Handle, type RemixNode } from 'remix/component'

const sample = `# Getting started with Reflow

**Runtime** Remix 3 · **Styles** CSS · **License** MIT

## Setup

- [x] Install the type scale and styles
- [x] Add a dropdown and a dialog
- [ ] Move every list to fluid hover
  - [x] Sidebar
  - [ ] Command menu
- [ ] Switch dense screens to compact

## How it moves

Every component shares **three motion tiers**, and hover *glides* to the item under your cursor. A label gains weight without moving its neighbors. The [motion page](/docs/motion) describes the tokens.

> Shared motion keeps the interface feeling consistent.

### What you get

- Native Remix components
  - Accessible keyboard behavior
  - Form-aware controls
- A size ladder of 36px and 28px
- A skill for your coding agent

### Motion tiers

| Speed | Perceived duration | Used for |
| --- | --- | --- |
| fast | 80ms | Hover and focus |
| moderate | 160ms | Menus and tabs |
| slow | 240ms | Dialogs and drawers |

## Install

Install Reflow from npm and serve its stylesheet through Remix. Replace ~~duplicated controls~~ repeated markup with reusable components.

\`\`\`tsx
import { Button } from '@rtzll/reflow'

<Button>Continue</Button>
\`\`\`

### Next steps

1. Read the component examples
2. Install the skill
   1. Let it inspect the project
   2. Apply the relevant guidance
3. Review keyboard and motion behavior

---

Found an issue? Record a reproducible example.
`

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
      const safe = /^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href)
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

/** The specimen's Markdown subset emits JSX nodes, so raw HTML stays text. */
export function renderMarkdown(source: string): RemixNode[] {
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
      while (index < lines.length && !lines[index].trim().startsWith(fence[2]))
        code.push(lines[index++])
      if (index < lines.length) index++
      blocks.push(
        <pre key={key} tabIndex={0}>
          <code>{code.join('\n')}</code>
        </pre>,
      )
      continue
    }
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (heading) {
      const text = inline(heading[2])
      const headings = [
        <h1 key={key}>{text}</h1>,
        <h2 key={key}>{text}</h2>,
        <h3 key={key}>{text}</h3>,
        <h4 key={key}>{text}</h4>,
        <h5 key={key}>{text}</h5>,
        <h6 key={key}>{text}</h6>,
      ]
      blocks.push(headings[heading[1].length - 1])
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
      blocks.push(<blockquote key={key}>{renderMarkdown(quote.join('\n'))}</blockquote>)
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
            <li key={itemKey} class="system-markdown-task">
              <input
                type="checkbox"
                aria-label={task[2]}
                defaultChecked={task[1].toLowerCase() === 'x'}
              />
              <div>{renderMarkdown(content.join('\n'))}</div>
            </li>,
          )
        } else items.push(<li key={itemKey}>{renderMarkdown(content.join('\n'))}</li>)
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
        <div key={key} class="system-markdown-table">
          <table>
            <thead>
              <tr>
                {headers.map((header, column) => (
                  <th key={column} style={{ textAlign: alignments[column] }}>
                    {inline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((_, column) => (
                    <td key={column} style={{ textAlign: alignments[column] }}>
                      {inline(row[column] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
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

export function MarkdownSpecimen(handle: Handle) {
  let source = sample
  let editing = false
  let revision = 0
  return () => (
    <div class="system-markdown-specimen">
      <div class="system-markdown-toolbar">
        <Switch
          label="Edit Markdown"
          checked={editing}
          onCheckedChange={(value) => {
            editing = value
            handle.update()
          }}
        />
        <Button
          variant="ghost"
          size="compact"
          mix={on('click', () => {
            source = sample
            revision++
            handle.update()
          })}
        >
          Reset sample
        </Button>
      </div>
      {editing && (
        <Textarea
          aria-label="Markdown source"
          value={source}
          rows={18}
          spellCheck={false}
          mix={on<HTMLTextAreaElement, 'input'>('input', (event) => {
            source = event.currentTarget.value
            handle.update()
          })}
        />
      )}
      <article key={revision} class="system-markdown" aria-label="Rendered Markdown">
        {renderMarkdown(source)}
      </article>
    </div>
  )
}
