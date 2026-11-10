#!/usr/bin/env node
// Runs end-to-end test files many times side by side, to tell a flaky test
// from a sound one before deciding what to fix. The copies load the machine
// the way a busy CI runner is loaded, which is when timing bugs show.
//
//   pnpm test:stress apps/web/test/drawer.test.e2e.ts [more files] [--runs 10] [--parallel 5]
//
// It exits non-zero if any run failed and prints each distinct failure once.
import { spawn } from 'node:child_process'
import { availableParallelism } from 'node:os'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const remix = `${root}apps/web/node_modules/.bin/remix`

const args = process.argv.slice(2)
const files = []
let runs = 10
let parallel = Math.max(2, Math.min(5, Math.floor(availableParallelism() / 2)))
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--runs') runs = Number(args[++i])
  else if (args[i] === '--parallel') parallel = Number(args[++i])
  else if (args[i] !== '--') files.push(args[i])
}
if (files.length === 0 || !(runs > 0) || !(parallel > 0)) {
  console.error('Usage: pnpm test:stress <e2e test files…> [--runs 10] [--parallel 5]')
  process.exit(2)
}

function run(index) {
  return new Promise((resolve) => {
    const child = spawn(remix, ['test', '--type', 'e2e', ...files], { cwd: root })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('close', (code) => {
      const passed = code === 0
      console.log(`run ${String(index + 1).padStart(2)}: ${passed ? 'pass' : 'FAIL'}`)
      resolve({ passed, output })
    })
  })
}

console.log(`Running ${files.join(', ')} ${runs} times, ${parallel} at once.`)
const results = []
let next = 0
await Promise.all(
  Array.from({ length: Math.min(parallel, runs) }, async () => {
    while (next < runs) results.push(await run(next++))
  }),
)

const failed = results.filter((result) => !result.passed)
console.log(`\n${runs - failed.length} of ${runs} runs passed.`)
if (failed.length === 0) process.exit(0)

// The runner lists failures after "Failed tests:"; show each distinct one once.
const failures = new Set(
  failed.map((result) => {
    const at = result.output.indexOf('Failed tests:')
    return (at === -1 ? result.output.slice(-2000) : result.output.slice(at))
      .split('\n')
      .filter((line) => !/^\s+at /.test(line))
      .join('\n')
      .trim()
  }),
)
for (const failure of failures) console.log(`\n${failure}`)
process.exit(1)
