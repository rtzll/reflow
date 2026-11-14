import { createController } from 'remix/router'
import { assets, getPageAssets } from '../assets.ts'
import { catalog, galleryCatalog } from '../catalog.tsx'
import { codeSamples } from '../code-samples.ts'
import { Document } from '../document.tsx'
import type { AppContext } from '../router.ts'
import { routes } from '../routes.ts'
import { readSettings, Showcase, type ShowcaseProps } from '../ui/site.tsx'
import { settingCookies, settingRows, withoutSettings } from '../public/site-settings.ts'

// Former block pages now live as examples on their component pages.
const moved: Record<string, string> = {
  'app-sidebar': '/docs/sidebar',
  'settings-dialog': '/docs/dialog#with-a-sidebar',
}

async function show(context: AppContext, page: ShowcaseProps['page'], slug?: string) {
  const url = new URL(context.request.url)
  const query = url.search
  // A shared link carries settings: save them as the visitor's own and show
  // the clean URL. The browser keeps the #fragment across the redirect.
  if (settingRows.some((row) => url.searchParams.has(row.key))) {
    const headers = new Headers({
      location: `${url.pathname}${withoutSettings(query)}`,
      'cache-control': 'no-store',
    })
    for (const cookie of settingCookies(query)) headers.append('set-cookie', cookie)
    return new Response(null, { status: 302, headers })
  }
  const settings = readSettings(query, context.request.headers.get('cookie') ?? '')
  const target = page === 'component' && slug ? moved[slug] : undefined
  if (target) {
    const [path, hash = ''] = target.split('#')
    return Response.redirect(
      new URL(`${path}${query}${hash && `#${hash}`}`, context.request.url),
      301,
    )
  }
  const component = catalog.find((entry) => entry.slug === slug)
  if (page === 'component' && !component)
    return new Response('Component not found', { status: 404 })
  const title =
    page === 'gallery'
      ? 'Reflow'
      : `${component?.name ?? (page === 'docs' ? 'Documentation' : 'Demo')} · Reflow`
  const pageAssets = await getPageAssets()
  // CodeBlock's samples are highlighted on the server, for the pages that show them.
  const samples =
    page === 'gallery' || page === 'demo' || slug === 'code-block' ? await codeSamples() : undefined
  const images = slug === 'code-block' ? { ...pageAssets.images, code: samples } : pageAssets.images
  const components =
    page === 'gallery' || page === 'demo'
      ? galleryCatalog(
          pageAssets.images.sidebarAvatar,
          page === 'gallery',
          samples,
          url.searchParams,
        )
      : catalog
  return context.render(
    <Document assets={pageAssets} settings={settings} title={title} url={url}>
      <Showcase
        page={page}
        components={components}
        slug={slug}
        images={images}
        query={query}
        settings={settings}
      />
    </Document>,
  )
}

export default createController(routes, {
  actions: {
    gallery: (context) => show(context, 'gallery'),
    docs: (context) => show(context, 'docs'),
    component: (context) => show(context, 'component', context.params.slug),
    demo: (context) =>
      show(context, 'demo', new URL(context.request.url).searchParams.get('c') ?? undefined),
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not found', { status: 404 })
    },
  },
})
