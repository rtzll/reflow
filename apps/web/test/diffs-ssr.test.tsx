import { DiffView } from '@rtzll/reflow/diffs'
import { prerenderDiff } from '@rtzll/reflow/diffs/ssr'
import { equal, match, ok } from 'remix/assert'
import { renderToString } from 'remix/component/server'
import { it } from 'remix/test'

const sampleDiff = `--- a/src/cache.ts
+++ b/src/cache.ts
@@ -10,4 +10,5 @@ export function readCache(key: string) {
   const entry = store.get(key)
-  if (!entry) return null
+  if (!entry || entry.expired) return undefined
+  entry.hits += 1
   return entry.value
 }
`

it('prerenderDiff returns Declarative Shadow DOM HTML and file summary counts', async () => {
  const result = await prerenderDiff({ diff: sampleDiff, wrap: true })
  equal(result.filename, 'src/cache.ts')
  equal(result.added, 2)
  equal(result.removed, 1)
  ok(result.prerenderedHTML.includes('data-dehydrated'), 'marks pre as dehydrated for hydration')
  ok(result.prerenderedHTML.includes('data-line-type="change-addition"'))
  ok(result.prerenderedHTML.includes('data-line-type="change-deletion"'))
  ok(result.prerenderedHTML.includes(':host { color-scheme: inherit; }'))
})

it('prerenderDiff computes diffs from oldFile and newFile pairs', async () => {
  const result = await prerenderDiff({
    oldFile: { name: 'notes.ts', contents: 'const ready = false\n' },
    newFile: { name: 'notes.ts', contents: 'const ready = true\nexport { ready }\n' },
    view: 'split',
  })
  equal(result.filename, 'notes.ts')
  equal(result.added, 2)
  equal(result.removed, 1)
  ok(result.prerenderedHTML.includes('data-diff-type="split"'))
})

it('DiffView server-renders Declarative Shadow DOM with zero fallback when prerenderedHTML is given', async () => {
  const { prerenderedHTML } = await prerenderDiff({
    diff: sampleDiff,
    lineAnnotations: [{ side: 'additions', lineNumber: 12, metadata: { id: 'c1' } }],
  })
  const html = await renderToString(
    <DiffView
      diff={sampleDiff}
      prerenderedHTML={prerenderedHTML}
      lineAnnotations={[{ side: 'additions', lineNumber: 12, metadata: { id: 'c1' } }]}
      renderAnnotation={() => <div class="inline-note">Keep expiry check</div>}
    />,
  )

  ok(html.includes('data-rf-diffs-ready'), 'marks prerendered diff ready on SSR')
  ok(!html.includes('rf-diff-fallback'), 'omits plain fallback when prerendered HTML is present')
  match(html, /<diffs-container><template shadowrootmode="open">/)
  ok(html.includes('slot="annotation-additions-12"'), 'projects slotted Remix annotations on SSR')
  ok(html.includes('Keep expiry check'))
})
