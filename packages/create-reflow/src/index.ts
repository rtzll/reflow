#!/usr/bin/env node
import { isAbsolute, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { create, readOptions, usage } from './create.ts'

const template = fileURLToPath(new URL('../template/', import.meta.url))

try {
  const options = readOptions(process.argv.slice(2))
  if (options === 'help') {
    console.log(usage)
  } else {
    const { destination, installed } = create(options, template)
    const nearby = relative(process.cwd(), destination)
    const path =
      nearby === '..' || nearby.startsWith(`..${sep}`) || isAbsolute(nearby)
        ? destination
        : nearby || '.'
    console.log(`\nCreated a Reflow app in ${path}.\n\nNext:`)
    if (path !== '.') console.log(`  cd ${path}`)
    if (!installed) {
      if (options.install) {
        console.log('  corepack enable pnpm   # pnpm was not found; or install it another way')
      }
      console.log('  pnpm install')
    }
    console.log('  pnpm dev')
  }
} catch (error) {
  console.error(`${error instanceof Error ? error.message : error}\n\n${usage}`)
  process.exitCode = 1
}
