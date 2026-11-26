import { build } from 'esbuild'
import type { BuildOptions, Metafile, Plugin } from 'esbuild'
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSoundAssets, soundFiles } from '../app/sound-assets.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = resolve(root, 'build')
const publicDir = resolve(root, 'app/public')
const clientEntries = new Map<string, string>()
for (const file of await readdir(publicDir, { recursive: true })) {
  if (!/\.tsx?$/.test(file) || /\.test\./.test(file)) continue
  const path = resolve(publicDir, file)
  if (/\bclientEntry\s*\(/.test(await readFile(path, 'utf8'))) {
    clientEntries.set(path, `file:///${relative(root, path).replaceAll('\\', '/')}`)
  }
}

const clientEntryPlugin: Plugin = {
  name: 'reflow-client-entries',
  setup(builder) {
    builder.onLoad({ filter: /\.tsx?$/ }, async ({ path }) => {
      const id = clientEntries.get(path)
      if (!id) return
      const source = await readFile(path, 'utf8')
      if (!source.includes('import.meta.url')) throw new Error(`Missing entry ID in ${path}`)
      return {
        contents: source.replaceAll('import.meta.url', JSON.stringify(id)),
        loader: path.endsWith('.tsx') ? 'tsx' : 'ts',
      }
    })
  },
}

await rm(output, { recursive: true, force: true })
const common: BuildOptions = {
  absWorkingDir: root,
  bundle: true,
  format: 'esm',
  target: 'es2022',
  minify: true,
  // Remix resolves client exports using component function names.
  keepNames: true,
  metafile: true,
  sourcemap: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [clientEntryPlugin],
}
const styles = [
  'app/public/fonts.css',
  '../../packages/reflow/dist/styles.css',
  'app/public/site.css',
  'app/public/examples.css',
]
const appStyles = (await readdir(resolve(publicDir, 'apps'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map(({ name }) => [name, `app/public/apps/${name}/styles.css`] as const)
const [client, samples, sources, diffs] = await Promise.all([
  build({
    ...common,
    entryPoints: [
      'app/public/entry.ts',
      ...clientEntries.keys(),
      ...styles,
      ...soundFiles,
      ...appStyles.map(([slug, path]) => ({ in: path, out: `app-${slug}` })),
    ],
    outdir: resolve(output, 'client'),
    entryNames: 'assets/[name]-[hash]',
    chunkNames: 'assets/chunk-[hash]',
    assetNames: 'assets/[name]-[hash]',
    publicPath: '/',
    platform: 'browser',
    splitting: true,
    loader: { '.woff2': 'file', '.mp3': 'copy' },
  }),
  // Highlight the CodeBlock samples while bundling, so the worker never includes Shiki.
  import('../app/code-samples.ts').then(({ codeSamples }) => codeSamples()),
  import('../app/code-samples.ts').then(({ exampleSources }) => exampleSources()),
  // Pre-render showcase diffs into Declarative Shadow DOM HTML, so the worker ships zero-flash SSR diffs with no @pierre/diffs runtime.
  import('../app/diff-samples.ts').then(({ diffSamples }) => diffSamples()),
])

if (!client.metafile) throw new Error('esbuild returned no metafile')
const clientMeta: Metafile = client.metafile

function outputOf(source: string) {
  const entry = Object.entries(clientMeta.outputs).find(
    ([, value]) => value.entryPoint && resolve(root, value.entryPoint) === resolve(root, source),
  )
  if (!entry) throw new Error(`Missing browser output for ${source}`)
  return entry[0]
}
function publicHref(file: string) {
  return '/' + relative(resolve(output, 'client'), resolve(root, file)).replaceAll('\\', '/')
}
function href(source: string) {
  return publicHref(outputOf(source))
}
// Every chunk a module imports statically, however deep. Preloading them lets
// the browser fetch a page's scripts at once instead of one import level per
// round trip, which on a slow connection costs seconds before hydration.
function staticImports(file: string, found = new Set<string>()) {
  for (const { path, kind, external } of clientMeta.outputs[file]?.imports ?? []) {
    if (kind !== 'import-statement' || external || found.has(path)) continue
    found.add(path)
    staticImports(path, found)
  }
  return found
}
function scriptEntry(source: string) {
  const file = outputOf(source)
  return {
    href: publicHref(file),
    importMap: { imports: {} },
    preloads: [file, ...staticImports(file)].map(publicHref),
  }
}

// Copy only explicitly public images and license notices, never the source tree.
for (const file of [
  'favicon.svg',
  'demo-avatar.svg',
  'reflow-preview.png',
  'og.png',
  'Inter-LICENSE.txt',
  'GeistSerif-LICENSE.txt',
  'icons/Tabler-LICENSE.txt',
  'icons/Phosphor-LICENSE.txt',
  'icons/HugeIcons-LICENSE.txt',
]) {
  const destination = resolve(output, 'client', file)
  await mkdir(dirname(destination), { recursive: true })
  await copyFile(resolve(publicDir, file), destination)
}
await copyFile(
  new URL('./LICENSE', import.meta.resolve('button-sounds/package.json')),
  resolve(output, 'client/Button-Sounds-LICENSE.txt'),
)
await writeFile(
  resolve(output, 'client/_headers'),
  '/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n  X-Content-Type-Options: nosniff\n',
)

const manifest = {
  appStyles: Object.fromEntries(appStyles.map(([slug, path]) => [slug, href(path)])),
  page: {
    entry: scriptEntry('app/public/entry.ts'),
    stylesheets: styles.map(href),
    favicon: '/favicon.svg',
    sounds: await getSoundAssets(href),
    ogImage: '/og.png',
    images: { sidebarAvatar: '/demo-avatar.svg', thinkingPreview: '/reflow-preview.png' },
  },
  entries: Object.fromEntries([...clientEntries].map(([path, id]) => [id, scriptEntry(path)])),
}
const worker = await build({
  ...common,
  entryPoints: ['worker/index.ts'],
  outfile: resolve(output, 'worker/index.js'),
  platform: 'browser',
  conditions: ['workerd', 'worker', 'browser'],
  external: ['node:async_hooks'],
  define: {
    ...common.define,
    REFLOW_ASSETS: JSON.stringify(manifest),
    REFLOW_EXAMPLE_SOURCES: JSON.stringify(sources),
    REFLOW_CODE_SAMPLES: JSON.stringify(samples),
    REFLOW_DIFF_SAMPLES: JSON.stringify(diffs),
  },
  plugins: [
    clientEntryPlugin,
    {
      name: 'reflow-worker-assets',
      setup(builder) {
        builder.onResolve({ filter: /assets\.ts$/ }, ({ path, resolveDir }) => {
          if (resolve(resolveDir, path) === resolve(root, 'app/assets.ts'))
            return { path: resolve(root, 'worker/assets.ts') }
        })
        builder.onResolve({ filter: /code-samples\.ts$/ }, ({ path, resolveDir }) => {
          if (resolve(resolveDir, path) === resolve(root, 'app/code-samples.ts'))
            return { path: resolve(root, 'worker/code-samples.ts') }
        })
        builder.onResolve({ filter: /diff-samples\.ts$/ }, ({ path, resolveDir }) => {
          if (resolve(resolveDir, path) === resolve(root, 'app/diff-samples.ts'))
            return { path: resolve(root, 'worker/diff-samples.ts') }
        })
        builder.onResolve({ filter: /^@pierre\/diffs(?:\/.*)?$/ }, ({ path }) => ({
          path,
          namespace: 'reflow-worker-diffs-stub',
        }))
        builder.onLoad({ filter: /.*/, namespace: 'reflow-worker-diffs-stub' }, () => ({
          contents: 'export {}\n',
          loader: 'js',
        }))
        builder.onLoad({ filter: /drag-adapter\.ts$/ }, ({ path }) => {
          if (path === resolve(root, 'app/public/apps/issues/drag-adapter.ts')) {
            return {
              contents:
                'export const draggable = () => () => {}\nexport const dropTargetForElements = () => () => {}\nexport const setIssueDragPreview = () => {}\n',
              loader: 'ts',
            }
          }
        })
      },
    },
  ],
})
await writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
await writeFile(
  resolve(output, 'metadata.json'),
  JSON.stringify({ client: client.metafile, worker: worker.metafile }, null, 2) + '\n',
)
console.log(`Built showcase with ${clientEntries.size} client entry modules.`)
