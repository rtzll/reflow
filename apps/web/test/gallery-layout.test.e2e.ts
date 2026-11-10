import type { Page } from 'playwright'
import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { pauseClock } from './clock.ts'
import { holdMotion, releaseMotion, seekMotion } from './motion.ts'
import { open, router } from './showcase-router.ts'

it('preserves the gallery order and keeps previews above their footers', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const expected = [
    'input-message',
    'thinking-indicator',
    'toaster',
    'hover-card',
    'queued-stack',
    'code-block',
    'card',
    'select',
    'command-menu',
    'tooltip',
    'avatar',
    'sidebar',
    'radio-group',
    'segmented-control',
    'thinking-steps',
    'tabs',
    'checkbox-group',
    'ask-user-questions',
    'slider',
    'dropdown',
    'banner',
    'input-copy',
    'accordion',
    'input-group',
    'carousel',
    'button',
    'breadcrumb',
    'table',
    'dialog',
    'calendar',
    'date-picker',
    'chat-message',
    'popover',
    'drawer',
    'color-picker',
    'switch',
    'combobox',
  ]
  const gallery = page.locator('.site-gallery')
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await open(page, '/?theme=dark')
    await gallery.getByRole('link', { name: 'View DatePicker documentation' }).waitFor()
    assert.deepEqual(
      await gallery
        .locator(':scope > article')
        .evaluateAll((tiles) => tiles.map((tile) => tile.dataset.component)),
      expected,
    )
    assert.equal(await gallery.locator('[data-component="card"] .rf-card').count(), 4)
    // The Breadcrumb card fits its trail to the card: middle steps fold behind
    // the ellipsis, while the first step, the section menu and the page stay.
    // In a small card the page name truncates, as in the reference.
    const trail = gallery.locator('[data-component="breadcrumb"] .rf-breadcrumb')
    await trail.getByRole('button', { name: 'Drafts' }).waitFor()
    assert.equal(await trail.locator('[aria-current="page"]').textContent(), 'Roadmap.md')
    assert.equal(await trail.locator('a').first().textContent(), 'Home')
    await trail.locator('li[data-ellipsis]').waitFor()
    assert.equal(
      await gallery.locator('[data-component="color-picker"] .rf-color-swatch').count(),
      17,
    )
    const calendar = gallery.locator('[data-component="calendar"]')
    await calendar
      .locator(`.example-gallery-calendar[data-months="${width < 768 ? 1 : 2}"]`)
      .waitFor()
    const checkContainment = async () => {
      const spills = await gallery.locator('.site-preview-stage').evaluateAll((stages) =>
        stages.flatMap((stage) => {
          const bounds = stage.getBoundingClientRect()
          const parts = [
            ...stage.children,
            ...stage.querySelectorAll(
              '.rf-calendar-grid, .rf-sidebar-layout, .rf-dropdown-surface[data-inline]',
            ),
          ]
          return parts.some((part) => {
            const box = part.getBoundingClientRect()
            return (
              box.width > 0 &&
              box.height > 0 &&
              (box.top < bounds.top - 1 ||
                box.bottom > bounds.bottom + 1 ||
                box.left < bounds.left - 1 ||
                box.right > bounds.right + 1)
            )
          })
            ? [stage.parentElement!.dataset.component]
            : []
        }),
      )
      assert.deepEqual(spills, [], `Preview overflow at ${width}px`)
    }
    await checkContainment()
    if (width === 768) {
      // Two columns, and as many small cards as fill them: the last row is full.
      const rows = await gallery.evaluate((node) => {
        const tiles = Array.from(node.querySelectorAll<HTMLElement>(':scope > article'))
        const bottom = Math.max(...tiles.map((tile) => tile.getBoundingClientRect().bottom))
        const last = tiles.filter(
          (tile) => Math.abs(tile.getBoundingClientRect().bottom - bottom) < 2,
        )
        const width = last.reduce((sum, tile) => sum + tile.getBoundingClientRect().width, 0)
        return width / node.getBoundingClientRect().width
      })
      assert.ok(rows > 0.9, `the last row fills the gallery (${rows})`)
    }
    if (width === 1440) {
      await expect(
        gallery.locator('[data-component="ask-user-questions"]').getByText('Question 1 of 8'),
      ).toBeVisible()
      const tile = (slug: string) =>
        gallery.locator(`article[data-component="${slug}"]`).boundingBox()
      const [table, dialog, datePicker, wideCalendar, tabs, thinking] = await Promise.all(
        ['table', 'dialog', 'date-picker', 'calendar', 'tabs', 'thinking-steps'].map(tile),
      )
      assert.equal(table!.y, dialog!.y)
      assert.equal(datePicker!.y, wideCalendar!.y)
      assert.ok(datePicker!.x < wideCalendar!.x)
      assert.equal(tabs!.y, thinking!.y)
      assert.ok(tabs!.x < thinking!.x)
      // The last band: a large conversation on the left, two smalls stacked beside it.
      const [chat, popover, drawer] = await Promise.all(
        ['chat-message', 'popover', 'drawer'].map(tile),
      )
      assert.ok(chat!.width > popover!.width * 1.9, 'the conversation spans two columns')
      assert.equal(chat!.y, popover!.y)
      assert.ok(popover!.x > chat!.x)
      assert.equal(popover!.x, drawer!.x)
      assert.ok(drawer!.y > popover!.y)
      assert.equal(Math.round(chat!.y + chat!.height), Math.round(drawer!.y + drawer!.height))
      // Wide cards alternate sides down the gallery: InputMessage on the right
      // of the first row, Toaster on the left of the second, ColorPicker on the
      // right again, and so on.
      const sides = await gallery.evaluate((node) => {
        const left = node.getBoundingClientRect().left
        return Array.from(
          node.querySelectorAll<HTMLElement>(':scope > article[data-wide]'),
          (card) => (card.getBoundingClientRect().left - left < 50 ? 'L' : 'R'),
        ).join('')
      })
      assert.equal(sides, 'RLRLRLRLRLRLRLR')
      const [indicator, input, toaster, hover] = await Promise.all(
        ['thinking-indicator', 'input-message', 'toaster', 'hover-card'].map(tile),
      )
      assert.equal(indicator!.y, input!.y)
      assert.ok(indicator!.x < input!.x)
      assert.equal(toaster!.y, hover!.y)
      assert.ok(toaster!.y > input!.y)
      assert.ok(hover!.x > toaster!.x)
      const accordion = gallery.locator('[data-component="accordion"]')
      await accordion.getByRole('button', { name: 'Accessibility', exact: true }).click()
      await checkContainment()
    }
  }
  const datePicker = gallery.locator('[data-component="date-picker"]')
  await datePicker.getByRole('button', { name: 'Clear date', exact: true }).click()
  const trigger = datePicker.getByRole('button', {
    name: 'Start date: Pick a date',
    exact: true,
  })
  assert.ok(await trigger.evaluate((button) => document.activeElement === button))
  await trigger.press('Enter')
  await datePicker.getByRole('dialog', { name: 'Start date' }).waitFor()
})

