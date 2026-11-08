import { AskUserQuestions, CommandMenu, type AskUserAnswer } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { on, type Handle } from 'remix/component'
import { describe, it } from 'remix/test'
import { Example } from '../app/public/examples.tsx'

function press(node: Element, key: string, options: KeyboardEventInit = {}) {
  node.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options }),
  )
}

function textInput(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  input.value = value
  input.dispatchEvent(new InputEvent('input', { bubbles: true }))
}

describe('Reflow flows', () => {
  it('opens the command palette by shortcut and selects a filtered command', async (t) => {
    const selected: string[] = []
    const { $, act, cleanup } = render(
      <CommandMenu
        trigger="Commands"
        footer
        filters={['Account', 'Actions']}
        items={[
          { value: 'home', label: 'Home', action: 'Open Home' },
          { value: 'help', label: 'Help', group: 'Actions' },
          { value: 'billing', label: 'Billing', group: 'Account', keywords: ['account'] },
          {
            value: 'security',
            label: 'Security',
            group: 'Account',
            keywords: ['account'],
            disabled: true,
          },
          { value: 'profile', label: 'Profile', group: 'Account', keywords: ['account'] },
        ]}
        onSelect={(value) => selected.push(value)}
      />,
    )
    t.after(cleanup)

    const trigger = $('button[aria-haspopup="dialog"]')
    const input = $('input[role="combobox"]')
    const dialog = $('dialog')
    ok(trigger instanceof HTMLButtonElement)
    ok(input instanceof HTMLInputElement)
    ok(dialog instanceof HTMLDialogElement)

    trigger.focus()
    await act(() => press(trigger, 'k', { ctrlKey: true }))
    equal(dialog.open, true)
    equal(document.activeElement, input)

    const footer = $('.rf-command-footer')
    equal(
      Array.from(footer?.querySelectorAll('kbd') ?? [], (cap) => cap.textContent)
        .join(' ')
        .replace('Enter', '↵'),
      '↑ ↓ ← → Esc ↵',
    )
    equal($('.rf-command-footer-action > span')?.textContent, 'Open Home')
    await act(() => press(input, 'ArrowLeft'))
    equal($('[role="tab"][aria-selected="true"]')?.textContent, 'Actions')
    equal($('.rf-command-footer-action > span')?.textContent, 'Help')
    await act(() => press(input, 'ArrowRight', { shiftKey: true }))
    equal($('[role="tab"][aria-selected="true"]')?.textContent, 'Actions')
    await act(() => press(input, 'ArrowRight'))
    equal($('[role="tab"][aria-selected="true"]')?.textContent, 'All')
    await act(() => textInput(input, 'account'))
    equal($('[role="option"][aria-selected="true"]')?.textContent, 'Billing')
    await act(() => press(input, 'ArrowDown'))
    equal($('[role="option"][aria-selected="true"]')?.textContent, 'Profile')
    equal($('.rf-command-footer-action > span')?.textContent, 'Profile')
    await act(() => press(input, 'Enter'))
    equal(selected.join(','), 'profile')
    equal(dialog.open, false)
    equal(document.activeElement, trigger)
  })

  it('filters multiple result groups together without changing their labels', async (t) => {
    const { $, act, cleanup } = render(
      <CommandMenu
        filters={['Pages', 'Actions']}
        items={[
          { value: 'home', label: 'Home', group: 'Pages' },
          { value: 'motion', label: 'Motion', group: 'System', filter: 'Pages' },
          { value: 'button', label: 'Button', group: 'Components', filter: 'Pages' },
          { value: 'copy', label: 'Copy', group: 'Actions' },
        ]}
      />,
    )
    t.after(cleanup)
    const input = $('input[role="combobox"]')
    ok(input instanceof HTMLInputElement)
    await act(() => press(input, 'ArrowRight'))
    equal($('[role="tab"][aria-selected="true"]')?.textContent, 'Pages')
    equal(
      Array.from(document.querySelectorAll('.rf-command-results [role="group"]'), (group) =>
        group.getAttribute('aria-label'),
      ).join(','),
      'Pages,System,Components',
    )
    equal(document.querySelectorAll('.rf-command-results [role="option"]').length, 3)
    await act(() => press(input, 'ArrowRight'))
    equal($('[role="option"]')?.textContent, 'Copy')
  })

  it('preserves answers across steps and reports custom text and skips', async (t) => {
    let submitted: Record<string, AskUserAnswer> | undefined
    const { $, act, cleanup } = render(
      <AskUserQuestions
        questions={[
          {
            id: 'theme',
            title: 'Choose a theme',
            options: [
              { id: 'light', title: 'Light' },
              { id: 'dark', title: 'Dark' },
            ],
          },
          {
            id: 'features',
            title: 'Select features',
            options: [{ id: 'motion', title: 'Motion' }],
            multiSelect: true,
            allowOther: true,
          },
          { id: 'name', title: 'Name the workspace', freeText: true, skippable: true },
        ]}
        onComplete={(answers) => {
          submitted = answers
        }}
      />,
    )
    t.after(cleanup)

    const button = (text: string) => {
      const node = Array.from($('.rf-questions')?.querySelectorAll('button') ?? []).find(
        (candidate) => candidate.textContent?.trim().startsWith(text),
      )
      ok(node instanceof HTMLButtonElement, `Expected button "${text}"`)
      return node
    }
    // A single choice answers and advances in one step.
    const dark = $('[role="radio"][aria-keyshortcuts="2"]')
    ok(dark instanceof HTMLElement)
    await act(() => dark.click())
    equal($('.rf-question-title')?.textContent, 'Select features')

    const motion = $('[role="checkbox"]')
    const custom = $('.rf-question-other textarea')
    ok(motion instanceof HTMLElement)
    ok(custom instanceof HTMLTextAreaElement)
    await act(() => motion.click())
    equal(motion.getAttribute('aria-checked'), 'true')
    await act(() => textInput(custom, 'Layering'))

    await act(() => button('Back').click())
    equal($('[role="radio"][aria-checked="true"]')?.getAttribute('aria-keyshortcuts'), '2')
    await act(() => ($('[role="radio"][aria-keyshortcuts="2"]') as HTMLElement).click())
    equal(($('.rf-question-other textarea') as HTMLTextAreaElement).value, 'Layering')
    equal($('[role="checkbox"]')?.getAttribute('aria-checked'), 'true')
    const continueButton = button('Continue')
    ok(continueButton.hasAttribute('aria-keyshortcuts'))
    await act(() =>
      continueButton.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          ctrlKey: true,
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    )
    equal($('.rf-question-title')?.textContent, 'Name the workspace')
    await act(() => button('Skip').click())

    equal(submitted?.theme.selectedIds.join(','), 'dark')
    equal(submitted?.features.selectedIds.join(','), 'motion')
    equal(submitted?.features.otherText, 'Layering')
    equal(submitted?.name.skipped, true)
  })

  it('moves between rows with the arrow keys and answers with the number keys', async (t) => {
    let submitted: Record<string, AskUserAnswer> | undefined
    const { $, act, cleanup } = render(
      <AskUserQuestions
        questions={[
          {
            id: 'a',
            title: 'First',
            options: [
              { id: 'one', title: 'One' },
              { id: 'two', title: 'Two' },
            ],
          },
          { id: 'b', title: 'Second', options: [{ id: 'x', title: 'X' }] },
        ]}
        onComplete={(answers) => {
          submitted = answers
        }}
      />,
    )
    t.after(cleanup)
    const rows = document.querySelectorAll<HTMLElement>('[role="radio"]')
    equal(rows[0].tabIndex, 0)
    equal(rows[1].tabIndex, -1)
    rows[0].focus()
    await act(() => press(rows[0], 'ArrowDown'))
    equal(document.activeElement, rows[1])
    await act(() => press(rows[1], 'ArrowRight'))
    equal($('.rf-question-title')?.textContent, 'Second')
    await act(() => press(document.body, '1'))
    equal(submitted?.a.skipped, true)
    equal(submitted?.b.selectedIds.join(), 'x')
  })
})

