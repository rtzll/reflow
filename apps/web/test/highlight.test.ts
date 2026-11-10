import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { highlight } from '@rtzll/reflow/highlight'

const styles = (result: Awaited<ReturnType<typeof highlight>>) =>
  result.lines.flatMap((line) => line.tokens.map((token) => token.style ?? ''))

it('colours tokens with Reflow’s CSS variables, ready to render', async () => {
  const result = await highlight('const greeting = "hi"', { lang: 'ts' })
  assert.equal(result.lang, 'ts')
  assert.equal(result.code, 'const greeting = "hi"')
  assert.equal(result.lines.length, 1)
  assert.equal(result.lines[0]!.tokens.map((token) => token.content).join(''), result.code)
  assert.ok(styles(result).some((style) => style.includes('var(--rf-code-token-keyword)')))
  assert.ok(styles(result).some((style) => style.includes('var(--rf-code-token-string')))
  // Plain data: it crosses from a route handler into a client entry as JSON.
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result)
})

it('reads [!code] notation into line marks and drops it from the code', async () => {
  const result = await highlight(
    [
      "import { CodeBlock } from '@rtzll/reflow' // [!code ++]",
      "import { Pre } from './pre' // [!code --]",
      'const block = <CodeBlock code={source} /> // [!code highlight]',
      'render(block) // [!code focus]',
    ].join('\n'),
    { lang: 'tsx' },
  )
  assert.ok(!result.code.includes('[!code'))
  // No space is left where a comment was.
  assert.ok(result.code.split('\n').every((line) => line === line.trimEnd()))
  assert.deepEqual(result.flags.sort(), ['has-diff', 'has-focused', 'has-highlighted'])
  const classes = result.lines.map((line) => line.class ?? '')
  assert.ok(classes[0]!.includes('diff') && classes[0]!.includes('add'))
  assert.ok(classes[1]!.includes('diff') && classes[1]!.includes('remove'))
  assert.ok(classes[2]!.includes('highlighted'))
  assert.ok(classes[3]!.includes('focused'))
  assert.equal(
    result.lines.map((line) => line.tokens.map((token) => token.content).join('')).join('\n'),
    result.code,
  )
})

it('keeps notation as written when asked to', async () => {
  const code = 'let a = 1 // [!code highlight]'
  const result = await highlight(code, { lang: 'js', notation: false })
  assert.equal(result.code, code)
  assert.deepEqual(result.flags, [])
})

it('loads any bundled language on demand and falls back to plain text', async () => {
  const rust = await highlight('fn main() { println!("hi"); }', { lang: 'rust' })
  assert.ok(styles(rust).some((style) => style.includes('--rf-code-token')))
  const python = await highlight('def f():\n    return 1', { lang: 'py' })
  assert.equal(python.lang, 'py')
  assert.equal(python.lines.length, 2)
  const unknown = await highlight('just words', { lang: 'not-a-language' })
  assert.equal(unknown.lang, 'text')
  assert.equal(unknown.code, 'just words')
})

it('takes any Shiki theme, or a light and dark pair', async () => {
  const single = await highlight('let a = 1', { lang: 'js', theme: 'github-light' })
  assert.ok(styles(single).some((style) => /color:#[0-9a-f]{6}/i.test(style)))
  const pair = await highlight('let a = 1', {
    lang: 'js',
    themes: { light: 'github-light', dark: 'github-dark' },
  })
  assert.ok(styles(pair).some((style) => style.includes('--shiki-dark')))
  assert.ok(pair.style?.includes('--shiki-dark-bg'))
})