it('uses one hover fill for grouped inputs and places the Volume preview above the track', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/?theme=dark')
  const inputGroup = page.locator('.site-gallery [data-component="input-group"]')
  const textbox = page.getByRole('textbox', { name: 'Name', exact: true })
  const name = inputGroup.getByRole('textbox', { name: 'Name', exact: true })
  const field = inputGroup.locator('.rf-input-field-control').filter({ has: textbox })
  await field.hover({ position: { x: 15, y: 15 } })
  await field.and(page.locator('[data-rf-hovered]')).waitFor({ timeout: 2500 })
  await name.hover()
  assert.equal(await field.getAttribute('data-rf-hovered'), '')
  assert.equal(
    await name.evaluate((input) => getComputedStyle(input).backgroundColor),
    'rgba(0, 0, 0, 0)',
  )

  const volume = page.locator('.site-gallery [data-component="slider"] [data-variant="scrubber"]')
  const track = volume.locator('.rf-slider-track')
  await track.hover({ timeout: 2500 })
  const bubble = volume.locator('.rf-slider-hover-tooltip')
  await bubble.waitFor({ timeout: 2500 })
  const above = await bubble.evaluate(
    (element) =>
      element.getBoundingClientRect().bottom <
      element.closest('.rf-slider-track')!.getBoundingClientRect().top,
  )
  assert.ok(above, 'The preview bubble should clear the top of the track')
})

it('restores dismissed banners and allows clearing the selected feature', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  // The banner returns on a timer, which the test moves on itself.
  await page.clock.install()
  await open(page, '/?theme=dark', { motion: true })
  const banner = page.locator('.site-gallery [data-component="banner"]')
  const dismiss = banner.getByRole('button', { name: 'Dismiss' })
  await pauseClock(page)
  await dismiss.click()
  await dismiss.waitFor({ state: 'hidden' })
  await page.clock.runFor(1500)
  await dismiss.waitFor({ state: 'visible' })

  const dropdown = page.getByRole('menu', { name: 'Component features' })
  const initial = dropdown.getByRole('menuitemcheckbox', {
    name: 'Spring animations',
  })
  const feature = dropdown.getByRole('menuitemcheckbox', {
    name: 'Font weight shifts',
  })
  const check = feature.locator('.rf-menu-check path')
  await check.evaluate((path) => {
    path.addEventListener('transitionend', (event) => {
      if ((event as TransitionEvent).propertyName === 'stroke-dashoffset') {
        path.setAttribute(
          'data-check-at',
          String(parseFloat(getComputedStyle(path).strokeDashoffset)),
        )
      }
    })
  })
  assert.equal(await initial.getAttribute('aria-checked'), 'true')
  await feature.click()
  assert.equal(await initial.getAttribute('aria-checked'), 'false')
  assert.equal(await feature.getAttribute('aria-checked'), 'true')
  await feature.locator('path[data-check-at="0"]').waitFor({ state: 'attached' })
  await feature.press('Space')
  assert.equal(await feature.getAttribute('aria-checked'), 'false')
  await feature.locator('path[data-check-at="1"]').waitFor({ state: 'attached' })
})

it('moves the hovered switch thumb without jumping and settles a drag from the thumb position', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/?theme=dark', { motion: true })
  const tile = page.locator('.site-gallery [data-component="switch"]')
  const input = tile.getByRole('switch', {
    name: 'Sound effects',
    exact: true,
  })
  await input.hover()
  const track = tile
    .locator('.rf-switch')
    .filter({
      has: page.getByRole('switch', { name: 'Sound effects', exact: true }),
    })
    .locator('.rf-switch-track')
  const thumb = track.locator('.rf-switch-thumb')
  await thumb.evaluate(async (element) => {
    await Promise.allSettled(element.getAnimations().map((animation) => animation.finished))
  })

  const firstFrame = await input.evaluate((element) => {
    if (!(element instanceof HTMLInputElement)) throw new Error('Expected a checkbox input')
    const thumb = element.nextElementSibling!.firstElementChild!
    const start = thumb.getBoundingClientRect()
    element.click()
    const travel = thumb
      .getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSTransition && animation.transitionProperty === 'translate',
      )
    if (!travel) throw new Error('Expected the thumb to animate its position')
    travel.pause()
    travel.currentTime = 0
    const first = thumb.getBoundingClientRect()
    travel.finish()
    return { x: first.x - start.x, width: first.width - start.width }
  })
  assert.ok(Math.abs(firstFrame.x) < 0.2 && Math.abs(firstFrame.width) < 0.2)
  assert.equal(await input.isChecked(), true)
  await input.press('Space')
  assert.equal(await input.isChecked(), false)
  await thumb.evaluate(async (element) => {
    await Promise.allSettled(element.getAnimations().map((animation) => animation.finished))
  })

  const box = (await track.boundingBox())!
  const y = box.y + box.height / 2
  // Start near the far end of the track and move a little toward the resting
  // thumb. The pointer is past halfway, but the thumb has stayed on the off side.
  await page.mouse.move(box.x + box.width - 4, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width - 9, y)
  await page.mouse.up()
  assert.equal(await input.isChecked(), false)

  await page.mouse.move(box.x + 5, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width - 5, y, { steps: 6 })
  await page.mouse.up()
  assert.equal(await input.isChecked(), true)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await input.press('Space')
  assert.equal(await input.isChecked(), false)
  assert.equal(await thumb.evaluate((element) => element.getAnimations().length), 0)
})

it('fans out the queue and reorders during a drag before release', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/queued-stack')
  const pile = page.getByRole('list', { name: 'Queued messages' })
  const height = (await pile.boundingBox())!.height
  await pile.hover()
  assert.ok((await pile.boundingBox())!.height > height * 2)
  await page.getByRole('button', { name: '3 queued messages' }).click()
  const rows = pile.locator('li')
  const first = (await rows.first().boundingBox())!
  const last = (await rows.last().boundingBox())!
  await page.mouse.move(first.x + 30, first.y + first.height / 2)
  await page.mouse.down()
  await page.mouse.move(last.x + 30, last.y + last.height / 2 + 4, {
    steps: 8,
  })
  assert.match((await rows.last().textContent()) ?? '', /Draft an intro/)
  await page.mouse.up()
  await rows
    .last()
    .getByRole('button', { name: /move message .* up/i })
    .press('Enter')
  assert.match((await rows.nth(1).textContent()) ?? '', /Draft an intro/)
})

