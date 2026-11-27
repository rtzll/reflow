import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('reveals, hides, creates, rotates, and revokes API keys while logging every action to the audit log', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/apps/admin')

  const deployCard = page.locator('[data-key-id="key-prod-deploy"]')
  const secretCode = deployCard.locator('.admin-secret-value')
  await expect(secretCode).toHaveText('rf_live_••••••••••••9f2c')
  await expect(secretCode).toHaveAttribute('data-revealed', 'false')

  // Click to reveal and hide the secret, verifying icon/label alignment on the Reveal button.
  const revealBtn = deployCard.getByRole('button', {
    name: 'Reveal secret for CI Production Deployer',
  })
  const [iconBox, labelBox] = await Promise.all([
    revealBtn.locator('.rf-button-icon').boundingBox(),
    revealBtn.locator('.rf-button-label').boundingBox(),
  ])
  expect(iconBox).not.toBeNull()
  expect(labelBox).not.toBeNull()
  expect(labelBox!.x - (iconBox!.x + iconBox!.width)).toBeGreaterThanOrEqual(4)
  expect(
    Math.abs(iconBox!.y + iconBox!.height / 2 - (labelBox!.y + labelBox!.height / 2)),
  ).toBeLessThanOrEqual(2)

  await revealBtn.click()
  await expect(secretCode).toHaveText('rf_live_98d4c1f7e2a0b6c39f2c')
  await expect(secretCode).toHaveAttribute('data-revealed', 'true')
  await deployCard.getByRole('button', { name: 'Hide secret for CI Production Deployer' }).click()
  await expect(secretCode).toHaveText('rf_live_••••••••••••9f2c')

  // Filter input box and Create API key button stay top-aligned.
  const [filterBox, createBox] = await Promise.all([
    page.getByRole('tabpanel').locator('.admin-toolbar-row .rf-filter-bar-box').boundingBox(),
    page.getByRole('button', { name: 'Create API key', exact: true }).boundingBox(),
  ])
  expect(filterBox).not.toBeNull()
  expect(createBox).not.toBeNull()
  expect(Math.abs(filterBox!.y - createBox!.y)).toBeLessThanOrEqual(2)
  expect(
    Math.abs(filterBox!.y + filterBox!.height / 2 - (createBox!.y + createBox!.height / 2)),
  ).toBeLessThanOrEqual(2)

  // Create a new API key via Dialog and verify one-time secret banner.
  await page.getByRole('button', { name: 'Create API key', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Create API key' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Key name').fill('Edge Release Bot')
  await dialog.getByRole('button', { name: 'Generate secret', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Secret created for Edge Release Bot')).toBeVisible()
  await expect(page.locator('.admin-key-card', { hasText: 'Edge Release Bot' })).toBeVisible()

  // Rotate an active key via AlertDialog confirmation.
  const stagingCard = page.locator('[data-key-id="key-staging-preview"]')
  await stagingCard.getByRole('button', { name: 'Rotate', exact: true }).click()
  const rotateDialog = page.getByRole('alertdialog', { name: 'Rotate Staging Preview Worker?' })
  await expect(rotateDialog).toBeVisible()
  await rotateDialog.getByRole('button', { name: 'Rotate key', exact: true }).click()
  await expect(page.getByText('Secret rotated for Staging Preview Worker')).toBeVisible()

  // Revoke a key via destructive AlertDialog confirmation.
  await stagingCard.getByRole('button', { name: 'Revoke', exact: true }).click()
  const revokeDialog = page.getByRole('alertdialog', { name: 'Revoke Staging Preview Worker?' })
  await expect(revokeDialog).toBeVisible()
  await revokeDialog.getByRole('button', { name: 'Revoke key', exact: true }).click()
  await expect(stagingCard).toHaveAttribute('data-status', 'revoked')

  // Verify live-recorded events appear in the Audit Log with inspectable JSON payload.
  await page.getByRole('tab', { name: /^Audit log/ }).click()
  const auditList = page.getByRole('list', { name: 'Audit events' })
  await expect(auditList.getByText('api_key.revoked').first()).toBeVisible()
  await expect(auditList.getByText('api_key.rotated').first()).toBeVisible()
  await expect(auditList.getByText('api_key.created').first()).toBeVisible()
  await expect(auditList.getByText('api_key.revealed').first()).toBeVisible()
  const detail = page.getByRole('complementary', { name: 'Selected audit event details' })
  await expect(detail.locator('.rf-object-inspector')).toContainText('api_key.revoked')
})

it('updates workspace settings, manages RBAC roles, and stays overflow-free on mobile', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1280, height: 900 })
  await open(page, '/apps/admin')

  // Settings tab: toggle IP allowlist and reveal webhook signing secret, then save.
  await page.getByRole('tab', { name: 'Settings', exact: true }).click()
  await page.getByRole('switch', { name: 'Restrict API keys to corporate IP allowlist' }).click()
  await expect(page.getByText('Unsaved workspace changes')).toBeVisible()
  const webhookValue = page.locator('.admin-webhook-secret .rf-copy-value')
  await expect(webhookValue).toHaveText(/whsec_7f•+d914/)
  await page.getByRole('button', { name: 'Reveal Webhook signing secret', exact: true }).click()
  await expect(webhookValue).toHaveText('whsec_7f9c41a8e20b3d559a1e4c80f6b2d914')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByText('Unsaved workspace changes')).toHaveCount(0)

  // Team & access tab: verify aligned columns, filter by missing MFA, and change a member's role.
  await page.getByRole('tab', { name: /^Team & access/ }).click()
  const members = page.getByRole('list', { name: 'Workspace members' })
  await expect(members.locator('li')).toHaveCount(5)
  const columnXs = await members.locator('li').evaluateAll((rows) =>
    rows.map((row) => {
      const badges = row.querySelectorAll<HTMLElement>('.rf-badge')
      const seen = row.querySelector<HTMLElement>('.admin-member-seen')!
      const select = row.querySelector<HTMLElement>('.rf-select')!
      return {
        mfaX: Math.round(badges[0].getBoundingClientRect().left),
        roleX: Math.round(badges[1].getBoundingClientRect().left),
        seenRight: Math.round(seen.getBoundingClientRect().right),
        selectX: Math.round(select.getBoundingClientRect().left),
      }
    }),
  )
  for (const row of columnXs.slice(1)) {
    expect(Math.abs(row.mfaX - columnXs[0].mfaX)).toBeLessThanOrEqual(1)
    expect(Math.abs(row.roleX - columnXs[0].roleX)).toBeLessThanOrEqual(1)
    expect(Math.abs(row.seenRight - columnXs[0].seenRight)).toBeLessThanOrEqual(1)
    expect(Math.abs(row.selectX - columnXs[0].selectX)).toBeLessThanOrEqual(1)
  }
  await page.getByRole('button', { name: 'Missing MFA', exact: true }).click()
  await expect(members.locator('li')).toHaveCount(1)
  await expect(members).toContainText('Sam Reed')
  await page.getByRole('button', { name: 'Role for Sam Reed' }).click()
  await page.getByRole('option', { name: 'Admin', exact: true }).click()
  await expect(members.locator('[data-member-id="mem-4"]')).toContainText('admin')

  // Mobile 390px zero-overflow check.
  await page.setViewportSize({ width: 390, height: 844 })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
