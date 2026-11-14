import { FileInput } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('submits accepted dropped files, reports rejections and clears on reset', async (t) => {
  const { $, act, cleanup } = render(
    <form>
      <FileInput label="Documents" name="documents" accept=".txt" multiple maxFiles={2} required />
    </form>,
  )
  t.after(cleanup)
  const form = $('form') as HTMLFormElement
  const input = $('input[type="file"]') as HTMLInputElement
  equal(input.labels?.[0]?.textContent, 'Documents')
  const files = new DataTransfer()
  files.items.add(new File(['hello'], 'notes.txt'))
  files.items.add(new File(['image'], 'photo.png', { type: 'image/png' }))
  await act(() =>
    input.parentElement?.dispatchEvent(
      new DragEvent('drop', { dataTransfer: files, bubbles: true, cancelable: true }),
    ),
  )
  const accepted = new FormData(form).getAll('documents') as File[]
  equal(accepted.map((file) => file.name).join(), 'notes.txt')
  ok($('[role="alert"]')?.textContent?.includes('photo.png'))
  await act(() => form.reset())
  equal(input.files?.length, 0)
  ok(input.validity.valueMissing)
  equal($('button[aria-label="Remove notes.txt"]'), null)
})
