import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('answers in place without changing the banner height and submits the answer', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/confirmation')
  const basic = page.locator('#basic')
  const banner = basic.getByRole('group', { name: 'Run pnpm build?' })
  const before = (await banner.boundingBox())!.height
  await basic.getByRole('button', { name: 'Approve' }).click()
  const answer = basic.getByRole('status').getByText('Approved')
  await expect(answer).toBeVisible()
  await expect(answer).toBeFocused()
  assert.equal((await banner.boundingBox())!.height, before)

  const form = page.locator('#in-a-form')
  await form.getByRole('button', { name: 'Submit' }).click()
  await expect(form.locator('output')).toHaveText('send=unanswered')
  await form.getByRole('button', { name: 'Don’t send' }).click()
  await form.getByRole('button', { name: 'Submit' }).click()
  await expect(form.locator('output')).toHaveText('send=denied')
})
