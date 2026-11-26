import { DiffView } from '@rtzll/reflow/diffs'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'
import { waitFor as pollUntil } from './browser-helpers.ts'

const waitFor = (predicate: () => boolean, timeout = 5000) =>
  pollUntil(predicate, { timeout, message: 'Timed out waiting for DiffView to mount' })

const sampleDiff = `--- a/src/cache.ts
+++ b/src/cache.ts
@@ -10,5 +10,6 @@ export function readCache(key: string) {
   const entry = store.get(key)
-  if (!entry) return null
-  return entry.value
+  if (!entry || entry.expired) return undefined
+  entry.hits += 1
+  return entry.value
 }
`

it('renders a unified diff with @pierre/diffs, extracts filename, and announces change counts', async (t) => {
  const { $, cleanup } = render(<DiffView diff={sampleDiff} />)
  t.after(cleanup)

  const figure = $('.rf-diff-view')!
  equal(figure.getAttribute('aria-label'), 'src/cache.ts')
  equal($('.rf-diff-folder')?.textContent, 'src/')
  equal($('.rf-diff-file')?.textContent, 'cache.ts')
  equal($('.rf-diff-added')?.textContent, '+3')
  equal($('.rf-diff-removed')?.textContent, '−2')
  equal($('.rf-diff-counts .rf-basic-sr-only')?.textContent, '3 added, 2 removed')

  await waitFor(() => figure.hasAttribute('data-rf-diffs-ready'))
  const container = figure.querySelector('diffs-container')
  ok(container?.shadowRoot, 'mounts @pierre/diffs inside a Shadow DOM container')
  await waitFor(() => container.shadowRoot!.querySelectorAll('[data-line]').length > 0)
  equal(
    container.shadowRoot!.querySelectorAll('[data-line][data-line-type="change-addition"]').length,
    3,
  )
  equal(
    container.shadowRoot!.querySelectorAll('[data-line][data-line-type="change-deletion"]').length,
    2,
  )
})

it('switches between unified and split views and updates @pierre/diffs diffStyle', async (t) => {
  const seen: string[] = []
  const { $, act, cleanup } = render(
    <DiffView diff={sampleDiff} viewToggle onViewChange={(view) => seen.push(view)} />,
  )
  t.after(cleanup)

  const figure = $('.rf-diff-view')!
  await waitFor(() => figure.hasAttribute('data-rf-diffs-ready'))
  const container = figure.querySelector('diffs-container')!
  await waitFor(() => container.shadowRoot!.querySelector('[data-diff-type]') !== null)
  equal(figure.getAttribute('data-view'), 'unified')
  equal(
    container.shadowRoot!.querySelector('[data-diff-type]')?.getAttribute('data-diff-type'),
    'single',
  )

  const splitRadio = $('input[type="radio"][value="split"]') as HTMLInputElement
  await act(() => splitRadio.click())

  deepEqual(seen, ['split'])
  equal(figure.getAttribute('data-view'), 'split')
  await waitFor(
    () =>
      container.shadowRoot!.querySelector('[data-diff-type]')?.getAttribute('data-diff-type') ===
      'split',
  )
})

it('computes diffs from oldFile and newFile and forwards lineNumbers and wrap options', async (t) => {
  const { $, cleanup } = render(
    <DiffView
      oldFile={{ name: 'notes.ts', contents: 'const ready = false\n' }}
      newFile={{ name: 'notes.ts', contents: 'const ready = true\nexport { ready }\n' }}
      lineNumbers={false}
      wrap
    />,
  )
  t.after(cleanup)

  const figure = $('.rf-diff-view')!
  await waitFor(() => figure.hasAttribute('data-rf-diffs-ready'))
  equal(figure.getAttribute('aria-label'), 'notes.ts')
  equal($('.rf-diff-added')?.textContent, '+2')
  equal($('.rf-diff-removed')?.textContent, '−1')
  ok(figure.hasAttribute('data-wrap'))

  const container = figure.querySelector('diffs-container')!
  await waitFor(() => container.shadowRoot!.querySelector('[data-diff]') !== null)
  const diffRoot = container.shadowRoot!.querySelector('[data-diff]')!
  equal(diffRoot.getAttribute('data-overflow'), 'wrap')
  ok(diffRoot.hasAttribute('data-disable-line-numbers'))
})

it('supports collapsible diff body, headerPrefix, copyable button, and slotted Remix annotations', async (t) => {
  const states: boolean[] = []
  let copied = 0
  const originalClipboard = navigator.clipboard
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => {} },
  })
  t.after(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    })
  })

  const { $, act, cleanup } = render(
    <DiffView
      diff={sampleDiff}
      collapsible
      onCollapsedChange={(next) => states.push(next)}
      headerPrefix={<span class="status-tag">M</span>}
      copyable
      onCopy={() => {
        copied++
      }}
      lineAnnotations={[{ side: 'additions', lineNumber: 12, metadata: { author: 'Ada' } }]}
      renderAnnotation={(annotation) => (
        <div class="test-annotation">
          Note on line {annotation.lineNumber} ({(annotation.metadata as { author: string }).author}
          )
        </div>
      )}
    />,
  )
  t.after(cleanup)

  const figure = $('.rf-diff-view')!
  await waitFor(() => figure.hasAttribute('data-rf-diffs-ready'))

  equal($('.status-tag')?.textContent, 'M')
  const annotationSlot = figure.querySelector('[slot="annotation-additions-12"]')
  ok(annotationSlot, 'mounts Remix annotation into matching @pierre/diffs slot')
  equal(annotationSlot.textContent, 'Note on line 12 (Ada)')

  const container = figure.querySelector('diffs-container')!
  await waitFor(
    () => container.shadowRoot!.querySelector('slot[name="annotation-additions-12"]') !== null,
  )

  const copyButton = $('.rf-diff-copy') as HTMLButtonElement
  await act(() => copyButton.click())
  await waitFor(() => copied === 1)
  equal(figure.getAttribute('data-state'), 'copied')

  const collapseButton = $('.rf-diff-collapse') as HTMLButtonElement
  equal(collapseButton.getAttribute('aria-expanded'), 'true')
  await act(() => collapseButton.click())
  deepEqual(states, [true])
  equal(figure.getAttribute('data-collapsed'), 'true')
  equal(collapseButton.getAttribute('aria-expanded'), 'false')
  ok($('.rf-diff-stage')?.hasAttribute('hidden'))
})
