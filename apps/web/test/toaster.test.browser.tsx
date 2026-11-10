import { Toaster, toast, type ToasterProps } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

async function waitFor(check: () => boolean, frames = 90) {
  for (let i = 0; i < frames; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected toaster state did not settle')
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Every test starts and ends with an empty store.
async function mount(props: ToasterProps = {}) {
  toast.dismiss()
  const view = render(<Toaster {...props} />)
  const region = view.$('section.rf-toaster-region') as HTMLElement
  const list = () => region.querySelector('ol.rf-toaster') as HTMLOListElement
  const live = () =>
    Array.from(region.querySelectorAll<HTMLElement>('.rf-toast:not([data-removed])'))
  await waitFor(() => !region.querySelector('.rf-toast'))
  return {
    region,
    list,
    live,
    cleanup() {
      toast.dismiss()
      view.cleanup()
    },
  }
}

function pointer(node: Element, type: string, init: PointerEventInit = {}) {
  node.dispatchEvent(
    new PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: 'mouse', ...init }),
  )
}

describe('Toaster', () => {
  it('shows a toast in a polite region and dismisses it by id', async (t) => {
    const { region, live, cleanup } = await mount()
    t.after(cleanup)
    equal(region.getAttribute('aria-live'), 'polite')
    equal(region.getAttribute('aria-label'), 'Notifications')
    equal(region.getAttribute('aria-keyshortcuts'), 'Alt+T')

    const id = toast('Event created', { description: 'Friday, 10:00' })
    await waitFor(() => live().length === 1)
    const item = live()[0]!
    equal(item.querySelector('.rf-toast-title')?.textContent, 'Event created')
    equal(item.querySelector('.rf-toast-description')?.textContent, 'Friday, 10:00')
    equal(item.dataset.status, 'default')
    ok(!item.querySelector('.rf-toast-icon'), 'a plain toast has no icon')

    toast.dismiss(id)
    await waitFor(() => item.hasAttribute('data-removed'))
    // It leaves after its exit motion.
    await waitFor(() => !item.isConnected)
  })

  it('marks status toasts with an icon and resolves a promise toast in place', async (t) => {
    const { live, cleanup } = await mount()
    t.after(cleanup)
    toast.success('Saved')
    toast.error('Upload failed')
    await waitFor(() => live().length === 2)
    // The newest toast is in front.
    equal(live()[0]!.dataset.status, 'error')
    equal(live()[1]!.dataset.status, 'success')
    ok(live()[0]!.querySelector('.rf-toast-icon svg'))
    toast.dismiss()

    let resolve!: (value: string) => void
    const id = toast.promise(new Promise<string>((done) => (resolve = done)), {
      loading: 'Uploading…',
      success: (name) => `Uploaded ${name}`,
      error: 'Upload failed',
    })
    await waitFor(() => live().length === 1 && live()[0]!.dataset.status === 'loading')
    const item = live()[0]!
    equal(item.dataset.toastId, id)
    ok(item.querySelector('.rf-toast-icon .rf-toast-spinner'))
    resolve('report.pdf')
    await waitFor(() => item.dataset.status === 'success')
    equal(item.querySelector('.rf-toast-title')?.textContent, 'Uploaded report.pdf')
    equal(live().length, 1)
  })

  it('updates a toast that reuses an id instead of adding one', async (t) => {
    const { live, cleanup } = await mount()
    t.after(cleanup)
    toast('Syncing', { id: 'sync' })
    await waitFor(() => live().length === 1)
    toast.success('Synced', { id: 'sync' })
    await waitFor(() => live()[0]?.dataset.status === 'success')
    equal(live().length, 1)
    equal(live()[0]!.querySelector('.rf-toast-title')?.textContent, 'Synced')
  })

  it('closes on its own after the duration, paused while the pointer is over the stack', async (t) => {
    const { list, live, cleanup } = await mount({ duration: 120 })
    t.after(cleanup)
    const closed: string[] = []
    toast('Copied', { onAutoClose: (item) => closed.push(item.id) })
    await waitFor(() => live().length === 1)
    pointer(list(), 'pointerenter')
    await waitFor(() => list().hasAttribute('data-expanded'))
    await pause(220)
    equal(live().length, 1, 'hovering keeps it open')
    pointer(list(), 'pointerleave')
    await waitFor(() => live().length === 0)
    equal(closed.length, 1)

    const sticky = toast('Stays', { duration: Infinity })
    await pause(220)
    equal(live().length, 1)
    toast.dismiss(sticky)
  })

  it('runs an action and dismisses the toast unless the action prevents it', async (t) => {
    const { live, cleanup } = await mount()
    t.after(cleanup)
    let undone = 0
    toast('Message archived', { action: { label: 'Undo', onClick: () => undone++ } })
    await waitFor(() => live().length === 1)
    const undo = live()[0]!.querySelector('button.rf-toast-action') as HTMLButtonElement
    equal(undo.textContent, 'Undo')
    undo.click()
    equal(undone, 1)
    await waitFor(() => live().length === 0)

    toast('Draft saved', {
      action: { label: 'Keep', onClick: (event) => event.preventDefault() },
    })
    await waitFor(() => live().length === 1)
    ;(live()[0]!.querySelector('button.rf-toast-action') as HTMLButtonElement).click()
    await pause(60)
    equal(live().length, 1)
  })

  it('shows a close button when asked, and never for toasts that cannot be dismissed', async (t) => {
    const { live, cleanup } = await mount({ closeButton: true })
    t.after(cleanup)
    const dismissed: string[] = []
    toast('Closable', { onDismiss: (item) => dismissed.push(item.id) })
    toast('Pinned', { dismissible: false, duration: Infinity })
    await waitFor(() => live().length === 2)
    ok(!live()[0]!.querySelector('.rf-toast-close'))
    const close = live()[1]!.querySelector('button.rf-toast-close') as HTMLButtonElement
    equal(close.getAttribute('aria-label'), 'Close')
    close.click()
    await waitFor(() => live().length === 1)
    equal(dismissed.length, 1)
  })

  it('keeps three toasts in view and stacks the newest in front', async (t) => {
    const { list, live, cleanup } = await mount({ position: 'top-center' })
    t.after(cleanup)
    equal(list().dataset.position, 'top-center')
    for (const name of ['One', 'Two', 'Three', 'Four']) toast(name, { duration: Infinity })
    await waitFor(() => live().length === 4)
    await waitFor(() => live()[3]!.hasAttribute('data-hidden'))
    equal(
      live()
        .map((item) => item.querySelector('.rf-toast-title')?.textContent)
        .join(),
      'Four,Three,Two,One',
    )
    equal(
      live()
        .map((item) => item.style.getPropertyValue('--rf-toast-depth'))
        .join(),
      '0,1,2,3',
    )
    ok(live()[0]!.hasAttribute('data-front'))
    ok(!live()[2]!.hasAttribute('data-hidden'))
  })

  it('dismisses on a swipe toward its edge and springs back from a short one', async (t) => {
    const { live, cleanup } = await mount({ position: 'bottom-right' })
    t.after(cleanup)
    const dismissed: string[] = []
    toast('Swipe me', { duration: Infinity, onDismiss: (item) => dismissed.push(item.id) })
    await waitFor(() => live().length === 1)
    const item = live()[0]!

    pointer(item, 'pointerdown', { clientX: 100, clientY: 100 })
    pointer(item, 'pointermove', { clientX: 100, clientY: 110 })
    ok(item.hasAttribute('data-swiping'))
    equal(item.style.getPropertyValue('--rf-swipe-y'), '10px')
    await pause(200)
    pointer(item, 'pointerup', { clientX: 100, clientY: 112 })
    ok(!item.hasAttribute('data-swiping'))
    equal(item.style.getPropertyValue('--rf-swipe-y'), '0px')
    equal(dismissed.length, 0)

    // Away from the edge it resists instead of following the pointer.
    pointer(item, 'pointerdown', { clientX: 100, clientY: 100 })
    pointer(item, 'pointermove', { clientX: 100, clientY: 20 })
    ok(Math.abs(parseFloat(item.style.getPropertyValue('--rf-swipe-y'))) < 30)
    pointer(item, 'pointerup', { clientX: 100, clientY: 20 })
    equal(dismissed.length, 0)

    // Sideways toward the right edge, past the threshold.
    pointer(item, 'pointerdown', { clientX: 100, clientY: 100 })
    pointer(item, 'pointermove', { clientX: 130, clientY: 100 })
    pointer(item, 'pointermove', { clientX: 160, clientY: 100 })
    pointer(item, 'pointerup', { clientX: 160, clientY: 100 })
    await waitFor(() => item.hasAttribute('data-removed'))
    equal(dismissed.length, 1)
  })

  it('focuses the stack with Alt+T and dismisses the focused toast with Escape', async (t) => {
    const { list, live, cleanup } = await mount()
    t.after(cleanup)
    const outside = document.createElement('button')
    outside.textContent = 'Outside'
    document.body.append(outside)
    t.after(() => outside.remove())
    toast('First', { duration: Infinity })
    toast('Second', { duration: Infinity })
    await waitFor(() => live().length === 2)
    outside.focus()

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: '†', code: 'KeyT', altKey: true, bubbles: true }),
    )
    await waitFor(() => document.activeElement === live()[0])
    ok(list().hasAttribute('data-expanded'))

    live()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await waitFor(() => live().length === 1)
    await waitFor(() => document.activeElement === live()[0])
    live()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await waitFor(() => live().length === 0)
    await waitFor(() => document.activeElement === outside)
  })
})