it('caps a long searchable dropdown while leaving its lower options reachable', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1200, height: 1000 })
  await open(page, '/docs/dropdown#searchable-menu')
  const trigger = page.locator('#searchable-menu').getByRole('button', { name: 'Auto detect' })
  await trigger.evaluate((button) =>
    window.scrollBy(0, button.getBoundingClientRect().bottom - innerHeight + 18),
  )
  await trigger.click()
  const surface = page.locator('.rf-dropdown-surface:popover-open')
  await surface.waitFor()
  const popup = await surface.evaluate((node) => ({
    placement: (node as HTMLElement).dataset.anchorPlacement,
    height: node.getBoundingClientRect().height,
    scroll: node.scrollHeight > node.clientHeight,
  }))
  assert.match(popup.placement ?? '', /^top/)
  assert.equal(popup.height, 480)
  assert.equal(popup.scroll, true)
  await surface.getByRole('searchbox').press('ArrowUp')
  const last = surface.getByRole('menuitemradio', { name: 'Vietnamese' })
  assert.ok(await last.evaluate((item) => item === document.activeElement))
  await last.press('Escape')
  await surface.waitFor({ state: 'hidden' })
  await page.waitForFunction(
    () =>
      document.activeElement === document.querySelector('#searchable-menu .rf-dropdown-trigger'),
  )

  await open(page, '/docs/dropdown#submenus')
  await page.getByRole('button', { name: 'Q3 report.pdf' }).click()
  const parent = page.getByRole('menuitem', { name: 'Move to' })
  await parent.hover()
  await expect(parent).toHaveAttribute('aria-expanded', 'true')
  const submenu = page.locator('[data-menu-submenu]:popover-open[data-anchor-placement]')
  const inbox = submenu.getByRole('menuitem', { name: 'Inbox', exact: true })
  await inbox.waitFor()
  const target = (await inbox.boundingBox())!
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 })
  assert.equal(await parent.getAttribute('aria-expanded'), 'true')
  assert.ok(await inbox.isVisible())
})

it('supports the queue, nested menus, and a compact picker on a touch viewport', async (t) => {
  const server = await createTestServer(router.fetch)
  const page = await t.serve(server)
  const context = await page
    .context()
    .browser()!
    .newContext({
      baseURL: server.baseUrl,
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    })
  t.after(() => context.close())
  const mobile = await context.newPage()
  mobile.setDefaultTimeout(8000)
  await open(mobile, '/docs/queued-stack')
  const pile = mobile.getByRole('list', { name: 'Queued messages' })
  const height = (await pile.boundingBox())!.height
  await pile.getByText('Draft an intro', { exact: true }).tap()
  await mobile.getByRole('button', { name: 'Collapse queue' }).waitFor()
  assert.ok((await pile.boundingBox())!.height > height * 2)
  await mobile.getByRole('button', { name: 'Collapse queue' }).tap()
  assert.equal((await pile.boundingBox())!.height, height)

  await open(mobile, '/docs/dropdown#submenus')
  const menuTrigger = mobile.getByRole('button', { name: 'Q3 report.pdf' })
  await menuTrigger.tap()
  const submenuTrigger = mobile.getByRole('menuitem', { name: 'Move to' })
  await submenuTrigger.tap()
  await expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true')
  await mobile.getByRole('menuitem', { name: 'Inbox', exact: true }).waitFor()
  await mobile.touchscreen.tap(5, 5)
  await expect(menuTrigger).toHaveAttribute('aria-expanded', 'false')
  await expect(mobile.locator('.rf-dropdown-surface:popover-open')).toHaveCount(0)

  await open(mobile, '/docs/date-picker?density=compact')
  const trigger = mobile.getByRole('button', { name: /^Travel dates:/ })
  await trigger.tap()
  const popup = mobile.locator('.rf-date-surface:popover-open')
  await popup.waitFor()
  const bounds = (await popup.boundingBox())!
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390)
  assert.equal(
    await popup
      .locator('.rf-calendar')
      .evaluate((calendar) =>
        getComputedStyle(calendar).getPropertyValue('--rf-control-height').trim(),
      ),
    '28px',
  )
  const month = (await popup.getByRole('grid').first().getAttribute('aria-label'))!
  await popup.getByRole('button', { name: 'Next month' }).tap()
  await popup.getByRole('grid', { name: month, exact: true }).waitFor({ state: 'hidden' })
  assert.ok(await popup.isVisible())
})

it('moves the inline menu focus ring and preserves its forced-colors fallback', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/dropdown#basic')
  const menu = page.getByRole('menu', { name: 'Library' })
  const first = menu.getByRole('menuitemradio', { name: 'Teamspaces' })
  const second = menu.getByRole('menuitemradio', { name: 'Recents' })
  const ring = menu.locator('[data-rf-focus-layer]')
  const ringOffset = () =>
    ring.evaluate((node) => {
      const row = node.parentElement?.querySelector('[role="menuitemradio"]:focus')
      if (!row || !node.hasAttribute('data-visible')) return Infinity
      return Math.abs(node.getBoundingClientRect().top - row.getBoundingClientRect().top)
    })

  await menu.press('ArrowDown')
  await expect(first).toBeFocused()
  await expect.poll(ringOffset).toBeLessThan(1)
  await page.keyboard.press('ArrowDown')
  await expect(second).toBeFocused()
  await expect.poll(ringOffset).toBeLessThan(1)
  assert.equal(await first.getAttribute('aria-checked'), 'true')
  assert.equal(await ring.evaluate((node) => getComputedStyle(node, '::before').top), '-2px')
  assert.equal(await ring.evaluate((node) => getComputedStyle(node).transitionProperty), 'opacity')

  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' })
  await expect(ring).toBeHidden()
  await expect(second).toHaveCSS('outline-style', 'solid')
})

