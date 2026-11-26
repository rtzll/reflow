import { RelativeTime } from '@rtzll/reflow'
import { equal } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('renders deterministic relative labels when now is supplied and preserves ISO dateTime', (t) => {
  const now = Date.UTC(2026, 10, 26, 15, 0, 0)
  const fourMinAgo = Date.UTC(2026, 10, 26, 14, 56, 0)
  const { $, cleanup } = render(<RelativeTime date={fourMinAgo} now={now} tooltip={false} />)
  t.after(cleanup)

  const time = $('.rf-relative-time') as HTMLTimeElement
  equal(time.textContent, '4m ago')
  equal(time.getAttribute('datetime'), '2026-11-26T14:56:00.000Z')
  equal(time.getAttribute('title'), '2026-11-26 14:56 UTC')
})
