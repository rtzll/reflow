import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('keeps indeterminate progress visible and still in reduced motion', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/docs/progress')
  const progress = page.locator('#indeterminate .rf-progress')
  await expect(progress.getByRole('progressbar', { name: 'Preparing files' })).toHaveCount(1)
  const fill = progress.locator('.rf-progress-fill')
  await expect(fill).toBeVisible()
  await expect(fill).toHaveCSS('animation-name', 'none')
})

it('fills the track from its start edge to the value', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/docs/progress')
  const progress = page.locator('.rf-progress:not([data-indeterminate])').first()
  const share = await progress.evaluate((element) => {
    const bar = element.querySelector('progress')
    const track = element.querySelector('.rf-progress-track')?.getBoundingClientRect()
    const fill = element.querySelector('.rf-progress-fill')?.getBoundingClientRect()
    if (!bar || !track || !fill) throw new Error('Missing progress parts')
    return { expected: bar.value / bar.max, shown: (fill.right - track.left) / track.width }
  })
  expect(share.shown).toBeCloseTo(share.expected, 2)
})
