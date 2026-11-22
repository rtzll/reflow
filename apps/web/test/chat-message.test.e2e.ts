import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('centres a system event between hairlines, muted, with its actions in view', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/docs/chat-message')
  const thread = page.locator('#system-messages .example-chat-thread')
  const event = thread.getByRole('article', { name: 'System' }).nth(1)
  await event.scrollIntoViewIfNeeded()
  const layout = await event.evaluate((node) => {
    const thread = node.parentElement!.getBoundingClientRect()
    const line = node.querySelector('.rf-chat-system')!
    const text = node.querySelector('.rf-chat-system-text')!.getBoundingClientRect()
    const before = getComputedStyle(line, '::before')
    const after = getComputedStyle(line, '::after')
    const box = node.getBoundingClientRect()
    return {
      spans: Math.round(box.width) === Math.round(thread.width),
      // Text, icon and actions sit together in the middle.
      centred:
        Math.abs(
          (node.querySelector('.rf-chat-system-icon')!.getBoundingClientRect().left +
            node.querySelector('.rf-chat-actions')!.getBoundingClientRect().right) /
            2 -
            (box.left + box.width / 2),
        ) < 2,
      rules: parseFloat(before.width) > 16 && parseFloat(after.width) > 16,
      rule: before.borderTopWidth,
      muted: getComputedStyle(line).color !== getComputedStyle(document.body).color,
      textWidth: text.width > 0,
    }
  })
  assert.deepEqual(layout, {
    spans: true,
    centred: true,
    rules: true,
    rule: '1px',
    muted: true,
    textWidth: true,
  })
  // Unlike a message's hover row, an event's actions are always in view.
  await page.mouse.move(5, 5)
  await expect(event.getByRole('button', { name: 'Undo' })).toBeVisible()
  await expect(event.locator('.rf-chat-actions')).toHaveCSS('opacity', '1')
})

it('wraps a long link or address inside the bubble on a phone', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 320, height: 800 })
  await open(page, '/docs/chat-message')
  const body = page.locator('.rf-chat-message[data-role="user"] .rf-chat-body').first()
  await body.scrollIntoViewIfNeeded()
  const fits = await body.evaluate((node) => {
    // A pasted address has nowhere to break but between its characters.
    node.textContent =
      'Please email bartholomew.fitzgerald@northwind-industries-holdings.example.com about https://example.com/workspaces/acme/projects/q3-launch/docs/9f8e7d6c5b4a?tab=comments'
    const message = node.closest('.rf-chat-message')!.getBoundingClientRect()
    const bubble = node.getBoundingClientRect()
    return bubble.right <= message.right + 0.5 && bubble.left >= message.left - 0.5
  })
  assert.equal(fits, true)
})
