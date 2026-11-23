import { FileChanges } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

const files = [
  { path: 'src/notes/cooldown.ts', added: 157, removed: 0, href: '/diff/cooldown' },
  { path: 'src/engine.ts', added: 4, removed: 1 },
  { path: 'README.md', added: 11, removed: 17 },
  { path: 'src/captions.ts', added: 2, removed: 2 },
  { path: 'src/proof.ts', added: 1, removed: 0 },
]

it('totals the edit, writes each count out and links rows', async (t) => {
  const { $, cleanup } = render(<FileChanges files={files} actions={<button>Undo</button>} />)
  t.after(cleanup)
  equal($('.rf-file-changes-title')?.textContent, 'Edited 5 files')
  equal(
    $('.rf-file-changes-heading .rf-basic-sr-only')?.textContent,
    '175 lines added, 20 lines removed',
  )
  const rows = [...document.querySelectorAll('ul[aria-label="Changed files"] li')]
  equal(rows.length, 3)
  equal(rows[0].querySelector('a')?.getAttribute('href'), '/diff/cooldown')
  equal(rows[0].querySelector('.rf-file-changes-folder')?.textContent, 'src/notes/')
  equal(rows[0].querySelector('.rf-basic-sr-only')?.textContent, '157 lines added, none removed')
  equal(rows[1].querySelector('a'), null)
  ok($('.rf-file-changes-actions button'))
})

it('folds rows past the visible count behind a toggle', async (t) => {
  const { $, act, cleanup } = render(<FileChanges files={files} title="Changed the proof" />)
  t.after(cleanup)
  equal($('.rf-file-changes-title')?.textContent, 'Changed the proof')
  const toggle = $('button.rf-file-changes-toggle') as HTMLButtonElement
  const more = $('.rf-file-changes-more') as HTMLElement
  equal(toggle.textContent, 'Show 2 more files')
  equal(toggle.getAttribute('aria-expanded'), 'false')
  equal(toggle.getAttribute('aria-controls'), more.id)
  ok(more.inert)
  equal(more.getAttribute('aria-hidden'), 'true')
  await act(() => toggle.click())
  equal(toggle.textContent, 'Show fewer files')
  equal(toggle.getAttribute('aria-expanded'), 'true')
  equal(more.inert, false)
  equal(more.querySelectorAll('li').length, 2)
})

it('shows no toggle when every file fits', async (t) => {
  const { $, cleanup } = render(<FileChanges files={files.slice(0, 2)} />)
  t.after(cleanup)
  equal($('.rf-file-changes-toggle'), null)
  equal($('.rf-file-changes-title')?.textContent, 'Edited 2 files')
})
