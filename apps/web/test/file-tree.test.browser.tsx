import { FileTree } from '@rtzll/reflow/trees'
import { equal, notEqual, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'
import { waitFor as pollUntil } from './browser-helpers.ts'

const waitFor = (predicate: () => boolean, timeout = 5000) =>
  pollUntil(predicate, { timeout, message: 'Timed out waiting for FileTree to mount' })

const paths = [
  'packages/reflow/src/diffs-ssr.ts',
  'packages/reflow/src/diffs.tsx',
  'apps/web/test/diffs-ssr.test.server.tsx',
]

it('mounts @pierre/trees in Shadow DOM with compacted folders, colored decorations, and selection', async (t) => {
  const selected: string[] = []
  const { $, cleanup } = render(
    <div style={{ '--rf-success': '#22c55e', '--rf-danger': '#ef4444' } as Record<string, string>}>
      <FileTree
        label="Changed files"
        paths={paths}
        defaultValue={paths[0]}
        gitStatus={[
          { path: paths[0], status: 'added' },
          { path: paths[1], status: 'modified' },
        ]}
        rowDecorations={{
          [paths[1]]: {
            text: '+12 −5',
            parts: [
              { text: '+12', color: 'var(--rf-success)' },
              { text: ' ' },
              { text: '−5', color: 'var(--rf-danger)' },
            ],
          },
        }}
        onValueChange={(path) => selected.push(path)}
      />
    </div>,
  )
  t.after(cleanup)

  const wrapper = $('.rf-file-tree')!
  equal(wrapper.getAttribute('aria-label'), 'Changed files')
  await waitFor(() => wrapper.hasAttribute('data-rf-trees-ready'))

  const container = wrapper.querySelector('file-tree-container')
  ok(container?.shadowRoot, 'mounts @pierre/trees inside a Shadow DOM host')
  await waitFor(() => container.shadowRoot!.querySelectorAll('[data-item-path]').length >= 5)

  const renderedPaths = [...container.shadowRoot!.querySelectorAll('[data-item-path]')].map((el) =>
    el.getAttribute('data-item-path'),
  )
  ok(
    renderedPaths.includes('packages/reflow/src/'),
    `compacts single-child folder chains (got: ${renderedPaths.join(', ')})`,
  )
  ok(
    renderedPaths.includes('packages/reflow/src/diffs.tsx'),
    `renders diffs.tsx row (got: ${renderedPaths.join(', ')})`,
  )

  const spans = [
    ...container.shadowRoot!.querySelectorAll('[data-item-section="decoration"] > span > span'),
  ]
  const added = spans.find((el) => el.textContent === '+12')
  const removed = spans.find((el) => el.textContent === '−5')
  ok(added && removed, 'renders colored +loc and -loc decoration parts')
  notEqual(getComputedStyle(added).color, getComputedStyle(removed).color)

  const targetRow = container.shadowRoot!.querySelector<HTMLElement>(
    `[data-item-path="${paths[1]}"]`,
  )
  ok(targetRow, 'renders diffs.tsx row')
  targetRow.click()
  await waitFor(() => selected.includes(paths[1]))
})
