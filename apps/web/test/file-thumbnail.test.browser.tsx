import { ChatMessage, FileThumbnail } from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('previews a local image through an object URL and revokes it on removal', async (t) => {
  const file = new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], 'chart.svg', {
    type: 'image/svg+xml',
  })
  const revoked: string[] = []
  const revoke = URL.revokeObjectURL
  URL.revokeObjectURL = (url) => {
    revoked.push(url)
    revoke(url)
  }
  t.after(() => {
    URL.revokeObjectURL = revoke
  })
  const { $, act, cleanup } = render(<FileThumbnail file={file} size={48} />)
  await act(() => {})
  const thumbnail = $('.rf-file-thumbnail') as HTMLElement
  equal(thumbnail.dataset.kind, 'image')
  equal(thumbnail.style.getPropertyValue('--rf-file-thumbnail-size'), '48px')
  const image = $('img[alt="chart.svg"]') as HTMLImageElement
  ok(image.src.startsWith('blob:'))
  cleanup()
  deepEqual(revoked, [image.src])
})

it('names other files with their extension on a card', async (t) => {
  const { $, cleanup } = render(
    <div>
      <FileThumbnail file={new File(['x'], 'release notes.txt', { type: 'text/plain' })} />
      <FileThumbnail file={{ name: 'Makefile' }} />
    </div>,
  )
  t.after(cleanup)
  const cards = [...document.querySelectorAll('.rf-file-thumbnail')].map((card) => [
    (card as HTMLElement).dataset.kind,
    card.querySelector('.rf-file-thumbnail-name')?.textContent,
    card.querySelector('.rf-badge')?.textContent ?? null,
  ])
  deepEqual(cards, [
    ['file', 'release notes', 'TXT'],
    ['file', 'Makefile', null],
  ])
  equal($('img'), null)
})

it('shows message attachments as the same thumbnails as the composer', async (t) => {
  const { $, cleanup } = render(
    <ChatMessage
      role="user"
      attachments={[
        {
          name: 'diagram.png',
          type: 'image/png',
          previewUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
        },
        { name: 'outline.md', detail: '2 KB', url: '/files/outline.md' },
      ]}
    >
      Here are both files.
    </ChatMessage>,
  )
  t.after(cleanup)
  const items = [...document.querySelectorAll('.rf-chat-attachment')] as HTMLElement[]
  equal(items.length, 2)
  equal(items[0].querySelector('.rf-file-thumbnail')?.getAttribute('data-kind'), 'image')
  equal(items[1].querySelector('.rf-file-thumbnail-name')?.textContent, 'outline')
  equal(items[1].title, 'outline.md (2 KB)')
  equal($('a[aria-label="outline.md"]')?.getAttribute('href'), '/files/outline.md')
})
