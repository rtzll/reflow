import { expect, type Page } from 'playwright/test'
import { it } from 'remix/test'
import { finishMotion } from './motion.ts'
import { showcaseServer, waitForShowcase, open } from './showcase-router.ts'

async function trackAudio(page: Page) {
  await page.addInitScript(() => {
    const start = AudioBufferSourceNode.prototype.start
    const state = Object.assign(window, { soundTestStarts: 0 })
    AudioBufferSourceNode.prototype.start = function (...args) {
      state.soundTestStarts++
      return start.apply(this, args)
    }
  })
  return () =>
    page.evaluate(() => (window as Window & { soundTestStarts?: number }).soundTestStarts ?? 0)
}

it('renders the saved sound state before the browser initializes audio', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route('**/*', (route) =>
    route.request().resourceType() === 'script' ? route.abort() : route.continue(),
  )
  await open(page, '/docs/accordion', { hydrate: false })
  const sound = page.locator('.site-right').getByRole('switch', { name: 'Sound effects' })
  await expect(sound).toBeVisible()
  await expect(sound).toBeChecked()
  await expect(sound).toBeDisabled()

  await page.context().addCookies([{ name: 'reflow_sound', value: 'off', url: page.url() }])
  await page.reload()
  await expect(sound).toBeVisible()
  await expect(sound).not.toBeChecked()
  await expect(page.locator('.site-right').getByText('Sounds by', { exact: true })).toBeVisible()
  const credit = page
    .locator('.site-right')
    .getByRole('link', { name: 'Josh W. Comeau', exact: true })
  await expect(credit).toBeVisible()
  await expect(credit).toHaveAttribute('href', 'https://buttons.joshwcomeau.com/')

  await page.setViewportSize({ width: 390, height: 844 })
  const shortcut = page.getByRole('button', { name: 'Showcase sound' })
  await expect(shortcut).toBeVisible()
  await expect(shortcut).toHaveAttribute('aria-pressed', 'false')
})

it('defaults sound on, migrates the saved preference, and keeps it out of shared URLs', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, '/docs/accordion')
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
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  const visit = async (path: string) => {
    await open(page, path)
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
  await tabs.getByRole('tab', { name: 'Files' }).press('ArrowRight')
  const activity = tabs.getByRole('tab', { name: 'Activity' })
  await expect(activity).toBeFocused()
  expect(await audioStarts()).toBe(0)
  await cue(() => activity.press('Enter'))
  const selected = await audioStarts()
  await activity.press('Enter')
  expect(await audioStarts()).toBe(selected)

  await visit('/docs/accordion')
  const styling = page
    .locator('.doc-preview-stage[data-playground]')
    .getByRole('button', { name: 'Styling' })
  await cue(() => styling.press('Enter'))
  await expect(styling).toHaveAttribute('aria-expanded', 'true')
  const expanded = await audioStarts()
  await styling.press('Enter')
  await expect(styling).toHaveAttribute('aria-expanded', 'false')
  await settle()
  expect(await audioStarts()).toBe(expanded)

  const mute = page.locator('.site-right').getByRole('switch', { name: 'Sound effects' })
  await mute.press('Space')
  await expect(mute).not.toBeChecked()
  await visit('/docs/accordion')
  await styling.press('Enter')
  await expect(styling).toHaveAttribute('aria-expanded', 'true')
  await settle()
  expect(await audioStarts()).toBe(0)
})