it('keeps the gallery question flow on step three until Continue and preserves the selected answers', async (t) => {
  const { $, $$, act, cleanup } = render(<Example slug="ask-user-questions" showcase gallery />)
  t.after(cleanup)

  const progress = () => $('.rf-questions-header')?.textContent?.trim()
  const option = (role: 'radio' | 'checkbox', name: string) => {
    const row = Array.from($$(`[role="${role}"]`)).find((element) =>
      element.textContent?.trim().startsWith(name),
    )
    ok(row instanceof HTMLElement, `Expected ${name} ${role}`)
    return row
  }

  equal(progress(), 'Question 1 of 8')
  await act(() => option('radio', 'Designer').click())
  await act(() => option('radio', 'Rounded').click())
  equal(progress(), 'Question 3 of 8')
  const next = $('.rf-question-submit')
  ok(next instanceof HTMLButtonElement)
  equal($('.rf-question-submit-label')?.firstChild?.textContent, 'Continue')
  equal(next.disabled, true)

  await act(() => option('checkbox', 'InputMessage').click())
  await act(() => option('checkbox', 'ThinkingSteps').click())
  equal(progress(), 'Question 3 of 8')
  equal(next.disabled, false)
  await act(() => next.click())
  equal(progress(), 'Question 4 of 8')
  const back = Array.from($$('button')).find((button) => button.textContent?.trim() === 'Back')
  ok(back instanceof HTMLButtonElement)
  await act(() => back.click())
  equal(option('checkbox', 'InputMessage').getAttribute('aria-checked'), 'true')
  equal(option('checkbox', 'ThinkingSteps').getAttribute('aria-checked'), 'true')
})

