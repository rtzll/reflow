// Builds the package into a fresh folder and swaps it in place of dist/ with
// two renames. Deleting dist/ first, as a plain `rm -rf dist && tsc` does,
// left a running `pnpm dev` importing a half-empty folder: its watcher
// restarted on the first change, failed to find dist/index.js, and then
// waited for changes to files it no longer watched.
import { execFileSync } from 'node:child_process'
import { copyFileSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const next = 'dist.next'
const previous = 'dist.previous'

rmSync(next, { recursive: true, force: true })
rmSync(previous, { recursive: true, force: true })
execFileSync('tsc', ['-p', 'tsconfig.json', '--outDir', next], { stdio: 'inherit' })
for (const file of readdirSync('src')) {
  if (file.endsWith('.css')) copyFileSync(join('src', file), join(next, file))
}

try {
  renameSync('dist', previous)
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}
renameSync(next, 'dist')
rmSync(previous, { recursive: true, force: true })
