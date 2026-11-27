import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type TemplateName = 'starter' | 'form' | 'minimal'
export type CssBundle = 'styles' | 'core'

export const templateNames: readonly TemplateName[] = ['starter', 'form', 'minimal']
export const cssBundles: readonly CssBundle[] = ['styles', 'core']

export function defaultCssForTemplate(template: TemplateName): CssBundle {
  return template === 'starter' ? 'styles' : 'core'
}

const formRoutesTs = `import { get, post, route } from 'remix/routes'

export const routes = route({
  home: get('/'),
  save: post('/'),
  assets: get('/assets/*path'),
})
`

const formControllerTsx = `import { ImportMap } from 'remix/component/server'
import { createController } from 'remix/router'
import type { RouterContext } from 'remix/router'
import { assets } from '../assets.ts'
import { FormWorkspace, regions, type FormState } from '../public/form-workspace.tsx'
import type { router } from '../router.ts'
import { routes } from '../routes.ts'

let savedState: FormState = {
  workspaceName: 'Northstar Cloud',
  supportEmail: 'security@northstar.example',
  region: 'eu-central',
  requireMfa: true,
  apiToken: 'rf_live_98d4c1f7e2a0b6c39f2c',
  saved: false,
  errors: {},
}

async function renderPage(context: RouterContext<typeof router>, state: FormState) {
  const [entry, libraryStyles, appStyles] = await Promise.all([
    assets.getScriptEntry('app/public/entry.ts'),
    assets.getHref(import.meta.resolve('@rtzll/reflow/core.css')),
    assets.getHref('app/public/starter.css'),
  ])

  return context.render(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>Workspace security · Reflow Form Starter</title>
        <link rel="stylesheet" href={libraryStyles} />
        <link rel="stylesheet" href={appStyles} />
        <ImportMap value={entry.importMap} />
        {entry.preloads.map((href) => (
          <link key={href} rel="modulepreload" href={href} />
        ))}
        <script type="module" src={entry.href} />
      </head>
      <body>
        <FormWorkspace state={state} />
      </body>
    </html>,
  )
}

export default createController<typeof routes, RouterContext<typeof router>>(routes, {
  actions: {
    async assets({ request }) {
      return (await assets.fetch(request)) ?? new Response('Not found', { status: 404 })
    },
    async home(context) {
      return renderPage(context, { ...savedState, saved: false, errors: {} })
    },
    async save(context) {
      const form = await context.request.formData()
      const workspaceName = String(form.get('workspaceName') ?? '').trim()
      const supportEmail = String(form.get('supportEmail') ?? '').trim()
      const rawRegion = String(form.get('region') ?? '')
      const region = regions.find(({ value }) => value === rawRegion)?.value ?? savedState.region
      const requireMfa = form.get('requireMfa') === 'on'

      const errors: Record<string, string> = {}
      if (!workspaceName) errors.workspaceName = 'Enter a workspace name.'
      if (!supportEmail.includes('@')) errors.supportEmail = 'Enter a valid email address.'

      if (Object.keys(errors).length > 0) {
        return renderPage(context, {
          ...savedState,
          workspaceName,
          supportEmail,
          region,
          requireMfa,
          saved: false,
          errors,
        })
      }

      savedState = {
        ...savedState,
        workspaceName,
        supportEmail,
        region,
        requireMfa,
      }
      return renderPage(context, { ...savedState, saved: true, errors: {} })
    },
  },
})
`

const formWorkspaceTsx = `import {
  Badge,
  Banner,
  BannerDescription,
  BannerTitle,
  Button,
  Field,
  FieldSet,
  Input,
  InputCopy,
  Select,
  Switch,
} from '@rtzll/reflow'
import { clientEntry, type Handle } from 'remix/component'

export interface FormState {
  workspaceName: string
  supportEmail: string
  region: string
  requireMfa: boolean
  apiToken: string
  saved: boolean
  errors: Record<string, string>
}

export const regions = [
  { value: 'eu-central', label: 'EU Central (Frankfurt)' },
  { value: 'us-east', label: 'US East (Virginia)' },
  { value: 'ap-south', label: 'AP South (Singapore)' },
]

export const FormWorkspace = clientEntry(
  import.meta.url,
  function FormWorkspace(handle: Handle<{ state: FormState }>) {
    return () => {
      const { state } = handle.props
      return (
        <main class="starter-form-shell">
          <header class="starter-form-header">
            <div class="starter-form-title">
              <h1>{state.workspaceName || 'Workspace security'}</h1>
              <Badge color="blue" size="compact">
                Remix POST form
              </Badge>
            </div>
            <p>
              Validates with native FormData on the server and works with or without JavaScript.
            </p>
          </header>

          {state.saved && (
            <Banner status="success">
              <BannerTitle>Settings saved</BannerTitle>
              <BannerDescription>
                Your workspace policy was validated and stored on the server.
              </BannerDescription>
            </Banner>
          )}

          <form method="post" action="/" noValidate class="starter-form-card">
            <FieldSet legend="General & security">
              <Field label="Workspace name" error={state.errors.workspaceName}>
                {(control) => (
                  <Input
                    {...control}
                    name="workspaceName"
                    defaultValue={state.workspaceName}
                    placeholder="Northstar Cloud"
                  />
                )}
              </Field>
              <Field label="Security contact email" error={state.errors.supportEmail}>
                {(control) => (
                  <Input
                    {...control}
                    name="supportEmail"
                    type="email"
                    defaultValue={state.supportEmail}
                    placeholder="security@northstar.example"
                  />
                )}
              </Field>
              <Field label="Primary data region">
                {(control) => (
                  <Select
                    {...control}
                    name="region"
                    label="Primary data region"
                    defaultValue={state.region}
                    options={regions}
                  />
                )}
              </Field>
              <Switch
                name="requireMfa"
                label="Require hardware or TOTP MFA"
                defaultChecked={state.requireMfa}
              />
            </FieldSet>

            <div class="starter-form-actions">
              <Button type="reset" variant="secondary">
                Reset
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>

          <section class="starter-form-card" aria-label="Workspace API token">
            <InputCopy label="Workspace API token" value={state.apiToken} masked size="compact" />
          </section>
        </main>
      )
    }
  },
)
`

