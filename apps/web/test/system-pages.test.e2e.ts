import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router } from './showcase-router.ts'

it('uses the native viewport through the custom scrollbar and follows scroll reveal progress', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/scrollbars')
  const viewport = page.getByRole('region', { name: 'Scrollable example', exact: true }).first()
  await viewport.hover()
  const scrollbar = page
    .getByRole('scrollbar', { name: 'Scrollable example vertical scrollbar' })
    .first()
  await scrollbar.press('End')
  assert.ok(await viewport.evaluate((element) => element.scrollTop > 0))
  await scrollbar.press('Home')
  assert.equal(await viewport.evaluate((element) => element.scrollTop), 0)
  await page.goto('/docs/reveal')
  const revealViewport = page.getByRole('region', { name: 'Scroll reveal preview', exact: true })
  await revealViewport.waitFor()
  await revealViewport.evaluate((element) => {
    element.scrollTop = 280
  })
  await page.waitForFunction(
    () =>
      Number(getComputedStyle(document.querySelector('.system-reveal-landing section')!).opacity) >
      0.9,
  )
  await revealViewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })

  await page.waitForFunction(
    () =>
      Number(getComputedStyle(document.querySelector('.system-reveal-landing section')!).opacity) <
      0.1,
    undefined,
    { timeout: 5000 },
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(
    await page
      .locator('.system-reveal-landing section')
      .first()
      .evaluate((element) => getComputedStyle(element).animationName),
    'none',
  )
})

it('renders editable Markdown tables and nested tasks while treating raw HTML as text', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.goto('/docs/typography')
  const specimen = page.locator('.system-markdown-specimen')
  await specimen.getByRole('table').waitFor()
  assert.ok((await specimen.getByRole('checkbox').count()) >= 4)
  await specimen.getByRole('switch', { name: 'Edit Markdown' }).check()
  await specimen
    .getByRole('textbox', { name: 'Markdown source' })
    .fill(
      '# A new heading\n\n**Strong text** and *emphasis*.\n\n<script>window.alert(1)</script>\n\n[Unsafe](javascript:alert)',
    )
  await specimen.getByRole('heading', { name: 'A new heading' }).waitFor()
  assert.equal(await specimen.locator('strong').innerText(), 'Strong text')
  assert.equal(await specimen.locator('em').innerText(), 'emphasis')
  assert.equal(await specimen.locator('script').count(), 0)
  assert.equal(await specimen.getByRole('link', { name: 'Unsafe' }).count(), 0)
  await specimen.getByText('<script>window.alert(1)</script>', { exact: true }).waitFor()
  await specimen.getByRole('button', { name: 'Reset sample' }).click()
  await specimen.getByRole('table').waitFor()
})
