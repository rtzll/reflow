import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router, waitForShowcase } from './showcase-router.ts'

it('preserves the gallery order and keeps previews above their footers', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const expected = [
    'input-message',
    'thinking-indicator',
    'color-picker',
    'switch',
    'combobox',
    'card',
    'select',
    'command-menu',
    'tooltip',
    'badge',
    'sidebar',
    'radio-group',
    'chat-message',
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
    'carousel-dots',
    'button',
    'table',
    'dialog',
    'calendar',
    'date-picker',
  ]
  const gallery = page.locator('.site-gallery')
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/?theme=dark')
    await gallery.getByRole('link', { name: 'View DatePicker documentation' }).waitFor()
    assert.deepEqual(
      await gallery
        .locator(':scope > article')
        .evaluateAll((tiles) => tiles.map((tile) => tile.dataset.component)),
      expected,
    )
    assert.equal(await gallery.locator('[data-component="card"] .rf-card').count(), 4)
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
      const accordion = gallery.locator('[data-component="accordion"]')
      await accordion.getByRole('button', { name: 'Accessibility', exact: true }).click()
      await checkContainment()
    }
  }
  const datePicker = gallery.locator('[data-component="date-picker"]')
  await datePicker.getByRole('button', { name: 'Clear date', exact: true }).click()
  const trigger = datePicker.getByRole('button', { name: 'Start date: Pick a date', exact: true })
  assert.ok(await trigger.evaluate((button) => document.activeElement === button))
  await trigger.press('Enter')
  await datePicker.getByRole('dialog', { name: 'Start date' }).waitFor()
})

it('uses one hover fill for grouped inputs and places the Volume preview above the track', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/?theme=dark')
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
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/?theme=dark')
  const banner = page.locator('.site-gallery [data-component="banner"]')
  const dismiss = banner.getByRole('button', { name: 'Dismiss' })
  await dismiss.click()
  await dismiss.waitFor({ state: 'hidden', timeout: 1000 })
  await dismiss.waitFor({ state: 'visible', timeout: 2500 })

  const dropdown = page.getByRole('menu', { name: 'Component features' })
  const initial = dropdown.getByRole('menuitemcheckbox', { name: 'Spring animations' })
  const feature = dropdown.getByRole('menuitemcheckbox', { name: 'Font weight shifts' })
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
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/?theme=dark')
  const tile = page.locator('.site-gallery [data-component="switch"]')
  const input = tile.getByRole('switch', { name: 'Sound effects', exact: true })
  await input.hover()
  const track = tile
    .locator('.rf-switch')
    .filter({ has: page.getByRole('switch', { name: 'Sound effects', exact: true }) })
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
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/queued-stack')
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
  await page.mouse.move(last.x + 30, last.y + last.height / 2 + 4, { steps: 8 })
  assert.match((await rows.last().textContent()) ?? '', /Draft a short intro/)
  await page.mouse.up()
  await rows
    .last()
    .getByRole('button', { name: /move message .* up/i })
    .press('Enter')
  assert.match((await rows.nth(1).textContent()) ?? '', /Draft a short intro/)
})

it('caps a long searchable dropdown while leaving its lower options reachable', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1200, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/dropdown#searchable-menu')
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

  await page.goto('/docs/dropdown#submenus')
  await page.getByRole('button', { name: 'Q3 report.pdf' }).click()
  const parent = page.getByRole('menuitem', { name: 'Move to' })
  await parent.hover()
  const inbox = page.getByRole('menuitem', { name: 'Inbox', exact: true })
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
  await mobile.goto('/docs/queued-stack')
  await waitForShowcase(mobile)
  const pile = mobile.getByRole('list', { name: 'Queued messages' })
  const height = (await pile.boundingBox())!.height
  await pile.getByText('Draft a short intro', { exact: true }).tap()
  await mobile.getByRole('button', { name: 'Collapse queue' }).waitFor()
  assert.ok((await pile.boundingBox())!.height > height * 2)
  await mobile.getByRole('button', { name: 'Collapse queue' }).tap()
  assert.equal((await pile.boundingBox())!.height, height)

  await mobile.goto('/docs/dropdown#submenus')
  await waitForShowcase(mobile)
  await mobile.getByRole('button', { name: 'Q3 report.pdf' }).tap()
  await mobile.getByRole('menuitem', { name: 'Move to' }).tap()
  await mobile.getByRole('menuitem', { name: 'Inbox', exact: true }).waitFor()
  await mobile.touchscreen.tap(5, 5)
  await mobile.locator('.rf-dropdown-surface:popover-open').first().waitFor({ state: 'hidden' })

  await mobile.goto('/docs/date-picker?density=compact')
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
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/dropdown#basic')
  await waitForShowcase(page)
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

it('marks the checked color format and moves a focus ring between formats', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/color-picker')
  await waitForShowcase(page)
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
  await page.goto('/docs/accordion')
  await waitForShowcase(page)
  await page
    .locator('.rf-accordion-trigger[aria-expanded="false"]')
    .first()
    .evaluate((button) => button.setAttribute('data-test-trigger', ''))
  const trigger = page.locator('[data-test-trigger]')
  await trigger.scrollIntoViewIfNeeded()
  const sample = () =>
    trigger.evaluate(async (button) => {
      const panel = button.closest('.rf-accordion-item')!.querySelector('.rf-accordion-panel')!
      const heights: number[] = []
      ;(button as HTMLElement).click()
      for (let i = 0; i < 30; i++) {
        await new Promise((resolve) => requestAnimationFrame(resolve))
        heights.push(Math.round(panel.getBoundingClientRect().height))
      }
      return heights
    })
  const animates = (heights: number[]) => {
    const final = heights.at(-1)!
    return final > 0 && heights.some((height) => height > 0 && height < final - 1)
  }

  const first = await sample()
  assert.ok(animates(first), `First open did not animate: ${first.join(' ')}`)
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await page.waitForTimeout(400)
  const second = await sample()
  assert.ok(animates(second), `Second open did not animate: ${second.join(' ')}`)
})

it('strengthens the command list header line and drops the end line at the bottom', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/command-menu')
  await waitForShowcase(page)
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
  await page.goto('/docs/dropdown')
  await waitForShowcase(page)
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

it('glides one hover along the breadcrumb, names cut steps, and collapses on overflow', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/breadcrumb')
  await waitForShowcase(page)

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

  const long = page.locator('#long-step-name .rf-breadcrumb-crumb').nth(1)
  await long.hover()
  await expect(long).toHaveAttribute('title', 'Quarterly planning and roadmap reviews')
  const short = page.locator('#long-step-name .rf-breadcrumb-crumb').first()
  await short.hover()
  await expect(short).not.toHaveAttribute('title')

  const frame = page.locator('#collapse-on-overflow .doc-demo-breadcrumb-resize')
  const trail = frame.locator('.rf-breadcrumb-item')
  await frame.evaluate((node) => ((node as HTMLElement).style.inlineSize = '560px'))
  await expect(frame.getByRole('button', { name: /hidden step/ })).toHaveCount(0)
  await expect(trail).toHaveCount(5)
  await frame.evaluate((node) => ((node as HTMLElement).style.inlineSize = '240px'))
  const ellipsis = frame.getByRole('button', { name: /Show \d hidden steps?/ })
  await expect(ellipsis).toHaveCount(1)
  assert.equal(await frame.locator('[aria-current="page"]').textContent(), 'Breadcrumb')
  assert.equal(await trail.first().textContent(), 'Home')
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
