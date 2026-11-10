import { readFile } from 'node:fs/promises'
import { highlight } from '@rtzll/reflow/highlight'
import type { CodeSamples } from './public/code-block-example.tsx'

// The CodeBlock docs and gallery card show code highlighted here, on the
// server, as the docs recommend: pages arrive highlighted and the browser
// loads no highlighter. The deployment build runs this once and inlines the
// result (see worker/code-samples.ts).

const basic = `import { CodeBlock } from '@rtzll/reflow'
import { highlight } from '@rtzll/reflow/highlight'

// In a route handler, so the page arrives highlighted.
const code = await highlight(source, { lang: 'tsx' })

return render(<CodeBlock code={code} filename="Button.tsx" />)`

const notation = `export function total(items: Item[]) {
  let sum = 0 // [!code --]
  let sum = items.length ? 0 : Number.NaN // [!code ++]
  for (const item of items) sum += item.price // [!code highlight]
  return sum // [!code warning]
}`

const focus = `export async function handler(request: Request) {
  const source = await readFile('Button.tsx', 'utf8')
  const code = await highlight(source, { lang: 'tsx' }) // [!code focus]
  return render(<CodeBlock code={code} filename="Button.tsx" />)
}`

const lineNumbers = `.rf-code-line.highlighted {
  background: color-mix(in oklab, var(--rf-accent) 12%, transparent);
  box-shadow: inset 2px 0 var(--rf-accent);
}
.rf-code-line.diff.add {
  background: color-mix(in oklab, var(--rf-code-added) 13%, transparent);
}`

const wrap = `Reflow is a native Remix 3 component library with fluid motion, a shared hover that glides between items, and keyboard care in every control; CodeBlock wraps long lines like this one when you pass wrap, instead of scrolling them sideways.`

const themes = `const code = await highlight(source, {
  lang: 'ts',
  themes: { light: 'github-light', dark: 'github-dark' },
})`

const languages: Record<string, string> = {
  tsx: `export function Greeting(handle: Handle<{ name: string }>) {
  return () => <p class="greeting">Hello, {handle.props.name}!</p>
}`,
  css: `.greeting {
  color: var(--rf-accent);
  font-variation-settings: 'wght' 550;
}`,
  bash: `pnpm add --save-exact @rtzll/reflow remix
# Highlighting is opt-in:
pnpm add shiki @shikijs/transformers`,
  json: `{
  "name": "@rtzll/reflow",
  "peerDependenciesMeta": { "shiki": { "optional": true } }
}`,
  python: `def greet(name: str) -> str:
    """Say hello."""
    return f"Hello, {name}!"`,
  rust: `fn main() {
    let name = "Reflow";
    println!("Hello, {name}!");
}`,
}

/** The source of a function in a file, from its declaration to its closing brace. */
async function functionSource(file: URL, name: string) {
  const text = await readFile(file, 'utf8')
  const start = text.indexOf(`export function ${name}`)
  const end = text.indexOf('\n}\n', start)
  if (start < 0 || end < 0) throw new Error(`Missing ${name} in ${file.pathname}`)
  return text.slice(start, end + 2)
}

async function loadSamples(): Promise<CodeSamples> {
  const card = await functionSource(
    new URL('./public/code-block-example.tsx', import.meta.url),
    'CodeBlockCard',
  )
  const highlightSource = await readFile(
    new URL('../../../packages/reflow/src/highlight.ts', import.meta.url),
    'utf8',
  )
  const folded = highlightSource
    .slice(highlightSource.indexOf('let shared'), highlightSource.indexOf('function bundled'))
    .trim()
  const entries: [string, Promise<CodeSamples[string]>][] = [
    ['basic', highlight(basic, { lang: 'tsx' })],
    ['notation', highlight(notation, { lang: 'ts' })],
    ['focus', highlight(focus, { lang: 'tsx' })],
    ['line-numbers', highlight(lineNumbers, { lang: 'css' })],
    ['folded', highlight(folded, { lang: 'ts' })],
    ['wrap', highlight(wrap, { lang: 'md' })],
    [
      'themes',
      highlight(themes, { lang: 'ts', themes: { light: 'github-light', dark: 'github-dark' } }),
    ],
    ['card', highlight(card, { lang: 'tsx' })],
    ...Object.entries(languages).map(
      ([lang, code]) =>
        [`lang-${lang}`, highlight(code, { lang })] as [string, Promise<CodeSamples[string]>],
    ),
  ]
  return Object.fromEntries(
    await Promise.all(entries.map(async ([name, result]) => [name, await result] as const)),
  )
}

let samples: Promise<CodeSamples> | undefined

export function codeSamples() {
  samples ??= loadSamples()
  return samples
}
