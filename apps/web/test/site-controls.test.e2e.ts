import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { expect } from 'playwright/test'
import { router, waitForShowcase, open } from './showcase-router.ts'

it('applies preferences immediately, keeps links clean, and persists through reload', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/?theme=light')
  const panel = page.locator('.site-right')
  await panel.locator('[data-setting-trigger="theme"]').click()
  await panel.getByRole('menuitemradio', { name: 'Dark', exact: true }).click()
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
  await panel.locator('[data-setting-trigger="accent"]').click()
  await panel.getByRole('button', { name: 'Violet', exact: true }).click()
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('html').getAttribute('data-accent'), 'violet')
  assert.equal(
    await page
      .locator('html')
      .evaluate((root) => getComputedStyle(root).getPropertyValue('--rf-accent').trim()),
    'light-dark(#7F22FE, #A684FF)',
  )
  await page.locator('body').press('r')
  assert.equal(await page.locator('html').getAttribute('data-shape'), 'rounded')
  assert.equal(
    await panel
      .locator('[data-setting-trigger="shape"] [data-setting-icon]')
      .getAttribute('data-value'),
    'rounded',
  )
  await page.locator('body').press('f')
  assert.equal(await page.locator('html').getAttribute('data-font'), 'geist-serif')
  const introduction = page
    .locator('.site-left')
    .getByRole('link', { name: 'Introduction', exact: true })
  assert.equal(await introduction.getAttribute('href'), '/docs')
  assert.equal(new URL(page.url()).search, '')
  await open(page, '/docs')
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
  assert.equal(await page.locator('html').getAttribute('data-accent'), 'violet')
  assert.equal(await page.locator('html').getAttribute('data-font'), 'geist-serif')
  await open(page, '/docs?theme=light')
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light')
})

it('keeps settings menus exclusive and dismisses them with pointer and keyboard input', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, '/docs')
  const panel = page.locator('.site-right')
  const theme = panel.locator('[data-setting-trigger="theme"]')
  const accent = panel.locator('[data-setting-trigger="accent"]')
  const themeMenu = panel.getByRole('menu', { name: 'Theme' })
  const accentPicker = panel.getByRole('dialog', { name: 'Accent', exact: true })

  await theme.press('ArrowUp')
  assert.equal(await theme.getAttribute('aria-expanded'), 'true')
  assert.ok(
    await themeMenu
      .getByRole('menuitemradio', { name: 'Dark' })
      .evaluate((option) => option === document.activeElement),
  )
  await page.keyboard.press('Home')
  assert.ok(
    await themeMenu
      .getByRole('menuitemradio', { name: 'System' })
      .evaluate((option) => option === document.activeElement),
  )
  await page.keyboard.press('Escape')
  assert.equal(await theme.getAttribute('aria-expanded'), 'false')
  assert.ok(await theme.evaluate((trigger) => trigger === document.activeElement))

  await theme.press('Enter')
  await page.keyboard.press('Tab')
  assert.equal(await theme.getAttribute('aria-expanded'), 'false')
  await expect(accent).toBeFocused()
  await accent.click()
  await theme.click()
  assert.equal(await accent.getAttribute('aria-expanded'), 'false')
  assert.equal(await theme.getAttribute('aria-expanded'), 'true')
  assert.equal(await page.locator('[data-setting-menu][open]').count(), 1)
  await page.keyboard.press('Escape')

  await accent.press('ArrowDown')
  await expect(accentPicker).toBeFocused()
  await page.keyboard.press('Tab')
  const square = accentPicker.getByRole('application', { name: 'Saturation and brightness' })
  await expect(square).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(accent).toBeFocused()
  await expect(accent).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Shift+Tab')
  await expect(theme).toBeFocused()
  await expect(accent).toHaveAttribute('aria-expanded', 'false')

  await theme.click()
  await page.locator('h1').click()
  assert.equal(await theme.getAttribute('aria-expanded'), 'false')
  await theme.click()
  await accent.focus()
  assert.equal(await theme.getAttribute('aria-expanded'), 'false')

  await panel.locator('[data-setting-trigger="hover"]').press('Tab')
  await expect(panel.getByRole('switch', { name: 'Sound effects' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(panel.getByRole('button', { name: 'Copy install prompt' })).toBeFocused()

  await page.setViewportSize({ width: 390, height: 844 })
  const mobile = page.locator('.site-mobile')
  await mobile.locator(':scope > summary').click()
  const mobileTheme = mobile.locator('[data-setting-trigger="theme"]')
  const mobileAccent = mobile.locator('[data-setting-trigger="accent"]')
  await mobileTheme.press('ArrowDown')
  assert.equal(await mobileTheme.getAttribute('aria-expanded'), 'true')
  await page.keyboard.press('Shift+Tab')
  assert.equal(await mobileTheme.getAttribute('aria-expanded'), 'false')
  await mobileAccent.click()
  await mobileTheme.click()
  assert.equal(await mobileAccent.getAttribute('aria-expanded'), 'false')
  assert.equal(await mobileTheme.getAttribute('aria-expanded'), 'true')
})

it('keeps the accent picker open while committing hex and RGB edits', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs')
  const panel = page.locator('.site-right')
  const accent = panel.locator('[data-setting-trigger="accent"]')
  const picker = panel.getByRole('dialog', { name: 'Accent', exact: true })
  const root = page.locator('html')

  await accent.click()
  const hex = picker.getByRole('textbox', { name: 'Hex value' })
  await hex.fill('123456')
  await hex.press('Enter')
  await expect(root).toHaveAttribute('data-accent', '#123456')
  await expect(accent).toHaveAttribute('aria-expanded', 'true')

  await picker.getByRole('button', { name: 'HEX', exact: true }).click()
  const rgb = picker.getByRole('menuitemradio', { name: 'RGB', exact: true })
  await rgb.click()
  await expect(rgb).toBeHidden()
  await expect(root).toHaveAttribute('data-accent', '#123456')

  const red = picker.getByRole('textbox', { name: 'Red', exact: true })
  await red.fill('20')
  await red.press('Enter')
  await expect(root).toHaveAttribute('data-accent', '#143456')
  await expect(picker.locator('.rf-color-square')).toHaveCSS('--rf-color-thumb', 'rgb(20, 52, 86)')
  await expect(accent).toHaveAttribute('aria-expanded', 'true')
})

