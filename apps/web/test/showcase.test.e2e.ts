import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router, waitForShowcase } from './showcase-router.ts'

it('hydrates previews across docs and deep-linked demo pages', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto('/docs/tabs?theme=dark&density=compact')
  await page.locator('.doc-preview').first().getByRole('tab', { name: 'Recents' }).click()
  await page.locator('.doc-preview').first().getByRole('tabpanel', { name: 'Recents' }).waitFor()
  assert.equal(await page.locator('html').getAttribute('data-density'), 'compact')

  await page.getByRole('link', { name: 'Sidebar', exact: true }).click()
  const sidebarPreview = page.locator('.doc-preview').first()
  await expect(sidebarPreview.getByRole('searchbox', { name: 'Filter navigation' })).toBeVisible()
  const sidebarControls = page
    .locator('.site-right')
    .getByRole('region', { name: 'Sidebar playground settings' })
  await expect(sidebarControls.getByRole('switch', { name: 'Searchable' })).toBeChecked()

  await page.goto('/demo?c=dropdown&theme=dark')
  await page.getByRole('button', { name: 'Email' }).click()
  await page.getByRole('menuitemradio', { name: 'Notifications' }).click()
  await page.locator('button[aria-haspopup="menu"]', { hasText: 'Notifications' }).waitFor()
  const detail = page.getByRole('link', { name: 'View Dropdown documentation' })
  const detailUrl = new URL((await detail.getAttribute('href'))!, page.url())
  assert.equal(detailUrl.pathname, '/docs/dropdown')
  assert.equal(detailUrl.search, '')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/docs/input-message')
  await waitForShowcase(page)
  const composer = page.locator('.doc-preview').first().getByRole('textbox', { name: 'Message' })
  await composer.press('Tab')
  await expect(composer).toHaveValue('Why is every other input box so stiff?')
  await composer.fill('A message from the demo')
  await composer.press('Enter')
  await page.getByText('A message from the demo', { exact: true }).waitFor()
  assert.deepEqual(errors, [])
})

it('collapses closed accordion panels and keeps the code example linkable', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/accordion?theme=dark')
  const preview = page.locator('.doc-preview').first()
  const closed = preview.locator('.rf-accordion-panel[data-state="closed"]')
  assert.ok((await closed.count()) > 0)
  assert.equal(await closed.first().evaluate((panel) => panel.getBoundingClientRect().height), 0)
  await preview.getByRole('button', { name: 'Styling' }).click()
  await preview
    .getByRole('tabpanel', { name: 'Preview', exact: true })
    .getByText('The component integrates with the shape system', { exact: false })
    .waitFor()
  await preview.getByRole('tab', { name: 'Code', exact: true }).click()
  assert.ok(
    (await preview.locator('pre code').textContent())?.includes(
      '<Accordion defaultValue="item-1" items={items}',
    ),
  )
  assert.ok(page.url().includes('view=code'))
  assert.ok(!page.url().includes('theme='))
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
})

