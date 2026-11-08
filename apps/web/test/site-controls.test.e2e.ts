import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { expect } from 'playwright/test'
import { router } from './showcase-router.ts'

it('applies preferences immediately, updates previews and links, and persists through reload', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/?theme=light')
  await page.locator('[data-site-controls-ready]').waitFor({ state: 'attached' })
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
  assert.equal(await page.locator('html').getAttribute('data-shape'), 'pill')
  assert.equal(
    await panel
      .locator('[data-setting-trigger="shape"] [data-setting-icon]')
      .getAttribute('data-value'),
    'pill',
  )
  await page.locator('body').press('f')
  assert.equal(await page.locator('html').getAttribute('data-font'), 'geist-serif')
  const introduction = page
    .locator('.site-left')
    .getByRole('link', { name: 'Introduction', exact: true })
  assert.ok((await introduction.getAttribute('href'))?.includes('accent=violet'))
  await page.goto('/docs')
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
  assert.equal(await page.locator('html').getAttribute('data-accent'), 'violet')
  assert.equal(await page.locator('html').getAttribute('data-font'), 'geist-serif')
  await page.goto('/docs?theme=light')
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light')
})

it('keeps settings menus exclusive and dismisses them with pointer and keyboard input', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs')
  await page.locator('[data-site-controls-ready]').waitFor({ state: 'attached' })
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
  assert.ok(await accent.evaluate((trigger) => trigger === document.activeElement))
  await accent.click()
  await theme.click()
  assert.equal(await accent.getAttribute('aria-expanded'), 'false')
  assert.equal(await theme.getAttribute('aria-expanded'), 'true')
  assert.equal(await page.locator('[data-setting-menu][open]').count(), 1)
  await page.keyboard.press('Escape')
  await accent.click()
  await accentPicker.getByRole('slider', { name: 'Hue' }).waitFor()
  const color = accentPicker.getByRole('textbox', { name: 'Hex value' })
  await color.fill('123456')
  await color.press('Enter')
  assert.equal(await page.locator('html').getAttribute('data-accent'), '#123456')
  assert.equal(await accent.getAttribute('aria-expanded'), 'true')
  await accentPicker.getByRole('button', { name: 'HEX', exact: true }).click()
  await page.getByRole('menuitemradio', { name: 'RGB', exact: true }).click()
  assert.equal(await page.locator('html').getAttribute('data-accent'), '#123456')
  const red = accentPicker.getByRole('textbox', { name: 'Red', exact: true })
  await red.fill('20')
  await red.press('Enter')
  assert.equal(await page.locator('html').getAttribute('data-accent'), '#143456')
  // Wait for the picker to render the committed color before moving focus.
  await expect(accentPicker.locator('.rf-color-square')).toHaveCSS(
    '--rf-color-thumb',
    'rgb(20, 52, 86)',
  )
  await accentPicker.getByRole('button', { name: 'Rose', exact: true }).press('Tab')
  await expect(accent).toHaveAttribute('aria-expanded', 'false')

  await theme.click()
  await page.locator('h1').click()
  assert.equal(await theme.getAttribute('aria-expanded'), 'false')
  await theme.click()
  await accent.focus()
  assert.equal(await theme.getAttribute('aria-expanded'), 'false')

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

it('opens a full-height mobile drawer and keeps page interaction behind it', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/docs?theme=dark')
  const mobile = page.locator('.site-mobile[data-enhanced]')
  const trigger = mobile.locator(':scope > summary')
  const drawer = page.getByRole('dialog', { name: 'Navigation and settings' })
  await trigger.waitFor()
  assert.deepEqual(await trigger.boundingBox(), { x: 16, y: 16, width: 32, height: 32 })

  await trigger.press('Enter')
  await drawer.waitFor()
  assert.ok(await drawer.evaluate((panel) => panel.matches(':modal')))
  assert.deepEqual(await drawer.boundingBox(), { x: 0, y: 0, width: 288, height: 844 })
  const close = drawer.getByRole('button', { name: 'Close navigation' })
  const theme = drawer.locator('[data-setting-trigger="theme"]')
  assert.ok(await close.evaluate((button) => button === document.activeElement))
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
  assert.ok(await close.evaluate((button) => button === document.activeElement))

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
  await close.click()
  await drawer.waitFor({ state: 'hidden' })

  await page.setViewportSize({ width: 1000, height: 780 })
  await page.keyboard.press('[')
  await drawer.waitFor()
  assert.deepEqual(await drawer.boundingBox(), { x: 0, y: 0, width: 288, height: 780 })
  await page.setViewportSize({ width: 1440, height: 900 })
  await drawer.waitFor({ state: 'hidden' })
  await page.locator('.site-left').waitFor()
  await page.locator('dialog:modal').waitFor({ state: 'detached' })
})

