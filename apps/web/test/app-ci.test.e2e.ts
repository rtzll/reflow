import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('inspects job DAG, grouped ANSI logs, waterfall spans, artifacts, run history, and re-runs failed jobs', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 900 })

  await open(page, '/apps/ci')
  await page.locator('[data-ci-ready]').waitFor()

  // Initial failing run #4577 renders PipelineGraph with measured edges and auto-opened failed LogViewer step.
  await expect(page.locator('.ci-title-row')).toContainText('#4577')
  const graphTab = page.getByRole('tabpanel', { name: 'Graph & logs' })
  await expect(graphTab.locator('.rf-pipeline-stage')).toHaveCount(4)
  await expect(graphTab.locator('.rf-pipeline-edge')).toHaveCount(8)
  await expect(graphTab.locator('[data-log-group="e2e-apps"]')).toHaveAttribute('data-open', 'true')

  // Filter LogViewer to Errors only, then switch to Build job via PipelineGraph.
  await graphTab.locator('.rf-log-pill[data-level="error"]').click()
  await expect(graphTab.locator('.rf-log-line')).toHaveCount(4)
  await graphTab.locator('.rf-log-pill[data-level="error"]').click()

  await graphTab.locator('[data-pipeline-job="build"]').click()
  await expect(graphTab.locator('.rf-log-title')).toContainText('Build workspace')

  // Switch to Waterfall tab and inspect a span.
  await page.getByRole('tab', { name: 'Waterfall' }).click()
  const waterfallTab = page.getByRole('tabpanel', { name: 'Waterfall' })
  await expect(waterfallTab.locator('.rf-waterfall-row')).toHaveCount(10)
  await waterfallTab.locator('[data-waterfall-id="deploy-test"]').click()
  await expect(waterfallTab.locator('.rf-log-title')).toContainText('Worker smoke')

  // Switch to Suites & artifacts tab and verify DataTable, FileTree, and DiffView.
  await page.getByRole('tab', { name: 'Suites & artifacts' }).click()
  await expect(page.getByRole('table', { name: 'Test suites' })).toBeVisible()
  await expect(page.locator('.ci-tree-card .rf-file-tree[data-rf-trees-ready]')).toBeVisible()
  await expect(page.locator('.rf-diff-view[data-rf-diffs-ready]')).toBeVisible()

  // Switch to Run #4578 via StatusStrip, then back to #4577 and click Re-run failed jobs.
  await page.locator('[data-strip-id="4578"]').click()
  await expect(page.locator('.ci-title-row')).toContainText('#4578')
  await expect(page.locator('.ci-title-row')).toContainText('Passed')

  await page.locator('[data-strip-id="4577"]').click()
  await expect(page.locator('.ci-title-row')).toContainText('#4577')
  await page.getByRole('button', { name: 'Re-run failed jobs' }).click()
  await expect(page.locator('.ci-title-row')).toContainText('Passed')
  await expect(page.getByRole('tab', { name: 'Graph & logs' })).toBeVisible()
})
