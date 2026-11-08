import type { Handle, RemixNode } from 'remix/component'
import { ImportMap } from 'remix/component/server'
import type { getPageAssets } from './assets.ts'
import { accentCss, type readSettings } from './public/site-settings.ts'
import { fontStylesheet, fontWeights } from './public/google-fonts.ts'
import { fontCatalog } from './public/google-font-catalog.ts'
import { ShowcaseIconSprite } from './public/icon-sprite.tsx'

interface DocumentProps {
  children: RemixNode
  assets: Awaited<ReturnType<typeof getPageAssets>>
  settings: ReturnType<typeof readSettings>
  title: string
}

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    const { assets, children, settings, title } = handle.props
    const customFont = settings.font.startsWith('google:')
      ? fontCatalog.find((font) => font.n === settings.font.slice(7))
      : undefined
    return (
      <html
        lang="en"
        data-theme={settings.theme}
        data-density={settings.density}
        data-icons={settings.icons}
        data-shape={settings.shape}
        data-hover={settings.hover}
        data-accent={settings.accent}
        data-font={settings.font}
        data-font-weights={customFont ? fontWeights(customFont).join(',') : undefined}
        data-custom-font={settings.customFont}
        data-font-weight={settings.fontWeight}
        style={{
          '--rf-accent': accentCss(settings.accent),
          '--rf-heading-font': customFont ? JSON.stringify(customFont.n) : undefined,
          '--rf-heading-weight': settings.fontWeight !== 'auto' ? settings.fontWeight : undefined,
        }}
      >
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light dark" />
          <meta name="description" content="Fluid components for Remix." />
          <link rel="icon" href={assets.favicon} type="image/svg+xml" />
          <title>{title}</title>
          {customFont && (
            <link id="reflow-custom-font" rel="stylesheet" href={fontStylesheet(customFont)} />
          )}
          {assets.stylesheets.map((href) => (
            <link key={href} rel="stylesheet" href={href} />
          ))}
          <ImportMap value={assets.entry.importMap} />
          {assets.entry.preloads.map((href) => (
            <link key={href} rel="modulepreload" href={href} />
          ))}
          <script type="module" src={assets.entry.href} />
        </head>
        <body>
          <ShowcaseIconSprite />
          {children}
        </body>
      </html>
    )
  }
}