it('updates the live playground and copied code while preserving replay and inspection', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/button?theme=dark')
  const preview = page.locator('.doc-preview').first()
  const controls = page.locator('.site-right .doc-playground-controls')
  await preview.getByRole('button', { name: 'Get started', exact: true }).click()
  await preview.getByText('Ready to start').waitFor()
  await preview.getByRole('button', { name: 'Replay example' }).click()
  await preview.getByText('Ready to start').waitFor({ state: 'hidden' })
  await controls.getByLabel('Variant', { exact: true }).selectOption('destructive')
  await controls.getByLabel('Label', { exact: true }).fill('Delete project')
  const button = preview.getByRole('button', { name: 'Delete project', exact: true })
  await button.waitFor()
  assert.equal(await button.getAttribute('data-variant'), 'destructive')
  await preview.getByRole('switch', { name: 'Inspect', exact: true }).check()
  await preview.locator('.doc-inspect-ruler-x').getByText('0', { exact: true }).waitFor()
  await button.hover()
  const label = preview.locator('.doc-inspect-label')
  await label.waitFor()
  assert.ok((await label.textContent())?.includes('padding'))
  assert.ok((await label.textContent())?.includes('margin'))
  assert.equal(await preview.locator('.doc-inspect-name').textContent(), 'button')
  assert.equal(await preview.locator('.doc-inspect-guide').count(), 4)
  const outline = (await preview.locator('.doc-inspect-box').boundingBox())!
  const control = (await button.boundingBox())!
  assert.ok(Math.abs(outline.x - control.x) < 1 && Math.abs(outline.width - control.width) < 1)
  await page.setViewportSize({ width: 390, height: 844 })
  await button.hover()
  assert.ok(
    await label.evaluate((element) => {
      const { left, right, top, bottom } = element.getBoundingClientRect()
      return left >= 0 && right <= innerWidth && top >= 0 && bottom <= innerHeight
    }),
  )
  await preview.getByRole('tab', { name: 'Code', exact: true }).click()
  assert.equal(await preview.locator('.doc-inspector').count(), 0)
  const code = await preview.locator('pre code').textContent()
  assert.ok(code?.includes('variant="destructive"'))
  assert.ok(code?.includes('Delete project'))
  assert.ok(code?.includes("from '@rtzll/reflow'"))
  assert.ok(
    (await page
      .getByRole('region', { name: 'Button API reference' })
      .locator('tbody tr')
      .count()) >= 8,
  )
})

it('keeps the loading Button label and size while showing the two-dot spinner', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/button')
  await waitForShowcase(page)
  const button = page.getByRole('button', { name: 'Click me', exact: true })
  const width = () => button.evaluate((element) => element.getBoundingClientRect().width)
  const idleWidth = await width()
  await button.click()
  await expect(button).toHaveAttribute('aria-busy', 'true')
  await expect(button).toBeDisabled()
  assert.equal(await width(), idleWidth)
  const circle = button.locator('.rf-button-spinner circle')
  assert.equal(
    await circle.evaluate((element) => getComputedStyle(element).animationDuration),
    '1s',
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await circle.evaluate((element) => getComputedStyle(element).animationName), 'none')
})

it('customizes the focused Button demo and keeps the reference slide order', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/demo?c=button&theme=dark')
  const slide = page.getByRole('article', { name: 'Slide 8 of 28: Button' })
  const stage = slide.locator('.site-demo-stage')
  assert.equal(await stage.getByRole('button').count(), 1)
  await stage.getByRole('button', { name: 'Get started', exact: true }).waitFor()
  const trigger = slide.locator('summary[aria-label="Customize Button"]')
  await trigger.click()
  const panel = slide.getByRole('region', { name: 'Customize Button', exact: true })
  await panel.getByLabel('Variant', { exact: true }).selectOption('secondary')
  await panel.getByLabel('Label', { exact: true }).fill('Start a project')
  assert.equal(
    await stage.getByRole('button', { name: 'Start a project' }).getAttribute('data-variant'),
    'secondary',
  )
  await page.keyboard.press('Escape')
  assert.ok(await trigger.evaluate((element) => document.activeElement === element))
  assert.equal(await panel.isVisible(), false)
  const settings = page.getByRole('link', { name: 'Go to Make them yours' })
  await settings.hover()
  await expect(settings).toHaveAttribute('data-rf-hovered', '')
  await settings.click()
  await page
    .getByRole('article', { name: 'Slide 28 of 28: Make them yours' })
    .getByRole('heading', { name: 'Make them yours' })
    .waitFor()
  await expect(page.getByRole('button', { name: 'Next slide' })).toBeDisabled()
  await page.goto('/demo?c=tooltip&theme=dark')
  await page.getByRole('link', { name: 'View Tooltip documentation' }).waitFor()
  // Breadcrumb joins the deck after the named slides, with its playground.
  await page.goto('/demo?c=breadcrumb&theme=dark')
  const breadcrumb = page.getByRole('article', { name: 'Slide 25 of 28: Breadcrumb' })
  await breadcrumb.locator('.site-demo-stage nav[aria-label="Breadcrumb"]').waitFor()
  await breadcrumb.locator('summary[aria-label="Customize Breadcrumb"]').waitFor()
})

