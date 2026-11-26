import { Badge, Button, Icon, Timeline } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { on } from 'remix/component'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('renders ordered timeline items with tones, metadata, details, and actions', async (t) => {
  let clicked = 0
  const { $, $$, act, cleanup } = render(
    <Timeline
      label="PR history"
      size="compact"
      items={[
        {
          id: 'push',
          icon: <Icon name="file" size={12} />,
          title: 'Pushed 2 commits',
          meta: <Badge size="compact">a84c1bb</Badge>,
          timestamp: '10m ago',
          detail: 'Added zero-flash SSR diff helper.',
        },
        {
          id: 'check',
          tone: 'success',
          title: 'Checks passed',
          action: (
            <Button
              size="compact"
              mix={on('click', () => {
                clicked++
              })}
            >
              Inspect
            </Button>
          ),
        },
      ]}
    />,
  )
  t.after(cleanup)

  const list = $('.rf-timeline')!
  equal(list.tagName, 'OL')
  equal(list.getAttribute('aria-label'), 'PR history')
  equal(list.getAttribute('data-density'), 'compact')

  const items = $$('.rf-timeline-item')
  equal(items.length, 2)
  equal(items[0]!.getAttribute('data-tone'), 'neutral')
  equal(items[1]!.getAttribute('data-tone'), 'success')
  ok(items[0]!.querySelector('.rf-timeline-marker[data-has-icon]'))
  ok(items[1]!.querySelector('.rf-timeline-dot'))
  equal(items[0]!.querySelector('.rf-timeline-time')?.textContent, '10m ago')
  equal(
    items[0]!.querySelector('.rf-timeline-detail')?.textContent,
    'Added zero-flash SSR diff helper.',
  )

  const btn = items[1]!.querySelector('button') as HTMLButtonElement
  await act(() => btn.click())
  equal(clicked, 1)
})
