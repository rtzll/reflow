import { Diagram } from '@rtzll/reflow/diagrams'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'
import { waitFor as pollUntil } from './browser-helpers.ts'

const waitFor = (predicate: () => boolean, timeout = 5000) =>
  pollUntil(predicate, { timeout, message: 'Timed out waiting for Diagram to render' })

const flow = `flowchart LR
  A[Author] --> B[Review]
  B --> C[Merge]`

it('lazily renders a Mermaid diagram with Pele and toggles between Diagram and Source', async (t) => {
  const { $, act, cleanup } = render(
    <Diagram title="Review flow" code={flow} copyable showSourceToggle />,
  )
  t.after(cleanup)

  const figure = $('.rf-diagram')!
  equal(figure.getAttribute('aria-label'), 'Review flow')
  await waitFor(
    () =>
      figure.hasAttribute('data-rf-diagram-ready') &&
      figure.querySelector('.rf-diagram-canvas svg') !== null,
  )
  ok(figure.querySelector('.rf-diagram-canvas svg')?.classList.contains('pele'))

  const sourceToggle = figure.querySelector<HTMLButtonElement>('.rf-diagram-action[aria-pressed]')!
  await act(() => sourceToggle.click())
  equal(sourceToggle.getAttribute('aria-pressed'), 'true')
  ok(figure.querySelector('.rf-diagram-source')?.textContent?.includes('A[Author] --> B[Review]'))

  await act(() => sourceToggle.click())
  await waitFor(() => figure.querySelector('.rf-diagram-canvas svg') !== null)
  equal(sourceToggle.getAttribute('aria-pressed'), 'false')
})

it('shows an accessible alert when Mermaid syntax is invalid', async (t) => {
  const { $, cleanup } = render(<Diagram code="flowchart LR\n  A -->" />)
  t.after(cleanup)

  const figure = $('.rf-diagram')!
  await waitFor(() => figure.querySelector('[role="alert"]') !== null)
  ok(figure.querySelector('[role="alert"]')?.textContent?.includes('Could not render Mermaid'))
})
