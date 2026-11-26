import { ReactionBar, type ReactionItem } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { type Handle } from 'remix/component'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

function DemoReactions(handle: Handle) {
  let items: ReactionItem[] = [
    { emoji: '👍', label: 'Thumbs up', count: 3, reacted: true },
    { emoji: '🚀', label: 'Rocket', count: 1, reacted: false },
  ]
  return () => (
    <ReactionBar
      reactions={items}
      onToggle={(emoji, nextReacted) => {
        const found = items.find((item) => item.emoji === emoji)
        if (found) {
          items = items.map((item) =>
            item.emoji === emoji
              ? { ...item, reacted: nextReacted, count: item.count + (nextReacted ? 1 : -1) }
              : item,
          )
        } else if (nextReacted) {
          items = [...items, { emoji, label: emoji, count: 1, reacted: true }]
        }
        void handle.update()
      }}
    />
  )
}

it('toggles reaction pills and adds new reactions from the picker', async (t) => {
  const { $, $$, act, cleanup } = render(<DemoReactions />)
  t.after(cleanup)

  equal($$('.rf-reaction-pill').length, 2)
  const rocket = Array.from($$('.rf-reaction-pill')).find((b) =>
    b.textContent?.includes('🚀'),
  ) as HTMLButtonElement
  equal(rocket.getAttribute('aria-pressed'), 'false')

  await act(() => {
    rocket.click()
  })
  equal(rocket.getAttribute('aria-pressed'), 'true')
  ok(rocket.textContent?.includes('2'))

  // Open + picker and add 🎉.
  await act(() => {
    ;($('.rf-reaction-add') as HTMLButtonElement).click()
  })
  ok($('.rf-reaction-picker'))
  const celebrate = Array.from($$('.rf-reaction-option')).find((b) =>
    b.textContent?.includes('🎉'),
  ) as HTMLButtonElement
  await act(() => {
    celebrate.click()
  })
  equal($('.rf-reaction-picker'), null)
  equal($$('.rf-reaction-pill').length, 3)
})

it('navigates picker with arrow keys, restores focus on Escape, and filters zero-count pills', async (t) => {
  const { $, $$, act, cleanup } = render(
    <ReactionBar
      reactions={[
        { emoji: '👍', label: 'Thumbs up', count: 2, reacted: false },
        { emoji: '👀', label: 'Eyes', count: 0, reacted: false },
      ]}
    />,
  )
  t.after(cleanup)

  equal($$('.rf-reaction-pill').length, 1, 'zero-count reactions stay hidden')

  const addBtn = $('.rf-reaction-add') as HTMLButtonElement
  await act(() => {
    addBtn.click()
  })
  const options = Array.from($$('.rf-reaction-option')) as HTMLButtonElement[]
  ok(options.length >= 2)
  equal(document.activeElement, options[0], 'opening picker focuses first reaction option')

  const picker = $('.rf-reaction-picker') as HTMLElement
  await act(() => {
    picker.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  })
  equal(document.activeElement, options[1], 'ArrowRight moves focus to next option')

  await act(() => {
    picker.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
  })
  equal(document.activeElement, options[options.length - 1], 'End focuses last option')

  await act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  equal($('.rf-reaction-picker'), null)
  equal(document.activeElement, addBtn, 'Escape restores focus to add trigger')
})

it('omits the add trigger when allowAdd is false', (t) => {
  const { $, cleanup } = render(
    <ReactionBar reactions={[{ emoji: '👍', label: 'Thumbs up', count: 1 }]} allowAdd={false} />,
  )
  t.after(cleanup)

  equal($('.rf-reaction-add'), null)
})