it('moves one focus ring between the rows of a triggered menu', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/dropdown#triggered-menu')
  const trigger = page.locator('#triggered-menu .rf-dropdown-trigger')
  await trigger.focus()
  await page.keyboard.press('Enter')
  const list = page.locator('#triggered-menu [role="menu"]')
  await expect(list).toBeVisible()
  const ring = list.locator(':scope > [data-rf-focus-layer]')
  const ringOffset = () =>
    list.evaluate((node) => {
      const ring = node.querySelector(':scope > [data-rf-focus-layer]')
      const row = node.querySelector('[role^="menuitem"]:focus-visible')
      if (!ring || !row || !ring.hasAttribute('data-visible')) return Infinity
      const a = ring.getBoundingClientRect()
      const b = row.getBoundingClientRect()
      return Math.abs(a.top - b.top) + Math.abs(a.height - b.height)
    })
  await page.keyboard.press('ArrowDown')
  await expect.poll(ringOffset).toBeLessThan(1)
  const firstTop = await ring.evaluate((node) => node.getBoundingClientRect().top)
  await page.keyboard.press('ArrowDown')
  await expect.poll(ringOffset).toBeLessThan(1)
  const secondTop = await ring.evaluate((node) => node.getBoundingClientRect().top)
  assert.ok(secondTop > firstTop, 'The ring should move down to the next row')
  // The row's own outline gives way to the ring, as in the inline menu.
  const focused = list.locator('[role^="menuitem"]:focus-visible')
  await expect(focused).toHaveCSS('outline-color', 'rgba(0, 0, 0, 0)')
  await page.keyboard.press('Escape')
  await expect(list).toBeHidden()

  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowDown')
  await expect(ring).toBeHidden()
  await expect(list.locator('[role^="menuitem"]:focus-visible')).toHaveCSS('outline-style', 'solid')
})

it('marks the checked color format and moves a focus ring between formats', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/color-picker')
  const trigger = page.locator('.rf-color-format-trigger').locator('visible=true').first()
  await trigger.focus()
  await page.keyboard.press('Enter')
  const menu = page.getByRole('menu', { name: 'Color format' }).locator('visible=true')
  await expect(menu).toHaveCount(1)
  const offset = (layer: string, row: string) =>
    menu.evaluate(
      (list, [layer, row]) => {
        const node = list.querySelector(`:scope > ${layer}`)
        const target = list.querySelector(row)
        if (!node || !target || !node.hasAttribute('data-visible')) return Infinity
        return Math.abs(node.getBoundingClientRect().top - target.getBoundingClientRect().top)
      },
      [layer, row],
    )

  await expect
    .poll(() => offset('[data-rf-selection-layer]', '[aria-checked="true"]'))
    .toBeLessThan(1)
  await page.keyboard.press('ArrowDown')
  await expect
    .poll(() => offset('[data-rf-focus-layer]', '[role^="menuitem"]:focus'))
    .toBeLessThan(1)
  const focused = await menu.evaluate((list) => list.querySelector(':focus')?.textContent)
  await page.keyboard.press('ArrowDown')
  await expect
    .poll(() => menu.evaluate((list) => list.querySelector(':focus')?.textContent))
    .not.toBe(focused)
  await expect
    .poll(() => offset('[data-rf-focus-layer]', '[role^="menuitem"]:focus'))
    .toBeLessThan(1)
  assert.equal(
    await menu.locator(':focus').evaluate((row) => getComputedStyle(row).outlineColor),
    'rgba(0, 0, 0, 0)',
  )
})

it('animates the accordion panel height on the first open as on later opens', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/accordion', { motion: true })
  await page
    .locator('.rf-accordion-trigger[aria-expanded="false"]')
    .first()
    .evaluate((button) => button.setAttribute('data-test-trigger', ''))
  const trigger = page.locator('[data-test-trigger]')
  await trigger.scrollIntoViewIfNeeded()
  const panel = page
    .locator('.rf-accordion-item')
    .filter({ has: trigger })
    .locator('.rf-accordion-panel')
  const height = () => panel.evaluate((node) => node.getBoundingClientRect().height)
  // A fifth of the way into its spring, the panel is part of the way to its full height.
  const opensGradually = async (label: string) => {
    await holdMotion(page)
    await trigger.click()
    await seekMotion(panel, 0.2)
    const partway = await height()
    await seekMotion(panel, 1)
    const full = await height()
    await releaseMotion(page)
    assert.ok(full > 0 && partway > 1 && partway < full - 1, `${label}: ${partway} of ${full}`)
  }

  await opensGradually('First open')
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(panel).toHaveCSS('grid-template-rows', '0px')
  await opensGradually('Second open')
})

it('strengthens the command list header line and drops the end line at the bottom', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/command-menu')
  const marked = await page.evaluate(() => {
    const root = Array.from(document.querySelectorAll<HTMLElement>('.rf-command-scroll')).find(
      (node) => {
        const viewport = node.querySelector<HTMLElement>(':scope > .rf-scroll-viewport')
        return (
          node.checkVisibility() &&
          !!viewport &&
          viewport.scrollHeight > viewport.clientHeight + 100 &&
          node.nextElementSibling !== null
        )
      },
    )
    root?.setAttribute('data-test-scroll', '')
    return !!root
  })
  assert.ok(marked, 'Expected a scrollable command list followed by a footer')
  const list = page.locator('[data-test-scroll]')
  const lines = (scrollTop: number) =>
    list.evaluate(async (root, scrollTop) => {
      const viewport = root.querySelector<HTMLElement>(':scope > .rf-scroll-viewport')!
      viewport.scrollTop = scrollTop
      for (let i = 0; i < 3; i++) await new Promise((resolve) => requestAnimationFrame(resolve))
      return {
        top: getComputedStyle(root, '::before').backgroundColor,
        end: getComputedStyle(root, '::after').opacity,
      }
    }, scrollTop)
  const border = await list.evaluate((root) => {
    const probe = document.createElement('span')
    probe.style.color = 'var(--rf-border)'
    root.append(probe)
    const color = getComputedStyle(probe).color
    probe.remove()
    return color
  })

  const rest = await lines(0)
  assert.notEqual(rest.top, border)
  assert.equal(rest.end, '1')
  const scrolled = await lines(80)
  assert.equal(scrolled.top, border)
  const end = await lines(1e6)
  assert.equal(end.end, '0')
})

it('previews a dropdown on hover, keeps it across the gap, and closes it on leave', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/dropdown')
  const trigger = page.getByRole('button', { name: 'Recent' }).locator('visible=true').first()
  await trigger.scrollIntoViewIfNeeded()
  const focused = await page.evaluate(() => document.activeElement?.tagName)
  await trigger.hover()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), focused)
  const row = page.getByRole('menuitem', { name: 'Roadmap' })
  await row.hover()
  await page.waitForTimeout(300)
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const box = (await trigger.boundingBox())!
  await page.mouse.move(box.x - 200, box.y - 200)
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

it('renders a fitting gallery breadcrumb before hydration', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route('**/*', (route) =>
    route.request().resourceType() === 'script' ? route.abort() : route.continue(),
  )
  await open(page, '/', { hydrate: false })
  const trail = page.locator('[data-component="breadcrumb"] .rf-breadcrumb')
  await expect(trail.getByRole('button', { name: 'Show 3 hidden steps' })).toBeVisible()
  await expect(trail.getByRole('link', { name: 'Roadmap.md' })).toBeVisible()
  assert.ok(
    await trail.evaluate((nav) => {
      const list = nav.querySelector(':scope > .rf-breadcrumb-list')!
      return list.scrollWidth <= nav.clientWidth + 1
    }),
  )
})