it('supports externally controlled question steps, answers, completion, and reset', async (t) => {
  let submitted: Record<string, AskUserAnswer> | undefined
  function ControlledQuestions(handle: Handle) {
    let index = 0
    let answers: Record<string, AskUserAnswer> = {}
    return () => (
      <>
        <button
          type="button"
          data-jump
          mix={on('click', () => {
            index = 1
            answers = { name: { questionId: 'name', selectedIds: [], otherText: 'Prefilled' } }
            handle.update()
          })}
        >
          Jump to name
        </button>
        <button
          type="button"
          data-reset
          mix={on('click', () => {
            index = 0
            answers = {}
            handle.update()
          })}
        >
          Reset externally
        </button>
        <AskUserQuestions
          currentIndex={index}
          answers={answers}
          onCurrentIndexChange={(next) => {
            index = next
            handle.update()
          }}
          onAnswersChange={(next) => {
            answers = next
            handle.update()
          }}
          onComplete={(next) => {
            submitted = next
          }}
          questions={[
            { id: 'theme', title: 'Choose a theme', options: [{ id: 'dark', title: 'Dark' }] },
            { id: 'name', title: 'Name the workspace', freeText: true, freeTextMultiline: false },
          ]}
        />
      </>
    )
  }
  const { $, act, cleanup } = render(<ControlledQuestions />)
  t.after(cleanup)
  await act(() => ($('[role=radio]') as HTMLElement).click())
  equal($('.rf-questions h3')?.textContent, 'Name the workspace')
  const name = $('.rf-question-free textarea') as HTMLTextAreaElement
  await act(() => textInput(name, 'Studio'))
  await act(() => press(name, 'Enter'))
  equal(submitted?.theme.selectedIds.join(), 'dark')
  equal(submitted?.name.otherText, 'Studio')
  equal($('.rf-questions h3')?.textContent, 'Name the workspace')
  await act(() => ($('[data-reset]') as HTMLButtonElement).click())
  equal($('.rf-questions h3')?.textContent, 'Choose a theme')
  equal($('[role=radio]')?.getAttribute('aria-checked'), 'false')
  await act(() => ($('[data-jump]') as HTMLButtonElement).click())
  equal(($('.rf-question-free textarea') as HTMLTextAreaElement).value, 'Prefilled')
})

it('keeps a controlled answer unchanged when the parent rejects a selection', async (t) => {
  let proposed: Record<string, AskUserAnswer> | undefined
  const { $, act, cleanup } = render(
    <AskUserQuestions
      currentIndex={0}
      answers={{}}
      onAnswersChange={(next) => {
        proposed = next
      }}
      questions={[{ id: 'choice', title: 'Choose', options: [{ id: 'one', title: 'One' }] }]}
    />,
  )
  t.after(cleanup)
  const option = $('[role=radio]') as HTMLElement
  await act(() => option.click())
  equal(proposed?.choice.selectedIds.join(), 'one')
  equal(option.getAttribute('aria-checked'), 'false')
})
