import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('shows distinct project panels and waits for keyboard activation', async (t) => {
  const page = await t.serve(showcaseServer)
  for (const [url, selector] of [
    ['/docs/tabs', '#playground'],
    ['/', 'article[data-component="tabs"]'],
  ]) {
    await open(page, url)
    const preview = page.locator(selector)
    const files = preview.getByRole('tabpanel', { name: 'Files' })
    await expect(files.getByText('context-menu.tsx')).toBeVisible()
    await preview.getByRole('tab', { name: 'Files' }).press('ArrowRight')
    const activity = preview.getByRole('tab', { name: 'Activity' })
    await expect(activity).toBeFocused()
    await expect(files).toBeVisible()
    await activity.press('Enter')
    await expect(preview.getByRole('tabpanel', { name: 'Activity' })).toContainText(
      'Added keyboard navigation',
    )
    await expect(files).toBeHidden()
    await preview.getByRole('tab', { name: 'Members' }).click()
    await expect(preview.getByRole('tabpanel', { name: 'Members' })).toContainText('Designer')
  }
})
