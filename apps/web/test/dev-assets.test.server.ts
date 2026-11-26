import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { it } from 'remix/test'
import { assets, createDevAssetServer } from '../app/assets.ts'

const webRoot = fileURLToPath(new URL('../', import.meta.url))
const publicDir = resolve(webRoot, 'app/public')

async function discoverClientEntries(): Promise<string[]> {
  const entries = ['app/public/entry.ts']
  for (const file of await readdir(publicDir, { recursive: true })) {
    if (!/\.tsx?$/.test(file) || /\.test\./.test(file)) continue
    const absPath = resolve(publicDir, file)
    const source = await readFile(absPath, 'utf8')
    if (/\bclientEntry\s*\(/.test(source)) {
      entries.push(relative(webRoot, absPath).replaceAll('\\', '/'))
    }
  }
  return entries.sort()
}

it('compiles all client entries and transitive module imports in source mode without allowlist errors', async () => {
  const devAssets = createDevAssetServer({ watch: false })
  try {
    const entries = await discoverClientEntries()
    assert.ok(entries.length >= 15, `Expected at least 15 client entries, got ${entries.length}`)

    const queue: string[] = []
    const visited = new Set<string>()
    const enqueue = (href: string) => {
      if (!href.startsWith('/assets/') || href.includes('*')) return
      if (visited.has(href)) return
      visited.add(href)
      queue.push(href)
    }

    for (const entryPath of entries) {
      const scriptEntry = await devAssets.getScriptEntry(entryPath)
      enqueue(scriptEntry.href)
      for (const preload of scriptEntry.preloads ?? []) enqueue(preload)
      for (const mapped of Object.values(scriptEntry.importMap?.imports ?? {})) enqueue(mapped)
    }

    while (queue.length > 0) {
      const href = queue.shift()!
      const response = await devAssets.fetch(new Request(`http://127.0.0.1${href}`))
      assert.ok(response, `Expected dev asset server to handle ${href}`)
      assert.equal(response.status, 200, `Dev asset server failed to compile ${href}`)
      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('javascript')) {
        const code = await response.text()
        // Follow rewritten static/dynamic /assets/ imports so optional peer chunks compile too.
        for (const match of code.matchAll(
          /(?:\bfrom\s*|\bimport\s*\(?)\s*["'](\/assets\/[^"'\s)]+)["']/g,
        )) {
          const target = match[1]
          if (target) enqueue(target)
        }
      }
    }

    assert.ok(visited.size > entries.length, 'Expected transitive module graph to be compiled')
  } finally {
    await devAssets.close()
    await assets.close()
  }
})
