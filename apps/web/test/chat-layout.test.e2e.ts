import { expect, type Locator } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

const fromEnd = (viewport: Locator) =>
  viewport.evaluate((node) => Math.round(node.scrollHeight - node.scrollTop - node.clientHeight))

it('opens at the newest message and jumps back to it from the history', async (t) => {
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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
  const page = await t.serve(showcaseServer)
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

it('anchors a sent message at the top while its reply grows below it', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/chat-layout')
  const example = page.locator('#anchored-replies')
  await example.scrollIntoViewIfNeeded()
  const viewport = example.locator('.rf-chat-layout-viewport')
  const log = example.getByRole('log')
  const composer = example.getByRole('textbox')
  // History present on load does not anchor: it opens at the end.
  await expect.poll(() => fromEnd(viewport)).toBe(0)

  await composer.fill('How should motion feel?')
  await composer.press('Enter')
  const sent = example.locator('.rf-chat-message[data-role="user"]').last()
  await expect(sent).toHaveText('How should motion feel?')
  // The message sits 16px below the top of the view, with the previous one peeking above.
  const offset = () =>
    sent.evaluate((node) => {
      const view = node.closest('.rf-chat-layout-viewport')!.getBoundingClientRect()
      return Math.round(node.getBoundingClientRect().top - view.top)
    })
  await expect.poll(offset).toBe(16)

  // While the reply streams, the log is busy and the message does not move.
  await expect(log).toHaveAttribute('aria-busy', 'true')
  const spacer = example.locator('.rf-chat-anchor-space')
  const before = (await spacer.boundingBox())!.height
  const tops: number[] = []
  for (let i = 0; i < 8; i++) {
    tops.push(await offset())
    await page.waitForTimeout(80)
  }
  assert.ok(
    tops.every((top) => Math.abs(top - 16) <= 1),
    `the message stays put: ${tops.join(',')}`,
  )
  await expect(log).not.toHaveAttribute('aria-busy', 'true')
  assert.ok((await spacer.boundingBox())!.height < before, 'the space shrinks as the reply grows')
  assert.equal(await fromEnd(viewport), 0, 'the anchored position is the end')
})
