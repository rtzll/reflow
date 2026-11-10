import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const folder = new URL('../apps/web/test/', import.meta.url)
const e2e = readdirSync(folder).filter((name) => name.endsWith('.e2e.ts'))

// End-to-end tests open pages through open() in showcase-router.ts, which
// waits for hydration; acting on markup before its scripts are wired is the
// most common cause of flaky tests.
test('end-to-end tests navigate only through open()', () => {
  assert.ok(e2e.length > 0, 'found the end-to-end tests')
  const offenders = e2e.flatMap((name) =>
    readFileSync(new URL(name, folder), 'utf8')
      .split('\n')
      .flatMap((line, index) => (/\.goto\(/.test(line) ? [`${name}:${index + 1}`] : [])),
  )
  assert.deepEqual(offenders, [], `use open(page, url) instead of goto: ${offenders.join(', ')}`)
})
