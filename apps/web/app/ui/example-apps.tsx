import { Card, CardDescription, CardHeader, Icon } from '@rtzll/reflow'
import type { Handle } from 'remix/component'
import { routes } from '../routes.ts'
import { issuesApp } from '../public/apps/issues/index.tsx'
import { chatApp } from '../public/apps/chat/index.tsx'
import { calendarApp } from '../public/apps/calendar/index.tsx'
import { analyticsApp } from '../public/apps/analytics/index.tsx'
import type { ExampleApp } from '../public/apps/types.ts'
import { appPreviews } from './app-previews.tsx'

export const exampleApps = [
  { ...issuesApp, Preview: appPreviews.issues },
  { ...chatApp, Preview: appPreviews.chat },
  { ...calendarApp, Preview: appPreviews.calendar },
  { ...analyticsApp, Preview: appPreviews.analytics },
]

export function AppsIndex() {
  return () => (
    <div class="site-app-shelf">
      <a class="site-skip" href="#main">
        Skip to content
      </a>
      <nav class="site-app-shelf-nav" aria-label="Reflow">
        <a href={routes.gallery.href()} class="site-app-wordmark">
          Reflow
        </a>
        <a href={routes.gallery.href()}>Showcase</a>
        <a href={routes.demo.href()}>Demo</a>
        <a href={routes.docs.href()}>Docs</a>
        <a href={routes.apps.href()} aria-current="page">
          Apps
        </a>
      </nav>
      <main id="main" class="site-app-directory">
        <h1>Example apps</h1>
        <ul class="site-app-list" role="list">
          {exampleApps.map((app) => (
            <li key={app.slug}>
              <Card
                class="site-app-card"
                href={routes.app.href({ slug: app.slug })}
                label={app.name}
                border="outlined"
              >
                <div aria-hidden="true" class="app-preview" data-preview={app.slug}>
                  <app.Preview />
                </div>
                <CardHeader>
                  <div class="site-app-card-heading">
                    <h2>{app.name}</h2>
                    <Icon name="arrow-right" size={16} />
                  </div>
                  <CardDescription>{app.description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </div>
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
          {app.render(search)}
        </main>
      </div>
    )
  }
}
