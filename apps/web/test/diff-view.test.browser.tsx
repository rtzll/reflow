import { DiffView, parseUnifiedDiff } from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

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

it('parses a unified diff, extracts the filename, numbers lines, and announces change counts', (t) => {
  const parsed = parseUnifiedDiff(sampleDiff)
  equal(parsed.filename, 'src/cache.ts')
  equal(parsed.hunks.length, 1)
  equal(parsed.hunks[0].lines[1].oldLine, 11)
  equal(parsed.hunks[0].lines[3].newLine, 11)

  const { $, $$, cleanup } = render(<DiffView diff={sampleDiff} />)
  t.after(cleanup)

  const region = $('[role="region"]')!
  equal(region.getAttribute('aria-label'), 'src/cache.ts')
  equal($('.rf-diff-folder')?.textContent, 'src/')
  equal($('.rf-diff-file')?.textContent, 'cache.ts')
  equal($('.rf-diff-added')?.textContent, '+3')
  equal($('.rf-diff-removed')?.textContent, '−2')
  ok(
    $('.rf-diff-counts .rf-basic-sr-only')?.textContent?.includes('3 lines added, 2 lines removed'),
  )
  equal($$('.rf-diff-line[data-type="add"]').length, 3)
  equal($$('.rf-diff-line[data-type="remove"]').length, 2)
  equal($$('.rf-diff-line[data-type="context"]').length, 2)
})

it('switches between unified and split views and pairs uneven change runs', async (t) => {
  const seen: string[] = []
  const { $, $$, act, cleanup } = render(
    <DiffView diff={sampleDiff} viewToggle onViewChange={(view) => seen.push(view)} />,
  )
  t.after(cleanup)

  equal($('.rf-diff-view')?.getAttribute('data-view'), 'unified')
  const splitRadio = $('input[type="radio"][value="split"]') as HTMLInputElement
  await act(() => splitRadio.click())

  deepEqual(seen, ['split'])
  equal($('.rf-diff-view')?.getAttribute('data-view'), 'split')
  // 2 removed vs 3 added produces 3 paired change rows, with 1 empty cell on the old side.
  equal($$('.rf-diff-split-row').length, 5)
  equal($$('.rf-diff-split-cell[data-side="old"][data-type="empty"]').length, 1)
  equal($$('.rf-diff-split-cell[data-side="new"][data-type="add"]').length, 3)
})

it('renders structured hunks with highlighted tokens and optional line numbers', (t) => {
  const { $, $$, cleanup } = render(
    <DiffView
      filename="notes.ts"
      lineNumbers={false}
      wrap
      hunks={[
        {
          lines: [
            {
              type: 'add',
              content: 'const ready = true',
              tokens: [
                { content: 'const ', style: 'color: var(--rf-accent)' },
                { content: 'ready = true' },
              ],
            },
          ],
        },
      ]}
    />,
  )
  t.after(cleanup)

  equal($$('.rf-diff-num').length, 0)
  ok($('.rf-diff-view')?.hasAttribute('data-wrap'))
  equal($('.rf-diff-code')?.textContent, 'const ready = true')
  equal($$('.rf-diff-code > span').length, 2)
})
