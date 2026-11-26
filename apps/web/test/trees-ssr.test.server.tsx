import { FileTree } from '@rtzll/reflow/trees'
import { prerenderFileTree } from '@rtzll/reflow/trees/ssr'
import { equal, match, ok } from 'remix/assert'
import { renderToString } from 'remix/component/server'
import { it } from 'remix/test'

const samplePaths = [
  'packages/reflow/src/diffs-ssr.ts',
  'packages/reflow/src/diffs.tsx',
  'apps/web/test/diffs-ssr.test.server.tsx',
]

it('prerenderFileTree returns Declarative Shadow DOM payload with compacted folders and colored row decorations', () => {
  const payload = prerenderFileTree({
    id: 'test-tree',
    paths: samplePaths,
    defaultValue: samplePaths[0],
    gitStatus: [
      { path: 'packages/reflow/src/diffs-ssr.ts', status: 'added' },
      { path: 'packages/reflow/src/diffs.tsx', status: 'modified' },
    ],
    rowDecorations: {
      'packages/reflow/src/diffs.tsx': {
        text: '+12 −5',
        parts: [
          { text: '+12', color: 'var(--rf-success)' },
          { text: ' ' },
          { text: '−5', color: 'var(--rf-danger)' },
        ],
      },
    },
    size: 'compact',
  })

  equal(payload.id, 'test-tree')
  ok(payload.shadowHtml.includes('packages/reflow/src'), 'flattens empty directory chain')
  ok(payload.shadowHtml.includes('diffs.tsx'))
  ok(payload.shadowHtml.includes('+12'))
  ok(payload.shadowHtml.includes('−5'))
  ok(payload.shadowHtml.includes('var(--rf-success)'))
  ok(payload.shadowHtml.includes('var(--rf-danger)'))
  ok(payload.shadowHtml.includes(':host { color-scheme: inherit; }'))
})

it('FileTree server-renders Declarative Shadow DOM with zero fallback when prerendered is given', async () => {
  const prerendered = prerenderFileTree({
    id: 'ssr-file-tree',
    paths: samplePaths,
    defaultValue: samplePaths[1],
  })
  const html = await renderToString(
    <FileTree paths={samplePaths} value={samplePaths[1]} prerendered={prerendered} />,
  )

  ok(html.includes('data-rf-trees-ready'), 'marks prerendered file tree ready on SSR')
  ok(!html.includes('class="rf-file-tree-fallback"'), 'omits plain fallback when prerendered')
  match(
    html,
    /<file-tree-container id="ssr-file-tree"[^>]*data-file-tree-virtualized="true"[^>]*><template shadowrootmode="open">/,
  )
  ok(html.includes('diffs.tsx'))
})
