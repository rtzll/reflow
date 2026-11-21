import { Button, CodeBlock, Toolbar, type HighlightedCode } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'

interface FilePreviewProps {
  filename: string
  code: string | HighlightedCode
}

export function FilePreview(handle: Handle<FilePreviewProps>) {
  let wrap = false
  let lineNumbers = false
  let feedback: { filename: string; message: string } | undefined
  async function copy() {
    const { filename, code } = handle.props
    try {
      await navigator.clipboard.writeText(typeof code === 'string' ? code : code.code)
      feedback = { filename, message: 'Copied ' + filename }
    } catch {
      feedback = { filename, message: 'Could not copy ' + filename }
    }
    if (!handle.signal.aborted) void handle.update()
  }
  return () => (
    <div class="example-file-preview">
      <Toolbar label="File preview">
        <Button
          size="compact"
          variant="ghost"
          aria-pressed={wrap}
          mix={on('click', () => {
            wrap = !wrap
            if (!handle.signal.aborted) void handle.update()
          })}
        >
          Wrap lines
        </Button>
        <Button
          size="compact"
          variant="ghost"
          aria-pressed={lineNumbers}
          mix={on('click', () => {
            lineNumbers = !lineNumbers
            if (!handle.signal.aborted) void handle.update()
          })}
        >
          Line numbers
        </Button>
        <Button size="compact" variant="ghost" mix={on('click', copy)}>
          Copy
        </Button>
      </Toolbar>
      <CodeBlock
        filename={handle.props.filename}
        code={handle.props.code}
        wrap={wrap}
        lineNumbers={lineNumbers}
        copyable={false}
        size="compact"
      />
      <span role="status" class="example-note">
        {feedback?.filename === handle.props.filename ? feedback.message : ''}
      </span>
    </div>
  )
}