it('loads each demo with its own defaults during carousel navigation', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.goto('/demo?c=input-message&theme=dark')
  const stage = page.locator('.site-demo-stage')
  await expect(stage.getByRole('textbox', { name: 'Message' })).toBeEnabled()
  const documentStart = await page.evaluate(() => performance.timeOrigin)
  const next = page.getByRole('link', { name: 'Next slide', exact: true })
  const button = page
    .getByRole('article', { name: 'Slide 8 of 28: Button' })
    .locator('.site-demo-stage')
    .getByRole('button')

  await next.click()
  await expect(stage.locator('.example-sidebar-playground > .rf-sidebar-layout')).toHaveAttribute(
    'data-variant',
    'inset',
  )
  await expect(stage.getByRole('searchbox', { name: 'Filter navigation' })).toBeVisible()
  await expect(stage.getByRole('button', { name: 'Open user menu' })).toBeEnabled()
  await next.click()
  await expect(button).toHaveText('Get started')
  await page.locator('summary[aria-label="Customize Button"]').click()
  const label = page
    .getByRole('region', { name: 'Customize Button', exact: true })
    .getByLabel('Label')
  await expect(label).toHaveValue('Get started')
  await label.fill('Start a project')
  await expect(button).toHaveText('Start a project')
  await page.getByRole('link', { name: 'Scale preview to fit the card' }).click()
  await expect(page.getByRole('link', { name: 'Show preview at actual size' })).toBeVisible()
  await expect(button).toHaveText('Start a project')

  await page.getByRole('link', { name: 'Previous slide', exact: true }).click()
  await expect(stage.getByRole('button', { name: 'Open user menu' })).toBeEnabled()
  await page.goBack()
  await expect(button).toHaveText('Get started')
  await page.goForward()
  await expect(stage.getByRole('searchbox', { name: 'Filter navigation' })).toBeVisible()
  assert.equal(await page.evaluate(() => performance.timeOrigin), documentStart)
})

it('routes demo arrows to the focused widget or to slide navigation', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/demo?c=checkbox-group&theme=dark&fit=1')
  const stage = page.locator('.site-demo-stage')
  const bananas = stage.getByRole('checkbox', { name: 'Bananas', exact: true })
  await bananas.click()
  assert.ok(await bananas.isChecked())
  assert.ok(await bananas.evaluate((input) => input === document.activeElement))
  await page.keyboard.press('ArrowDown')
  assert.ok(
    await stage
      .getByRole('checkbox', { name: 'Cherries', exact: true })
      .evaluate(
        (input) => input === document.activeElement && !(input as HTMLInputElement).checked,
      ),
  )
  await page.keyboard.press('ArrowRight')
  await page.getByRole('link', { name: 'View Accordion documentation' }).waitFor()
  assert.equal(new URL(page.url()).searchParams.get('fit'), '1')
  assert.equal(new URL(page.url()).searchParams.get('theme'), null)
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')

  await page.goto('/demo?c=slider')
  const slider = stage.getByRole('slider', { name: 'Opacity', exact: true })
  const before = Number(await slider.inputValue())
  await slider.press('ArrowRight')
  assert.equal(Number(await slider.inputValue()), before + 1)
  assert.equal(new URL(page.url()).searchParams.get('c'), 'slider')
  await page.getByRole('link', { name: 'Next slide', exact: true }).press('ArrowDown')
  await page.getByRole('link', { name: 'View AskUserQuestions documentation' }).waitFor()
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('aria-label') === 'Next slide',
    undefined,
    { timeout: 2500 },
  )

  await page.goto('/demo?c=tabs')
  await stage.getByRole('tab', { name: 'Home', exact: true }).press('ArrowRight')
  assert.ok(
    await stage
      .getByRole('tab', { name: 'Chat', exact: true })
      .evaluate(
        (tab) => tab === document.activeElement && tab.getAttribute('aria-selected') === 'false',
      ),
  )
  assert.equal(new URL(page.url()).searchParams.get('c'), 'tabs')
})

