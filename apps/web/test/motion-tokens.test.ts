import { readFileSync } from 'node:fs'
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
