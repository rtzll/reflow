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