it('loads switch recordings on demand and discards a cue muted during decode', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  const files: URL[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.endsWith('.mp3')) files.push(url)
  })
  await page.addInitScript(() => {
    const decode = AudioContext.prototype.decodeAudioData
    const state = window as Window & { finishFirstDecode?: () => void }
    AudioContext.prototype.decodeAudioData = async function (...args) {
      const buffer = await decode.apply(this, args)
      if (!state.finishFirstDecode)
        await new Promise<void>((resolve) => {
          state.finishFirstDecode = resolve
        })
      return buffer
    }
  })
  await open(page, '/docs/switch')
  expect(files).toHaveLength(0)
  const control = page.locator('[data-playground]').getByRole('switch', { name: 'Notifications' })
  const mute = page.locator('.site-right').getByRole('switch', { name: 'Sound effects' })
  await control.press('Space')
  await page.waitForFunction(() => 'finishFirstDecode' in window)
  await mute.press('Space')
  await mute.press('Space')
  await expect.poll(audioStarts).toBe(1)
  await page.evaluate(async () => {
    const state = window as Window & { finishFirstDecode?: () => void }
    state.finishFirstDecode!()
    await new Promise(requestAnimationFrame)
  })
  expect(await audioStarts()).toBe(1)
  await control.click()
  await expect.poll(audioStarts).toBe(2)
  expect(files.map((url) => url.pathname.split('/').pop())).toEqual([
    expect.stringMatching(/^guitar-toggle-off.*\.mp3$/),
    expect.stringMatching(/^guitar-toggle-on.*\.mp3$/),
  ])
  expect(files.every((url) => url.origin === new URL(page.url()).origin)).toBe(true)
})

it('ticks as a slider changes steps during a drag or keyboard adjustment', async (t) => {
  const page = await t.serve(showcaseServer)
  const starts = await trackAudio(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/docs/slider')
  const example = page.locator('#steps .rf-slider').first()
  const thumb = example.getByRole('slider')
  const rail = example.locator('.rf-slider-rail')
  await rail.scrollIntoViewIfNeeded()
  const box = (await rail.boundingBox())!
  const move = (fraction: number) =>
    page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2)
  await move(0.5)
  await page.mouse.down()
  await move(0.55)
  await expect(thumb).toHaveValue('50')
  expect(await starts()).toBe(0)
  await move(0.75)
  await expect.poll(starts).toBe(1)
  await move(0.8)
  await move(0.98)
  await expect.poll(starts).toBe(2)
  await move(0.75)
  await expect.poll(starts).toBe(3)
  await page.mouse.up()
  await thumb.press('ArrowRight')
  await expect.poll(starts).toBe(4)
  await thumb.press('ArrowRight')
  await expect(thumb).toHaveValue('100')
  await page.locator('.site-right').getByRole('switch', { name: 'Sound effects' }).click()
  await thumb.press('ArrowLeft')
  await expect(thumb).toHaveValue('75')
  expect(await starts()).toBe(4)
})

it('ticks as a Calendar event snaps longer or shorter during a drag', async (t) => {
  const page = await t.serve(showcaseServer)
  const starts = await trackAudio(page)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/apps/calendar')
  const kickoff = page.getByRole('button', { name: /^Weekly kickoff,/ })
  const handle = kickoff.locator('.rf-time-grid-resize')
  await handle.scrollIntoViewIfNeeded()
  const edge = (await handle.boundingBox())!
  const quarterHour =
    (await page.locator('.rf-time-grid-times span').first().boundingBox())!.height / 4
  const x = edge.x + edge.width / 2
  const y = edge.y + edge.height / 2
  const drag = (slots: number) => page.mouse.move(x, y + slots * quarterHour)
  await drag(0)
  await page.mouse.down()
  await drag(0.2)
  expect(await starts()).toBe(0)
  await drag(1)
  await expect.poll(starts).toBe(1)
  await drag(1.2)
  await drag(2)
  await expect.poll(starts).toBe(2)
  await drag(1)
  await expect.poll(starts).toBe(3)
  await page.mouse.up()
  await expect(kickoff).toHaveAccessibleName('Weekly kickoff, Monday, 09:00–10:15 UTC')
  expect(await starts()).toBe(3)
  await kickoff.press('ArrowRight')
  await page.getByRole('button', { name: 'Showcase sound' }).click()
  await kickoff.press('Shift+ArrowUp')
  await expect(kickoff).toHaveAccessibleName('Weekly kickoff, Tuesday, 09:00–10:00 UTC')
  expect(await starts()).toBe(3)
})

