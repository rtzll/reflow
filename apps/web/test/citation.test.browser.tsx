import { Citation, type CitationSource } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

async function waitFor(check: () => boolean, frames = 60) {
  for (let i = 0; i < frames; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected citation state did not settle')
}

const rams: CitationSource = {
  title: 'Ten principles for good design',
  href: 'https://www.vitsoe.com/us/about/good-design',
  description: 'Good design is as little design as possible.',
}
const sources: CitationSource[] = [
  rams,
  { title: 'The Design of Everyday Things', href: 'https://mitpress.mit.edu/9780262525671/' },
  { title: 'Laws of UX', href: 'https://lawsofux.com', site: 'Laws of UX' },
]

describe('Citation', () => {
  it('links its number to the source and names what it cites', async (t) => {
    const { $, cleanup } = render(
      <p>
        Good design is unobtrusive.
        <Citation index={1} sources={rams} />
      </p>,
    )
    t.after(cleanup)
    const chip = $('a.rf-citation') as HTMLAnchorElement
    equal(chip.textContent, '1')
    equal(chip.getAttribute('href'), rams.href)
    equal(chip.getAttribute('aria-label'), 'Source 1: Ten principles for good design (vitsoe.com)')
    ok(!chip.hasAttribute('target'))
  })

  it('previews its sources on focus, each with its site, title and excerpt', async (t) => {
    const { $, cleanup } = render(<Citation index={4} sources={sources} openDelay={0} />)
    t.after(cleanup)
    const chip = $('a.rf-citation') as HTMLAnchorElement
    equal(chip.textContent, '4–6')
    equal(
      chip.getAttribute('aria-label'),
      'Sources 4 to 6: Ten principles for good design (vitsoe.com); The Design of Everyday Things (mitpress.mit.edu); Laws of UX (Laws of UX)',
    )
    const card = $('.rf-hover-card') as HTMLElement
    chip.focus()
    await waitFor(() => card.matches(':popover-open'))
    const items = Array.from(card.querySelectorAll('.rf-citation-source'))
    equal(items.length, 3)
    equal(items[0]!.querySelector('.rf-citation-site')?.textContent, 'vitsoe.com')
    const title = items[0]!.querySelector('a.rf-citation-title') as HTMLAnchorElement
    equal(title.textContent, rams.title)
    equal(title.getAttribute('href'), rams.href)
    equal(
      items[0]!.querySelector('.rf-citation-description')?.textContent,
      'Good design is as little design as possible.',
    )
    ok(!items[1]!.querySelector('.rf-citation-description'))
    equal(items[0]!.querySelector('.rf-citation-number')?.textContent, '4')
  })

  it('shows the site instead of the number, with a count of the rest', async (t) => {
    const { $, cleanup } = render(<Citation variant="site" sources={sources} />)
    t.after(cleanup)
    const chip = $('a.rf-citation') as HTMLAnchorElement
    equal(chip.dataset.variant, 'site')
    equal(chip.textContent, 'vitsoe.com +2')
    equal(
      chip.getAttribute('aria-label'),
      'Sources: Ten principles for good design (vitsoe.com); The Design of Everyday Things (mitpress.mit.edu); Laws of UX (Laws of UX)',
    )
  })

  it('opens sources in a new tab safely when asked to', async (t) => {
    const { $, cleanup } = render(<Citation index={1} sources={rams} target="_blank" />)
    t.after(cleanup)
    const chip = $('a.rf-citation') as HTMLAnchorElement
    equal(chip.getAttribute('target'), '_blank')
    equal(chip.getAttribute('rel'), 'noopener noreferrer')
    const title = $('a.rf-citation-title') as HTMLAnchorElement
    equal(title.getAttribute('target'), '_blank')
    equal(title.getAttribute('rel'), 'noopener noreferrer')
  })
})
