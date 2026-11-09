import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { catalog } from '../app/catalog.tsx'
import { router } from './showcase-router.ts'

it('renders every documented component and includes the right assets', async () => {
  const index = await router.fetch(new Request('http://localhost/docs'))
  assert.equal(index.status, 200)
  const indexHtml = await index.text()
  for (const entry of catalog) {
    assert.ok(
      indexHtml.includes(`href="/docs/${entry.slug}"`),
      `${entry.slug} is missing from docs navigation`,
    )
    const response = await router.fetch(
      new Request(`http://localhost/docs/${entry.slug}`, {
        headers: { cookie: 'reflow_theme=dark' },
      }),
    )
    assert.equal(response.status, 200, entry.slug)
    const html = await response.text()
    assert.ok(html.includes(`data-theme="dark"`), entry.slug)
    assert.ok(html.includes(`<!-- rmx:h:`) || html.includes('rmx:h:'), entry.slug)
  }
  for (const [from, to] of [
    ['app-sidebar', '/docs/sidebar'],
    ['settings-dialog', '/docs/dialog#with-a-sidebar'],
  ]) {
    const moved = await router.fetch(new Request(`http://localhost/docs/${from}`))
    assert.equal(moved.status, 301, from)
    const location = new URL(moved.headers.get('location') ?? '')
    assert.equal(location.pathname + location.search + location.hash, to)
  }
  assert.ok(!indexHtml.includes('>Blocks<'), 'docs navigation has no Blocks group')
  const shared = await router.fetch(
    new Request('http://localhost/docs/button?theme=dark&accent=%23123ABC&density=huge&view=code'),
  )
  assert.equal(shared.status, 302)
  assert.equal(shared.headers.get('location'), '/docs/button?view=code')
  assert.deepEqual(
    shared.headers.getSetCookie().map((cookie) => cookie.split(';')[0]),
    ['reflow_theme=dark', 'reflow_accent=%23123ABC'],
  )
  const missing = await router.fetch(new Request('http://localhost/docs/missing'))
  assert.equal(missing.status, 404)
})