it('advances demo questions without focusing the title and preserves keyboard navigation in the answers', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/demo?c=ask-user-questions')
  await waitForShowcase(page)
  const stage = page.locator('.site-demo-stage')
  await stage.getByRole('radio', { name: /^Designer/ }).click()
  await stage.getByText('Question 2 of 3', { exact: true }).waitFor()
  assert.ok(await page.evaluate(() => document.activeElement === document.body))
  await page.keyboard.press('1')
  await stage.getByText('Question 3 of 3', { exact: true }).waitFor()
  assert.ok(await page.evaluate(() => document.activeElement === document.body))

  await page.goto('/demo?c=ask-user-questions')
  await waitForShowcase(page)
  await stage.getByRole('radio', { name: /^Designer/ }).press('Enter')
  const motion = stage.getByRole('radio', { name: /^Motion/ })
  await motion.waitFor()
  assert.ok(await motion.evaluate((row) => row === document.activeElement))
  await page.keyboard.press('ArrowLeft')
  await stage.getByText('Question 1 of 3', { exact: true }).waitFor()
  assert.ok(
    await stage
      .getByRole('radio', { name: /^Designer/ })
      .evaluate((row) => row === document.activeElement),
  )
})

it('configures keyboard prompts and a native attachment picker for the InputMessage demo', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/demo?c=input-message&theme=dark')
  const stage = page.locator('.site-demo-stage')
  const message = stage.getByRole('textbox', { name: 'Message', exact: true })
  const prompts = stage.getByRole('listbox', { name: 'Suggested prompts', exact: true })
  const attach = stage.getByRole('button', { name: 'Attach files', exact: true })
  const suggestion = 'How does Reflow tune the springs behind these animations?'
  assert.equal(await prompts.getByRole('option').count(), 4)
  assert.ok((await prompts.boundingBox())!.y > (await attach.boundingBox())!.y)
  await message.press('ArrowDown')
  await message.press('ArrowDown')
  assert.equal(
    await prompts
      .getByRole('option', { name: suggestion, exact: true })
      .getAttribute('aria-selected'),
    'true',
  )
  await message.press('Enter')
  assert.equal(await message.inputValue(), suggestion)
  await page.waitForFunction(
    () => {
      const region = document.querySelector('.site-demo-stage .rf-composer-suggestions-region')
      return region?.hasAttribute('inert') && region.getBoundingClientRect().height < 1
    },
    undefined,
    { timeout: 2500 },
  )
  assert.equal(new URL(page.url()).searchParams.get('c'), 'input-message')

  const chooser = page.waitForEvent('filechooser')
  await attach.click()
  await (
    await chooser
  ).setFiles({ name: 'demo.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n') })
  const preview = stage.getByRole('img', { name: 'demo.pdf', exact: true })
  await preview.waitFor()
  await stage.getByRole('button', { name: 'Send message', exact: true }).click()
  await stage
    .getByRole('log', { name: 'Conversation' })
    .getByText(suggestion, { exact: true })
    .waitFor()
  await prompts.waitFor()

  await page.locator('summary[aria-label="Customize InputMessage"]').click()
  const customize = page.getByRole('region', { name: 'Customize InputMessage', exact: true })
  await customize.getByRole('switch', { name: 'Suggested prompts', exact: true }).uncheck()
  await prompts.waitFor({ state: 'hidden' })
  assert.ok(await attach.isVisible())

  await page.goto('/')
  const tile = page.locator('.site-gallery [data-component="input-message"]')
  await tile.getByRole('textbox', { name: 'Message', exact: true }).waitFor()
  assert.equal(await tile.getByRole('listbox').count(), 0)
  assert.equal(await tile.getByRole('button', { name: 'Attach files', exact: true }).count(), 0)
})

