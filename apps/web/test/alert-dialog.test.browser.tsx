import { AlertDialog } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('focuses Cancel and invokes the action only on confirmation', async (t) => {
  let removed = 0
  const { $, act, cleanup } = render(
    <AlertDialog
      trigger="Delete"
      title="Delete draft?"
      description="This clears the draft."
      confirmLabel="Delete draft"
      onConfirm={() => {
        removed++
      }}
    />,
  )
  t.after(cleanup)
  const trigger = $('button') as HTMLButtonElement
  trigger.focus()
  await act(() => trigger.click())
  const dialog = $('dialog[role="alertdialog"]') as HTMLDialogElement
  ok(dialog?.matches(':modal'))
  equal(document.activeElement?.textContent?.trim(), 'Cancel')
  equal(dialog.getAttribute('aria-describedby'), dialog.querySelector('p')?.id)
  await act(() => (document.activeElement as HTMLButtonElement).click())
  equal(removed, 0)
  ok(!dialog.open)
  await act(() => trigger.click())
  const confirm = Array.from(dialog.querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === 'Delete draft',
  )!
  await act(() => confirm.click())
  equal(removed, 1)
  ok(!dialog.open)
})
