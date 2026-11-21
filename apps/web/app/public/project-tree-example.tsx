import {
  CodeBlock,
  ContextMenu,
  Resizable,
  Tree,
  type ContextMenuProps,
  type HighlightedCode,
} from '@rtzll/reflow'
import type { Handle } from 'remix/component'
import { play } from 'cuelume'
import { CodeBlockCard } from './code-block-example.tsx'

const projectFiles = [
  { value: 'app', label: 'app', children: [{ value: 'source', label: 'code-block-example.tsx' }] },
  { value: 'readme', label: 'README.md' },
]

export function projectFileMenuCode(size: ContextMenuProps['size'] = 'default') {
  return `const files = ${JSON.stringify(projectFiles, null, 2)}
let file = 'readme'
function openFile(value: string) {
  file = value
  void handle.update()
}

<ContextMenu label="File actions" target='[role="treeitem"][aria-selected]' size="${size}"
  items={[{ value: 'open', label: 'Open file' }]}
  onSelect={(_action, row) => {
    const value = row.dataset.treeValue
    if (value !== undefined) openFile(value)
  }}>
  <Tree label="Project files" items={files} value={file} defaultExpanded={['app']}
    size="${size}" onValueChange={openFile} />
</ContextMenu>`
}

export function ProjectTreeExample(
  handle: Handle<{ source?: HighlightedCode; size?: ContextMenuProps['size'] }>,
) {
  let file = handle.props.source ? 'source' : 'readme'
  let expanded = ['app']
  function openFile(value: string) {
    play('select', { emphasis: 'subtle' })
    file = value
    void handle.update()
  }
  return () => (
    <Resizable
      class="example-project-tree"
      label="Resize project files"
      defaultValue={34}
      min={25}
      max={55}
      onValueCommit={() => play('select', { emphasis: 'subtle', volume: 0.35 })}
      first={
        <ContextMenu
          label="File actions"
          target='[role="treeitem"][aria-selected]'
          size={handle.props.size ?? 'compact'}
          items={[{ value: 'open', label: 'Open file' }]}
          onSelect={(_action, row) => {
            const value = row.dataset.treeValue
            if (value !== undefined) openFile(value)
          }}
        >
          <Tree
            label="Project files"
            items={projectFiles}
            defaultExpanded={['app']}
            onExpandedChange={(next) => {
              play(next.length > expanded.length ? 'open' : 'close', { emphasis: 'subtle' })
              expanded = next
            }}
            value={file}
            size={handle.props.size ?? 'compact'}
            onValueChange={openFile}
          />
        </ContextMenu>
      }
      second={
        file === 'readme' ? (
          <CodeBlock
            key="readme"
            language="md"
            filename="README.md"
            size="compact"
            wrap
            code={'# Reflow\n\nFluid components for Remix.\n\npnpm add @rtzll/reflow'}
          />
        ) : handle.props.source ? (
          <CodeBlockCard key="source" source={handle.props.source} />
        ) : (
          <CodeBlock
            key="source"
            filename="code-block-example.tsx"
            size="compact"
            wrap
            code={
              'export function Example() {\n  return () => <CodeBlock code="Hello, Reflow" />\n}'
            }
          />
        )
      }
    />
  )
}