it('opens a full-height mobile drawer and keeps page interaction behind it', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, '/docs?theme=dark')
  const mobile = page.locator('.site-mobile[data-enhanced]')
  const trigger = mobile.locator(':scope > summary')
  const drawer = page.getByRole('dialog', { name: 'Navigation and settings' })
  await trigger.waitFor()
  assert.deepEqual(await trigger.boundingBox(), { x: 16, y: 16, width: 32, height: 32 })

  await trigger.press('Enter')
  await drawer.waitFor()
  assert.ok(await drawer.evaluate((panel) => panel.matches(':modal')))
  assert.deepEqual(await drawer.boundingBox(), { x: 0, y: 0, width: 288, height: 844 })
  const theme = drawer.locator('[data-setting-trigger="theme"]')
  assert.ok(await drawer.evaluate((panel) => panel === document.activeElement))
  assert.equal(await drawer.getByRole('button', { name: 'Close navigation' }).count(), 0)
  assert.equal(await drawer.getByRole('button', { name: 'Reset settings to defaults' }).count(), 0)
  assert.equal(
    await drawer.getByRole('button', { name: 'Copy link with these settings' }).count(),
    0,
  )
  assert.equal(await drawer.locator('.doc-playground-controls').count(), 0)
  const title = (await drawer.locator('.site-sheet-heading h2').boundingBox())!
  const github = (await drawer.getByRole('link', { name: 'Reflow on GitHub' }).boundingBox())!
  assert.equal(await drawer.locator('.site-sheet-heading h2').innerText(), 'Make them yours')
  assert.ok(title.height < 24)
  assert.ok(Math.abs(title.y + title.height / 2 - (github.y + github.height / 2)) < 4)
  assert.deepEqual(
    await theme
      .locator('[data-theme-icon]')
      .evaluateAll((icons) =>
        icons
          .filter((icon) => getComputedStyle(icon).display !== 'none')
          .map((icon) => icon.getAttribute('data-theme-icon')),
      ),
    ['dark'],
  )
  assert.equal(await theme.evaluate((summary) => getComputedStyle(summary).display), 'flex')
  const settings = (await drawer.getByRole('region', { name: 'Customize Reflow' }).boundingBox())!
  const search = (await drawer.getByRole('button', { name: 'Search Reflow' }).boundingBox())!
  assert.ok(search.y > settings.y + settings.height)
  assert.equal(await page.locator('.site-left').isVisible(), false)
  await page.locator('main').evaluate((main) => {
    main.tabIndex = 0
    main.focus()
    main.addEventListener('click', () => main.setAttribute('data-background-clicked', ''))
  })
  assert.ok(await drawer.evaluate((panel) => panel === document.activeElement))

  await theme.press('ArrowDown')
  await page.keyboard.press('Escape')
  assert.equal(await theme.getAttribute('aria-expanded'), 'false')
  assert.ok(await drawer.isVisible())
  await page.keyboard.press('Escape')
  await drawer.waitFor({ state: 'hidden' })
  await page.waitForFunction(() => document.activeElement?.matches('.site-mobile > summary'))

  await trigger.click()
  await drawer.waitFor()
  await drawer.getByRole('button', { name: 'Search Reflow' }).click()
  const command = page.getByRole('dialog', { name: 'Search Reflow' })
  await command.waitFor()
  await page.keyboard.press('Escape')
  await command.waitFor({ state: 'hidden' })
  assert.ok(await drawer.isVisible())
  await page.mouse.click(350, 200)
  await drawer.waitFor({ state: 'hidden' })
  assert.equal(await page.locator('[data-background-clicked]').count(), 0)

  await page.setViewportSize({ width: 320, height: 568 })
  await trigger.click()
  assert.deepEqual(await drawer.boundingBox(), { x: 0, y: 0, width: 288, height: 568 })
  await page.mouse.click(304, 200)
  await drawer.waitFor({ state: 'hidden' })

  await page.setViewportSize({ width: 1000, height: 780 })
  await page.keyboard.press('[')
  await drawer.waitFor()
  assert.deepEqual(await drawer.boundingBox(), { x: 0, y: 0, width: 288, height: 780 })
  await page.setViewportSize({ width: 1440, height: 900 })
  await drawer.waitFor({ state: 'hidden' })
  await page.locator('.site-left').waitFor()
  await page.locator('dialog:modal').waitFor({ state: 'detached' })
  await page
    .locator('.site-right')
    .getByRole('button', { name: 'Reset settings to defaults' })
    .waitFor()
})

