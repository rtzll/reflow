import { readdirSync, readFileSync } from 'node:fs'
import { motion } from '@rtzll/reflow'
import { equal } from 'remix/assert'
import { it } from 'remix/test'

function normalizeCss(value: string) {
  return value.replace(/\s+/g, ' ').replaceAll('( ', '(').replaceAll(' )', ')').trim()
}

// The CSS spring tokens must stay the same curves as the JS motion tiers.
it('keeps the CSS spring tokens identical to the motion tiers', () => {
  const css = readFileSync(
    new URL('../../../packages/reflow/src/foundations.css', import.meta.url),
    'utf8',
  )
  for (const tier of ['fast', 'moderate', 'slow'] as const) {
    const declared = css.match(new RegExp(`--rf-spring-${tier}: ([^;]+);`))?.[1]
    equal(
      normalizeCss(declared ?? ''),
      normalizeCss(String(motion[tier])),
      `--rf-spring-${tier} differs from motion.${tier}`,
    )
  }
})

const stylesheets = () => {
  const dirs = [
    new URL('../../../packages/reflow/src/', import.meta.url),
    new URL('../app/public/', import.meta.url),
  ]
  return dirs.flatMap((dir) =>
    readdirSync(dir)
      .filter((file) => file.endsWith('.css'))
      .map((file) => ({ file, css: readFileSync(new URL(file, dir), 'utf8') })),
  )
}

// As in the reference's UI polish checks: `all` animates layout and paint
// properties nobody meant to move.
it('never transitions all', () => {
  for (const { file, css } of stylesheets()) {
    const found = css.match(/transition(-property)?:\s*all\b[^;]*;/)
    equal(found?.[0], undefined, `${file} transitions all`)
  }
})

// The build's CSS transformer folds animation-timeline into a literal
// animation shorthand, a syntax browsers reject, which drops the animation.
// Rules with a timeline keep their shorthand behind a variable.
it('keeps scroll-driven animation shorthands behind a variable', () => {
  for (const { file, css } of stylesheets()) {
    for (const [, body] of css.matchAll(/\{([^{}]*animation-timeline[^{}]*)\}/g)) {
      const shorthand = body.match(/(?:^|[;\s])animation:\s*([^;]+);/)?.[1]
      if (shorthand === undefined) continue
      equal(shorthand.trim().startsWith('var('), true, `${file}: animation: ${shorthand.trim()}`)
    }
  }
})
