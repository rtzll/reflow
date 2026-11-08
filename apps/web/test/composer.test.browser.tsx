import { ChatMessage, InputMessage } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { type Handle } from 'remix/component'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('queues while streaming, dispatches on stop, and restores history drafts', async (t) => {
  const sent: string[] = []
  function Example(handle: Handle) {
    let status: 'idle' | 'streaming' = 'streaming'
    return () => (
      <InputMessage
        status={status}
        history={['Earlier message']}
        onStop={() => {
          status = 'idle'
          handle.update()
        }}
        onSend={(message) => {
          sent.push(message.text)
        }}
      />
    )
  }
  const { $, act, cleanup } = render(<Example />)
  t.after(cleanup)
  const textarea = $('textarea') as HTMLTextAreaElement
  const form = $('form') as HTMLFormElement
  await act(() => {
    textarea.value = 'Next message'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(() => form.requestSubmit())
  equal(sent.length, 0)
  ok($('[aria-label="Queued messages"]:not([hidden])'))
  equal(textarea.value, '')
  await act(() => ($('button[aria-label="Stop response"]') as HTMLButtonElement).click())
  for (let frame = 0; frame < 20 && !sent.length; frame++)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  equal(sent.join(), 'Next message')
  equal($('[aria-label="Queued messages"]:not([hidden])'), null)
  await act(() => {
    textarea.value = 'Current draft'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(() =>
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
    ),
  )
  equal(textarea.value, 'Earlier message')
  await act(() =>
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    ),
  )
  equal(textarea.value, 'Current draft')
})

it('filters dropped files and renders an image attachment preview', async (t) => {
  const { $, act, cleanup } = render(<InputMessage onSend={() => {}} />)
  t.after(cleanup)
  const transfer = new DataTransfer()
  transfer.items.add(new File(['image'], 'sample.png', { type: 'image/png' }))
  transfer.items.add(new File(['text'], 'notes.txt', { type: 'text/plain' }))
  await act(() =>
    $('form')!.dispatchEvent(
      new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }),
    ),
  )
  const preview = $('img[alt="sample.png"]') as HTMLImageElement
  ok(preview.src.startsWith('blob:'))
  equal($('[role=alert]')?.textContent, 'Some files have an unsupported type.')
  equal($('button[aria-label="Remove notes.txt"]'), null)
  await act(() => ($('button[aria-label="Remove sample.png"]') as HTMLButtonElement).click())
  // The tile fades out first, then leaves the list.
  for (let frame = 0; frame < 60 && $('.rf-composer-files li'); frame++)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  equal($('.rf-composer-files li'), null)
  equal($('.rf-composer-files-region[data-open]'), null)
})

it('retains a failed queued message and ignores concurrent send attempts', async (t) => {
  let attempts = 0
  let rejectSend: (error: Error) => void = () => {}
  const { $, act, cleanup } = render(
    <InputMessage
      status="streaming"
      defaultValue="Retry me"
      onSend={() => {
        attempts++
        return new Promise<void>((_resolve, reject) => {
          rejectSend = reject
        })
      }}
    />,
  )
  t.after(cleanup)
  await act(() => ($('form') as HTMLFormElement).requestSubmit())
  const send = $('.rf-queue-actions button:last-child') as HTMLButtonElement
  await act(() => {
    send.click()
    send.click()
  })
  equal(attempts, 1)
  await act(() => rejectSend(new Error('Offline')))
  for (let frame = 0; frame < 30 && !$('[role=alert]'); frame++)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  ok($('[aria-label="Queued messages"]:not([hidden])'))
  equal($('[role=alert]')?.textContent, 'Could not send the message. Try again.')
})

it('stops reporting attachment and queue changes after the composer unmounts', async () => {
  const file = new File(['image'], 'sample.png', { type: 'image/png' })
  const send = Promise.withResolvers<void>()
  let fileChanges = 0
  let queueChanges = 0
  const { $, act, cleanup } = render(
    <InputMessage
      files={[file]}
      queue={[{ id: 'queued', text: 'Queued message', files: [] }]}
      onFilesChange={() => fileChanges++}
      onQueueChange={() => queueChanges++}
      onSend={() => send.promise}
    />,
  )
  try {
    await act(() => ($('button[aria-label="Remove sample.png"]') as HTMLButtonElement).click())
    ok($('.rf-composer-files li[data-exiting]'))
    await act(() => ($('.rf-queue-actions button:last-child') as HTMLButtonElement).click())
    equal(queueChanges, 1)
  } finally {
    cleanup()
  }
  send.reject(new Error('Offline'))
  await new Promise((resolve) => setTimeout(resolve, 450))
  equal(fileChanges, 0)
  equal(queueChanges, 1)
})

it('morphs a queued message into its sent bubble and cleans up the transition', async (t) => {
  function Example(handle: Handle) {
    let sent: { text: string; queuedId?: string } | undefined
    return () => (
      <>
        <InputMessage
          transitionMessages
          status="streaming"
          defaultValue="Morph this message"
          onSend={async (message) => {
            sent = message
            await handle.update()
          }}
        />
        {sent && (
          <ChatMessage role="user" transitionId={sent.queuedId} animate={false}>
            {sent.text}
          </ChatMessage>
        )}
      </>
    )
  }
  const { $, act, cleanup } = render(<Example />)
  t.after(cleanup)
  await act(() => ($('form') as HTMLFormElement).requestSubmit())
  const source = $('.rf-queue li') as HTMLElement
  const transitionName = source.style.viewTransitionName
  ok(transitionName.startsWith('rf-message-'))
  await act(() => ($('.rf-queue-actions button:last-child') as HTMLButtonElement).click())
  for (
    let frame = 0;
    frame < 90 &&
    (!$('.rf-chat-body') || document.documentElement.hasAttribute('data-rf-message-transition'));
    frame++
  ) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  equal($('.rf-chat-body')?.textContent, 'Morph this message')
  equal(($('.rf-chat-body') as HTMLElement).style.viewTransitionName, transitionName)
  equal($('.rf-queue:not([hidden])'), null)
  equal(document.documentElement.hasAttribute('data-rf-message-transition'), false)
})
