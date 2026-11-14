import { Button, Spinner } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('names standalone loading and keeps a loading button’s name', (t) => {
  const { $, cleanup } = render(
    <div>
      <Spinner label="Loading results" />
      <Button loading>Save changes</Button>
    </div>,
  )
  t.after(cleanup)
  const status = $('[role="status"]')
  equal(status?.getAttribute('aria-label'), 'Loading results')
  const button = $('button')
  equal(button?.textContent?.trim(), 'Save changes')
  equal(button?.getAttribute('aria-busy'), 'true')
  ok(button?.querySelector('[data-slot="spinner"][aria-hidden="true"]'))
})
