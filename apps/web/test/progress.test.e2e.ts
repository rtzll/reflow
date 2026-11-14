import { expect } from 'playwright/test'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

it('keeps indeterminate progress visible and still in reduced motion', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/progress')
  const progress = page.locator('#indeterminate .rf-progress')
  await expect(progress.getByRole('progressbar', { name: 'Preparing files' })).toHaveCount(1)
  const fill = progress.locator('.rf-progress-fill')
  await expect(fill).toBeVisible()
  await expect(fill).toHaveCSS('animation-name', 'none')
})
