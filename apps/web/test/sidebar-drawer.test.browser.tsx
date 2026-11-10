import { Sidebar } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

async function waitFor(check: () => boolean, frames = 60) {
  for (let i = 0; i < frames; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected sidebar drawer state did not settle')
}

const sections = [
  {
    label: 'Mail',
    items: [
      { label: 'Inbox', href: '#inbox' },
      { label: 'Drafts', href: '#drafts' },
    ],
  },
]

// Browser tests load no CSS, so the narrow-screen trigger is always shown here.
describe('Sidebar mobile drawer', () => {
  it('opens the navigation in a left Drawer and closes it after navigating', async (t) => {
    const { $, cleanup } = render(
      <Sidebar sections={sections} activeHref="#inbox" label="Mailboxes">
        <p>Content</p>
      </Sidebar>,
    )
    t.after(cleanup)
    const trigger = $('button.rf-sidebar-drawer-trigger') as HTMLButtonElement
    const panel = $('dialog.rf-drawer.rf-sidebar-drawer') as HTMLDialogElement
    equal(panel.dataset.side, 'left')
    equal(trigger.getAttribute('aria-controls'), panel.id)
    equal(trigger.getAttribute('aria-haspopup'), 'dialog')
    ok(panel.hasAttribute('data-flush'))
    equal(document.getElementById(panel.getAttribute('aria-labelledby')!)?.textContent, 'Mailboxes')

    trigger.click()
    await waitFor(() => panel.open)
    equal(trigger.getAttribute('aria-expanded'), 'true')
    ok(!panel.querySelector('.rf-drawer-handle'))
    ok(!panel.querySelector('.rf-drawer-close'), 'the hidden Close navigation button stands in')

    const drafts = Array.from(panel.querySelectorAll('a')).find(
      (link) => link.textContent?.trim() === 'Drafts',
    )!
    drafts.addEventListener('click', (event) => event.preventDefault(), { once: true })
    drafts.click()
    await waitFor(() => !panel.open)
    equal(trigger.getAttribute('aria-expanded'), 'false')

    trigger.click()
    await waitFor(() => panel.open)
    const close = Array.from(panel.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Close navigation',
    )!
    close.click()
    await waitFor(() => !panel.open)
  })
})
