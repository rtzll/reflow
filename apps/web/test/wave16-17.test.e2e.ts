import { expect } from 'playwright/test'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('updates live previews and generated JSX across Wave 16 and Wave 17 playgrounds', async (t) => {
  const page = await t.serve(showcaseServer)
  await page.setViewportSize({ width: 1440, height: 900 })

  await open(page, '/docs/merge-readiness')
  const mrControls = page.getByRole('region', { name: 'MergeReadiness playground settings' })
  await mrControls.getByRole('combobox', { name: 'Status', exact: true }).selectOption('blocked')
  await expect(page.locator('#playground .rf-merge-readiness')).toHaveAttribute(
    'data-status',
    'blocked',
  )
  await expect(page.locator('#playground code').first()).toContainText('status="blocked"')

  await open(page, '/docs/kanban-board')
  const kbControls = page.getByRole('region', { name: 'KanbanBoard playground settings' })
  await kbControls.getByRole('combobox', { name: 'Size', exact: true }).selectOption('compact')
  await expect(page.locator('#playground .rf-kanban-board')).toHaveAttribute('data-size', 'compact')
  await kbControls.getByRole('switch', { name: 'WIP limit', exact: true }).uncheck()
  await expect(page.locator('#playground .rf-kanban-wip')).toHaveCount(0)

  await open(page, '/docs/roadmap-timeline')
  const rmControls = page.getByRole('region', { name: 'RoadmapTimeline playground settings' })
  await rmControls.getByRole('switch', { name: 'Today line', exact: true }).uncheck()
  await expect(page.locator('#playground .rf-roadmap-today')).toHaveCount(0)
  await rmControls.getByRole('combobox', { name: 'Zoom', exact: true }).selectOption('quarters')
  await expect(page.locator('#playground code').first()).toContainText('defaultZoom="quarters"')

  await open(page, '/docs/cycle-overview')
  const coControls = page.getByRole('region', { name: 'CycleOverview playground settings' })
  await coControls.getByRole('switch', { name: 'Burndown', exact: true }).uncheck()
  await expect(page.locator('#playground .rf-line-chart')).toHaveCount(0)
})

it('renders flagship Wave 16 and Wave 17 docs cleanly across dark, accent, pill, compact, and mobile viewports', async (t) => {
  const page = await t.serve(showcaseServer)
  const slugs = [
    'kanban-board',
    'roadmap-timeline',
    'cycle-overview',
    'triage-queue',
    'code-browser',
    'merge-readiness',
    'stack-graph',
    'pipeline-graph',
    'waterfall',
    'log-viewer',
  ]

  await page.setViewportSize({ width: 390, height: 844 })
  for (const slug of slugs) {
    await open(page, `/docs/${slug}?theme=dark&accent=violet&shape=pill&density=compact`)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'violet')
    await expect(page.locator('html')).toHaveAttribute('data-shape', 'pill')
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow, `/docs/${slug} horizontal overflow at 390px`).toBeLessThanOrEqual(0)
  }
})
