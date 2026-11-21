// Inline Markdown's remark pipeline into dist/markdown.js after tsc.
//
// Remix's asset server serves browser code as unbundled ES modules, and two packages in the
// pipeline ship only CommonJS: `extend` (used by unified) and `style-to-js` (used by
// hast-util-to-jsx-runtime). Bundling here means apps install and serve nothing extra.
// Remix and Reflow's own modules stay as imports, so apps keep a single copy of each.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, type Plugin } from 'esbuild'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const entry = join(root, 'dist/markdown.js')
const permissive = new Set(['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD'])

const keepImports: Plugin = {
  name: 'keep-reflow-and-remix-imports',
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.kind === 'entry-point') return undefined
      if (/^(?:remix|@remix-run)(?:\/|$)/.test(args.path))
        return { path: args.path, external: true }
      // Reflow's own modules, such as ./code-block.js, stay separate files.
      if (args.importer === entry && args.path.startsWith('.'))
        return { path: args.path, external: true }
      return undefined
    })
  },
}

const result = await build({
  entryPoints: [entry],
  outfile: entry,
  allowOverwrite: true,
  bundle: true,
  format: 'esm',
  // One file for the browser and server rendering: no browser or node conditions, so each
  // package's portable build is chosen. The browser build of
  // decode-named-character-reference, for one, needs the DOM.
  platform: 'neutral',
  mainFields: ['module', 'main'],
  target: 'es2022',
  minify: true,
  metafile: true,
  legalComments: 'none',
  plugins: [keepImports],
  logLevel: 'warning',
})

// Collect each bundled package once, with its license text.
const packages = new Map<string, string>()
for (const input of Object.keys(result.metafile.inputs)) {
  const match = /^(.*node_modules\/((?:@[^/]+\/)?[^/]+))\//.exec(resolve(root, input))
  if (match) packages.set(match[2]!, match[1]!)
}
const notices: string[] = []
for (const [name, dir] of [...packages].sort(([a], [b]) => a.localeCompare(b))) {
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  if (!permissive.has(manifest.license)) {
    throw new Error(`${name} is licensed ${manifest.license}, which is not on the allowlist`)
  }
  const file = existsSync(dir) && readdirSync(dir).find((item) => /^licen[cs]e(?:\.|$)/i.test(item))
  if (!file) throw new Error(`${name} has no license file to reproduce`)
  notices.push(
    `${name}@${manifest.version} (${manifest.license})\n\n${readFileSync(join(dir, file), 'utf8').trim()}`,
  )
}
writeFileSync(
  join(root, 'dist/markdown-licenses.txt'),
  `dist/markdown.js includes the following packages.\n\n${notices.join('\n\n---\n\n')}\n`,
)
console.log(`Bundled ${packages.size} packages into dist/markdown.js`)
