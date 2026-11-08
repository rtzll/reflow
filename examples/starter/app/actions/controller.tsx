import { ImportMap } from 'remix/component/server'
import { createController } from 'remix/router'
import type { RouterContext } from 'remix/router'
import { assets } from '../assets.ts'
import { Settings, notificationOptions, themes } from '../public/settings.tsx'
import type { router } from '../router.ts'
import { routes } from '../routes.ts'

export default createController<typeof routes, RouterContext<typeof router>>(routes, {
  actions: {
    async assets({ request }) {
      return (await assets.fetch(request)) ?? new Response('Not found', { status: 404 })
    },
    async home(context) {
      const [entry, libraryStyles, appStyles] = await Promise.all([
        assets.getScriptEntry('app/public/entry.ts'),
        assets.getHref(import.meta.resolve('@rtzll/reflow/styles.css')),
        assets.getHref('app/public/starter.css'),
      ])
      const params = new URL(context.request.url).searchParams
      const applied = params.has('preferences')
      const theme = themes.find(({ value }) => value === params.get('theme'))?.value ?? 'system'
      const compact = params.get('density') === 'compact'
      const selected = params.getAll('notification')
      const notifications = applied
        ? notificationOptions
            .filter(({ value }) => selected.includes(value))
            .map(({ value }) => value)
        : ['mentions']

      return context.render(
        <html lang="en">
          <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="color-scheme" content="light dark" />
            <title>Workspace settings · Reflow Starter</title>
            <link rel="stylesheet" href={libraryStyles} />
            <link rel="stylesheet" href={appStyles} />
            <ImportMap value={entry.importMap} />
            {entry.preloads.map((href) => (
              <link key={href} rel="modulepreload" href={href} />
            ))}
            <script type="module" src={entry.href} />
          </head>
          <body>
            <Settings
              theme={theme}
              compact={compact}
              notifications={notifications}
              applied={applied}
            />
          </body>
        </html>,
      )
    },
  },
})
