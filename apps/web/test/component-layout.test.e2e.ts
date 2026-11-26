import type { Page } from 'playwright'
import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { pauseClock } from './clock.ts'
import { holdMotion, releaseMotion, seekMotion } from './motion.ts'
import { open, showcaseServer } from './showcase-router.ts'
it('moves the inline menu focus ring and preserves its forced-colors fallback', async (t) => {
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
  await page.clock.install()
  await open(page, '/docs/dropdown')
  await pauseClock(page)
  const trigger = page.getByRole('button', { name: 'Recent' }).locator('visible=true').first()
  await trigger.scrollIntoViewIfNeeded()
  const focused = await page.evaluate(() => document.activeElement?.tagName)
  await trigger.hover()
  await page.clock.runFor(400)
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), focused)
  const row = page.getByRole('menuitem', { name: 'Roadmap' })
  await row.hover()
  await page.clock.runFor(400)
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const box = (await trigger.boundingBox())!
  await page.mouse.move(box.x - 200, box.y - 200)
  await page.clock.runFor(400)
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

it('renders a fitting gallery breadcrumb before hydration', async (t) => {
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, '/')
  const trail = page.locator('[data-component="breadcrumb"] .rf-breadcrumb')
  const ellipsis = trail.getByRole('button', { name: 'Show 2 hidden steps' })
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
  const page = await t.serve(showcaseServer)
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
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  )
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
  const page = await t.serve(showcaseServer)
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
  const setLocked = (element: Element | null) => {
    locked = element
  }
  Object.defineProperty(Document.prototype, 'pointerLockElement', {
    configurable: true,
    get: () => locked,
  })
  Element.prototype.requestPointerLock = function (this: Element) {
    setLocked(this)
    queueMicrotask(() => document.dispatchEvent(new Event('pointerlockchange')))
    return Promise.resolve()
  } as Element['requestPointerLock']
  Document.prototype.exitPointerLock = function () {
    setLocked(null)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
})

it('anchors docs previews 48px below the header, as the reference does', async (t) => {
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