const formCss = `body {
  margin: 0;
  background: var(--rf-bg);
  color: var(--rf-fg);
  font-family: var(--rf-font);
}

.starter-form-shell {
  max-width: 620px;
  margin-inline: auto;
  padding: 40px 20px 64px;
  display: grid;
  gap: 20px;
}

.starter-form-header {
  display: grid;
  gap: 6px;
}

.starter-form-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.starter-form-header h1 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
}

.starter-form-header p {
  margin: 0;
  color: var(--rf-muted);
  font-size: 13.5px;
}

.starter-form-card {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--rf-border);
  border-radius: var(--rf-panel-radius);
  background: var(--rf-surface-1);
}

.starter-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
`

const minimalControllerTsx = `import { ImportMap } from 'remix/component/server'
import { createController } from 'remix/router'
import type { RouterContext } from 'remix/router'
import { assets } from '../assets.ts'
import { App } from '../public/app.tsx'
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
        assets.getHref(import.meta.resolve('@rtzll/reflow/core.css')),
        assets.getHref('app/public/starter.css'),
      ])

      return context.render(
        <html lang="en">
          <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="color-scheme" content="light dark" />
            <title>Reflow App</title>
            <link rel="stylesheet" href={libraryStyles} />
            <link rel="stylesheet" href={appStyles} />
            <ImportMap value={entry.importMap} />
            {entry.preloads.map((href) => (
              <link key={href} rel="modulepreload" href={href} />
            ))}
            <script type="module" src={entry.href} />
          </head>
          <body>
            <App />
          </body>
        </html>,
      )
    },
  },
})
`

const minimalAppTsx = `import { Badge, Button, InputCopy } from '@rtzll/reflow'
import { clientEntry, on, type Handle } from 'remix/component'

export const App = clientEntry(import.meta.url, function App(handle: Handle) {
  let count = 0

  return () => (
    <main class="minimal-shell">
      <div class="minimal-head">
        <h1>Reflow + Remix 3</h1>
        <Badge size="compact" color="blue">
          core.css
        </Badge>
      </div>
      <p>Edit app/public/app.tsx to start building with native Remix 3 components.</p>
      <div class="minimal-actions">
        <Button
          mix={on('click', () => {
            count++
            handle.update()
          })}
        >
          Count: {count}
        </Button>
      </div>
      <InputCopy label="Start dev server" value="pnpm dev" size="compact" />
    </main>
  )
})
`

const minimalCss = `body {
  margin: 0;
  background: var(--rf-bg);
  color: var(--rf-fg);
  font-family: var(--rf-font);
}

.minimal-shell {
  max-width: 520px;
  margin-inline: auto;
  padding: 56px 20px;
  display: grid;
  gap: 16px;
}

.minimal-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.minimal-head h1 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
}

.minimal-shell p {
  margin: 0;
  color: var(--rf-muted);
}

.minimal-actions {
  display: flex;
  gap: 8px;
}
`

export function applyTemplateVariant(
  destination: string,
  template: TemplateName,
  css: CssBundle,
): void {
  if (template === 'form') {
    rmSync(join(destination, 'app/public/settings.tsx'), { force: true })
    writeFileSync(join(destination, 'app/routes.ts'), formRoutesTs)
    writeFileSync(join(destination, 'app/actions/controller.tsx'), formControllerTsx)
    writeFileSync(join(destination, 'app/public/form-workspace.tsx'), formWorkspaceTsx)
    writeFileSync(join(destination, 'app/public/starter.css'), formCss)
  } else if (template === 'minimal') {
    rmSync(join(destination, 'app/public/settings.tsx'), { force: true })
    writeFileSync(join(destination, 'app/actions/controller.tsx'), minimalControllerTsx)
    writeFileSync(join(destination, 'app/public/app.tsx'), minimalAppTsx)
    writeFileSync(join(destination, 'app/public/starter.css'), minimalCss)
  }

  const controllerPath = join(destination, 'app/actions/controller.tsx')
  const specifier = css === 'core' ? '@rtzll/reflow/core.css' : '@rtzll/reflow/styles.css'
  const current =
    template === 'form'
      ? formControllerTsx
      : template === 'minimal'
        ? minimalControllerTsx
        : undefined
  if (current !== undefined) {
    writeFileSync(
      controllerPath,
      current.replace(/@rtzll\/reflow\/(?:styles|core)\.css/, specifier),
    )
  } else if (css === 'core') {
    const starterController = join(destination, 'app/actions/controller.tsx')
    writeFileSync(
      starterController,
      // Read/replace only when overriding the default starter CSS bundle.
      requireControllerWithCss(starterController, specifier),
    )
  }
}

function requireControllerWithCss(path: string, specifier: string): string {
  return readFileSync(path, 'utf8').replace(/@rtzll\/reflow\/(?:styles|core)\.css/, specifier)
}
