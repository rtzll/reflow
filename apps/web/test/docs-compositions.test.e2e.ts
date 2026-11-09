import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router } from './showcase-router.ts'

it('lets external question controls load, navigate, and clear answer state', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  const hydration = Promise.withResolvers<void>()
  await page.route(/\/doc-preview(?:\.@[^.]+)?\.tsx(?:\?.*)?$/, async (route) => {
    await hydration.promise
    await route.continue()
  })
  const example = page.locator('#controlled .doc-preview')
  const loadSample = example.getByRole('button', { name: 'Load sample answer' })
  try {
    await page.goto('/docs/ask-user-questions', { waitUntil: 'commit' })
    await loadSample.waitFor()
    assert.ok(await loadSample.isDisabled())
  } finally {
    hydration.resolve()
  }
  await loadSample.click()
  assert.ok(await example.getByRole('radio', { name: 'Engineer', exact: true }).isChecked())
  await example.getByRole('tab', { name: 'Tool', exact: true }).click()
  await example.getByRole('radio', { name: 'Figma', exact: true }).click()
  await example.getByRole('tab', { name: 'Role', exact: true }).click()
  assert.ok(await example.getByRole('radio', { name: 'Engineer', exact: true }).isChecked())
  const state = await example.locator('.doc-controlled-state pre').textContent()
  assert.ok(state?.includes('eng'))
  assert.ok(state?.includes('figma'))
  await example.getByRole('button', { name: 'Clear answers' }).click()
  assert.equal(await example.locator('.doc-controlled-state pre').textContent(), '{}')
  assert.equal(
    await example.getByRole('radio', { name: 'Engineer', exact: true }).isChecked(),
    false,
  )
})

it('streams reasoning text, replays it, and displays local images and expandable sources', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/thinking-steps')
  const basic = page.locator('#basic .rf-thinking-steps-disclosure')
  const trigger = basic.locator(':scope > summary')
  const nested = basic.getByText('Explored 6 files', { exact: true })
  assert.ok(await nested.isVisible())
  await nested.click()
  await basic.getByText('Read accordion.tsx', { exact: true }).waitFor()
  await trigger.press('Space')
  await nested.waitFor({ state: 'hidden' })
  await trigger.press('Space')
  await basic.getByText('Read accordion.tsx', { exact: true }).waitFor()

  const stream = page.locator('#streaming-text .doc-preview')
  await stream.locator('.doc-streaming-text').scrollIntoViewIfNeeded()
  await page.waitForFunction(
    () =>
      document.querySelector('#streaming-text .doc-streaming-text')?.getAttribute('aria-busy') ===
      'false',
  )
  const text = await stream.locator('.doc-streaming-text').textContent()
  assert.ok((text?.length ?? 0) > 100)
  await stream.getByRole('button', { name: 'Replay example' }).click()
  assert.equal(await stream.locator('.doc-streaming-text').getAttribute('aria-busy'), 'true')

  await page.getByRole('heading', { name: 'With Images', exact: true }).scrollIntoViewIfNeeded()
  const image = page.locator('#with-images .rf-thinking-step-image img')
  await image.waitFor()
  await page.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>(
      '#with-images .rf-thinking-step-image img',
    )
    return image?.complete && image.naturalWidth > 0
  })
  assert.equal(await image.getAttribute('alt'), 'Reflow component showcase preview')
  const sources = page.locator('#sources-and-details .doc-research-content')
  await sources.locator('summary').click()
  await sources.getByText('Component anatomy', { exact: true }).waitFor()

  const custom = page.locator('#custom-content .rf-thinking-steps')
  await custom.locator('summary').press('Space')
  await custom.getByText('Build verified', { exact: true }).waitFor({ state: 'hidden' })
  await custom.locator('summary').press('Enter')
  await custom.getByText('Build verified', { exact: true }).waitFor()
})

it('keeps workspace switching, project creation and profile controls functional inside the sidebar composition', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/sidebar')
  const example = page.locator('#workspace-composition .doc-preview')
  await example.getByRole('button', { name: 'Acme Inc', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Design Studio', exact: true }).click()
  await example.getByRole('button', { name: 'Design Studio', exact: true }).waitFor()
  await example.getByRole('button', { name: 'New project', exact: true }).click()
  const project = page.getByRole('dialog', { name: 'New project', exact: true })
  await project.getByLabel('Project name', { exact: true }).fill('Launch')
  await project.getByRole('button', { name: 'Create project', exact: true }).click()
  await example.getByRole('heading', { name: 'Launch', exact: true }).waitFor()
  await example.locator('.rf-sidebar-toolbar').getByText('Design Studio / Launch').waitFor()
  assert.ok((await example.locator('.rf-sidebar-nav a').filter({ hasText: 'Launch' }).count()) > 0)
  await example.getByRole('button', { name: 'Alex Morgan', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Profile settings', exact: true }).click()
  const profile = page.getByRole('dialog', { name: 'Profile settings', exact: true })
  await profile.getByLabel('Display name', { exact: true }).fill('Sam')
  await profile.getByRole('button', { name: 'Done', exact: true }).click()
  await example.getByRole('button', { name: 'Sam', exact: true }).waitFor()
})

it('streams thinking steps on the reference schedule and ends the connector with the text', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/thinking-steps')
  // When each step appears and when every step completes, from the page clock.
  await page.evaluate(() => {
    const marks: number[] = []
    ;(window as unknown as { marks: number[] }).marks = marks
    let seen = 0
    let done = false
    const tick = () => {
      const steps = document.querySelectorAll('#streaming .rf-thinking-timeline > li')
      if (steps.length > seen) {
        seen = steps.length
        marks.push(performance.now())
      }
      const complete = Array.from(steps).every(
        (step) => step.getAttribute('data-status') === 'complete',
      )
      if (!done && seen === 4 && complete) {
        done = true
        marks.push(performance.now())
      }
      if (!done) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await page.locator('#streaming .doc-preview').scrollIntoViewIfNeeded()
  await page.waitForFunction(
    () => (window as unknown as { marks: number[] }).marks.length === 5,
    undefined,
    { timeout: 10_000 },
  )
  const marks = await page.evaluate(() => (window as unknown as { marks: number[] }).marks)
  const gaps = marks.slice(1).map((mark, index) => mark - marks[index]!)
  // The reference: steps at 400, 1800, 3200 and 4200ms, all complete at 5200ms.
  const expected = [1400, 1400, 1000, 1000]
  gaps.forEach((gap, index) =>
    assert.ok(Math.abs(gap - expected[index]!) < 250, `gap ${index}: ${Math.round(gap)}ms`),
  )

  // The connector stops where a step's text ends, so a one-line step draws none.
  const lines = await page.locator('#basic .rf-thinking-timeline > li').evaluateAll((steps) =>
    steps.slice(0, 2).map((step) => {
      const icon = step.querySelector('.rf-thinking-timeline-icon')!
      const row = step.querySelector('.rf-thinking-timeline-row')!
      const line = parseFloat(getComputedStyle(icon, '::after').height)
      const iconBottom = icon.getBoundingClientRect().bottom
      const textBottom = row.getBoundingClientRect().bottom - 6
      return { line, gap: iconBottom - 6 - textBottom }
    }),
  )
  assert.equal(lines[0]!.line, 0)
  assert.ok(lines[1]!.line > 20)
  assert.ok(Math.abs(lines[1]!.gap) < 1)

  // Source chips scale up as they unblur.
  const chip = page.locator('#streaming .rf-thinking-step-source').first()
  assert.match(
    await chip.evaluate((node) => getComputedStyle(node).animationName),
    /rf-thinking-source-enter/,
  )
})
