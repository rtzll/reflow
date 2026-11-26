import { Waterfall, type WaterfallSpan } from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

const spans: WaterfallSpan[] = [
  {
    id: 'verify',
    label: 'verify',
    status: 'passed',
    startMs: 0,
    durationMs: 42000,
    critical: true,
    children: [
      { id: 'lint', label: 'lint & fmt', status: 'passed', startMs: 0, durationMs: 4000 },
      {
        id: 'e2e',
        label: 'e2e:chromium',
        meta: 'chromium',
        status: 'passed',
        startMs: 8000,
        durationMs: 34000,
        critical: true,
      },
    ],
  },
  {
    id: 'publish',
    label: 'publish',
    status: 'running',
    startMs: 42000,
    durationMs: 12000,
    critical: true,
  },
]

it('renders proportional timing bars, collapses child spans, and emits selection on click and keyboard', async (t) => {
  const selected: string[] = []
  const { $, $$, act, cleanup } = render(
    <Waterfall
      label="Release waterfall"
      spans={spans}
      defaultValue="verify"
      onValueChange={(id) => selected.push(id)}
    />,
  )
  t.after(cleanup)

  equal($$('.rf-waterfall-row').length, 4)
  ok($('.rf-waterfall-bar[data-critical="true"]'))

  // Collapse the verify job -> hides its 2 child spans.
  const toggle = $('[data-waterfall-id="verify"] .rf-waterfall-toggle') as HTMLButtonElement
  await act(() => toggle.click())
  equal($$('.rf-waterfall-row').length, 2)

  // Re-expand and click publish row.
  await act(() => toggle.click())
  equal($$('.rf-waterfall-row').length, 4)

  const publishRow = $('[data-waterfall-id="publish"]') as HTMLElement
  await act(() => publishRow.click())
  deepEqual(selected, ['publish'])
  equal(publishRow.getAttribute('aria-selected'), 'true')
})
