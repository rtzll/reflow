import { CodeBlock, Resizable, Tree, type HighlightedCode } from '@rtzll/reflow'
import type { Handle } from 'remix/component'
import { CodeBlockCard } from './code-block-example.tsx'

const projectFiles = [
  { value: 'app', label: 'app', children: [{ value: 'source', label: 'code-block-example.tsx' }] },
  { value: 'readme', label: 'README.md' },
]

export function ProjectTreeExample(handle: Handle<{ source?: HighlightedCode }>) {
  let file = handle.props.source ? 'source' : 'readme'
  return () => (
    <Resizable
      class="example-project-tree"
      label="Resize project files"
      defaultValue={34}
      min={25}
      max={55}
      first={
        <Tree
          label="Project files"
          items={projectFiles}
          defaultExpanded={['app']}
          value={file}
          size="compact"
          onValueChange={(value) => {
            file = value
            void handle.update()
          }}
        />
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