it('can reopen either gallery breadcrumb menu after switching and selecting', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/')
  const trail = page.locator('[data-component="breadcrumb"] .rf-breadcrumb')
  const ellipsis = trail.getByRole('button', { name: 'Show 3 hidden steps' })
  const drafts = trail.getByRole('button', { name: 'Drafts' })
  const website = trail.getByRole('menuitem', { name: 'Website' })
  const published = trail.getByRole('menuitemradio', { name: 'Published' })

  await ellipsis.hover()
  await expect(ellipsis).toHaveAttribute('aria-expanded', 'true')
  await expect(website).toBeVisible()
  await drafts.hover()
  await expect(drafts).toHaveAttribute('aria-expanded', 'true')
  await expect(published).toBeVisible()
  await expect(ellipsis).toHaveAttribute('aria-expanded', 'false')

  await ellipsis.hover()
  await expect(ellipsis).toHaveAttribute('aria-expanded', 'true')
  await expect(website).toBeVisible()
  await ellipsis.click()
  await website.click()
  await expect(page).toHaveURL(/#website$/)
  await expect(ellipsis).toHaveAttribute('aria-expanded', 'false')

  await drafts.hover()
  await expect(drafts).toHaveAttribute('aria-expanded', 'true')
  await expect(published).toBeVisible()
  await published.click()
  await expect(trail.getByRole('button', { name: 'Published' })).toBeVisible()
  await ellipsis.hover()
  await expect(ellipsis).toHaveAttribute('aria-expanded', 'true')
  await expect(website).toBeVisible()
})

it('glides one hover along the breadcrumb, names cut steps, and collapses on overflow', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/breadcrumb')

  const basic = page.locator('#basic .rf-breadcrumb').first()
  const layer = basic.locator('[data-rf-hover-layer]')
  const items = basic.locator('.rf-breadcrumb-item')
  await items.nth(1).hover()
  await expect(layer).toHaveAttribute('data-visible', '')
  const aligned = () =>
    basic.evaluate((nav) => {
      const layer = nav.querySelector(':scope > [data-rf-hover-layer]')!.getBoundingClientRect()
      const item = nav.querySelector('[data-rf-hovered]')?.getBoundingClientRect()
      return item ? Math.abs(layer.left - item.left) + Math.abs(layer.width - item.width) : Infinity
    })
  await expect.poll(aligned).toBeLessThan(1)
  await items.nth(0).hover()
  await expect.poll(aligned).toBeLessThan(1)

  // A cut step shows its full name in the library tooltip under it, as in the
  // reference; a step that fits shows none.
  const long = page.locator('#long-step-name .rf-breadcrumb-crumb').nth(1)
  const tooltip = page.locator('.rf-tooltip[data-open]')
  await long.hover()
  await expect(tooltip).toHaveText('Quarterly planning and roadmap reviews')
  await expect(tooltip).toHaveAttribute('data-side', 'bottom')
  const tooltipId = await tooltip.getAttribute('id')
  await expect(long).toHaveAttribute('aria-describedby', tooltipId!)
  await expect(long).not.toHaveAttribute('title')
  const below = await page.evaluate(
    ([crumb, tip]) => tip!.getBoundingClientRect().top >= crumb!.getBoundingClientRect().bottom,
    [await long.elementHandle(), await tooltip.elementHandle()],
  )
  assert.ok(below, 'The full name should sit under the step')
  const short = page.locator('#long-step-name .rf-breadcrumb-crumb').first()
  await short.hover()
  await expect(tooltip).toHaveCount(0)
  await page.waitForTimeout(400)
  await expect(tooltip).toHaveCount(0)
  await expect(short).not.toHaveAttribute('aria-describedby')

  // A cut step that opens a menu keeps its tooltip closed while the menu is open.
  const menuStep = page.locator('#open-on-click .rf-breadcrumb [aria-haspopup]')
  await menuStep.evaluate((node) => ((node as HTMLElement).style.maxInlineSize = '60px'))
  await menuStep.hover()
  await expect(tooltip).toHaveText('Components')
  await menuStep.focus()
  await page.keyboard.press('Enter')
  await expect(menuStep).toHaveAttribute('aria-expanded', 'true')
  await expect(tooltip).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.mouse.move(0, 0)

  const frame = page.locator('#collapse-on-overflow .doc-demo-breadcrumb-resize')
  const trail = frame.locator('.rf-breadcrumb-item')
  await frame.evaluate((node) => ((node as HTMLElement).style.inlineSize = '560px'))
  await expect(frame.getByRole('button', { name: /hidden step/ })).toHaveCount(0)
  await expect(trail).toHaveCount(5)
  await frame.evaluate((node) => ((node as HTMLElement).style.inlineSize = '240px'))
  const ellipsis = frame.getByRole('button', { name: /Show \d hidden steps?/ })
  await expect(ellipsis).toHaveCount(1)
  assert.equal(await frame.locator('[aria-current="page"]').textContent(), 'Breadcrumb')
  assert.equal(await trail.first().locator('.rf-breadcrumb-crumb').textContent(), 'Home')
  const fits = await frame.evaluate((node) => {
    const list = node.querySelector('.rf-breadcrumb-list') as HTMLElement
    return list.scrollWidth <= node.querySelector('.rf-breadcrumb')!.clientWidth + 1
  })
  assert.ok(fits, 'The collapsed trail should fit its container')
  await ellipsis.click()
  await expect(page.getByRole('menuitem', { name: 'Workspace' })).toBeVisible()
  // Menus fit their entries, not the fixed 288px Dropdown width.
  const menuWidth = await frame
    .locator('.rf-dropdown-surface:popover-open')
    .evaluate((node) => node.getBoundingClientRect().width)
  assert.ok(menuWidth >= 128 && menuWidth < 200, `menu width ${menuWidth}`)
  await page.keyboard.press('Escape')
  await frame.evaluate((node) => ((node as HTMLElement).style.inlineSize = '560px'))
  await expect(trail).toHaveCount(5)
})

