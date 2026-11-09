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
      indexHtml.includes(`href="/docs/${entry.slug}?`),
      `${entry.slug} is missing from docs navigation`,
    )
    const response = await router.fetch(
      new Request(`http://localhost/docs/${entry.slug}?theme=dark`),
    )
    assert.equal(response.status, 200, entry.slug)
    const html = await response.text()
    assert.ok(html.includes(`data-theme="dark"`), entry.slug)
    assert.ok(html.includes(`<!-- rmx:h:`) || html.includes('rmx:h:'), entry.slug)
  }
  for (const [from, to] of [
    ['app-sidebar', '/docs/sidebar?theme=dark'],
    ['settings-dialog', '/docs/dialog?theme=dark#with-a-sidebar'],
  ]) {
    const moved = await router.fetch(new Request(`http://localhost/docs/${from}?theme=dark`))
    assert.equal(moved.status, 301, from)
    const location = new URL(moved.headers.get('location') ?? '')
    assert.equal(location.pathname + location.search + location.hash, to)
  }
  assert.ok(!indexHtml.includes('>Blocks<'), 'docs navigation has no Blocks group')
  const missing = await router.fetch(new Request('http://localhost/docs/missing'))
  assert.equal(missing.status, 404)
})
