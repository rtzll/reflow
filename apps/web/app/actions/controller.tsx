import { createController } from 'remix/router'
import { assets, getPageAssets } from '../assets.ts'
import { catalog, galleryCatalog } from '../catalog.tsx'
import { codeSamples, exampleSource } from '../code-samples.ts'
import { docsIndex, introductionMarkdown, pageMarkdown } from '../docs-markdown.ts'
import { Document } from '../document.tsx'
import type { AppContext } from '../router.ts'
import { routes } from '../routes.ts'
import { AppsIndex, AppWorkspace, exampleApps } from '../ui/example-apps.tsx'
import { readSettings, Showcase, type ShowcaseProps } from '../ui/site.tsx'
import { settingCookies, settingRows, withoutSettings } from '../public/site-settings.ts'

// Former block pages now live as examples on their component pages.
const moved = new Map([
  ['app-sidebar', '/docs/sidebar'],
  ['settings-dialog', '/docs/dialog#with-a-sidebar'],
])

function movedResponse(slug: string, url: URL, markdown: boolean) {
  const target = moved.get(slug)
  if (!target) return
  const destination = new URL(target, url)
  if (markdown) destination.pathname += '.md'
  destination.search = url.search
  return Response.redirect(destination, 301)
}

function markdownResponse(body: string) {
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}

async function show(
  context: AppContext,
  page: ShowcaseProps['page'] | 'app' | 'apps',
  slug?: string,
) {
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
  if (page === 'component' && slug) {
    const redirect = movedResponse(slug, url, false)
    if (redirect) return redirect
  }
  if (page === 'app' || page === 'apps') {
    const app = exampleApps.find((entry) => entry.slug === slug)
    if (page === 'app' && !app) return new Response('App not found', { status: 404 })
    const assets = await getPageAssets(app?.slug ?? 'directory')
    return context.render(
      <Document
        assets={assets}
        settings={{ ...settings, shape: 'rounded' }}
        title={`${app?.name ?? 'Example apps'} · Reflow`}
        url={url}
      >
        {app ? (
          <AppWorkspace app={app} search={query} soundEnabled={settings.soundEnabled} />
        ) : (
          <AppsIndex soundEnabled={settings.soundEnabled} />
        )}
      </Document>,
    )
  }
  const component = page === 'component' ? catalog.find((entry) => entry.slug === slug) : undefined
  if (page === 'component' && !component)
    return new Response('Component not found', { status: 404 })
  const title = page === 'gallery' ? 'Reflow' : `${component?.name ?? 'Documentation'} · Reflow`
  const pageAssets = await getPageAssets()
  // CodeBlock's samples are highlighted on the server, for the pages that show them.
  const samples = page === 'gallery' || slug === 'code-block' ? await codeSamples() : undefined
  const images = slug === 'code-block' ? { ...pageAssets.images, code: samples } : pageAssets.images
  const source = page === 'component' && slug ? await exampleSource(slug) : undefined
  const components =
    page === 'gallery'
      ? galleryCatalog(
          pageAssets.images.sidebarAvatar,
          page === 'gallery',
          samples,
          url.searchParams,
        )
      : source
        ? catalog.map((entry) => (entry.slug === slug ? { ...entry, source } : entry))
        : catalog
  return context.render(
    <Document
      assets={pageAssets}
      settings={settings}
      title={title}
      url={url}
      markdownHref={
        component
          ? routes.componentMarkdown.href({ slug: component.slug })
          : page === 'docs'
            ? routes.docsMarkdown.href()
            : undefined
      }
    >
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
    docsMarkdown: () => markdownResponse(introductionMarkdown()),
    docsIndex: (context) =>
      new Response(docsIndex(new URL(context.request.url)), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }),
    async componentMarkdown(context) {
      const { slug } = context.params
      const redirect = movedResponse(slug, new URL(context.request.url), true)
      if (redirect) return redirect
      const entry = catalog.find((component) => component.slug === slug)
      if (!entry) return new Response('Documentation not found', { status: 404 })
      return markdownResponse(pageMarkdown({ ...entry, source: await exampleSource(slug) }))
    },
    apps: (context) => show(context, 'apps'),
    app: (context) => show(context, 'app', context.params.slug),
    component: (context) => show(context, 'component', context.params.slug),
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not found', { status: 404 })
    },
  },
})