it('grows, merges and splits the checked fill in a CheckboxGroup', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/checkbox-group')
  const group = page.getByRole('group', { name: 'Fruit' }).first()
  const list = group.locator('.rf-choice-group-list')
  const row = (name: string) => group.locator('.rf-choice-group-row', { hasText: name })
  // Each fill block's box, and each checked row's own background.
  const read = () =>
    list.evaluate((node) => {
      const base = node.getBoundingClientRect()
      const box = (element: Element) => {
        const rect = element.getBoundingClientRect()
        return {
          top: Math.round(rect.top - base.top),
          bottom: Math.round(rect.bottom - base.top),
        }
      }
      return {
        blocks: Array.from(node.querySelectorAll('.rf-choice-run:not([data-leaving])'), box),
        rows: Array.from(node.querySelectorAll('.rf-choice-group-row'), box),
        rowFill: Array.from(
          node.querySelectorAll('.rf-choice-group-row:has(input:checked)'),
          (element) => getComputedStyle(element).backgroundColor,
        ),
      }
    })
  const settled = async (spans: [number, number][]) => {
    await expect
      .poll(async () => {
        const { blocks, rows } = await read()
        return blocks
          .map((block) => {
            const span = spans.find(
              ([from, to]) =>
                Math.abs(block.top - rows[from]!.top) <= 1 &&
                Math.abs(block.bottom - rows[to]!.bottom) <= 1,
            )
            return span ? span.join('-') : `${block.top}-${block.bottom}`
          })
          .sort()
          .join(' ')
      })
      .toBe(spans.map((span) => span.join('-')).join(' '))
  }

  // Apples starts checked: one block, and the row draws no fill of its own.
  await settled([[0, 0]])
  assert.deepEqual((await read()).rowFill, ['rgba(0, 0, 0, 0)'])
  const first = await list.locator('.rf-choice-run').elementHandle()

  // Checking the neighbour grows the same block over both rows.
  await row('Bananas').click()
  await settled([[0, 1]])
  assert.ok(await first!.evaluate((node) => node.isConnected))

  // A run that is not adjacent gets its own block.
  await row('Bananas').click()
  await row('Cherries').click()
  await settled([
    [0, 0],
    [2, 2],
  ])

  // Bridging the two runs: the halves meet in the middle of the bridge row,
  // then become one block.
  await row('Bananas').click()
  const meeting = await read()
  const mid = Math.round((meeting.rows[1]!.top + meeting.rows[1]!.bottom) / 2)
  await expect
    .poll(async () => {
      const { blocks } = await read()
      return blocks.length === 2 && blocks.every((b) => b.top === mid || b.bottom === mid)
    })
    .toBe(true)
  await settled([[0, 2]])

  // Unchecking the middle row splits the block back into two.
  await row('Bananas').click()
  await settled([
    [0, 0],
    [2, 2],
  ])
  // Toggling the bridge row mid-flight settles on the final selection.
  const bridgeRow = row('Bananas')
  for (let i = 0; i < 3; i++) await bridgeRow.click({ delay: 0 })
  await settled([[0, 2]])
  await expect(list.locator('.rf-choice-run')).toHaveCount(1)
})

// Headless Chromium refuses pointer lock, so this stands in for a browser
// that grants it: the lock is recorded and announced as a real one would be.
const grantPointerLock = () => {
  let locked: Element | null = null
  Object.defineProperty(Document.prototype, 'pointerLockElement', {
    configurable: true,
    get: () => locked,
  })
  Element.prototype.requestPointerLock = function (this: Element) {
    locked = this
    queueMicrotask(() => document.dispatchEvent(new Event('pointerlockchange')))
    return Promise.resolve()
  } as Element['requestPointerLock']
  Document.prototype.exitPointerLock = function () {
    locked = null
    document.dispatchEvent(new Event('pointerlockchange'))
  }
}

async function pressAlpha(page: Page) {
  const alpha = page
    .locator('.rf-color-field input[aria-label="Alpha"]')
    .locator('visible=true')
    .first()
  const body = alpha.locator('xpath=..')
  await body.scrollIntoViewIfNeeded()
  const box = (await body.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  return {
    alpha,
    moveTo: (dx: number) => page.mouse.move(x + dx, y, { steps: 5 }),
  }
}

it('scrubs a color channel with a locked pointer and a virtual cursor', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.addInitScript(grantPointerLock)
  await open(page, '/docs/color-picker')
  const cursor = page.locator('.rf-scrub-cursor')
  const { alpha, moveTo } = await pressAlpha(page)
  await moveTo(-10)
  // The OS cursor is locked and hidden; a drawn ↔ arrow stands in for it.
  await expect.poll(() => page.evaluate(() => !!document.pointerLockElement)).toBe(true)
  await expect(cursor).toBeVisible()
  const start = (await cursor.boundingBox())!
  await moveTo(-30)
  // 30px of travel, less the one move that crossed into the lock.
  const percent = async () => Number.parseInt(await alpha.inputValue(), 10)
  await expect.poll(percent).toBeLessThanOrEqual(72)
  assert.ok((await percent()) >= 68)
  const moved = (await cursor.boundingBox())!
  assert.ok(moved.x < start.x - 15, 'The virtual cursor should follow the drag')
  await page.mouse.up()
  await expect(cursor).toBeHidden()
  assert.equal(await page.evaluate(() => !!document.pointerLockElement), false)
  const settled = await percent()
  assert.ok(settled >= 68 && settled <= 72, `scrubbed to ${settled}%`)
  await expect(alpha).not.toBeFocused()
})

// Whether a headless browser grants pointer lock differs by platform, so this
// refuses it outright, as a browser does when the page may not lock.
const refusePointerLock = () => {
  Element.prototype.requestPointerLock = function () {
    queueMicrotask(() => document.dispatchEvent(new Event('pointerlockerror')))
    return Promise.reject(new DOMException('Pointer lock refused', 'NotSupportedError'))
  } as Element['requestPointerLock']
}

it('keeps scrubbing on the OS cursor when the pointer lock is refused', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.addInitScript(refusePointerLock)
  await open(page, '/docs/color-picker')
  const { alpha, moveTo } = await pressAlpha(page)
  await moveTo(-30)
  await expect(alpha).toHaveValue('70%')
  await expect(page.locator('.rf-scrub-cursor')).toBeHidden()
  await page.mouse.up()
  await expect(alpha).toHaveValue('70%')
})

