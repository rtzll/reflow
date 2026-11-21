import type { Element, ElementContent, Nodes as HastNodes, Root as HastRoot } from 'hast'
import { toJsxRuntime, type Components } from 'hast-util-to-jsx-runtime'
import type { Nodes as MdastNodes, Root as MdastRoot } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import type { Handle, RemixNode } from 'remix/component'
import { Fragment, jsx, jsxs } from 'remix/component/jsx-runtime'
import { unified } from 'unified'
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
  // Footnote IDs are prefixed per instance so several replies can share a page.
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkReflow)
    .use(remarkRehype, {
      clobberPrefix: handle.id + '-',
      footnoteLabelProperties: { className: ['rf-basic-sr-only'] },
      // Raw HTML stays visible as text instead of being rendered or dropped. An HTML block
      // reads as its own paragraph.
      handlers: {
        html: (_state, node, parent) => {
          const text = { type: 'text' as const, value: node.value }
          return parent && blockContainers.has(parent.type)
            ? { type: 'element', tagName: 'p', properties: {}, children: [text] }
            : text
        },
      },
    })
    .use(rehypeReflow)

  return () => (
    <div
      class={classList('rf-markdown', handle.props.class)}
      data-slot="markdown"
      data-size={handle.props.size}
    >
      {toJsxRuntime(processor.runSync(processor.parse(handle.props.source)), {
        Fragment,
        jsx: jsx as never,
        jsxs: jsxs as never,
        components,
        passNode: true,
        elementAttributeNameCase: 'html',
        stylePropertyNameCase: 'dom',
      })}
    </div>
  )
}

// Nodes whose HTML children are blocks rather than inline markup.
const blockContainers = new Set(['root', 'blockquote', 'listItem', 'footnoteDefinition'])

// Only web, mail, same-site path and fragment links, checked before remark
// normalizes the destination.
function safeUrl(url: string) {
  return (
    /^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(url) &&
    !url.includes('\\') &&
    !Array.from(url).some((char) => char.charCodeAt(0) < 32)
  )
}

// Unwrap unsafe links and show images as links, so Markdown never loads remote images.
function remarkReflow() {
  function rewrite(node: MdastNodes): MdastNodes[] {
    if (node.type === 'definition' && !safeUrl(node.url)) return []
    if (node.type === 'image' || node.type === 'imageReference') {
      const label = { type: 'text' as const, value: node.alt || ('url' in node ? node.url : '') }
      if (node.type === 'imageReference')
        return [
          {
            type: 'linkReference',
            identifier: node.identifier,
            label: node.label,
            referenceType: node.referenceType,
            children: [label],
          },
        ]
      return safeUrl(node.url) ? [{ type: 'link', url: node.url, children: [label] }] : [label]
    }
    if ('children' in node) {
      const children = node.children.flatMap(rewrite)
      if (node.type === 'link' && !safeUrl(node.url)) return children
      ;(node as { children: MdastNodes[] }).children = children
    }
    return [node]
  }
  return (tree: MdastRoot) => {
    rewrite(tree)
  }
}

function text(node: HastNodes): string {
  if (node.type === 'text') return node.value
  return 'children' in node ? node.children.map(text).join('') : ''
}

// Give each task its label and the layout Markdown's stylesheet expects:
// a read-only checkbox beside the item's content.
function rehypeReflow() {
  function visit(node: HastNodes) {
    if (!('children' in node)) return
    for (const child of node.children) visit(child)
    if (node.type !== 'element' || node.tagName !== 'li') return
    const classes = node.properties.className
    if (!Array.isArray(classes) || !classes.includes('task-list-item')) return
    // In a loose list the checkbox sits inside the item's first paragraph.
    const host: Element =
      node.children.find(
        (child): child is Element => child.type === 'element' && child.tagName === 'p',
      ) ?? node
    const index = host.children.findIndex(
      (child) => child.type === 'element' && child.tagName === 'input',
    )
    if (index === -1) return
    const [input] = host.children.splice(index, 1) as [Element]
    const content = node.children.filter(
      (child) => !(child.type === 'element' && ['ul', 'ol'].includes(child.tagName)),
    )
    input.properties.ariaLabel = content.map(text).join('').trim()
    node.properties.className = ['rf-markdown-task']
    node.children = [
      input,
      { type: 'element', tagName: 'div', properties: {}, children: node.children },
    ] as ElementContent[]
  }
  return (tree: HastRoot) => visit(tree)
}

interface PartProps {
  node: Element
  children?: RemixNode
  align?: string
  style?: Record<string, string>
}

// Reflow's components in place of the native table elements, keeping column alignment.
function part(
  Component: (handle: Handle<never>) => () => RemixNode,
  extra: Record<string, unknown> = {},
) {
  return (handle: Handle<PartProps>) => () => {
    const { children, align, style } = handle.props
    return jsx(Component as never, {
      ...extra,
      children,
      style: align ? { ...style, textAlign: align } : style,
    })
  }
}

function Fence(handle: Handle<{ node: Element }>) {
  return () => {
    const pre = handle.props.node
    const code = pre.children.find(
      (child): child is Element => child.type === 'element' && child.tagName === 'code',
    )
    const className = code?.properties.className
    const language = (Array.isArray(className) ? className : [])
      .map(String)
      .find((name) => name.startsWith('language-'))
      ?.slice('language-'.length)
    return <CodeBlock code={text(code ?? pre).replace(/\n$/, '')} language={language} />
  }
}

const components = {
  pre: Fence,
  table: part(Table, { fluidHover: false }),
  thead: part(TableHeader),
  tbody: part(TableBody),
  tr: part(TableRow, { hover: false }),
  th: part(TableHead),
  td: part(TableCell),
} as unknown as Partial<Components>
