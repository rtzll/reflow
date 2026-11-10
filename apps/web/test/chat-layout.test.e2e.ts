import { expect, type Locator } from 'playwright/test'
import * as assert from 'remix/assert'
import { createTestServer } from 'remix/node-fetch-server/test'
import { it } from 'remix/test'
import { open, router } from './showcase-router.ts'

const fromEnd = (viewport: Locator) =>
  viewport.evaluate((node) => Math.round(node.scrollHeight - node.scrollTop - node.clientHeight))

it('opens at the newest message and jumps back to it from the history', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/chat-layout')
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

it('stays on a streaming reply while the reader does', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/chat-layout')
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

  // As the reply streams in, the transcript follows it. Each time it grows,
  // the test's own ResizeObserver, called after ChatLayout's in the same
  // rendering step, reads where the frame about to be painted will be.
  const { samples, lengths } = await viewport.evaluate(
    (node) =>
      new Promise<{ samples: number[]; lengths: number[] }>((resolve) => {
        const samples: number[] = []
        const lengths: number[] = []
        const content = node.firstElementChild as HTMLElement
        const log = node.querySelector('[role="log"]')!
        const observer = new ResizeObserver(() => {
          samples.push(Math.round(content.offsetHeight - node.clientHeight - node.scrollTop))
          const replies = node.querySelectorAll('.rf-chat-message[data-role="assistant"]')
          lengths.push((replies[replies.length - 1]?.textContent ?? '').length)
        })
        observer.observe(log)
        setTimeout(() => {
          observer.disconnect()
          resolve({ samples, lengths })
        }, 1400)
      }),
  )
  assert.ok(lengths.at(-1)! > lengths[0]!, `the reply streamed: ${lengths.join(',')}`)
  assert.ok(Math.max(...samples) <= 2, `kept at the end: ${samples.join(',')}`)
})

it('leaves a reader who scrolled back where they are while a reply streams', async (t) => {
  const page = await t.serve(await createTestServer(router.fetch))
  await page.setViewportSize({ width: 1280, height: 900 })
  // The reply streams on timers, which the test moves on itself.
  await page.clock.install()
  await open(page, '/docs/chat-layout')
  const example = page.locator('#long-history')
  await example.scrollIntoViewIfNeeded()
  const viewport = example.locator('.rf-chat-layout-viewport')
  const composer = example.getByRole('textbox')
  const reply = () =>
    viewport.evaluate((node) => {
      const replies = node.querySelectorAll('.rf-chat-message[data-role="assistant"]')
      return (replies[replies.length - 1]?.textContent ?? '').length
    })

  await composer.fill('And what about speed?')
  await composer.press('Enter')
  await page.clock.runFor(500)
  await viewport.evaluate((node) => node.scrollBy(0, -200))
  const held = await viewport.evaluate((node) => node.scrollTop)
  await expect(example.getByRole('button', { name: 'New messages' })).toBeVisible()
  const before = await reply()
  await page.clock.runFor(400)
  assert.ok((await reply()) > before, 'the reply kept streaming')
  assert.equal(await viewport.evaluate((node) => node.scrollTop), held)
})
