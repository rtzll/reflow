import { Button, EmptyState, Icon } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { on } from 'remix/component'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('renders title, description, icon, and actions with accessible heading linkage', async (t) => {
  let cleared = 0
  const { $, act, cleanup } = render(
    <EmptyState
      surface="outlined"
      size="compact"
      icon={<Icon name="search" size={16} />}
      title="No matching files"
      description="Clear the filter to see every file in the diff."
      actions={
        <Button
          size="compact"
          mix={on('click', () => {
            cleared++
          })}
        >
          Clear filter
        </Button>
      }
    />,
  )
  t.after(cleanup)

  const section = $('.rf-empty-state')!
  equal(section.getAttribute('data-surface'), 'outlined')
  equal(section.getAttribute('data-density'), 'compact')
  const title = $('.rf-empty-state-title')!
  equal(title.textContent, 'No matching files')
  equal(section.getAttribute('aria-labelledby'), title.id)
  equal(
    $('.rf-empty-state-description')?.textContent,
    'Clear the filter to see every file in the diff.',
  )
  ok($('.rf-empty-state-icon'))

  const button = section.querySelector('button') as HTMLButtonElement
  await act(() => button.click())
  equal(cleared, 1)
})
