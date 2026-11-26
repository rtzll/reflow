import * as assert from 'remix/assert'
import { afterAll, it } from 'remix/test'
import { getComponentApi } from '../app/docs-data.ts'
import { componentExamples } from '../app/public/demos/examples.ts'
import { catalog } from '../app/catalog.tsx'
import { assets } from '../app/assets.ts'
import { router } from '../app/router.ts'

afterAll(() => assets.close())

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

it('publishes every docs page as a discoverable, complete Markdown document', async () => {
  const origin = 'https://showcase.example'
  const get = (path: string) => router.fetch(new Request(new URL(path, origin)))
  const index = await get('/llms.txt')
  assert.equal(index.status, 200)
  assert.equal(index.headers.get('content-type'), 'text/plain; charset=utf-8')
  const directory = await index.text()
  const links = [...directory.matchAll(/^- \[[^\]]+\]\(([^)]+)\): \S/gm)].map((match) => match[1])
  const paths = ['/docs', ...catalog.map(({ slug }) => '/docs/' + slug)]
  assert.deepEqual(links.toSorted(), paths.map((path) => origin + path + '.md').sort())

  for (const path of paths) {
    const href = path + '.md'
    const html = await (await get(path)).text()
    assert.ok(html.includes(`type="text/markdown" href="${href}"`), path)
    assert.ok(html.includes('rel="describedby" href="/llms.txt"'), path)
    assert.ok(new RegExp(`<a [^>]*href="${href}"[^>]*>View as Markdown</a>`).test(html), path)
    const response = await get(href)
    assert.equal(response.status, 200, href)
    assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8', href)
    const md = await response.text()
    const slug = path.slice('/docs/'.length)
    const title =
      slug === 'skill'
        ? '/reflow skill'
        : (catalog.find((entry) => entry.slug === slug)?.name ?? 'Introduction')
    assert.ok(md.startsWith('# ' + title + '\n\n'), href)
    assert.ok(md.includes('## Installation\n'), href)
    for (const example of componentExamples[slug] ?? []) {
      assert.ok(md.includes('## ' + example.title + '\n'), href + ' ' + example.title)
    }
    for (const group of getComponentApi(slug)) {
      assert.ok(md.includes('### ' + group.name + '\n'), href)
      for (const prop of group.props)
        assert.ok(md.includes('- `' + prop.name + '` ('), href + ' ' + prop.name)
    }
    assert.ok(!md.includes('rmx:h:') && !md.includes('[object Object]'), href)
  }

  const drawerLink = directory.match(/^- \[Drawer\]\(([^)]+)\): .*bottom sheet/m)?.[1]
  assert.ok(drawerLink)
  const drawer = await (await get(drawerLink)).text()
  assert.ok(drawer.includes('## Snap points\n'))
  assert.ok(drawer.includes('snapPoints={[0.4, 0.9]}'))
  assert.ok(drawer.includes('focus returns to the trigger'))
  assert.equal(await (await get('/docs/drawer.md?view=code&theme=dark')).text(), drawer)

  const system = await (await get('/docs/fluid-hover.md')).text()
  assert.ok(system.includes('stays visible and glides from one row to the next'))
  assert.ok(system.includes('| `nearest` | boolean |'))
  assert.ok(system.includes('import { fluidHover }'))
  const skill = await (await get('/docs/skill.md')).text()
  assert.ok(skill.includes('npx skills add rtzll/reflow'))
  assert.ok(skill.includes('1. **Reads your stack** Identifies your Remix setup'))
  const moved = await get('/docs/settings-dialog.md')
  assert.equal(moved.status, 301)
  assert.equal(moved.headers.get('location'), origin + '/docs/dialog.md#with-a-sidebar')
  assert.equal((await get('/docs/missing.md')).status, 404)
})
