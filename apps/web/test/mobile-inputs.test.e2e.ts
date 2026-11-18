import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('keeps editable controls at least 16px on touch screens without disabling zoom', async (t) => {
  const desktop = await t.serve(showcaseServer)
  await open(desktop, '/docs/input')
  const origin = new URL(desktop.url()).origin
  const context = await desktop
    .context()
    .browser()!
    .newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    })
  t.after(() => context.close())
  const mobile = await context.newPage()
  for (const [path, selector] of [
    ['/docs/input', '#playground input.rf-input'],
    ['/docs/textarea', '#playground textarea.rf-input'],
    ['/docs/input-message', '#playground .rf-composer textarea'],
    ['/docs/combobox', '#playground .rf-picker-input'],
    ['/docs/command-menu', '#playground .rf-command-search input'],
    ['/docs/slider', '.rf-slider-value input'],
    ['/docs/color-picker', '.rf-color-picker:not([data-in-popover]) .rf-color-field input:visible'],
  ]) {
    await open(mobile, origin + path)
    const input = mobile.locator(selector).first()
    await expect(input).toBeVisible()
    await expect
      .poll(() => input.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)))
      .toBeGreaterThanOrEqual(16)
    await input.focus()
    await expect(input).toBeFocused()
  }
  const viewport = await mobile.locator('meta[name="viewport"]').getAttribute('content')
  expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\D|$)/i)
  expect(
    await desktop
      .locator('#playground input.rf-input')
      .first()
      .evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
  ).toBeLessThan(16)
})
