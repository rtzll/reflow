import { MarkdownEditor } from '@rtzll/reflow/markdown'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('switches between Write, Preview, and Split modes, applies toolbar formatting, renders custom code blocks, and submits', async (t) => {
  let submitted = ''
  const { $, $$, act, cleanup } = render(
    <MarkdownEditor
      defaultValue="Architecture notes"
      renderCodeBlock={({ code, language }) =>
        language === 'mermaid' ? <div data-custom-mermaid="">{code}</div> : undefined
      }
      onSubmit={(value) => {
        submitted = value
      }}
    />,
  )
  t.after(cleanup)

  const textarea = $('.rf-md-editor-textarea') as HTMLTextAreaElement
  const readValue = () => textarea.value
  equal(readValue(), 'Architecture notes')

  // Select "notes" and click Bold toolbar button.
  textarea.setSelectionRange(13, 18)
  const boldBtn = Array.from($$('.rf-md-editor-tool')).find(
    (btn) => btn.getAttribute('aria-label') === 'Bold',
  ) as HTMLButtonElement
  await act(() => {
    boldBtn.click()
  })
  equal(readValue(), 'Architecture **notes**')

  // Insert Mermaid diagram via toolbar.
  textarea.setSelectionRange(readValue().length, readValue().length)
  const mermaidBtn = Array.from($$('.rf-md-editor-tool')).find(
    (btn) => btn.getAttribute('aria-label') === 'Insert Mermaid diagram',
  ) as HTMLButtonElement
  await act(() => {
    mermaidBtn.click()
  })
  ok(readValue().includes('```mermaid'))

  // Switch to Split mode and verify custom Mermaid preview renders alongside editor.
  const splitRadio = Array.from($$('input[type="radio"]')).find(
    (input) => (input as HTMLInputElement).value === 'split',
  ) as HTMLInputElement
  await act(() => {
    splitRadio.click()
  })
  ok($('.rf-md-editor-preview strong')?.textContent === 'notes')
  ok($('[data-custom-mermaid]'))

  // Submit via button.
  await act(() => {
    ;($('.rf-md-editor-footer button') as HTMLButtonElement).click()
  })
  ok(submitted.includes('Architecture **notes**'))
  ok(submitted.includes('```mermaid'))
})