it('server-renders native settings disclosures before client enhancement', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs?theme=dark')
  const context = await page.context().browser()!.newContext({ javaScriptEnabled: false })
  try {
    const unenhanced = await context.newPage()
    // A shared link applies its settings without JavaScript too.
    await open(unenhanced, new URL('/docs?theme=dark', page.url()).href, { hydrate: false })
    assert.equal(new URL(unenhanced.url()).search, '')
    const panel = unenhanced.locator('.site-right')
    const accent = panel.locator('[data-setting-trigger="accent"]')
    const theme = panel.locator('[data-setting-trigger="theme"]')
    await accent.click()
    await panel.getByRole('dialog', { name: 'Accent', exact: true }).waitFor()
    await theme.click()
    await panel.getByRole('menuitemradio', { name: 'Dark', checked: true }).waitFor()
    assert.equal(await panel.locator('[data-setting-menu][open]').count(), 1)
    assert.equal(
      await panel.getByRole('dialog', { name: 'Accent', exact: true }).isVisible(),
      false,
    )

    await unenhanced.setViewportSize({ width: 390, height: 844 })
    const mobile = unenhanced.locator('.site-mobile')
    await mobile.locator(':scope > summary').click()
    const drawer = mobile.getByRole('dialog', { name: 'Navigation and settings' })
    await drawer.waitFor()
    assert.deepEqual(await drawer.boundingBox(), { x: 0, y: 0, width: 288, height: 844 })
    await drawer.getByRole('link', { name: 'Showcase', exact: true }).waitFor()
    await drawer.locator('[data-setting-trigger="theme"]').click()
    await drawer.getByRole('menuitemradio', { name: 'Dark', checked: true }).waitFor()
    await mobile.locator(':scope > summary').click()
    await drawer.waitFor({ state: 'hidden' })
  } finally {
    await context.close()
  }
})

