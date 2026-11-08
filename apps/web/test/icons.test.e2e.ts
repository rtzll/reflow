import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router, waitForShowcase } from './showcase-router.ts'

it('switches real icon geometry in place and remembers the selection across routes', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/')
  await waitForShowcase(page)
  const icon = page.locator('.site-main [data-rf-icon="home"]').first()
  const trigger = page.locator('.site-right [data-setting-trigger="icons"]')
  const geometry = () =>
    icon.evaluate((node) => {
      const shape = Array.from(node.children).find(
        (child) => getComputedStyle(child).display !== 'none',
      )
      if (!shape) throw new Error('No icon was rendered')
      const href = shape.getAttribute('href')
      const path = href
        ? document.querySelector(href)?.querySelector('path')
        : shape.querySelector('path')
      const bounds = (shape as SVGGraphicsElement).getBBox()
      return { path: path?.getAttribute('d'), width: bounds.width, height: bounds.height }
    })
  const paths = new Set<string>()
  for (const [key, label] of [
    ['lucide', 'Lucide'],
    ['tabler', 'Tabler'],
    ['phosphor', 'Phosphor'],
    ['hugeicons', 'HugeIcons'],
  ]) {
    await trigger.click()
    await page.getByRole('menuitemradio', { name: label, exact: true }).click()
    assert.equal(await page.locator('html').getAttribute('data-icons'), key)
    const { path, width, height } = await geometry()
    assert.ok(path)
    assert.ok(width > 0 && height > 0)
    paths.add(path)
  }
  assert.equal(paths.size, 4)
  await trigger.press('ArrowUp')
  assert.ok(
    await page
      .getByRole('menuitemradio', { name: 'HugeIcons' })
      .evaluate((option) => document.activeElement === option),
  )
  assert.equal(
    await page.getByRole('menu', { name: 'Icons', exact: true }).locator('button').count(),
    paths.size,
  )
  await page.keyboard.press('Escape')
  await page.locator('body').press('i')
  assert.equal(await page.locator('html').getAttribute('data-icons'), 'lucide')
  await page.locator('body').press('i')
  assert.equal(await page.locator('html').getAttribute('data-icons'), 'tabler')
  assert.ok(page.url().includes('icons=tabler'))
  await page.goto('/docs/select')
  const selectIcon = page.locator('.doc-preview [data-rf-icon="chevron-down"]').first()
  const visibleFamily = (node: Element) =>
    Array.from(node.children)
      .find((child) => getComputedStyle(child).display !== 'none')
      ?.getAttribute('data-rf-icon-family')
  assert.equal(await selectIcon.evaluate(visibleFamily), 'tabler')

  const browser = page.context().browser()!
  const serverOnly = await browser.newContext({ javaScriptEnabled: false })
  try {
    const unenhanced = await serverOnly.newPage()
    await unenhanced.goto(new URL('/docs/select?icons=phosphor', page.url()).href)
    assert.equal(
      await unenhanced
        .locator('.doc-preview [data-rf-icon="chevron-down"]')
        .first()
        .evaluate(visibleFamily),
      'phosphor',
    )
  } finally {
    await serverOnly.close()
  }
})

it('applies Button icon, active and icon-only settings to the preview and generated code', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/button')
  const preview = page.locator('.doc-preview').first()
  const button = preview.getByRole('button', { name: 'Get started', exact: true })
  const controls = page.getByRole('region', { name: 'Button playground settings' })
  await controls.getByRole('switch', { name: 'Leading icon' }).click()
  await controls.getByRole('switch', { name: 'Trailing icon' }).click()
  await controls.getByRole('switch', { name: 'Active' }).click()
  assert.equal(await button.locator('.rf-button-icon [data-rf-icon="plus"]').count(), 1)
  assert.equal(await button.locator('.rf-button-icon [data-rf-icon="arrow-right"]').count(), 1)
  assert.ok(await button.getAttribute('data-active'))
  const codeTab = preview.getByRole('tab', { name: 'Code', exact: true })
  await codeTab.click()
  let code = await preview.locator('pre').innerText()
  assert.ok(code.includes('leadingIcon={<Icon name="plus" />}'))
  assert.ok(code.includes('trailingIcon={<Icon name="arrow-right" />}'))
  await preview.getByRole('tab', { name: 'Preview', exact: true }).click()
  await controls.getByRole('switch', { name: 'Icon only' }).click()
  assert.equal(await button.getAttribute('data-size'), 'icon')
  assert.equal(await button.locator('.rf-button-icon').count(), 0)
  assert.equal(await button.locator('[data-rf-icon="plus"]').count(), 1)
  await codeTab.click()
  code = await preview.locator('pre').innerText()
  assert.ok(code.includes('size="icon"') && code.includes('aria-label={"Get started"}'))
  assert.ok(!code.includes('leadingIcon=') && !code.includes('trailingIcon='))
})
