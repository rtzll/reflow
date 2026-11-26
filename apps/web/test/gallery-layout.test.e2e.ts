import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { galleryOrder } from '../app/ui/site.tsx'
import { pauseClock } from './clock.ts'
import { open, showcaseServer } from './showcase-router.ts'

it('preserves the gallery order and keeps previews above their footers', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const gallery = page.locator('.site-gallery')
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await open(page, '/?theme=dark')
    await gallery.getByRole('link', { name: 'View DatePicker documentation' }).waitFor()
    assert.deepEqual(
      await gallery
        .locator(':scope > article')
        .evaluateAll((tiles) => tiles.map((tile) => tile.dataset.component)),
      galleryOrder,
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
    const tile = (slug: string) =>
      gallery.locator(`article[data-component="${slug}"]`).boundingBox()
    const [
      markdown,
      citation,
      toaster,
      timeGrid,
      chart,
      codeBlock,
      diffView,
      breadcrumb,
      segmented,
    ] = await Promise.all(
      [
        'markdown',
        'citation',
        'toaster',
        'time-grid',
        'bar-chart',
        'code-block',
        'diff-view',
        'breadcrumb',
        'segmented-control',
      ].map(tile),
    )
    const rowGap = await gallery.evaluate((node) => parseFloat(getComputedStyle(node).rowGap))
    assert.equal(timeGrid!.y, toaster!.y + toaster!.height + rowGap)
    assert.equal(codeBlock!.y, chart!.y + chart!.height + rowGap)
    assert.equal(diffView!.y, codeBlock!.y + codeBlock!.height + rowGap)
    assert.equal(diffView!.width, codeBlock!.width)
    if (width >= 768) {
      assert.equal(citation!.y, markdown!.y)
      assert.equal(timeGrid!.y, chart!.y)
      assert.equal(timeGrid!.x, codeBlock!.x)
      assert.equal(chart!.x + chart!.width, codeBlock!.x + codeBlock!.width)
      assert.ok(Math.abs(timeGrid!.width - chart!.width) < 1)
      assert.equal(breadcrumb!.y, segmented!.y)
      assert.equal(breadcrumb!.x, codeBlock!.x)
      assert.equal(segmented!.x + segmented!.width, codeBlock!.x + codeBlock!.width)
      assert.ok(Math.abs(breadcrumb!.width - segmented!.width) < 1)
    } else {
      assert.equal(timeGrid!.x, chart!.x)
      assert.equal(chart!.y, timeGrid!.y + timeGrid!.height + rowGap)
      assert.equal(breadcrumb!.x, segmented!.x)
      assert.equal(segmented!.y, breadcrumb!.y + breadcrumb!.height + rowGap)
    }
    const buildChart = gallery.getByRole('group', { name: 'Seconds by build stage' })
    await expect(buildChart.locator('.rf-bar-chart-ticks span')).toHaveText([
      'Compile',
      'Test',
      'Bundle',
      'Pack',
    ])
    const { gap, horizontal, offset } = await buildChart.evaluate((chart) => {
      const bars = chart.querySelectorAll('.rf-bar-chart-fill')
      const labels = Array.from(chart.querySelectorAll('.rf-bar-chart-ticks span'), (tick) => {
        const range = document.createRange()
        range.selectNodeContents(tick)
        return range.getBoundingClientRect()
      })
      const center = (rect: DOMRect) => rect.left + rect.width / 2
      return {
        gap: Math.min(...labels.slice(1).map((label, i) => label.left - labels[i]!.right)),
        horizontal: labels.every((label) => label.width > label.height),
        offset: Math.max(
          ...labels.map((label, i) =>
            Math.abs(center(label) - center(bars[i]!.getBoundingClientRect())),
          ),
        ),
      }
    })
    assert.ok(horizontal, `chart labels stay horizontal at ${width}px`)
    assert.ok(gap >= 6, `chart label gap at ${width}px is ${gap}px`)
    assert.ok(offset < 1, `chart label is ${offset}px off its bar center at ${width}px`)
    if (width === 1440) {
      await expect(
        gallery.locator('[data-component="ask-user-questions"]').getByText('Question 1 of 8'),
      ).toBeVisible()
      const [card, dialog, datePicker, wideCalendar, timeField, thinking] = await Promise.all(
        ['card', 'alert-dialog', 'date-picker', 'calendar', 'time-field', 'thinking-steps'].map(
          tile,
        ),
      )
      assert.equal(card!.y, dialog!.y)
      assert.equal(datePicker!.y, wideCalendar!.y)
      assert.ok(datePicker!.x < wideCalendar!.x)
      assert.equal(timeField!.y, thinking!.y)
      assert.ok(timeField!.x < thinking!.x)
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
      // Wide cards alternate sides down the gallery: the tall Carousel on the
      // right of the first band and Toaster on the left of the next row.
      const sides = await gallery.evaluate((node) => {
        const left = node.getBoundingClientRect().left
        return Array.from(
          node.querySelectorAll<HTMLElement>(':scope > article[data-wide]'),
          (card) => (card.getBoundingClientRect().left - left < 50 ? 'L' : 'R'),
        ).join('')
      })
      assert.equal(sides, 'RLLRLRLRLRLRLRL')
      // The first band: QueuedStack and HoverCard stacked beside the Carousel.
      const [carousel, queue, hover, avatar] = await Promise.all(
        ['carousel', 'queued-stack', 'hover-card', 'avatar'].map(tile),
      )
      assert.equal(queue!.y, carousel!.y)
      assert.ok(queue!.x < carousel!.x)
      assert.equal(hover!.x, queue!.x)
      assert.ok(hover!.y > queue!.y)
      assert.equal(Math.round(carousel!.y + carousel!.height), Math.round(hover!.y + hover!.height))
      assert.equal(toaster!.y, avatar!.y)
      assert.ok(toaster!.y > carousel!.y)
      assert.ok(avatar!.x > toaster!.x)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
  await open(page, '/docs/queued-stack')
  const pile = page.getByRole('list', { name: 'Queued messages' })
  const height = (await pile.boundingBox())!.height
  await pile.hover()
  assert.ok((await pile.boundingBox())!.height > height * 2)
  await page.getByRole('button', { name: '3 queued messages' }).click()
  const rows = pile.locator('li')
  const { first, last } = await pile.evaluate((list) => {
    const items = list.querySelectorAll('li')
    const box = (el: Element) => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height }
    }
    return { first: box(items[0]!), last: box(items[items.length - 1]!) }
  })
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
  const context = await page
    .context()
    .browser()!
    .newContext({
      baseURL: showcaseServer.baseUrl,
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
