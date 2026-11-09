import { expect, type Page } from 'playwright/test'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router, waitForShowcase } from './showcase-router.ts'

async function trackAudio(page: Page) {
  await page.addInitScript(() => {
    const start = AudioScheduledSourceNode.prototype.start
    const startBuffer = AudioBufferSourceNode.prototype.start
    let starts = 0
    AudioScheduledSourceNode.prototype.start = function (...args) {
      document.documentElement.dataset.audioStarts = String(++starts)
      return start.apply(this, args)
    }
    AudioBufferSourceNode.prototype.start = function (...args) {
      document.documentElement.dataset.audioStarts = String(++starts)
      return startBuffer.apply(this, args)
    }
  })
  return () => page.locator('html').evaluate((root) => Number(root.dataset.audioStarts ?? 0))
}

it('renders the saved sound state before the browser initializes audio', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route('**/*', (route) =>
    route.request().resourceType() === 'script' ? route.abort() : route.continue(),
  )
  await page.goto('/docs/accordion')
  const sound = page.locator('.site-right').getByRole('switch', { name: 'Sound effects' })
  await expect(sound).toBeVisible()
  await expect(sound).toBeChecked()
  await expect(sound).toBeDisabled()

  await page.context().addCookies([{ name: 'reflow_sound', value: 'off', url: page.url() }])
  await page.reload()
  await expect(sound).toBeVisible()
  await expect(sound).not.toBeChecked()
  const credit = page.locator('.site-right').getByRole('link', { name: 'Cuelume', exact: true })
  await expect(credit).toBeVisible()
  await expect(credit).toHaveAttribute('href', 'https://cuelume.dev/')

  await page.setViewportSize({ width: 390, height: 844 })
  const shortcut = page.getByRole('button', { name: 'Showcase sound' })
  await expect(shortcut).toBeVisible()
  await expect(shortcut).toHaveAttribute('aria-pressed', 'false')
})

it('defaults sound on, migrates the saved preference, and keeps it out of shared URLs', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/docs/accordion')
  await waitForShowcase(page)
  const settings = page.locator('.site-right')
  const sound = settings.getByRole('switch', { name: 'Sound effects' })
  const cookie = async () =>
    (await page.context().cookies(page.url())).find((entry) => entry.name === 'reflow_sound')?.value
  await expect(sound).toBeChecked()

  await page.evaluate(() => localStorage.setItem('reflow_sound', 'off'))
  await page.reload()
  await waitForShowcase(page)
  await expect(sound).not.toBeChecked()
  await expect.poll(cookie).toBe('off')

  await page.evaluate(() => localStorage.setItem('reflow_sound', 'on'))
  await page.reload()
  await waitForShowcase(page)
  await expect(sound).not.toBeChecked()
  const url = page.url()
  await settings.getByRole('button', { name: 'Copy link with these settings' }).click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(url)
  await sound.press('Space')
  await expect(sound).toBeChecked()
  await expect.poll(cookie).toBe('on')
  expect(page.url()).toBe(url)
})

it('plays quiet cues on committed changes and stays silent when muted', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const audioStarts = await trackAudio(page)
  const visit = async (path: string) => {
    await page.goto(path)
    await waitForShowcase(page)
  }
  const cue = async (action: () => Promise<void>) => {
    const before = await audioStarts()
    await action()
    await expect.poll(audioStarts).toBeGreaterThan(before)
  }
  const settle = () =>
    page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    )

  await visit('/docs/button')
  const button = page.getByRole('button', { name: 'Click me', exact: true })
  await button.click()
  await expect(button).toHaveAttribute('aria-busy', 'true')
  await settle()
  expect(await audioStarts()).toBe(0)

  await visit('/docs/combobox')
  const single = page.locator('#basic')
  const framework = single.getByRole('combobox', { name: 'Framework' })
  await framework.fill('Astro')
  await expect(single.getByRole('option', { name: 'Astro' })).toBeVisible()
  await settle()
  expect(await audioStarts()).toBe(0)
  await cue(() => single.getByRole('option', { name: 'Astro' }).click())

  await visit('/docs/tabs')
  const tabs = page.locator('.doc-preview-stage[data-playground]')
  await tabs.getByRole('tab', { name: 'Teamspaces' }).press('ArrowRight')
  const recents = tabs.getByRole('tab', { name: 'Recents' })
  await expect(recents).toBeFocused()
  expect(await audioStarts()).toBe(0)
  await cue(() => recents.press('Enter'))
  const selected = await audioStarts()
  await recents.press('Enter')
  expect(await audioStarts()).toBe(selected)

  await visit('/docs/accordion')
  const styling = page
    .locator('.doc-preview-stage[data-playground]')
    .getByRole('button', { name: 'Styling' })
  await cue(() => styling.press('Enter'))
  await expect(styling).toHaveAttribute('aria-expanded', 'true')
  await cue(() => styling.press('Enter'))
  await expect(styling).toHaveAttribute('aria-expanded', 'false')

  await visit('/docs/slider')
  const stage = page.locator('.doc-preview-stage[data-playground]')
  const track = stage.locator('.rf-slider-track')
  await track.scrollIntoViewIfNeeded()
  const box = (await track.boundingBox())!
  const y = box.y + box.height / 2
  await page.mouse.move(box.x + box.width * 0.4, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.8, y, { steps: 5 })
  await settle()
  expect(await audioStarts()).toBe(0)
  await cue(() => page.mouse.up())
  await cue(() => stage.getByRole('slider').press('ArrowLeft'))

  const mute = page.locator('.site-right').getByRole('switch', { name: 'Sound effects' })
  await mute.press('Space')
  await expect(mute).not.toBeChecked()
  await visit('/docs/accordion')
  await styling.press('Enter')
  await expect(styling).toHaveAttribute('aria-expanded', 'true')
  await settle()
  expect(await audioStarts()).toBe(0)
})

