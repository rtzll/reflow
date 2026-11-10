import { expect, type Locator } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { router, waitForShowcase } from './showcase-router.ts'

const fromEnd = (viewport: Locator) =>
  viewport.evaluate((node) => Math.round(node.scrollHeight - node.scrollTop - node.clientHeight))

it('opens at the newest message and jumps back to it from the history', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/chat-layout')
  await waitForShowcase(page)
  const example = page.locator('#long-history')
  await example.scrollIntoViewIfNeeded()
  const viewport = example.locator('.rf-chat-layout-viewport')
  await expect.poll(() => fromEnd(viewport)).toBe(0)
  const jump = example.getByRole('button', { name: 'Jump to latest' })
  await expect(jump).toBeHidden()

  await viewport.evaluate((node) => node.scrollBy(0, -300))
  await expect(jump).toBeVisible()
  await jump.click()
  await expect.poll(() => fromEnd(viewport)).toBe(0)
  await expect(jump).toBeHidden()
})

it('stays on a streaming reply while the reader does, and leaves a reader who scrolled back', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/chat-layout')
  await waitForShowcase(page)
  const example = page.locator('#long-history')
  await example.scrollIntoViewIfNeeded()
  const viewport = example.locator('.rf-chat-layout-viewport')
  const composer = example.getByRole('textbox')

  // Scrolled back, the reader's own message brings them to the end.
  await viewport.evaluate((node) => node.scrollBy(0, -300))
  await composer.fill('How should motion feel?')
  await composer.press('Enter')
  await expect(example.getByText('How should motion feel?')).toBeVisible()
  await expect.poll(() => fromEnd(viewport)).toBe(0)

  // As the reply streams in, the transcript follows it.
  const reply = example.locator('.rf-chat-message[data-role="assistant"]').last()
  const samples: number[] = []
  const lengths: number[] = []
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(90)
    samples.push(await fromEnd(viewport))
    lengths.push(((await reply.textContent()) ?? '').length)
  }
  assert.ok(lengths.at(-1)! > lengths[0]!, `the reply streamed: ${lengths.join(',')}`)
  assert.ok(Math.max(...samples) <= 2, `kept at the end: ${samples.join(',')}`)

  // Send again, then scroll back: the reader stays put while the reply grows.
  await composer.fill('And what about speed?')
  await composer.press('Enter')
  await page.waitForTimeout(500)
  await viewport.evaluate((node) => node.scrollBy(0, -200))
  const held = await viewport.evaluate((node) => node.scrollTop)
  await expect(example.getByRole('button', { name: 'New messages' })).toBeVisible()
  await page.waitForTimeout(400)
  assert.equal(await viewport.evaluate((node) => node.scrollTop), held)
})
