import { CommentThread } from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('renders comments, applies suggestions, submits replies, and resolves/reopens cleanly', async (t) => {
  const replies: string[] = []
  const resolvedStates: boolean[] = []
  let applied = 0

  const { $, $$, act, cleanup } = render(
    <CommentThread
      context="src/diffs-ssr.ts:144"
      outdated
      defaultResolved={false}
      onResolvedChange={(next) => resolvedStates.push(next)}
      onReply={(body) => replies.push(body)}
      comments={[
        {
          id: 'c1',
          author: { name: 'Noah Park', role: 'Reviewer' },
          timestamp: '8m ago',
          body: 'Strip leading prefixes before returning filename.',
          suggestion: {
            removed: 'const filename = fileDiff.name',
            added: "const filename = fileDiff.name.replace(/^[ab]\\//, '')",
            onApply: () => {
              applied++
            },
          },
        },
      ]}
    />,
  )
  t.after(cleanup)

  equal($('.rf-comment-context')?.textContent, 'src/diffs-ssr.ts:144')
  equal($$('.rf-comment-entry').length, 1)
  ok($('.rf-comment-suggestion'))

  const applyBtn = Array.from($$('button')).find((b) =>
    b.textContent?.includes('Apply suggestion'),
  ) as HTMLButtonElement
  await act(() => applyBtn.click())
  equal(applied, 1)

  const textarea = $('.rf-comment-reply-input') as HTMLTextAreaElement
  await act(() => {
    textarea.value = 'Done in the latest push.'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
  const replyBtn = Array.from($$('button')).find(
    (b) => b.textContent?.trim() === 'Reply',
  ) as HTMLButtonElement
  await act(() => replyBtn.click())
  deepEqual(replies, ['Done in the latest push.'])

  const resolveBtn = Array.from($$('button')).find(
    (b) => b.textContent?.trim() === 'Resolve',
  ) as HTMLButtonElement
  await act(() => resolveBtn.click())
  deepEqual(resolvedStates, [true])
  equal($('.rf-comment-thread')?.getAttribute('data-resolved'), 'true')
  ok(!$('.rf-comment-collapse')?.hasAttribute('data-open'))

  const showBtn = Array.from($$('button')).find((b) =>
    b.textContent?.includes('Show thread'),
  ) as HTMLButtonElement
  await act(() => showBtn.click())
  ok($('.rf-comment-collapse')?.hasAttribute('data-open'))

  const reopenBtn = Array.from($$('button')).find(
    (b) => b.textContent?.trim() === 'Reopen',
  ) as HTMLButtonElement
  await act(() => reopenBtn.click())
  deepEqual(resolvedStates, [true, false])
  equal($('.rf-comment-thread')?.getAttribute('data-resolved'), null)
})