it('ticks for accepted keyboard resizes in timed and all-day TimeGrid examples', async (t) => {
  const page = await t.serve(showcaseServer)
  const starts = await trackAudio(page)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/time-grid')
  const portrait = page
    .locator('[data-playground]')
    .getByRole('button', { name: /^Portrait session,/ })
  await portrait.press('Shift+ArrowDown')
  await expect.poll(starts).toBe(1)
  await portrait.press('Shift+ArrowDown')
  await expect(portrait).toHaveAccessibleName('Portrait session, Friday, 09:00–10:00')
  const freeze = page.getByRole('button', { name: /^Code freeze,/ })
  await freeze.press('Shift+ArrowRight')
  await expect.poll(starts).toBe(2)
  await freeze.press('Shift+ArrowRight')
  await freeze.press('Shift+ArrowLeft')
  await expect.poll(starts).toBe(3)
})

it('shares sound and mute between the example workspaces and docs', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await open(page, '/apps/chat')
  const field = page.getByRole('textbox', { name: 'Message' })
  await field.fill('Try the recorded send sound')
  await field.press('Enter')
  await expect.poll(audioStarts).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Showcase sound' }).click()
  await open(page, '/apps/analytics')
  await expect(page.getByRole('button', { name: 'Showcase sound' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await open(page, '/docs/switch')
  await expect(
    page.locator('.site-right').getByRole('switch', { name: 'Sound effects' }),
  ).not.toBeChecked()
})

it('confirms each successful InputCopy action, including a quick repeat', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, '/docs/input-copy')
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
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await page.addInitScript(() => {
    Clipboard.prototype.writeText = async () => {
      throw new DOMException('Clipboard denied', 'NotAllowedError')
    }
  })
  await open(page, '/docs/input-copy')
  await page.getByRole('button', { name: 'Copy import', exact: true }).click()
  await expect.poll(audioStarts).toBeGreaterThan(0)

  const example = page.locator('.doc-preview-stage[data-playground] [data-slot="input-copy"]')
  const before = await audioStarts()
  await example.getByRole('button', { name: /^Copy / }).click()
  await expect(example).toHaveAttribute('data-state', 'error')
  await expect.poll(audioStarts).toBeGreaterThan(before)
})

it('plays the ready cue when the ThinkingSteps stream finishes', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await page.clock.install()
  await open(page, '/docs/thinking-steps', { motion: true })
  const preview = page.locator('#streaming .doc-preview')
  await page.locator('#streaming h2').click()
  await preview.scrollIntoViewIfNeeded()
  await expect(preview.getByRole('button', { name: 'Pause example' })).toBeVisible()
  expect(await audioStarts()).toBe(0)
  await page.clock.runFor(8000)
  await expect(preview.getByRole('button', { name: 'Replay example' })).toBeVisible()
  await expect.poll(audioStarts).toBeGreaterThan(0)
})

it('plays a cue on manual carousel changes and leaves autoplay silent', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await open(page, '/docs/carousel-dots', { motion: true })
  const carousel = page.locator('#autoplay .example-carousel')
  await page.locator('#autoplay h2').click()
  await finishMotion(carousel.locator('.rf-carousel-dots [aria-current="true"]'))
  await expect(carousel.getByRole('button', { name: 'Show Drafts' })).toHaveAttribute(
    'aria-current',
    'true',
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

it('plays a cue as each toast arrives and as a promise toast settles', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await open(page, '/docs/toaster')
  await page.locator('#status').getByRole('button', { name: 'Success', exact: true }).click()
  await page.locator('.rf-toast[data-status="success"]').waitFor()
  await expect.poll(audioStarts).toBeGreaterThan(0)
  const arrived = await audioStarts()
  await page.locator('#promise').getByRole('button', { name: 'Upload', exact: true }).click()
  const upload = page.locator('.rf-toast[data-status="loading"]')
  await upload.waitFor()
  await page.waitForTimeout(200)
  // The spinner arrives silently; the outcome plays.
  expect(await audioStarts()).toBe(arrived)
  await page.locator('.rf-toast', { hasText: 'Uploaded roadmap.pdf' }).waitFor()
  await expect.poll(audioStarts).toBeGreaterThan(arrived)
})

it('confirms a CodeBlock copy with the copy cue', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  const audioStarts = await trackAudio(page)
  await open(page, '/docs/code-block')
  const block = page.locator('#basic [data-slot="code-block"]')
  await block.getByRole('button', { name: 'Copy code' }).click()
  await expect(block.getByRole('button', { name: 'Copied' })).toBeVisible()
  await expect.poll(audioStarts).toBeGreaterThan(0)
})

