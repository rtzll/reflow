import { createController } from 'remix/router'
import { assets, getPageAssets } from '../assets.ts'
import { catalog, galleryCatalog } from '../catalog.tsx'
import { Document } from '../document.tsx'
import type { AppContext } from '../router.ts'
import { routes } from '../routes.ts'
import { readSettings, Showcase, type ShowcaseProps } from '../ui/site.tsx'

// Former block pages now live as examples on their component pages.
const moved: Record<string, string> = {
  'app-sidebar': '/docs/sidebar',
  'settings-dialog': '/docs/dialog#with-a-sidebar',
}

async function show(context: AppContext, page: ShowcaseProps['page'], slug?: string) {
  const query = new URL(context.request.url).search
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
  const components =
    page === 'gallery' || page === 'demo'
      ? galleryCatalog(pageAssets.images.sidebarAvatar, page === 'gallery')
      : catalog
  return context.render(
    <Document assets={pageAssets} settings={settings} title={title}>
      <Showcase
        page={page}
        components={components}
        slug={slug}
        images={pageAssets.images}
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
