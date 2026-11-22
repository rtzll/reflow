import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { open, showcaseServer } from './showcase-router.ts'

it('truncates long steps rather than run past a phone-width container', async (t) => {
  const page = await t.serve(showcaseServer)
  await open(page, '/docs/breadcrumb')
  const fit = await page.evaluate(() => {
    const nav = [...document.querySelectorAll<HTMLElement>('nav.rf-breadcrumb')].find(
      (node) => !node.closest('.rf-breadcrumb-measure') && !node.querySelector('[data-ellipsis]'),
    )!
    const box = document.createElement('div')
    box.style.inlineSize = '320px'
    nav.before(box)
    box.append(nav)
    // Names as long as real ones get: a company, a German compound, a file.
    const labels = nav.querySelectorAll(':scope > ol > li .rf-breadcrumb-label')
    labels[0]!.textContent = 'Northwind Industries Holdings'
    labels[1]!.textContent = 'Benachrichtigungseinstellungen'
    labels[labels.length - 1]!.textContent = 'Q3 Board Deck — FINAL (revised) v12.pdf'
    const bounds = box.getBoundingClientRect()
    const page = nav.querySelector('[aria-current="page"]')!.getBoundingClientRect()
    return {
      inside: [...nav.querySelectorAll('.rf-breadcrumb-crumb')].every(
        (crumb) => crumb.getBoundingClientRect().right <= bounds.right + 0.5,
      ),
      pageVisible: page.width > 40,
    }
  })
  assert.deepEqual(fit, { inside: true, pageVisible: true })
})
