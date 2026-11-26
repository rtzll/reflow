import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('inspects job DAG, runner telemetry, Datadog-style log explorer, waterfall spans, artifacts, run history, and re-runs failed jobs', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 900 })

  await open(page, '/apps/ci')
  await page.locator('[data-ci-ready]').waitFor()

  // Initial failing run #4577 renders PipelineGraph, Runner Telemetry, Failure Callout, and LogViewer histogram.
  await expect(page.locator('.ci-title-row')).toContainText('#4577')
  const graphTab = page.getByRole('tabpanel', { name: 'Graph & logs' })
  await expect(graphTab.locator('.rf-pipeline-stage')).toHaveCount(4)
  await expect(graphTab.locator('.rf-pipeline-edge')).toHaveCount(8)
  await expect(graphTab.locator('.ci-telemetry-grid .ci-metric-card')).toHaveCount(4)
  await expect(graphTab.locator('.ci-failure-callout')).toBeVisible()
  await expect(graphTab.locator('.rf-log-histogram .rf-log-hist-bucket')).toHaveCount(3)
  await expect(graphTab.locator('[data-log-group="e2e-apps"]')).toHaveAttribute('data-open', 'true')

  // Inspect structured Datadog fields on the failing line and click a facet value to filter.
  await graphTab.locator('.rf-log-fields-toggle').first().click()
  await expect(graphTab.locator('.rf-log-fields-drawer')).toBeVisible()

  // Click Filter errors on the failure callout -> applies `level:error` facet query.
  await graphTab.getByRole('button', { name: 'Filter errors' }).click()
  await expect(graphTab.locator('.rf-log-line')).toHaveCount(4)

  // Switch to Build job via PipelineGraph -> updates telemetry & logs.
  await graphTab.locator('[data-pipeline-job="build"]').click()
  await expect(graphTab.locator('.rf-log-title')).toContainText('Build workspace')
  await expect(graphTab.locator('.ci-failure-callout')).toBeHidden()

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
})
