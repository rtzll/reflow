import { Markdown } from '@rtzll/reflow/markdown'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

describe('Markdown', () => {
  it('renders prose, lists, aligned columns and fenced code as semantic elements', (t) => {
    const source = [
      '## At the ferry',
      '',
      '**Departure** at `07:30`.',
      '- Buy a ticket',
      '  - Keep the receipt',
      '',
      '| Route | Fare |',
      '| --- | ---: |',
      '| North | **€4** |',
      '',
      '```sh',
      'echo "North"',
      '```',
    ].join('\r\n')
    const { $, cleanup } = render(<Markdown source={source} />)
    t.after(cleanup)
    equal($('h2')?.textContent, 'At the ferry')
    equal($('p strong')?.textContent, 'Departure')
    equal($('p code')?.textContent, '07:30')
    equal($('ul li ul li')?.textContent, 'Keep the receipt')
    equal($('table th[scope="col"]')?.textContent, 'Route')
    equal(($('table td:nth-child(2)') as HTMLElement).style.textAlign, 'right')
    equal($('table td strong')?.textContent, '€4')
    equal($('pre code')?.textContent, 'echo "North"')
  })

  it('keeps raw HTML literal and limits link destinations', (t) => {
    const source = [
      '<img src=x> [docs](/docs/typography) [public](https://example.org)',
      '[section](#notes) [mail](mailto:editor@example.org)',
      '[bad](javascript:alert) [data](data:text/html,x) [host](//example.org) [slash](/\\example.org)',
    ].join(' ')
    const { $, container, cleanup } = render(<Markdown source={source} />)
    t.after(cleanup)
    ok(container.textContent?.includes('<img src=x>'))
    ok(!$('img'))
    deepEqual(
      Array.from(container.querySelectorAll('a'), (link) => link.getAttribute('href')),
      ['/docs/typography', 'https://example.org', '#notes', 'mailto:editor@example.org'],
    )
  })

  it('decodes character references in text but keeps code spans literal', (t) => {
    const source = 'Fish &amp; chips &copy; 2026 &#8212; &nbsp;`a&amp;b` &unknown;'
    const { $, cleanup } = render(<Markdown source={source} />)
    t.after(cleanup)
    equal($('p')?.textContent, 'Fish & chips © 2026 —  a&amp;b &unknown;')
    equal($('code')?.textContent, 'a&amp;b')
  })

  it('shows a raw HTML block as a paragraph of text', (t) => {
    const { $, cleanup } = render(
      <Markdown source={'Before\n\n<script>alert(1)</script>\n\nAfter'} />,
    )
    t.after(cleanup)
    equal($('script'), null)
    deepEqual(
      Array.from(document.querySelectorAll('.rf-markdown > p'), (p) => p.textContent),
      ['Before', '<script>alert(1)</script>', 'After'],
    )
  })

  it('follows CommonMark for emphasis inside words and links containing parentheses', (t) => {
    const source = 'Rename snake_case_name. See [the note](https://example.org/a_(b)).'
    const { $, cleanup } = render(<Markdown source={source} />)
    t.after(cleanup)
    equal($('em'), null)
    equal($('p')?.textContent, 'Rename snake_case_name. See the note.')
    equal($('a')?.getAttribute('href'), 'https://example.org/a_(b)')
  })

  it('renders read-only, labeled task checkboxes and keeps paragraphs inside list items', (t) => {
    const source = [
      '- [x] Book the ferry',
      '- [ ] Pack',
      '',
      '1. First',
      '',
      '   More on first.',
    ].join('\n')
    const { $$, $, cleanup } = render(<Markdown source={source} />)
    t.after(cleanup)
    const boxes = Array.from($$('input[type="checkbox"]')) as HTMLInputElement[]
    deepEqual(
      boxes.map((box) => [box.disabled, box.checked, box.getAttribute('aria-label')]),
      [
        [true, true, 'Book the ferry'],
        [true, false, 'Pack'],
      ],
    )
    equal($('ol li')?.querySelectorAll('p').length, 2)
  })

  it('updates partial inline marks and keeps an open fence readable as text arrives', async (t) => {
    const { $, root, act, cleanup } = render(<Markdown source="A **partial" />)
    t.after(cleanup)
    equal($('p')?.textContent, 'A **partial')
    await act(() => root.render(<Markdown source={'A **partial reply**\n\n```txt\nCoast'} />))
    equal($('strong')?.textContent, 'partial reply')
    equal($('pre code')?.textContent, 'Coast')
    await act(() =>
      root.render(<Markdown source={'A **partial reply**\n\n```txt\nCoast road\n```\n\nNext'} />),
    )
    equal($('pre code')?.textContent, 'Coast road')
    equal($('p:last-child')?.textContent, 'Next')
  })
})
