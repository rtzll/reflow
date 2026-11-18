import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))

export async function startLocalWorker() {
  process.env.WRANGLER_LOG_PATH = resolve(root, '.wrangler/logs')
  process.env.WRANGLER_SEND_METRICS = 'false'
  const { unstable_dev } = await import('wrangler')
  return unstable_dev(resolve(root, 'build/worker/index.js'), {
    config: resolve(root, 'wrangler.jsonc'),
    local: true,
    ip: '127.0.0.1',
    port: 0,
    inspectorPort: 0,
    persist: false,
    logLevel: 'error',
    experimental: {
      forceLocal: true,
      watch: false,
      disableDevRegistry: true,
      disableExperimentalWarning: true,
    },
  })
}
