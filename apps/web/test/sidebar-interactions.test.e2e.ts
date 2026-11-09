import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router } from './showcase-router.ts'

it('keeps the focused Sidebar frame in place as the inset fills it', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.goto('/demo?c=sidebar')
  const shell = page.locator('.site-demo-stage .example-sidebar-playground > .rf-sidebar-layout')
  const main = shell.locator('.rf-sidebar-main')
  const frame = await shell.boundingBox()
  assert.equal(frame?.width, 600)
  assert.equal(frame?.height, 560)
  assert.equal(await shell.getAttribute('data-variant'), 'inset')
  const expanded = await main.boundingBox()
  await shell.getByRole('button', { name: 'Hide sidebar' }).click()
  await shell.getByRole('button', { name: 'Show sidebar' }).waitFor()
  await page.waitForFunction(
    () =>
      document.querySelector('.site-demo-stage .rf-sidebar-panel')?.getBoundingClientRect()
        .width === 0,
  )
  assert.deepEqual(await shell.boundingBox(), frame)
  assert.ok((await main.boundingBox())!.width > expanded!.width + 200)
})

it('uses the focused Sidebar workspace, shortcuts, section actions and user menu', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.goto('/demo?c=sidebar')
  const shell = page.locator('.site-demo-stage .example-sidebar-playground > .rf-sidebar-layout')
  const workspace = shell.getByRole('button', { name: 'Switch workspace' })
  const search = shell.getByRole('searchbox', { name: 'Filter navigation' })
  const create = shell.getByRole('button', { name: 'New', exact: true })
  await create.hover()
  assert.equal(
    await create.locator('kbd').evaluate(async (key) => {
      await Promise.all(key.getAnimations().map((animation) => animation.finished))
      return getComputedStyle(key).opacity
    }),
    '1',
  )
  await create.press('Control+k')
  assert.ok(await search.evaluate((input) => input === document.activeElement))
  await search.fill('Scrollbar')
  await shell.getByRole('link', { name: 'Scrollbar fade regression' }).waitFor()
  assert.equal(
    await shell.getByRole('link', { name: 'Sidebar component height in demo' }).count(),
    0,
  )
  await search.fill('')
  await search.press('Control+Shift+O')
  assert.equal(
    await shell.getByRole('link', { name: 'New thread 1' }).getAttribute('aria-current'),
    'page',
  )

  const portfolio = shell.getByRole('button', { name: 'Add item · portfolio-site' })
  await portfolio.hover()
  await page.getByRole('tooltip', { name: 'Add item · portfolio-site' }).waitFor()
  await portfolio.click()
  await shell
    .locator('.rf-sidebar-section')
    .filter({ has: page.getByRole('button', { name: 'Add item · portfolio-site' }) })
    .getByRole('link', { name: 'New thread 2' })
    .waitFor()

  await workspace.click()
  await expect(workspace).toHaveAttribute('aria-expanded', 'true')
  assert.equal(
    await page.getByRole('menuitemradio', { name: 'Acme Inc' }).getAttribute('aria-checked'),
    'true',
  )
  await page.getByRole('menuitemradio', { name: 'Fluid Labs' }).click()
  assert.match((await workspace.textContent()) ?? '', /Fluid Labs/)
  assert.equal(await shell.getByRole('link', { name: 'New thread 2' }).count(), 0)
  await shell.getByRole('link', { name: 'Summarise the Q3 board deck' }).waitFor()
  await expect(workspace).toHaveAttribute('aria-expanded', 'false')
  // Remix restores focus after the exit transition and then accepts another open.
  await expect(workspace).toBeFocused()
  await workspace.click()
  await expect(workspace).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('menuitemradio', { name: 'Acme Inc' }).click()
  await shell.getByRole('link', { name: 'New thread 2' }).waitFor()

  const user = shell.getByRole('button', { name: 'Open user menu' })
  await user.click()
  await expect(user).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  assert.match((await user.textContent()) ?? '', /Signed out/)
  await expect(user).toHaveAttribute('aria-expanded', 'false')
  await expect(user).toBeFocused()
  await user.click()
  await expect(user).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('menuitem', { name: 'Sign in' }).click()
  assert.match((await user.textContent()) ?? '', /Alex Morgan/)
})

