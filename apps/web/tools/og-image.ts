// Captures the gallery's first band (QueuedStack, an open HoverCard and the
// Carousel) as the link preview image every page shares.
//
// usage: pnpm --filter @reflow/web og:image [origin]
// Start the showcase first (pnpm dev); the origin defaults to its address.
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'

const origin = process.argv[2] ?? 'http://127.0.0.1:44100'
const output = fileURLToPath(new URL('../app/public/og.png', import.meta.url))
// Twice the 1200 × 630 card link previews use. With this margin around it,
// the band at the gallery's full width fills that ratio.
const width = 2000
const height = 1050
const margin = 19
// Wide enough that the gallery reaches its full 1200px width.
const viewport = { width: 1800, height: 1000 }

async function open(browser: Browser, deviceScaleFactor: number) {
  const page = await browser.newPage({ viewport, deviceScaleFactor })
  await page.goto(`${origin}/?theme=dark`, { waitUntil: 'networkidle' })
  await page
    .locator('head script[type="module"][src]')
    .evaluate(async (script: HTMLScriptElement) => {
      await import(script.src)
    })
  return page
}

function tile(page: Page, slug: string) {
  return page.locator(`.site-gallery > [data-component="${slug}"]`)
}

// The band with the side margin, at the target ratio, centred vertically.
async function bandOf(page: Page) {
  const queue = await tile(page, 'queued-stack').boundingBox()
  const carousel = await tile(page, 'carousel').boundingBox()
  if (!queue || !carousel) throw new Error('The gallery band is not visible')
  const bandWidth = carousel.x + carousel.width - queue.x + margin * 2
  const bandHeight = bandWidth * (height / width)
  return {
    x: queue.x - margin,
    y: queue.y - (bandHeight - carousel.height) / 2,
    width: bandWidth,
    height: bandHeight,
  }
}

const browser = await chromium.launch()
try {
  const measure = await open(browser, 1)
  const scale = width / (await bandOf(measure)).width
  await measure.close()

  const page = await open(browser, scale)
  const band = await bandOf(page)
  await tile(page, 'hover-card').getByRole('link', { name: '@reflow' }).hover()
  // The card opens after its delay; let it finish its entrance.
  await page.locator('.rf-hover-card:popover-open').waitFor()
  await page.waitForTimeout(400)
  // Half a device pixel more, so rounding lands on the full target height.
  await page.screenshot({ path: output, clip: { ...band, height: band.height + 0.5 / scale } })
  console.log(`Wrote ${output} (${width} × ${height})`)
} finally {
  await browser.close()
}