it('glides earlier chat messages up when a new one is sent', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await open(page, '/docs/input-message', { motion: true })
  const box = page.locator('.doc-composer-preview textarea').first()
  await box.scrollIntoViewIfNeeded()
  for (let i = 1; i <= 7; i++) {
    await box.fill(`Message ${i}`)
    await box.press('Enter')
  }
  // A message glides once its own entrance has finished.
  const earlier = page.locator('.rf-chat-message', { hasText: /^Message 6$/ })
  await expect
    .poll(() =>
      earlier.evaluate((node) => node.getAnimations().map((animation) => animation.playState)),
    )
    .not.toContain('running')
  const top = () => earlier.evaluate((node) => node.getBoundingClientRect().top)
  const before = await top()

  await holdMotion(page)
  await box.fill('Message 8')
  await box.press('Enter')
  await page.locator('.rf-chat-message', { hasText: /^Message 8$/ }).waitFor()
  // A glide restarts on the next frame if the transcript scrolled under it.
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  )
  const frames = []
  for (const progress of [0, 0.2, 1]) {
    await seekMotion(earlier, progress)
    frames.push(await top())
  }
  const [start, middle, end] = frames as [number, number, number]
  // From where it showed, through the space between, rather than in one jump.
  // A spring, it is most of the way there a fifth of the way through.
  assert.ok(Math.abs(start - before) < 1, `starts where it was: ${before} → ${frames}`)
  assert.ok(end < before - 20, `moves up: ${frames}`)
  assert.ok(middle < start - 4 && middle > end + 4, `passes between: ${frames}`)
  // It lands where the glide ended, without the transcript snapping back.
  await releaseMotion(page)
  await expect.poll(top).toBeCloseTo(end, 0)
})

it('fills the InputMessage playground and demo with the conversation, composer at the bottom', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/input-message')
  const stage = page.locator('.doc-preview-stage[data-playground][data-component="input-message"]')
  const edges = (frame: string) =>
    page
      .locator(frame)
      .first()
      .evaluate((node) => {
        const box = node.getBoundingClientRect()
        const transcript = node.querySelector('.rf-chat-layout-body')!.getBoundingClientRect()
        const composer = node.querySelector('.rf-composer')!.getBoundingClientRect()
        return {
          top: Math.round(transcript.top - box.top),
          bottom: Math.round(box.bottom - composer.bottom),
          height: Math.round(box.height),
        }
      })
  // As in the reference: 16px from the stage's top and bottom edges.
  await stage.scrollIntoViewIfNeeded()
  const playground = await edges(
    '.doc-preview-stage[data-playground][data-component="input-message"]',
  )
  assert.deepEqual(playground, { top: 16, bottom: 16, height: 560 })

  // The demo's conversation column is the reference's 480px, inside the card.
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 900 })
    await open(page, '/demo?c=input-message')
    const fits = await page.locator('.site-demo-card').evaluate((card) => {
      const column = card.querySelector('.doc-composer-preview')!.getBoundingClientRect()
      const footer = card.querySelector('.site-preview-footer')!.getBoundingClientRect()
      return {
        height: Math.round(column.height),
        inside: column.bottom <= footer.top,
      }
    })
    assert.deepEqual(fits, { height: 480, inside: true }, `at ${width}px`)
  }
})

it('anchors docs previews 48px below the header, as the reference does', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const offset = (frame: string, target: string) =>
    page.locator(frame).evaluate((stage, target) => {
      const box = stage.getBoundingClientRect()
      const node = stage.querySelector(target)!.getBoundingClientRect()
      return {
        x: Math.round(node.left - box.left),
        y: Math.round(node.top - box.top),
      }
    }, target)

  // A collapsing example stays in place: the stage hugs it instead of centering it.
  await open(page, '/docs/thinking-steps')
  const stage = '#basic .doc-preview-stage'
  const summary = page.locator('#basic .rf-thinking-steps-disclosure > summary')
  assert.equal((await offset(stage, '.rf-thinking-steps')).y, 48)
  const expanded = await offset(stage, '.rf-thinking-steps-disclosure > summary')
  await summary.click()
  await page.locator('#basic .rf-thinking-steps-disclosure:not([open])').waitFor()
  assert.equal((await offset(stage, '.rf-thinking-steps-disclosure > summary')).y, expanded.y)

  // A one-line example gets the reference's 120px stage, not a tall centered one.
  await open(page, '/docs/breadcrumb')
  assert.equal((await offset('#basic .doc-preview-stage', 'nav')).y, 48)
  assert.ok(
    (await page
      .locator('#basic .doc-preview-stage')
      .evaluate((n) => n.getBoundingClientRect().height)) < 140,
  )

  // A command menu stage is the reference's: its 360px panel plus the
  // stage's own padding, with no second layer of padding around it.
  await open(page, '/docs/command-menu')
  assert.equal((await offset('#basic .doc-preview-stage', '.rf-command')).y, 48)
  assert.equal(
    await page
      .locator('#basic .doc-preview-stage')
      .evaluate((n) => n.getBoundingClientRect().height),
    456,
  )

  // The accordion playground supplies its own inset in the reference.
  await open(page, '/docs/accordion')
  const accordion = '.doc-preview-stage[data-playground][data-component="accordion"]'
  assert.deepEqual(await offset(accordion, '.doc-example-content'), {
    x: 24,
    y: 40,
  })
  await page.locator(accordion).getByRole('button', { name: 'Styling', exact: true }).click()
  assert.equal((await offset(accordion, '.rf-accordion')).y, 40)
  await page.setViewportSize({ width: 390, height: 844 })
  assert.deepEqual(await offset(accordion, '.doc-example-content'), {
    x: 16,
    y: 40,
  })
  await page.setViewportSize({ width: 1280, height: 900 })

  // Pickers start at the top so their popups expanded downward.
  await open(page, '/docs/date-picker')
  assert.deepEqual(await offset('.doc-preview-stage[data-playground]', 'button'), { x: 24, y: 64 })
  await open(page, '/docs/calendar')
  assert.equal((await offset('.doc-preview-stage[data-playground]', '[role="grid"]')).y, 88)
})

it('lays out calendar headers like the reference for one, side-by-side and stacked months', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/calendar')
  const layout = (example: string) =>
    page.locator(`#${example} .rf-calendar`).evaluate((calendar) =>
      Array.from(calendar.querySelectorAll('.rf-calendar-month'), (month) => {
        const box = (node: Element | null) => node?.getBoundingClientRect()
        const grid = box(month.querySelector('tbody tr:first-child td:not(.rf-calendar-week)'))!
        const row = box(month.querySelector('tbody tr:first-child'))!
        const days = { left: grid.left, right: row.right }
        const title = box(month.querySelector('.rf-calendar-months-label'))!
        const previous = box(month.querySelector('[aria-label="Previous month"]'))
        const next = box(month.querySelector('[aria-label="Next month"]'))
        return {
          titleCenter: Math.round(title.left + title.width / 2 - (days.left + days.right) / 2),
          titleLeft: Math.round(title.left - days.left),
          previous: previous ? Math.round(previous.left - days.left) : null,
          next: next ? Math.round(days.right - next.right) : null,
          nextAfterPrevious: !!previous && !!next && next.left >= previous.right,
          arrowsAfterTitle: !!previous && previous.left >= title.right,
        }
      }),
    )

  // Side by side: titles centered over their days, previous at the far left,
  // next at the far right.
  const range = await layout('range')
  assert.equal(range.length, 2)
  for (const month of range) assert.ok(Math.abs(month.titleCenter) <= 1, JSON.stringify(month))
  assert.equal(range[0]!.previous, 0)
  assert.equal(range[0]!.next, null)
  assert.equal(range[1]!.previous, null)
  assert.equal(range[1]!.next, 0)

  // One month and stacked months: title left, both arrows together after it.
  for (const example of ['single', 'stacked-months']) {
    const [first, ...rest] = await layout(example)
    assert.ok(first!.arrowsAfterTitle && first!.nextAfterPrevious, example)
    assert.equal(first!.next, 0, example)
    for (const month of rest) assert.deepEqual([month.previous, month.next], [null, null], example)
  }
})

