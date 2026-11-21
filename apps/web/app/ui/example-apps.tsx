import type { Handle } from 'remix/component'
import { routes } from '../routes.ts'
import { issuesApp } from '../public/apps/issues/index.tsx'
import { chatApp } from '../public/apps/chat/index.tsx'
import { calendarApp } from '../public/apps/calendar/index.tsx'
import { analyticsApp } from '../public/apps/analytics/index.tsx'
import type { ExampleApp } from '../public/apps/types.ts'

export const exampleApps = [issuesApp, chatApp, calendarApp, analyticsApp]

export function AppsIndex() {
  return () => (
    <article class="site-doc">
      <header class="site-doc-heading">
        <h1>Example apps</h1>
      </header>
      <ul class="site-app-list">
        {exampleApps.map((app) => (
          <li key={app.slug}>
            <a href={routes.app.href({ slug: app.slug })}>{app.name}</a>
            <p>{app.description}</p>
          </li>
        ))}
      </ul>
    </article>
  )
}

export function AppWorkspace(handle: Handle<{ app: ExampleApp; search: string }>) {
  return () => {
    const { app, search } = handle.props
    return (
      <div class="site-app-workspace" data-app={app.slug}>
        <a class="site-skip" href="#main">
          Skip to content
        </a>
        <nav aria-label="App navigation" class="site-app-nav">
          <a href={routes.gallery.href()}>Reflow</a>
          <a href={routes.apps.href()}>Apps</a>
          <span aria-current="page">{app.name}</span>
        </nav>
        <main id="main" data-rmx-key={app.slug}>
          {app.render ? (
            app.render(search)
          ) : (
            <article class="site-app-overview">
              <h1>{app.name}</h1>
              <p>{app.description}</p>
              <h2>Components to explore while this app is in development</h2>
              <ul>
                {app.components.map(({ slug, name }) => (
                  <li key={slug}>
                    <a href={routes.component.href({ slug })}>{name}</a>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </main>
      </div>
    )
  }
}
