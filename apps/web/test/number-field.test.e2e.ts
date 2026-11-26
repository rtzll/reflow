import { expect } from 'playwright/test'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

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

it('scrubs the guest count in the gallery input group', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/')
  const group = page.locator('[data-component="input-group"]')
  const input = group.getByRole('spinbutton', { name: 'Guests' })
  const label = group.getByText('Guests', { exact: true })
  await label.scrollIntoViewIfNeeded()
  const box = (await label.boundingBox())!
  await page.mouse.move(box.x + 4, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 19, box.y + box.height / 2)
  await page.mouse.up()
  await expect(input).toHaveValue('5')
  await input.press('ArrowDown')
  await expect(input).toHaveValue('4')
})

it('locks the pointer and shows the virtual cursor while scrubbing a number field', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.addInitScript(grantPointerLock)
  await open(page, '/')
  const group = page.locator('[data-component="input-group"]')
  const input = group.getByRole('spinbutton', { name: 'Guests' })
  const label = group.getByText('Guests', { exact: true })
  const cursor = page.locator('.rf-scrub-cursor')
  await label.scrollIntoViewIfNeeded()
  const box = (await label.boundingBox())!
  const x = box.x + 4
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 10, y, { steps: 3 })
  await expect.poll(() => page.evaluate(() => !!document.pointerLockElement)).toBe(true)
  await expect(cursor).toBeVisible()
  await page.mouse.move(x + 25, y, { steps: 3 })
  await page.mouse.up()
  await expect(cursor).toBeHidden()
  assert.equal(await page.evaluate(() => !!document.pointerLockElement), false)
  assert.ok(Number(await input.inputValue()) > 2)
})
