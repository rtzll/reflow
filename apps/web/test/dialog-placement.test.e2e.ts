import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('centers the AlertDialog trigger in its gallery card and docs preview', async (t) => {
  const page = await t.serve(showcaseServer)
  for (const [url, selector] of [
    ['/', 'article[data-component="alert-dialog"] .site-preview-stage'],
    ['/docs/alert-dialog', '#playground .doc-preview-stage'],
    ['/docs/alert-dialog', '#leave-without-saving .doc-preview-stage'],
  ]) {
    await open(page, url)
    const stage = page.locator(selector)
    const trigger = stage.getByRole('button', { name: /Delete draft|Leave editor/ })
    await expect(trigger).toBeVisible()
    const bounds = (await stage.boundingBox())!
    const button = (await trigger.boundingBox())!
    expect(Math.abs(button.x + button.width / 2 - (bounds.x + bounds.width / 2))).toBeLessThan(1)
  }
})

it('opens both dialog panels at the center of the viewport', async (t) => {
  const page = await t.serve(showcaseServer)
  for (const [url, name, role] of [
    ['/docs/dialog', 'Open dialog', 'dialog'],
    ['/docs/alert-dialog', 'Delete draft', 'alertdialog'],
  ] as const) {
    await open(page, url)
    await page.locator('#basic, #playground').getByRole('button', { name, exact: true }).click()
    const panel = page.getByRole(role)
    await expect(panel).toBeVisible()
    const center = await panel.evaluate((element) => {
      const { x, y, width, height } = element.getBoundingClientRect()
      return [x + width / 2 - innerWidth / 2, y + height / 2 - innerHeight / 2]
    })
    for (const offset of center) expect(Math.abs(offset)).toBeLessThan(1)
  }
})

it('clears the deletion confirmation and restarts its timer on another confirmation', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.clock.install()
  await open(page, '/')
  const example = page.locator('[data-component="alert-dialog"]')
  const confirm = async () => {
    await example.getByRole('button', { name: 'Delete draft', exact: true }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete draft' }).click()
  }
  await confirm()
  await expect(example.getByRole('status')).toHaveText('Draft deleted')
  await page.clock.runFor(2000)
  await confirm()
  await page.clock.runFor(2000)
  await expect(example.getByRole('status')).toHaveText('Draft deleted')
  await page.clock.runFor(1000)
  await expect(example.getByRole('status')).toBeEmpty()
})