it('shows stacked months under one weekday row with up and down arrows, as the reference does', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/calendar')
  const stacked = await page.locator('#stacked-months .rf-calendar').evaluate((calendar) => {
    const weeks = Array.from(calendar.querySelectorAll('.rf-calendar-grid tbody tr:first-child'))
    const origin = weeks[0]!.getBoundingClientRect().top
    const at = (node: Element | null) => Math.round(node!.getBoundingClientRect().top - origin)
    const rows = Array.from(calendar.querySelectorAll('.rf-calendar-weekdays'))
    const headers = Array.from(calendar.querySelectorAll('.rf-calendar-grid thead'))
    const titles = Array.from(calendar.querySelectorAll('.rf-calendar-header'))
    const turn = (direction: string) =>
      getComputedStyle(calendar.querySelector(`[data-direction="${direction}"] svg`)!).rotate
    return {
      rows: rows.length,
      rowHidden: rows[0]?.getAttribute('aria-hidden'),
      rowTop: at(rows[0] ?? null),
      titleTops: titles.map(at),
      secondWeek: at(weeks[1] ?? null),
      headersShown: headers.filter((head) => head.getBoundingClientRect().height > 1).length,
      headerCells: calendar.querySelectorAll('.rf-calendar-grid thead th').length,
      // Stacked months page up and down: previous's left chevron turns to
      // point up, next's right chevron to point down.
      turns: [turn('previous'), turn('next')],
    }
  })
  // The reference: weekdays 84px above the first week, a title row 40px
  // above it, the next month's title 196px below it and its first week 236px.
  assert.deepEqual(stacked, {
    rows: 1,
    rowHidden: 'true',
    rowTop: -84,
    titleTops: [-40, 196],
    secondWeek: 236,
    headersShown: 0,
    headerCells: 14,
    turns: ['90deg', '90deg'],
  })

  // Side by side keeps a weekday header in each month.
  const sideBySide = await page.locator('#range .rf-calendar').evaluate((calendar) => ({
    rows: calendar.querySelectorAll('.rf-calendar-weekdays').length,
    headersShown: Array.from(calendar.querySelectorAll('.rf-calendar-grid thead')).filter(
      (head) => head.getBoundingClientRect().height > 1,
    ).length,
  }))
  assert.deepEqual(sideBySide, { rows: 0, headersShown: 2 })
})

it('fills the proposed range end like a selected day, with a faint inner ring', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
  await open(page, '/docs/calendar?theme=dark')
  const calendar = page.locator('#range .rf-calendar')
  const day = (label: string) => calendar.getByRole('button', { name: label, exact: false }).first()
  await day('November 10').click()
  await day('November 26').hover()
  const end = calendar.locator('.rf-calendar-preview-end')
  await expect(end).toHaveAttribute('data-visible', '')
  const look = await calendar.evaluate((node) => {
    const layer = node.querySelector<HTMLElement>('.rf-calendar-preview-end')!
    const target = node.querySelector<HTMLElement>('.rf-calendar-day[data-rf-selected]')!
    const start = node.querySelector<HTMLElement>('.rf-calendar-day[data-selected]')!
    const ring = getComputedStyle(layer, '::before')
    const a = layer.getBoundingClientRect()
    const b = target.getBoundingClientRect()
    return {
      // The same solid fill and text as the selected start day.
      fill: getComputedStyle(layer).backgroundColor === getComputedStyle(start).backgroundColor,
      text: getComputedStyle(target).color === getComputedStyle(start).color,
      shadow: getComputedStyle(layer).boxShadow,
      ring: [ring.borderTopWidth, ring.inset, ring.opacity],
      onDay: Math.abs(a.left - b.left) + Math.abs(a.top - b.top) < 1,
      label: target.textContent?.trim(),
    }
  })
  assert.deepEqual(look, {
    fill: true,
    text: true,
    shadow: 'none',
    ring: ['1px', '1px', '0.4'],
    onDay: true,
    label: '26',
  })
})

it('sends a queued message up into the card’s conversation and restores the queue after', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1440, height: 900 })
  // The card resets on a timer; the test moves the clock on rather than waiting.
  await page.clock.install()
  await open(page, '/?theme=dark')
  const card = page.locator('.site-gallery [data-component="queued-stack"]')
  await card.scrollIntoViewIfNeeded()
  const rows = card.locator('.rf-queue > li')
  await expect(rows).toHaveCount(3)
  // The queue's bottom edge, measured from the card's.
  const queueBottom = () =>
    card
      .locator('.rf-queue-wrap')
      .evaluate((node) =>
        Math.round(
          node.closest('article')!.getBoundingClientRect().bottom -
            node.getBoundingClientRect().bottom,
        ),
      )
  const docked = await queueBottom()
  // Hovering brings the button into view first, so the click itself scrolls nothing.
  const send = rows.first().getByRole('button', { name: 'Send' })
  await send.hover()
  const pageTop = await page.evaluate(() => scrollY)

  await send.click()
  const sent = card.getByRole('log', { name: 'Sent messages' }).getByText('Draft an intro')
  await expect(sent).toBeVisible()
  await expect(rows).toHaveCount(2)
  // The message lands above the queue, which stays docked at the bottom.
  const above = await sent.evaluate(
    (node, queueTop) => node.getBoundingClientRect().bottom <= queueTop,
    await card.locator('.rf-queue-wrap').evaluate((node) => node.getBoundingClientRect().top),
  )
  assert.ok(above, 'the sent message sits above the queue')
  assert.equal(await queueBottom(), docked)
  assert.equal(await page.evaluate(() => scrollY), pageTop, 'sending leaves the page where it was')

  // While the pointer stays, nothing resets; once it leaves, the card returns to how it began.
  await page.clock.runFor(3000)
  await expect(rows).toHaveCount(2)
  await page.mouse.move(5, 5)
  await page.clock.runFor(3000)
  await expect(rows).toHaveCount(3)
  await expect(card.locator('.rf-chat-message')).toHaveCount(0)
})