it('plays the copy cue from the CodeBlock gallery card too', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  const audioStarts = await trackAudio(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/?theme=dark')
  const card = page.locator('.site-gallery [data-component="code-block"]')
  await card.getByRole('button', { name: 'Copy code' }).click()
  await expect(card.getByRole('button', { name: 'Copied' })).toBeVisible()
  await expect.poll(audioStarts).toBeGreaterThan(0)
})

it('plays the error cue when a CodeBlock copy fails, as InputCopy does', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await page.addInitScript(() => {
    Clipboard.prototype.writeText = async () => {
      throw new DOMException('Clipboard denied', 'NotAllowedError')
    }
  })
  await open(page, '/docs/code-block')
  // Unlock audio with a first gesture, as the InputCopy test does.
  await page.getByRole('button', { name: 'Copy import', exact: true }).click()
  await expect.poll(audioStarts).toBeGreaterThan(0)
  const block = page.locator('#basic [data-slot="code-block"]')
  const before = await audioStarts()
  await block.getByRole('button', { name: 'Copy code' }).click()
  await expect(block).toHaveAttribute('data-state', 'error')
  await expect(block.getByRole('button', { name: 'Copy failed' })).toBeVisible()
  await expect.poll(audioStarts).toBeGreaterThan(before)
})

it('keeps the sound button working after moving between docs pages', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/docs/carousel')
  const documentStart = await page.evaluate(() => performance.timeOrigin)
  await page.getByRole('link', { name: 'Next: CarouselDots' }).click()
  await expect(page).toHaveURL(/\/docs\/carousel-dots/)
  await page.getByRole('link', { name: 'Previous: Carousel' }).click()
  await expect(page).toHaveURL(/\/docs\/carousel$/)
  // The pages changed within the same document.
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart)

  const sound = page.locator('.site-right').getByRole('switch', { name: 'Sound effects' })
  await expect(sound).toBeEnabled()
  const on = await sound.isChecked()
  await sound.click()
  await expect(sound).toBeChecked({ checked: !on })
  await sound.click()
  await expect(sound).toBeChecked({ checked: on })
})

it('swooshes on manual Carousel moves and keeps autoplay silent', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await open(page, '/docs/carousel', { motion: true })
  const example = page.locator('#basic')
  const swoosh = page.waitForResponse(/surface-swoosh[^/]*\.mp3/)
  await example.getByRole('button', { name: 'Next slide' }).click()
  expect((await swoosh).ok()).toBe(true)
  await expect.poll(audioStarts).toBe(1)
  await example.getByRole('button', { name: 'Show Fluid motion' }).click()
  await expect.poll(audioStarts).toBe(2)

  // Autoplay moves on silently.
  const autoplay = page.locator('#autoplay')
  await autoplay.scrollIntoViewIfNeeded()
  await page.mouse.move(5, 5)
  const before = await audioStarts()
  await finishMotion(autoplay.locator('.rf-carousel-dots [aria-current="true"]'))
  await expect(autoplay.getByRole('button', { name: 'Show Shared hover' })).toHaveAttribute(
    'aria-current',
    'true',
  )
  expect(await audioStarts()).toBe(before)
})

it('swooshes once on banner dismissal and stays quiet when the banner returns', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await open(page, '/docs/banner')
  const example = page.locator('.doc-preview-stage[data-playground]')
  const dismiss = example.getByRole('button', { name: 'Dismiss', exact: true })
  const swoosh = page.waitForResponse(/surface-swoosh[^/]*\.mp3/)
  await dismiss.press('Enter')
  expect((await swoosh).ok()).toBe(true)
  await expect.poll(audioStarts).toBe(1)
  await example.getByRole('button', { name: 'Show banner' }).click()
  await expect(dismiss).toBeVisible()
  await dismiss.click()
  await expect.poll(audioStarts).toBe(2)
})

