import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('opens both dialog panels at the center of the viewport', async (t) => {
  const page = await t.serve(showcaseServer)
  for (const [url, name, role] of [
    ['/docs/dialog', 'New teamspace', 'dialog'],
    ['/docs/alert-dialog', 'Delete Design', 'alertdialog'],
  ] as const) {
    await open(page, url)
    await page.locator('#basic, #playground').getByRole('button', { name, exact: true }).click()
    const panel = page.getByRole(role)
    await expect(panel).toBeVisible()
    const center = await panel.evaluate((element) => {
      const { x, y, width, height } = element.getBoundingClientRect()
      return [x + width / 2 - innerWidth / 2, y + height / 2 - innerHeight / 2]
    })
    for (const offset of center) expect(Math.abs(offset)).toBeLessThan(1)
  }
})

it('creates named teamspaces and deletes only the confirmed row', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 390, height: 844 })
  for (const url of ['/docs/dialog', '/docs/alert-dialog', '/']) {
    await open(page, url)
    const example = page
      .locator(url === '/' ? 'article[data-component="alert-dialog"]' : '#basic, #playground')
      .first()
    const create = example.getByRole('button', { name: 'New teamspace' })
    const dialog = page.getByRole('dialog', { name: 'Create teamspace' })
    const field = dialog.getByRole('textbox', { name: 'Name' })
    await create.click()
    await expect(field).toBeFocused()
    await field.fill('Release')
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(create).toBeFocused()
    await create.click()
    await expect(field).toHaveValue('')
    await field.fill('  Release  ')
    await field.press('Enter')
    const remove = example.getByRole('button', { name: 'Delete Release' })
    await expect(remove).toBeVisible()
    await remove.click()
    const alert = page.getByRole('alertdialog', { name: 'Delete Release?' })
    const cancel = alert.getByRole('button', { name: 'Cancel' })
    await expect(cancel).toBeFocused()
    await cancel.click()
    await expect(remove).toBeFocused()
    await remove.press('Enter')
    await alert.getByRole('button', { name: 'Delete teamspace' }).click()
    await expect(remove).toHaveCount(0)
    await expect(example.getByRole('button', { name: 'Delete Design' })).toBeVisible()
    await expect(create).toBeFocused()
  }
})

it('keeps edits on cancel and discards them when leaving the editor', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/docs/alert-dialog')
  const editor = page.locator('#leave-without-saving')
  const notes = editor.getByRole('textbox', { name: 'Project notes' })
  await notes.fill('Unsaved changes')
  const leave = editor.getByRole('button', { name: 'Leave editor' })
  await leave.click()
  await editor.getByRole('button', { name: 'Keep editing' }).click()
  await expect(notes).toHaveValue('Unsaved changes')
  await leave.click()
  await editor.getByRole('button', { name: 'Leave', exact: true }).click()
  await editor.getByRole('button', { name: 'Reopen editor' }).click()
  await expect(notes).toHaveValue('Review the release notes.')
})
