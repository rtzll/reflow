import { Avatar, AvatarGroup } from '@rtzll/reflow'
import { equal, notEqual, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

async function waitFor(check: () => boolean, frames = 60) {
  for (let i = 0; i < frames; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected avatar state did not settle')
}

const pixel =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect width="1" height="1" fill="%236b97ff"/%3E%3C/svg%3E'

describe('Avatar', () => {
  it('shows initials from the name on a colour picked from it', async (t) => {
    const { $, $$, cleanup } = render(
      <>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Brewster Murray Hopper" size={40} />
        <Avatar name="ada lovelace" />
        <Avatar name="Émile" />
      </>,
    )
    t.after(cleanup)
    const avatars = Array.from($$('.rf-avatar')) as HTMLElement[]
    equal(avatars[0]!.getAttribute('role'), 'img')
    equal(avatars[0]!.getAttribute('aria-label'), 'Ada Lovelace')
    equal(avatars[0]!.textContent, 'AL')
    equal(avatars[1]!.textContent, 'GH')
    equal(avatars[1]!.style.getPropertyValue('--rf-avatar-size'), '40px')
    equal(avatars[3]!.textContent, 'É')
    // The same name always gets the same colour.
    equal(avatars[0]!.dataset.color, avatars[2]!.dataset.color)
    ok(avatars[0]!.dataset.color)
    equal($('.rf-avatar-initials')?.getAttribute('aria-hidden'), 'true')
  })

  it('shows an image, and falls back to initials when it fails', async (t) => {
    const { $$, cleanup } = render(
      <>
        <Avatar name="Alex Morgan" src={pixel} />
        <Avatar name="Broken Image" src="data:image/png;base64,broken" />
      </>,
    )
    t.after(cleanup)
    const [good, broken] = Array.from($$('.rf-avatar')) as HTMLElement[]
    const image = good!.querySelector('img') as HTMLImageElement
    equal(image.getAttribute('alt'), '')
    await waitFor(() => broken!.dataset.image === 'error')
    notEqual(good!.dataset.image, 'error')
  })

  it('names its status, takes a shape, and hides when decorative', async (t) => {
    const { $$, cleanup } = render(
      <>
        <Avatar name="Ada Lovelace" status="away" shape="square" color="violet" />
        <Avatar name="Ada Lovelace" decorative />
      </>,
    )
    t.after(cleanup)
    const [status, decorative] = Array.from($$('.rf-avatar')) as HTMLElement[]
    equal(status!.getAttribute('aria-label'), 'Ada Lovelace (away)')
    equal(status!.dataset.shape, 'square')
    equal(status!.dataset.color, 'violet')
    equal(status!.querySelector('.rf-avatar-status')?.getAttribute('data-status'), 'away')
    equal(decorative!.getAttribute('aria-hidden'), 'true')
    ok(!decorative!.hasAttribute('role'))
    ok(!decorative!.hasAttribute('aria-label'))
  })
})

describe('AvatarGroup', () => {
  const people = [
    { name: 'Ada Lovelace' },
    { name: 'Grace Hopper' },
    { name: 'Alan Turing' },
    { name: 'Katherine Johnson' },
    { name: 'Edsger Dijkstra' },
  ]

  it('lists everyone up to the limit and counts the rest', async (t) => {
    const { $, $$, cleanup } = render(<AvatarGroup avatars={people} max={3} />)
    t.after(cleanup)
    const group = $('ul.rf-avatar-group') as HTMLElement
    equal(group.getAttribute('aria-label'), '5 people')
    const items = Array.from($$('ul.rf-avatar-group > li'))
    equal(items.length, 3)
    equal(items[0]!.querySelector('.rf-avatar')?.getAttribute('aria-label'), 'Ada Lovelace')
    // Earlier avatars stack above later ones, keeping status dots in view.
    const layers = items.map((item) => Number((item as HTMLElement).style.zIndex || 0))
    ok(layers[0]! > layers[1]! && layers[1]! > layers[2]!, `stacking: ${layers.join(',')}`)
    const more = items[2]!.querySelector('.rf-avatar-more') as HTMLElement
    equal(more.textContent, '+3')
    equal(
      more.getAttribute('aria-label'),
      '3 more: Alan Turing, Katherine Johnson, Edsger Dijkstra',
    )
  })

  it('shows everyone when they fit, under its own label', async (t) => {
    const { $, $$, cleanup } = render(
      <AvatarGroup avatars={people.slice(0, 2)} label="Editors" size={24} />,
    )
    t.after(cleanup)
    equal($('ul.rf-avatar-group')?.getAttribute('aria-label'), 'Editors')
    equal($$('ul.rf-avatar-group > li').length, 2)
    ok(!$('.rf-avatar-more'))
    equal(($('.rf-avatar') as HTMLElement).style.getPropertyValue('--rf-avatar-size'), '24px')
  })
})
