import {
  CodeBlock,
  ContextMenu,
  Icon,
  Resizable,
  Tree,
  toast,
  type ContextMenuProps,
  type HighlightedCode,
} from '@rtzll/reflow'
import type { Handle } from 'remix/component'
import { play } from 'cuelume'
import { FilePreview } from './file-preview.tsx'
import { CodeBlockCard } from './code-block-example.tsx'

const sourcePath = 'app/code-block-example.tsx'
const readmePath = 'README.md'
const readme =
  '# Reflow\n\nFluid components for Remix, with shared keyboard navigation, accessible focus management, and a customizable theme.\n\npnpm add @rtzll/reflow'
const sourceExample =
  'export function Example() {\n  return () => <CodeBlock filename="README.md" code="# Reflow" />\n}'
const projectFiles = [
  {
    value: 'app',
    label: 'app',
    children: [{ value: sourcePath, label: 'code-block-example.tsx' }],
  },
  { value: readmePath, label: readmePath },
]

const fileActions: ContextMenuProps['items'] = [
  { value: 'open', label: 'Open file', icon: <Icon name="file" />, shortcut: 'Enter' },
  {
    value: 'copy',
    label: 'Copy',
    icon: <Icon name="copy" />,
    separatorBefore: true,
    children: [
      { value: 'copy-name', label: 'File name', icon: <Icon name="file" /> },
      { value: 'copy-path', label: 'Relative path', icon: <Icon name="folder" /> },
    ],
  },
]

export function projectFileMenuCode(size: ContextMenuProps['size'] = 'default') {
  return `const files = ${JSON.stringify(projectFiles, null, 2)}
const fileRows = '[role="treeitem"][aria-selected]'
let file = 'README.md'
function openFile(value: string) {
  file = value
  void handle.update()
}

async function selectAction(action: string, row: HTMLElement) {
  const path = row.dataset.treeValue
  if (!path) return
  if (action === 'open') return openFile(path)
  const text = action === 'copy-name' ? path.slice(path.lastIndexOf('/') + 1) : path
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied ' + text)
  } catch {
    toast.error('Could not copy to the clipboard')
  }
}

const fileActions = [
  { value: 'open', label: 'Open file', icon: <Icon name="file" />, shortcut: 'Enter' },
  { value: 'copy', label: 'Copy', icon: <Icon name="copy" />, separatorBefore: true, children: [
    { value: 'copy-name', label: 'File name', icon: <Icon name="file" /> },
    { value: 'copy-path', label: 'Relative path', icon: <Icon name="folder" /> },
  ] },
]

<ContextMenu label="File actions" target={fileRows} size="${size}"
  items={fileActions} onSelect={selectAction}>
  <Tree label="Project files" items={files} value={file} defaultExpanded={['app']}
    size="${size}" onValueChange={openFile} />
</ContextMenu>
<Toaster />`
}

export function ProjectTreeExample(
  handle: Handle<{ source?: HighlightedCode; size?: ContextMenuProps['size']; toolbar?: boolean }>,
) {
  let file = handle.props.source ? sourcePath : readmePath
  let expanded = ['app']
  function openFile(value: string) {
    play('select', { emphasis: 'subtle' })
    file = value
    void handle.update()
  }
  async function selectAction(action: string, row: HTMLElement) {
    const path = row.dataset.treeValue
    if (!path) return
    if (action === 'open') return openFile(path)
    const text = action === 'copy-name' ? path.slice(path.lastIndexOf('/') + 1) : path
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied ' + text)
    } catch {
      toast.error('Could not copy to the clipboard')
    }
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
          items={fileActions}
          onSelect={selectAction}
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
        handle.props.toolbar ? (
          <FilePreview
            filename={file}
            code={file === readmePath ? readme : (handle.props.source ?? sourceExample)}
          />
        ) : file === readmePath ? (
          <CodeBlock
            key="readme"
            language="md"
            filename="README.md"
            size="compact"
            wrap
            code={readme}
          />
        ) : handle.props.source ? (
          <CodeBlockCard key="source" source={handle.props.source} />
        ) : (
          <CodeBlock
            key="source"
            filename="code-block-example.tsx"
            size="compact"
            wrap
            code={sourceExample}
          />
        )
      }
    />
  )
}