it('opens global search with Mod+K, applies commands, and shows individual shortcut keycaps', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await open(page, '/?theme=dark')
  assert.equal(await page.locator('.site-left .site-search kbd').count(), 2)
  await page.locator('body').press('ControlOrMeta+k')
  const dialog = page.getByRole('dialog', { name: 'Search Reflow' })
  await dialog.waitFor()
  const input = dialog.getByRole('combobox', { name: 'Search commands' })
  await input.fill('Theme: Light')
  await input.press('Enter')
  await dialog.waitFor({ state: 'hidden' })
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light')
  await page.locator('.site-left').getByRole('button', { name: 'Search Reflow' }).click()
  await dialog.waitFor()
  await input.fill('DatePicker')
  await input.press('Enter')
  await page.waitForURL((url) => url.pathname === '/docs/date-picker' && url.search === '')
  await waitForShowcase(page)
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light')
  await page.locator('body').press('?')
  const help = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
  await help.waitFor()
  assert.equal(await help.locator('.site-keycaps').first().locator('kbd').count(), 2)
  await page.keyboard.press('Escape')
  await help.waitFor({ state: 'hidden' })
  assert.deepEqual(errors, [])
})

it('browses a custom heading family and restores its weight and stylesheet', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const requestedFonts: string[] = []
  await page.route('https://fonts.googleapis.com/**', async (route) => {
    requestedFonts.push(route.request().url())
    await route.fulfill({ status: 200, contentType: 'text/css', body: '' })
  })
  await open(page, '/docs/typography?font=inter')
  assert.equal(requestedFonts.length, 0)
  const panel = page.locator('.site-right')
  await panel.locator('[data-setting-trigger="font"]').click()
  await panel.getByRole('menuitem', { name: 'Browse Google Fonts…' }).click()
  const dialog = page.getByRole('dialog', { name: 'Heading fonts' })
  await dialog.getByRole('searchbox', { name: 'Search font families' }).fill('Playfair Display')
  await dialog.getByRole('button', { name: 'Playfair Display Serif', exact: false }).first().click()
  await dialog.waitFor({ state: 'hidden' })
  await page.waitForFunction(() =>
    document.activeElement?.matches('.site-right [data-setting-trigger="font"]'),
  )
  assert.equal(await page.locator('html').getAttribute('data-font'), 'google:Playfair Display')
  await page.locator('#reflow-custom-font').waitFor({ state: 'attached' })
  assert.ok(
    (await page.locator('#reflow-custom-font').getAttribute('href'))?.startsWith(
      'https://fonts.googleapis.com/css2?family=Playfair+Display',
    ),
  )
  await panel.locator('[data-setting-trigger="fontWeight"]').click()
  await panel.getByRole('menuitemradio', { name: '700', exact: true }).click()
  assert.equal(await page.locator('html').getAttribute('data-font-weight'), '700')
  await open(page, '/docs/typography')
  assert.equal(await page.locator('html').getAttribute('data-font'), 'google:Playfair Display')
  assert.equal(await page.locator('html').getAttribute('data-font-weight'), '700')
  await waitForShowcase(page)
  await page.locator('body').press('f')
  assert.equal(await page.locator('html').getAttribute('data-font'), 'inter')
  await page.locator('body').press('f')
  await page.locator('body').press('f')
  assert.equal(await page.locator('html').getAttribute('data-font'), 'google:Playfair Display')
  await panel.locator('[data-setting-trigger="font"]').click()
  await panel.getByRole('menuitem', { name: 'Browse Google Fonts…' }).click()
  await dialog.getByRole('searchbox', { name: 'Search font families' }).fill('Instrument Serif')
  await dialog.getByRole('button', { name: 'Instrument Serif Serif', exact: false }).click()
  await dialog.waitFor({ state: 'hidden' })
  assert.equal(await page.locator('html').getAttribute('data-font-weight'), '400')
  await panel.locator('[data-setting-trigger="fontWeight"]').click()
  await panel.getByRole('menuitemradio', { name: '400', exact: true }).waitFor()
  assert.equal(await panel.getByRole('menuitemradio', { name: '700', exact: true }).count(), 0)
})

