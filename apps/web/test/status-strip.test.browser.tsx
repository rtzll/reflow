import { StatusStrip, type StatusStripItem } from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

const items: StatusStripItem[] = [
  { id: 'r1', status: 'passed', label: 'Run #4575', value: 180_000, detail: 'main · 3m' },
  { id: 'r2', status: 'failed', label: 'Run #4576', value: 240_000, detail: 'main · 4m' },
  { id: 'r3', status: 'passed', label: 'Run #4577', value: 210_000, detail: 'main · 3m 30s' },
]

it('renders duration-scaled status bars, updates readout, and emits selection', async (t) => {
  const selected: string[] = []
  const { $, $$, act, cleanup } = render(
    <StatusStrip
      label="Recent CI runs"
      items={items}
      defaultValue="r3"
      showReadout
      onValueChange={(id) => selected.push(id)}
    />,
  )
  t.after(cleanup)

  equal($$('.rf-status-strip-bar').length, 3)
  ok($('.rf-status-strip-readout')?.textContent?.includes('Run #4577'))

  const failedBar = $('[data-strip-id="r2"]') as HTMLButtonElement
  await act(() => failedBar.click())
  deepEqual(selected, ['r2'])
  equal(failedBar.getAttribute('aria-selected'), 'true')
  ok($('.rf-status-strip-readout')?.textContent?.includes('Run #4576'))
})
