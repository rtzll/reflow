// Builds the package into a fresh folder and swaps it in place of dist/ with
// two renames. Deleting dist/ first, as a plain `rm -rf dist && tsc` does,
// left a running `pnpm dev` importing a half-empty folder: its watcher
// restarted on the first change, failed to find dist/index.js, and then
// waited for changes to files it no longer watched.
import { execFileSync } from 'node:child_process'
import { readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function bundleStyles(sourceDir: string) {
  const entry = readFileSync(join(sourceDir, 'styles.css'), 'utf8')
  const imports = [...entry.matchAll(/^@import\s+'\.\/([^']+)'\s+layer\(reflow\)\s*;$/gm)]
  const remainder = entry
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^@import\s+'\.\/([^']+)'\s+layer\(reflow\)\s*;$/gm, '')
    .trim()
  if (remainder !== '') {
    throw new Error(`Unexpected CSS in styles.css outside layer(reflow) imports:\n${remainder}`)
  }

  const properties: string[] = []
  const sections: string[] = []
  const propertyRule = /@property\s+[^{]+\{[^{}]*\}/g

  for (const [, file] of imports) {
    const css = readFileSync(join(sourceDir, file), 'utf8')
    if (/@(?:import|charset|namespace)\b/.test(css)) {
      throw new Error(`Nested @import/@charset/@namespace is not supported in ${file}`)
    }
    const layered = css
      .replace(propertyRule, (match) => {
        properties.push(match.trim())
        return ''
      })
      .trim()
    sections.push(`/* ${file} */\n${layered}`)
  }

  const header =
    '/* Reflow stylesheet. Every rule sits in the `reflow` cascade layer so app CSS and Remix css() styles override it. */'
  const propertyBlock = properties.length > 0 ? `\n\n${properties.join('\n\n')}` : ''
  return `${header}${propertyBlock}\n\n@layer reflow {\n${sections.join('\n\n')}\n}\n`
}

const next = 'dist.next'
const previous = 'dist.previous'

rmSync(next, { recursive: true, force: true })
rmSync(previous, { recursive: true, force: true })
execFileSync('tsc', ['-p', 'tsconfig.json', '--outDir', next], { stdio: 'inherit' })
writeFileSync(join(next, 'styles.css'), bundleStyles('src'))

try {
  renameSync('dist', previous)
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}
renameSync(next, 'dist')
rmSync(previous, { recursive: true, force: true })