it('fills and advances the gallery carousel, pausing over the slide', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1475, height: 900 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/?theme=dark')
  const tile = page.locator('.site-gallery [data-component="carousel-dots"]')
  const slide = tile.locator('.example-carousel-card')
  const activeDot = tile.locator('button[aria-current="true"]')
  const fill = activeDot.locator('.rf-carousel-dot > span')
  await slide.hover()
  await tile.locator('.rf-carousel-dots[data-rf-paused]').waitFor()
  assert.equal(await activeDot.getAttribute('aria-label'), 'Show Inbox')
  assert.equal(
    await fill.evaluate((element) => getComputedStyle(element).animationPlayState),
    'paused',
  )

  await tile.getByRole('link', { name: 'View CarouselDots documentation' }).hover()
  await page.waitForFunction(() => {
    const fill = document.querySelector(
      '.site-gallery [data-component="carousel-dots"] [aria-current="true"] .rf-carousel-dot > span',
    )
    const animation = fill?.getAnimations()[0]
    const progress = animation?.effect?.getComputedTiming().progress
    return typeof progress === 'number' && progress > 0 && progress < 1
  })
  await slide.getByText('Drafts', { exact: true }).waitFor({ timeout: 5000 })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await fill.evaluate((element) => getComputedStyle(element).animationName), 'none')
  await tile.getByRole('button', { name: 'Show Archive' }).press('Enter')
  await slide.getByText('Archive', { exact: true }).waitFor()
})

it('keeps the gallery Combobox aligned and scrollable after a third choice wraps', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1475, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?theme=dark&icons=lucide')
  const tile = page.locator('.site-gallery [data-component="combobox"]')
  await tile.getByRole('button', { name: 'Open options' }).click()
  const list = tile.getByRole('listbox', { name: 'Components' })
  await list.getByRole('option', { name: 'Card', exact: true }).click()

  const first = (await tile
    .getByRole('button', { name: 'Remove Button', exact: true })
    .boundingBox())!
  const third = (await tile
    .getByRole('button', { name: 'Remove Card', exact: true })
    .boundingBox())!
  const toggle = (await tile.getByRole('button', { name: 'Close options' }).boundingBox())!
  assert.ok(third.y > first.y)
  assert.equal(first.y + first.height / 2, toggle.y + toggle.height / 2)
  assert.equal(
    await list
      .getByRole('option', { name: 'Button', exact: true })
      .evaluate((row) => getComputedStyle(row).borderBottomLeftRadius),
    '0px',
  )
  assert.equal(
    await list
      .getByRole('option', { name: 'Card', exact: true })
      .evaluate((row) => getComputedStyle(row).borderTopLeftRadius),
    '0px',
  )

  const viewportSelector = '.site-gallery [data-component="combobox"] .rf-scroll-viewport'
  await page.waitForFunction((selector) => {
    const viewport = document.querySelector(selector)
    return (
      viewport &&
      parseFloat(getComputedStyle(viewport).getPropertyValue('--rf-scroll-fade-bottom')) > 0
    )
  }, viewportSelector)
  const input = tile.getByRole('combobox', { name: 'Components' })
  await input.press('End')
  await page.waitForFunction((selector) => {
    const viewport = document.querySelector(selector)
    return (
      viewport &&
      viewport.scrollTop > 0 &&
      getComputedStyle(viewport).getPropertyValue('--rf-scroll-fade-bottom') === '0px'
    )
  }, viewportSelector)
  await input.press('Escape')
  // The popup plays its exit tween before it hides.
  await list.waitFor({ state: 'hidden', timeout: 1000 })
})

it('smooths text with grayscale antialiasing across the site, as the reference does', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/button')
  for (const selector of ['body', '.site-doc h1', '.rf-button']) {
    assert.equal(
      await page
        .locator(selector)
        .first()
        .evaluate((node) => getComputedStyle(node).getPropertyValue('-webkit-font-smoothing')),
      'antialiased',
      selector,
    )
  }
})