it('confirms each successful InputCopy action, including a quick repeat', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const audioStarts = await trackAudio(page)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/docs/input-copy')
  await waitForShowcase(page)
  const example = page.locator('.doc-preview-stage[data-playground] [data-slot="input-copy"]')
  const button = example.getByRole('button')
  await button.click()
  await expect(example).toHaveAttribute('data-state', 'copied')
  await expect.poll(audioStarts).toBeGreaterThan(0)
  const before = await audioStarts()
  await button.click()
  await expect.poll(audioStarts).toBeGreaterThan(before)
})

it('plays an error cue after a failed clipboard action', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const audioStarts = await trackAudio(page)
  await page.addInitScript(() => {
    Clipboard.prototype.writeText = async () => {
      throw new DOMException('Clipboard denied', 'NotAllowedError')
    }
  })
  await page.goto('/docs/input-copy')
  await waitForShowcase(page)
  await page.getByRole('button', { name: 'Copy import', exact: true }).click()
  await expect.poll(audioStarts).toBeGreaterThan(0)

  const example = page.locator('.doc-preview-stage[data-playground] [data-slot="input-copy"]')
  const before = await audioStarts()
  await example.getByRole('button', { name: /^Copy / }).click()
  await expect(example).toHaveAttribute('data-state', 'error')
  await expect.poll(audioStarts).toBeGreaterThan(before)
})

it('plays the ready cue when the ThinkingSteps stream finishes', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const audioStarts = await trackAudio(page)
  await page.goto('/docs/thinking-steps')
  await waitForShowcase(page)
  const preview = page.locator('#streaming .doc-preview')
  await page.locator('#streaming h2').click()
  await preview.scrollIntoViewIfNeeded()
  await expect(preview.getByRole('button', { name: 'Pause example' })).toBeVisible()
  expect(await audioStarts()).toBe(0)
  await expect(preview.getByRole('button', { name: 'Replay example' })).toBeVisible({
    timeout: 8000,
  })
  await expect.poll(audioStarts).toBeGreaterThan(0)
})

it('plays a cue on manual carousel changes and leaves autoplay silent', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const audioStarts = await trackAudio(page)
  await page.goto('/docs/carousel-dots')
  await waitForShowcase(page)
  const carousel = page.locator('#autoplay .example-carousel')
  await page.locator('#autoplay h2').click()
  await expect(carousel.getByRole('button', { name: 'Show Drafts' })).toHaveAttribute(
    'aria-current',
    'true',
    { timeout: 6000 },
  )
  expect(await audioStarts()).toBe(0)
  const archive = carousel.getByRole('button', { name: 'Show Archive' })
  await archive.press('Enter')
  await expect(archive).toHaveAttribute('aria-current', 'true')
  await expect.poll(audioStarts).toBeGreaterThan(0)
  const before = await audioStarts()
  await archive.press('Enter')
  expect(await audioStarts()).toBe(before)
})

it('plays open and close cues for a Popover', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const audioStarts = await trackAudio(page)
  await page.goto('/docs/popover')
  await waitForShowcase(page)
  const trigger = page.locator('#basic').getByRole('button', { name: 'Dimensions', exact: true })
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect.poll(audioStarts).toBeGreaterThan(0)
  const opened = await audioStarts()
  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect.poll(audioStarts).toBeGreaterThan(opened)
})

it('keeps HoverCard previews silent', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const audioStarts = await trackAudio(page)
  await page.goto('/docs/hover-card')
  await waitForShowcase(page)
  await page.locator('#basic .doc-hover-trigger').hover()
  await expect(page.locator('#basic .rf-hover-card')).toBeVisible()
  await page.waitForTimeout(200)
  expect(await audioStarts()).toBe(0)
})
