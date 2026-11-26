import { fileURLToPath } from 'node:url'
import { buildSync } from 'esbuild'
import { createAssetServer } from 'remix/assets'
import { loadConfig } from 'remix/cli'
import { getSoundAssets } from './sound-assets.ts'
import type { CodeSamples } from './public/code-block-example.tsx'

const config = await loadConfig(fileURLToPath(new URL('../', import.meta.url)))
const production = process.env.NODE_ENV === 'production'
if (!config.assets?.allowFiles) throw new Error('Missing asset allowlist in remix.json')

// The element adapter and @pierre/diffs's lru_map include CommonJS modules.
// Serve them as ESM in source mode, as the Worker build does for production.
const dragAdapter = new URL('./public/apps/issues/drag-adapter.ts', import.meta.url)
export const assets = createAssetServer({
  ...config.assets,
  allowFiles: config.assets.allowFiles,
  scripts: {
    loaders: [
      (url, context, nextLoad) => {
        if (url !== dragAdapter.href && !url.endsWith('/lru_map/dist/lru.js'))
          return nextLoad(url, context)
        const bundle = buildSync({
          entryPoints: [fileURLToPath(url)],
          bundle: true,
          format: 'esm',
          platform: 'browser',
          target: 'es2022',
          define: {
            'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
          },
          minify: production,
          write: false,
        })
        return { format: 'module', source: bundle.outputFiles[0]!.text, shortCircuit: true }
      },
    ],
  },
  minify: production,
  fingerprint: production,
  watch: !production,
})

export interface ExampleImages {
  sidebarAvatar: string
  thinkingPreview: string
  /** CodeBlock samples highlighted on the server, only on pages that show them. */
  code?: CodeSamples
  /** DiffView HTML pre-rendered on the server for zero-flash hydration. */
  diff?: string
}

export async function getPageAssets(appSlug?: string) {
  const [entry, fonts, library, site, examples, favicon, sidebarAvatar, thinkingPreview, ogImage] =
    await Promise.all([
      assets.getScriptEntry('app/public/entry.ts'),
      assets.getHref('app/public/fonts.css'),
      assets.getHref('../../packages/reflow/dist/styles.css'),
      assets.getHref('app/public/site.css'),
      assets.getHref('app/public/examples.css'),
      assets.getHref('app/public/favicon.svg'),
      assets.getHref('app/public/demo-avatar.svg'),
      assets.getHref('app/public/reflow-preview.png'),
      assets.getHref('app/public/og.png'),
    ])
  return {
    entry,
    stylesheets: appSlug
      ? [
          fonts,
          library,
          site,
          examples,
          await assets.getHref(`app/public/apps/${appSlug}/styles.css`),
        ]
      : [fonts, library, site, examples],
    favicon,
    sounds: await getSoundAssets((file) => assets.getHref(file)),
    /** The link preview image every page shares. Regenerate it with `pnpm --filter @reflow/web og:image`. */
    ogImage,
    images: { sidebarAvatar, thinkingPreview },
  }
}
