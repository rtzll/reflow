import { fileURLToPath } from 'node:url'
import { createAssetServer } from 'remix/assets'
import { loadConfig } from 'remix/cli'
import type { CodeSamples } from './public/code-block-example.tsx'

const config = await loadConfig(fileURLToPath(new URL('../', import.meta.url)))
const production = process.env.NODE_ENV === 'production'
if (!config.assets?.allowFiles) throw new Error('Missing asset allowlist in remix.json')

export const assets = createAssetServer({
  ...config.assets,
  allowFiles: config.assets.allowFiles,
  minify: production,
  fingerprint: production,
  watch: !production,
})

export interface ExampleImages {
  sidebarAvatar: string
  thinkingPreview: string
  /** CodeBlock samples highlighted on the server, only on pages that show them. */
  code?: CodeSamples
}

export async function getPageAssets() {
  const [entry, fonts, library, site, examples, favicon, sidebarAvatar, thinkingPreview] =
    await Promise.all([
      assets.getScriptEntry('app/public/entry.ts'),
      assets.getHref('app/public/fonts.css'),
      assets.getHref('../../packages/reflow/dist/styles.css'),
      assets.getHref('app/public/site.css'),
      assets.getHref('app/public/examples.css'),
      assets.getHref('app/public/favicon.svg'),
      assets.getHref('app/public/demo-avatar.svg'),
      assets.getHref('app/public/reflow-preview.png'),
    ])
  return {
    entry,
    stylesheets: [fonts, library, site, examples],
    favicon,
    images: { sidebarAvatar, thinkingPreview },
  }
}
