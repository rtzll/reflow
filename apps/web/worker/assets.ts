import type { ScriptEntry } from 'remix/assets'
import type { getPageAssets as getDevelopmentPageAssets } from '../app/assets.ts'

// Replaced by the build with public URLs only, never filesystem paths.
declare const REFLOW_ASSETS: {
  page: Awaited<ReturnType<typeof getDevelopmentPageAssets>>
  appStyles: Record<string, string>
  entries: Record<string, ScriptEntry>
}

export const assets = {
  async getScriptEntry(id: string): Promise<ScriptEntry> {
    const entry = REFLOW_ASSETS.entries[id]
    if (!entry) throw new Error(`Unknown client entry: ${id}`)
    return entry
  },
  async fetch(_request: Request): Promise<Response | null> {
    // Cloudflare serves existing files before the router; missing assets stay 404s.
    return null
  },
}

export async function getPageAssets(appSlug?: string) {
  const page = REFLOW_ASSETS.page
  if (!appSlug) return page
  const style = REFLOW_ASSETS.appStyles[appSlug]
  if (!style) throw new Error(`Unknown app stylesheet: ${appSlug}`)
  return { ...page, stylesheets: [...page.stylesheets, style] }
}