it('server-renders native settings disclosures before client enhancement', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs?theme=dark')
  const context = await page.context().browser()!.newContext({ javaScriptEnabled: false })
  try {
    const unenhanced = await context.newPage()
    await unenhanced.goto(page.url())
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
  await page.goto('/?theme=dark')
  await page.locator('[data-site-controls-ready]').waitFor({ state: 'attached' })
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
  await page.waitForURL(
    (url) => url.pathname === '/docs/date-picker' && url.searchParams.get('theme') === 'light',
  )
  await page.locator('[data-site-controls-ready]').waitFor({ state: 'attached' })
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
  await page.goto('/docs/typography?font=inter')
  await page.locator('[data-site-controls-ready]').waitFor({ state: 'attached' })
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
  await page.goto('/docs/typography')
  assert.equal(await page.locator('html').getAttribute('data-font'), 'google:Playfair Display')
  assert.equal(await page.locator('html').getAttribute('data-font-weight'), '700')
  await page.locator('[data-site-controls-ready]').waitFor({ state: 'attached' })
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

it('preserves explicit default settings through links and search despite older cookies', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/')
  await page.context().addCookies([
    { name: 'reflow_theme', value: 'dark', url: page.url() },
    { name: 'reflow_accent', value: 'violet', url: page.url() },
    { name: 'reflow_density', value: 'compact', url: page.url() },
  ])
  await page.goto('/docs/button?theme=system&accent=blue&density=default')
  const reveal = page.locator('.site-left').getByRole('link', { name: 'Reveal', exact: true })
  const target = new URL((await reveal.getAttribute('href'))!, page.url())
  for (const [key, value] of Object.entries({
    theme: 'system',
    accent: 'blue',
    density: 'default',
  }))
    assert.equal(target.searchParams.get(key), value)
  await reveal.click()
  await page.waitForURL((url) => url.pathname === '/docs/reveal')
  await page.locator('[data-site-controls-ready]').waitFor({ state: 'attached' })
  for (const [key, value] of Object.entries({
    theme: 'system',
    accent: 'blue',
    density: 'default',
  }))
    assert.equal(await page.locator('html').getAttribute(`data-${key}`), value)
  await page.locator('body').press('ControlOrMeta+k')
  const search = page
    .getByRole('dialog', { name: 'Search Reflow' })
    .getByRole('combobox', { name: 'Search commands' })
  await search.fill('Accordion')
  await search.press('Enter')
  await page.waitForURL((url) => url.pathname === '/docs/accordion')
  for (const [key, value] of Object.entries({
    theme: 'system',
    accent: 'blue',
    density: 'default',
  }))
    assert.equal(await page.locator('html').getAttribute(`data-${key}`), value)
  await page.goto('/docs/button?theme=dark&accent=red')
  const trigger = page.locator('.site-right [data-setting-trigger="accent"]')
  const currentColor = page.locator('.site-right .site-accent-panel input[aria-label="Hex value"]')
  await trigger.click()
  assert.equal((await currentColor.inputValue()).toUpperCase(), 'FF6467')
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/docs/button?theme=system&accent=red')
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
