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

  it('checks link destinations after decoding character references and escapes', (t) => {
    const source = [
      '[a](/&#x2f;example.org) [b](/&#47;example.org) [c](/&#x5c;example.org)',
      '[d](javascript&#x3a;alert(1)) [e](/\\/example.org) [f](/a&#x7f;b)',
      '![g](/&#x2f;example.org/x.png)',
      '[ok](/docs?a=1&amp;b=2 "Fish &amp; chips")',
    ].join(' ')
    const { container, cleanup } = render(<Markdown source={source} />)
    t.after(cleanup)
    deepEqual(
      Array.from(container.querySelectorAll('a'), (link) => [
        link.getAttribute('href'),
        link.getAttribute('title'),
      ]),
      [['/docs?a=1&b=2', 'Fish & chips']],
    )
    ok(container.textContent?.includes('g'))
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
      '  - Socks',
      '',
      '1. First',
      '',
      '   More on first.',
      '',
      '* [x] Loose task',
      '',
      '  With details.',
    ].join('\n')
    const { $$, $, cleanup } = render(
      <>
        <Markdown source={source} />
        <Markdown source={source} />
      </>,
    )
    t.after(cleanup)
    const boxes = Array.from($$('input[type="checkbox"]')) as HTMLInputElement[]
    const label = (box: HTMLInputElement) =>
      document.getElementById(box.getAttribute('aria-labelledby')!)?.textContent
    deepEqual(
      boxes.slice(0, 3).map((box) => [box.disabled, box.checked, label(box)]),
      [
        [true, true, 'Book the ferry'],
        [true, false, 'Pack'],
        [true, true, 'Loose task'],
      ],
    )
    const ids = boxes.map((box) => box.getAttribute('aria-labelledby'))
    equal(new Set(ids).size, 6)
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

  it('preserves snake_case, nested emphasis, multi-backtick code, parenthesized links, images, 1-column tables, and compact size', (t) => {
    const source = [
      'Use `foo_bar_baz` and foo_bar_baz with **bold and *italic* text** and `` use `ticks` ``.',
      'See [Remix](https://en.wikipedia.org/wiki/Remix_(web_framework)) and ![Diagram](https://example.org/a.png).',
      '```inline code``` stays inline.',
      '',
      '| Only |',
      '| --- |',
      '| Value\\|1 |',
      '## Next | Heading',
      '',
      '- [x] **Ship** release',
      '1. [x] Ordered stays numbered',
    ].join('\n')
    const { $, $$, cleanup } = render(<Markdown source={source} size="compact" />)
    t.after(cleanup)
    equal($('em')?.textContent, 'italic')
    ok($('p')?.textContent?.includes('foo_bar_baz'))
    equal($$('p code')[1]?.textContent, 'use `ticks`')
    equal($('a')?.getAttribute('href'), 'https://en.wikipedia.org/wiki/Remix_(web_framework)')
    // The image shows as a link to it, never as an image.
    deepEqual(
      Array.from($$('a'), (link) => [link.textContent, link.getAttribute('href')]),
      [
        ['Remix', 'https://en.wikipedia.org/wiki/Remix_(web_framework)'],
        ['Diagram', 'https://example.org/a.png'],
      ],
    )
    equal($('img'), null)
    ok(!$('p')?.textContent?.includes('!Diagram'))
    equal($('pre'), null)
    equal($('table th')?.textContent, 'Only')
    equal($('table td')?.textContent, 'Value|1')
    equal($('h2')?.textContent, 'Next | Heading')
    equal($('.rf-table-container')?.getAttribute('data-size'), 'compact')
    const checkbox = $('.rf-markdown-task input[type="checkbox"]') as HTMLInputElement
    ok(checkbox.disabled)
    equal(checkbox.checked, true)
    equal(
      document.getElementById(checkbox.getAttribute('aria-labelledby')!)?.textContent,
      'Ship release',
    )
    equal(checkbox.getAttribute('aria-label'), null)
    // GFM makes ordered items tasks too, as GitHub renders them.
    equal($('ol')?.getAttribute('start'), null)
    ok($('ol .rf-markdown-task input[type="checkbox"]'))
  })

  it('passes the size on to fenced code', (t) => {
    const { $, cleanup } = render(<Markdown source={'```ts\nconst a = 1\n```'} size="compact" />)
    t.after(cleanup)
    equal($('[data-density]')?.getAttribute('data-density'), 'compact')
  })

  it('keeps footnote syntax visible as text', (t) => {
    const { container, cleanup } = render(
      <Markdown source={'A claim.[^1]\n\n[^1]: https://example.org'} />,
    )
    t.after(cleanup)
    equal(container.querySelector('a'), null)
    deepEqual(
      Array.from(container.querySelectorAll('.rf-markdown > p'), (p) => p.textContent),
      ['A claim.[^1]', '[^1]: https://example.org'],
    )
  })
})
