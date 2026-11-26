import { Confirmation, type ConfirmationState } from '@rtzll/reflow'
import { deepEqual, equal } from 'remix/assert'
import type { Handle } from 'remix/component'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'
import { waitFor } from './browser-helpers.ts'

describe('Confirmation', () => {
  it('asks in a named group and keeps the answer itself, moving focus to it', async (t) => {
    const calls: string[] = []
    const { $, $$, act, cleanup } = render(
      <form>
        <Confirmation
          title="Run pnpm build?"
          description="Builds the library into dist/."
          name="build"
          onApprove={() => calls.push('approve')}
          onDeny={() => calls.push('deny')}
        />
      </form>,
    )
    t.after(cleanup)
    const group = $('[role="group"]') as HTMLElement
    equal(
      document.getElementById(group.getAttribute('aria-labelledby')!)?.textContent,
      'Run pnpm build?',
    )
    equal(
      document.getElementById(group.getAttribute('aria-describedby')!)?.textContent,
      'Builds the library into dist/.',
    )
    equal(
      $('[role="status"], [role="alert"]')?.textContent ?? '',
      '',
      'the question is not announced',
    )
    deepEqual(
      Array.from($$('button'), (button) => [button.textContent, button.dataset.variant]),
      [
        ['Approve', 'primary'],
        ['Deny', 'ghost'],
      ],
    )
    equal($('input[name="build"]'), null, 'unanswered, the form has no value')

    const approve = $$('button')[0] as HTMLButtonElement
    approve.focus()
    await act(() => approve.click())
    deepEqual(calls, ['approve'])
    equal($$('button').length, 0)
    const answer = $('.rf-confirmation-answer') as HTMLElement
    equal(answer.textContent, 'Approved')
    equal(
      answer.closest('[role="status"]') !== null || answer.getAttribute('role') === 'status',
      true,
    )
    await waitFor(() => document.activeElement === answer, 'focus moves to the answer')
    equal(answer.tabIndex, -1)
    equal(($('input[name="build"]') as HTMLInputElement).value, 'approved')
    equal(new FormData($('form') as HTMLFormElement).get('build'), 'approved')
  })

  it('follows a controlled state and custom labels', async (t) => {
    let state: ConfirmationState = 'requested'
    const calls: string[] = []
    let owner: Handle
    function Controlled(handle: Handle) {
      owner = handle
      return () => (
        <Confirmation
          title="Send the summary to Ada?"
          state={state}
          approveLabel="Send"
          denyLabel="Keep draft"
          approvedLabel="Sent"
          deniedLabel="Kept as a draft"
          onApprove={() => calls.push('approve')}
          onDeny={() => calls.push('deny')}
        />
      )
    }
    const { $, $$, act, cleanup } = render(<Controlled />)
    t.after(cleanup)
    deepEqual(
      Array.from($$('button'), (button) => button.textContent),
      ['Send', 'Keep draft'],
    )
    // Controlled, a press only reports; the owner decides.
    await act(() => ($$('button')[1] as HTMLButtonElement).click())
    deepEqual(calls, ['deny'])
    equal($$('button').length, 2)
    state = 'denied'
    await act(() => owner!.update())
    equal($('.rf-confirmation-answer')?.textContent, 'Kept as a draft')
  })
})