it('keeps the profile and workspace menus inside a resized rail with visible keyboard focus', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/demo?c=sidebar&theme=dark')
  const shell = page.locator('.site-demo-stage .example-sidebar-playground > .rf-sidebar-layout')
  await shell.getByRole('separator', { name: 'Resize sidebar' }).press('ArrowLeft')
  const rail = shell.locator('.rf-sidebar-panel .rf-sidebar-inner')
  const railBox = (await rail.boundingBox())!
  for (const name of ['Switch workspace', 'Open user menu']) {
    const trigger = rail.getByRole('button', { name })
    await trigger.press('ArrowDown')
    const surface = rail.locator('.rf-dropdown-surface:popover-open[data-anchor-placement]')
    await surface.waitFor()
    const popup = (await surface.boundingBox())!
    assert.ok(popup.x >= railBox.x)
    assert.ok(popup.x + popup.width <= railBox.x + railBox.width + 1)

    const row = surface.getByRole(name === 'Open user menu' ? 'menuitem' : 'menuitemradio').first()
    await expect(row).toBeFocused()
    await expect(row).toHaveCSS('outline-style', 'none')
    await expect(surface.locator('.rf-menu-hover')).toHaveAttribute('data-visible', '')
    await page.emulateMedia({ forcedColors: 'active' })
    await expect(row).toHaveCSS('outline-style', 'solid')
    await page.emulateMedia({ forcedColors: 'none' })
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  }
})

it('peeks without expanding the content grid, dismisses on Escape and outside press, and pins open', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/docs/sidebar')
  const click = page.locator('#resize-collapse-peek .rf-sidebar-layout').nth(1)
  const edge = click.getByRole('button', { name: 'Peek sidebar' })
  await edge.click()
  assert.equal(await click.getAttribute('data-collapsed'), 'true')
  assert.equal(await click.getAttribute('data-peeking'), 'true')
  assert.equal(await click.locator('.rf-sidebar-panel').getAttribute('inert'), null)
  await edge.press('Escape')
  assert.equal(await click.getAttribute('data-peeking'), null)
  assert.ok(await edge.evaluate((e) => e === document.activeElement))
  await edge.click()
  await click.locator('.rf-sidebar-main').click({ position: { x: 320, y: 200 } })
  assert.equal(await click.getAttribute('data-peeking'), null)
  await edge.click()
  await click.getByRole('button', { name: 'Pin sidebar', exact: true }).click()
  assert.equal(await click.getAttribute('data-collapsed'), null)
  assert.equal(await click.getAttribute('data-peeking'), null)
  assert.ok(
    await click
      .getByRole('button', { name: 'Hide sidebar', exact: true })
      .evaluate((e) => e === document.activeElement),
  )
  const hover = page.locator('#resize-collapse-peek .rf-sidebar-layout').first()
  await hover.getByRole('button', { name: 'Hide sidebar', exact: true }).click()
  await hover.getByRole('button', { name: 'Peek sidebar' }).hover()
  await page.waitForFunction(() =>
    document
      .querySelector('#resize-collapse-peek .rf-sidebar-layout')
      ?.hasAttribute('data-peeking'),
  )
  await hover.getByRole('button', { name: 'Peek sidebar' }).press('Escape')
  assert.equal(await hover.getAttribute('data-peeking'), null)
})

it('uses the Settings dialog in Sidebar docs and provides a mobile section selector', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/docs/sidebar')
  await page.locator('#inside-a-dialog').getByRole('button', { name: 'Open settings' }).click()
  const dialog = page.getByRole('dialog', { name: 'Settings', exact: true })
  await dialog.getByRole('link', { name: 'Notifications', exact: true }).click()
  await dialog.getByRole('switch', { name: 'Daily digest' }).click()
  assert.equal(await dialog.getByRole('switch', { name: 'Daily digest' }).isChecked(), false)
  await dialog.press('Escape')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('#inside-a-dialog').getByRole('button', { name: 'Open settings' }).click()
  await dialog.getByRole('button', { name: 'Section', exact: true }).click()
  await page.getByRole('option', { name: 'Appearance', exact: true }).click()
  await dialog.getByRole('heading', { name: 'Appearance', exact: true }).waitFor()
  assert.deepEqual(errors, [])
})