it('plays one swoosh as a Drawer slides in and one as it slides out', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await open(page, '/docs/drawer')
  const swoosh = page.waitForResponse(/surface-swoosh[^/]*\.mp3/)
  await page.locator('#basic').getByRole('button', { name: 'Filters', exact: true }).click()
  expect((await swoosh).ok()).toBe(true)
  await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible()
  await expect.poll(audioStarts).toBe(1)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Filters' })).toBeHidden()
  await expect.poll(audioStarts).toBe(2)
})

it('clicks only on opening a Popover', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await open(page, '/docs/popover')
  const trigger = page.locator('#basic').getByRole('button', { name: 'Dimensions', exact: true })
  const click = page.waitForResponse(/hi75-soft[^/]*\.mp3/)
  await trigger.click()
  expect((await click).ok()).toBe(true)
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect.poll(audioStarts).toBe(1)
  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  )
  expect(await audioStarts()).toBe(1)
})

it('keeps HoverCard previews silent', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await open(page, '/docs/hover-card')
  await page.locator('#basic .doc-hover-trigger').hover()
  await expect(page.locator('#basic .rf-hover-card')).toBeVisible()
  await page.waitForTimeout(200)
  expect(await audioStarts()).toBe(0)
})

it('sounds committed tree, number, queue and mention interactions', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await open(page, '/')
  const cue = async (action: () => Promise<unknown>) => {
    const before = await audioStarts()
    await action()
    await expect.poll(audioStarts).toBeGreaterThan(before)
  }
  const browser = page.locator('[data-component="code-block"]')
  const folder = browser.getByRole('treeitem', { name: 'app', exact: true })
  await cue(() => folder.press('ArrowLeft'))
  await cue(() => folder.press('ArrowRight'))
  await cue(() => browser.getByRole('treeitem', { name: 'README.md' }).press('Enter'))
  await cue(() => browser.getByRole('separator').press('ArrowLeft'))
  const number = page.locator('[data-component="input-group"]')
  await cue(() => number.getByRole('button', { name: 'Increase' }).click())
  const queue = page.locator('[data-component="queued-stack"]')
  await cue(() => queue.getByRole('button', { name: '3 queued messages' }).click())
  await cue(() => queue.getByRole('button', { name: 'Move message 1 down' }).click())
  const composer = page
    .locator('[data-component="input-message"]')
    .getByRole('textbox', { name: 'Message' })
  await composer.fill('@gr')
  await cue(() => composer.press('Enter'))
  await expect(composer).toHaveValue('@Grace Hopper ')
})

it('sounds accepted and rejected files but stays silent after muting', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await open(page, '/docs/file-input')
  const input = page.getByLabel('Cover image').last()
  await input.setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from('image'),
  })
  await expect.poll(audioStarts).toBeGreaterThan(0)
  const accepted = await audioStarts()
  await input.setInputFiles({
    name: 'note.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('text'),
  })
  await expect.poll(audioStarts).toBeGreaterThan(accepted)
  await page.locator('.site-right').getByRole('switch', { name: 'Sound effects' }).press('Space')
  const muted = await audioStarts()
  await input.setInputFiles({
    name: 'other.png',
    mimeType: 'image/png',
    buffer: Buffer.from('image'),
  })
  await page.waitForTimeout(200)
  expect(await audioStarts()).toBe(muted)
})

it('sounds custom selection and gallery pagination', async (t) => {
  const page = await t.serve(showcaseServer)
  const audioStarts = await trackAudio(page)
  await open(page, '/')
  const select = page.locator('[data-component="select"]')
  await select.getByRole('button', { name: 'Role' }).click()
  await select.getByRole('option').nth(1).click()
  await expect.poll(audioStarts).toBeGreaterThan(0)
  const before = await audioStarts()
  await page
    .getByRole('navigation', { name: 'Team pages' })
    .getByRole('link', { name: 'Next page' })
    .click()
  await expect(page).toHaveURL(/teamPage=2/)
  await expect.poll(audioStarts).toBeGreaterThan(before)
})
