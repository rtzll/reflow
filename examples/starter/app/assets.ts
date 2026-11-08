import { fileURLToPath } from 'node:url'
import { createAssetServer } from 'remix/assets'
import { loadConfig } from 'remix/cli'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const config = await loadConfig(rootDir)
if (!config.assets?.allowFiles) throw new Error('Missing asset allowlist in remix.json')

export const assets = createAssetServer({
  ...config.assets,
  rootDir,
  allowFiles: config.assets.allowFiles,
  watch: process.env.NODE_ENV !== 'production',
})
