import { readdirSync, readFileSync } from 'node:fs'
import * as assert from 'remix/assert'
import { it } from 'remix/test'

const src = new URL('../../../packages/reflow/src/', import.meta.url)
const entry = readFileSync(new URL('styles.css', src), 'utf8')
const imports = [...entry.matchAll(/^@import\s+'\.\/([^']+)'(.*);$/gm)]

// Apps override Reflow through their own CSS and Remix's css() styles only
// while every Reflow rule sits in the reflow layer; an unlayered stylesheet
// would beat them again.
it('imports every stylesheet into the reflow layer', () => {
  const unlayered = imports.filter(([, , rest]) => rest.trim() !== 'layer(reflow)')
  assert.deepEqual(
    unlayered.map(([, file]) => file),
    [],
  )
  const imported = new Set(imports.map(([, file]) => file))
  const missing = readdirSync(src).filter(
    (file) => file.endsWith('.css') && file !== 'styles.css' && !imported.has(file),
  )
  assert.deepEqual(missing, [])
})

it('has no rules outside its imports', () => {
  const rest = entry
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^@import[^;]*;$/gm, '')
    .trim()
  assert.equal(rest, '')
})