it('saves the settings of a shared link over older cookies and shows the clean URL', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/')
  await page.context().addCookies([
    { name: 'reflow_theme', value: 'dark', url: page.url() },
    { name: 'reflow_accent', value: 'violet', url: page.url() },
    { name: 'reflow_density', value: 'compact', url: page.url() },
  ])
  const shared = { theme: 'system', accent: 'blue', density: 'default' }
  await open(page, '/docs/button?theme=system&accent=blue&density=default&view=code#examples')
  const url = new URL(page.url())
  assert.equal(url.pathname + url.search + url.hash, '/docs/button?view=code#examples')
  await waitForShowcase(page)
  for (const [key, value] of Object.entries(shared))
    assert.equal(await page.locator('html').getAttribute(`data-${key}`), value)
  const reveal = page.locator('.site-left').getByRole('link', { name: 'Reveal', exact: true })
  assert.equal(await reveal.getAttribute('href'), '/docs/reveal')
  await reveal.click()
  await page.waitForURL((url) => url.pathname === '/docs/reveal' && url.search === '')
  for (const [key, value] of Object.entries(shared))
    assert.equal(await page.locator('html').getAttribute(`data-${key}`), value)

  // Sharing copies only the settings that differ from the defaults.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await waitForShowcase(page)
  await page.locator('body').press('t')
  await page
    .locator('.site-right')
    .getByRole('button', { name: 'Copy link with these settings' })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(new URL('/docs/reveal?theme=light', page.url()).href)
  await page.locator('body').press('ControlOrMeta+k')
  const search = page
    .getByRole('dialog', { name: 'Search Reflow' })
    .getByRole('combobox', { name: 'Search commands' })
  await page.evaluate(() => navigator.clipboard.writeText(''))
  await search.fill('Copy link')
  await search.press('Enter')
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(new URL('/docs/reveal?theme=light', page.url()).href)

  // Reset returns every setting to its default and is unavailable once there.
  const reset = page
    .locator('.site-right')
    .getByRole('button', { name: 'Reset settings to defaults' })
  await expect(reset).toBeEnabled()
  await page.locator('body').press('r')
  await reset.click()
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'system')
  assert.equal(await page.locator('html').getAttribute('data-shape'), 'sharp')
  await expect(reset).toBeDisabled()
  await page.reload()
  await waitForShowcase(page)
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'system')
  await expect(reset).toBeDisabled()
  await page.locator('body').press('t')
  await expect(reset).toBeEnabled()
  await page.locator('body').press('ControlOrMeta+k')
  await search.fill('Reset settings')
  await search.press('Enter')
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'system')
  await expect(reset).toBeDisabled()
  await open(page, '/docs/button?theme=dark&accent=red')
  const trigger = page.locator('.site-right [data-setting-trigger="accent"]')
  const currentColor = page.locator('.site-right .site-accent-panel input[aria-label="Hex value"]')
  await trigger.click()
  assert.equal((await currentColor.inputValue()).toUpperCase(), 'FF6467')
  await page.emulateMedia({ colorScheme: 'dark' })
  await open(page, '/docs/button?theme=system&accent=red')
  await trigger.click()
  await page.waitForFunction(
    () =>
      document
        .querySelector<HTMLInputElement>(
          '.site-right .site-accent-panel input[aria-label="Hex value"]',
        )
        ?.value.toUpperCase() === 'FF6467',
  )
  await page.emulateMedia({ colorScheme: 'light' })
  await page.waitForFunction(
    () =>
      document
        .querySelector<HTMLInputElement>(
          '.site-right .site-accent-panel input[aria-label="Hex value"]',
        )
        ?.value.toUpperCase() === 'E7000B',
  )
})

it('scrolls the page from over the right rail and keeps the left rail self-contained', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/docs/button')
  const right = page.locator('.site-right')
  const left = page.locator('.site-left')
  const scrollY = () => page.evaluate(() => Math.round(window.scrollY))
  const centre = async (locator: typeof right) => {
    const box = (await locator.boundingBox())!
    return { x: box.x + box.width / 2, y: 450 }
  }

  // The right rail reads as page background: it has no scroll of its own,
  // so the wheel over it moves the page.
  assert.equal(await right.evaluate((rail) => getComputedStyle(rail).overflowY), 'visible')
  const overRight = await centre(right)
  await page.mouse.move(overRight.x, overRight.y)
  await page.mouse.wheel(0, 600)
  await expect.poll(scrollY).toBeGreaterThan(0)

  // Taller than the window, the rail rides up with the page until its end is in view.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect
    .poll(() => right.evaluate((rail) => rail.getBoundingClientRect().bottom - innerHeight))
    .toBeLessThanOrEqual(1)

  // The navigation keeps its own scroll and never hands it on to the page.
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect.poll(scrollY).toBe(0)
  const overLeft = await centre(left)
  await page.mouse.move(overLeft.x, overLeft.y)
  await page.mouse.wheel(0, 4000)
  await expect.poll(() => left.evaluate((nav) => nav.scrollTop)).toBeGreaterThan(0)
  await page.waitForTimeout(300)
  assert.equal(await scrollY(), 0)
})
