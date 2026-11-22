import { Drawer } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { on, type Handle } from 'remix/component'
import { describe, it } from 'remix/test'

async function waitFor(check: () => boolean, frames = 60) {
  for (let i = 0; i < frames; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected drawer state did not settle')
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function pointer(node: Element, type: string, init: PointerEventInit = {}) {
  node.dispatchEvent(
    new PointerEvent(type, { bubbles: true, pointerId: 3, pointerType: 'mouse', ...init }),
  )
}

function press(node: Element, key: string) {
  node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

// Drags from the middle of the panel by dx, dy in a few steps.
function center(panel: HTMLElement) {
  const rect = panel.getBoundingClientRect()
  return { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
}

async function drag(panel: HTMLElement, dx: number, dy: number, ms = 200) {
  const start = center(panel)
  pointer(panel, 'pointerdown', start)
  for (const step of [0.25, 0.5, 1]) {
    await pause(ms / 3)
    pointer(panel, 'pointermove', {
      clientX: start.clientX + dx * step,
      clientY: start.clientY + dy * step,
    })
  }
  pointer(panel, 'pointerup', { clientX: start.clientX + dx, clientY: start.clientY + dy })
}

describe('Drawer', () => {
  it('opens a modal panel from the bottom with a handle and returns focus on Escape', async (t) => {
    const changes: boolean[] = []
    const { $, cleanup } = render(
      <Drawer
        trigger="Filters"
        title="Filters"
        description="Narrow the results."
        onOpenChange={(open) => changes.push(open)}
      >
        <p>Content</p>
      </Drawer>,
    )
    t.after(cleanup)
    const trigger = $('button[aria-haspopup="dialog"]') as HTMLButtonElement
    const panel = $('dialog.rf-drawer') as HTMLDialogElement
    equal(panel.dataset.side, 'bottom')
    equal(trigger.getAttribute('aria-controls'), panel.id)
    ok($('.rf-drawer-handle'), 'a bottom drawer has a handle')
    ok(!$('.rf-drawer-close'), 'the handle stands in for a close button')

    trigger.focus()
    trigger.click()
    await waitFor(() => panel.open && panel.matches(':modal'))
    equal(trigger.getAttribute('aria-expanded'), 'true')
    equal(document.getElementById(panel.getAttribute('aria-labelledby')!)?.textContent, 'Filters')
    equal(
      document.getElementById(panel.getAttribute('aria-describedby')!)?.textContent,
      'Narrow the results.',
    )

    panel.dispatchEvent(new Event('cancel', { cancelable: true }))
    await waitFor(() => !panel.open)
    equal(document.activeElement, trigger)
    equal(changes.join(), 'true,false')
  })

  it('slides from the sides with a close button and no handle', async (t) => {
    const { $, cleanup } = render(
      <Drawer trigger="Menu" title="Menu" side="right" defaultOpen>
        <p>Links</p>
      </Drawer>,
    )
    t.after(cleanup)
    const panel = $('dialog.rf-drawer') as HTMLDialogElement
    equal(panel.dataset.side, 'right')
    ok(!$('.rf-drawer-handle'))
    await waitFor(() => panel.open)
    const close = $('.rf-drawer-close') as HTMLButtonElement
    equal(close.getAttribute('aria-label'), 'Close drawer')
    close.click()
    await waitFor(() => !panel.open)
  })

  it('closes when dragged past a quarter of its height, and springs back from less', async (t) => {
    const { $, cleanup } = render(
      <Drawer trigger="Open" title="Drag me" defaultOpen>
        <div style="height: 300px">Body</div>
      </Drawer>,
    )
    t.after(cleanup)
    const panel = $('dialog.rf-drawer') as HTMLDialogElement
    await waitFor(() => panel.open)
    const height = panel.getBoundingClientRect().height
    ok(height > 100, 'the panel has a size to drag against')

    // A slow, short drag springs back.
    await drag(panel, 0, height * 0.15, 600)
    ok(panel.open)
    ok(!panel.hasAttribute('data-dragging'))
    equal(panel.style.getPropertyValue('--rf-drawer-drag'), '0px')

    // Upward, away from the edge, it resists instead of following.
    const { clientX, clientY } = center(panel)
    pointer(panel, 'pointerdown', { clientX, clientY })
    pointer(panel, 'pointermove', { clientX, clientY: clientY - 50 })
    pointer(panel, 'pointermove', { clientX, clientY: clientY - 100 })
    ok(panel.hasAttribute('data-dragging'))
    const resisted = parseFloat(panel.style.getPropertyValue('--rf-drawer-drag'))
    ok(resisted < 0 && resisted > -30, `resisted to ${resisted}px`)
    pointer(panel, 'pointerup', { clientX, clientY: clientY - 100 })
    ok(panel.open)

    // Past a quarter of its height, it closes.
    await drag(panel, 0, height * 0.4, 600)
    await waitFor(() => !panel.open)
  })

  it('closes on a quick flick even when it travels a short way', async (t) => {
    const { $, cleanup } = render(
      <Drawer trigger="Open" title="Flick" side="left" defaultOpen>
        <div style="height: 300px">Body</div>
      </Drawer>,
    )
    t.after(cleanup)
    const panel = $('dialog.rf-drawer') as HTMLDialogElement
    await waitFor(() => panel.open)
    await drag(panel, -40, 0, 30)
    await waitFor(() => !panel.open)
  })

  it('ignores drags that start on a control', async (t) => {
    const { $, cleanup } = render(
      <Drawer trigger="Open" title="Controls" defaultOpen>
        <button type="button" class="inside">
          Inside
        </button>
      </Drawer>,
    )
    t.after(cleanup)
    const panel = $('dialog.rf-drawer') as HTMLDialogElement
    await waitFor(() => panel.open)
    const inside = $('button.inside') as HTMLButtonElement
    pointer(inside, 'pointerdown', { clientX: 200, clientY: 300 })
    pointer(inside, 'pointermove', { clientX: 200, clientY: 500 })
    ok(!panel.hasAttribute('data-dragging'))
    pointer(inside, 'pointerup', { clientX: 200, clientY: 500 })
    ok(panel.open)
  })

  it('stays open when it is not dismissible', async (t) => {
    const { $, cleanup } = render(
      <Drawer trigger="Open" title="Required" dismissible={false} defaultOpen>
        <div style="height: 300px">Body</div>
      </Drawer>,
    )
    t.after(cleanup)
    const panel = $('dialog.rf-drawer') as HTMLDialogElement
    await waitFor(() => panel.open)
    panel.dispatchEvent(new Event('cancel', { cancelable: true }))
    await drag(panel, 0, 400, 60)
    await pause(40)
    ok(panel.open)
    ok(!$('.rf-drawer-handle'), 'a drawer that cannot be dragged away shows no handle')
  })

  it('follows a controlled open state and closes from the footer', async (t) => {
    let open = true
    let view: Handle | undefined
    function Controlled(handle: Handle) {
      view = handle
      return () => (
        <Drawer
          title="Controlled"
          open={open}
          onOpenChange={(next) => {
            open = next
            void handle.update()
          }}
          footer={(close) => (
            <button type="button" class="done" mix={on('click', close)}>
              Done
            </button>
          )}
        />
      )
    }
    const { $, cleanup } = render(<Controlled />)
    t.after(cleanup)
    const panel = $('dialog.rf-drawer') as HTMLDialogElement
    await waitFor(() => panel.open)
    open = false
    await view!.update()
    await waitFor(() => !panel.open)
  })
})

describe('Drawer snap points', () => {
  const offset = (panel: HTMLElement) =>
    parseFloat(panel.style.getPropertyValue('--rf-drawer-drag'))

  it('opens at the first point and settles at the nearest one after a drag', async (t) => {
    const changes: number[] = []
    const { $, cleanup } = render(
      <Drawer
        trigger="Open"
        title="Route"
        defaultOpen
        snapPoints={['100px', '300px']}
        onSnapChange={(index) => changes.push(index)}
      >
        <div style="height: 600px">Body</div>
      </Drawer>,
    )
    t.after(cleanup)
    const panel = $('dialog.rf-drawer') as HTMLDialogElement
    await waitFor(() => panel.open)
    equal(offset(panel), 200, 'rests at the first point, the rest below the edge')
    equal(panel.dataset.snap, '0')

    // A slow drag up most of the way settles at the larger point.
    await drag(panel, 0, -150, 600)
    await waitFor(() => offset(panel) === 0)
    equal(panel.dataset.snap, '1')
    equal(changes.join(), '1')

    // Past the largest point it resists.
    const { clientX, clientY } = center(panel)
    pointer(panel, 'pointerdown', { clientX, clientY })
    pointer(panel, 'pointermove', { clientX, clientY: clientY - 50 })
    pointer(panel, 'pointermove', { clientX, clientY: clientY - 100 })
    ok(offset(panel) < 0 && offset(panel) > -30, `resisted to ${offset(panel)}px`)
    pointer(panel, 'pointerup', { clientX, clientY: clientY - 100 })
    await waitFor(() => offset(panel) === 0)

    // A quick flick down moves one point, not straight to closed.
    await drag(panel, 0, 40, 30)
    await waitFor(() => offset(panel) === 200)
    ok(panel.open)
    equal(changes.join(), '1,0')

    // From the smallest point, a drag past a quarter of its height closes it.
    await drag(panel, 0, 80, 600)
    await waitFor(() => !panel.open)
  })

  it('lets a drawer that is not dismissible move between points but not close', async (t) => {
    const { $, cleanup } = render(
      <Drawer
        trigger="Open"
        title="Required"
        defaultOpen
        dismissible={false}
        snapPoints={['100px', '300px']}
      >
        <div style="height: 600px">Body</div>
      </Drawer>,
    )
    t.after(cleanup)
    const panel = $('dialog.rf-drawer') as HTMLDialogElement
    await waitFor(() => panel.open)
    await drag(panel, 0, -180, 600)
    await waitFor(() => offset(panel) === 0)
    await drag(panel, 0, 380, 60)
    await waitFor(() => offset(panel) === 200)
    await pause(40)
    ok(panel.open)
  })

  it('steps between points from the handle with clicks and arrow keys', async (t) => {
    const { $, act, cleanup } = render(
      <Drawer trigger="Open" title="Route" defaultOpen snapPoints={['100px', '200px', '300px']}>
        <div style="height: 600px">Body</div>
      </Drawer>,
    )
    t.after(cleanup)
    const panel = $('dialog.rf-drawer') as HTMLDialogElement
    await waitFor(() => panel.open)
    const handle = $('button.rf-drawer-handle') as HTMLButtonElement
    equal(handle.getAttribute('aria-label'), 'Expand drawer')
    equal(handle.getAttribute('aria-expanded'), 'false')
    equal(handle.getAttribute('aria-controls'), panel.id)

    await act(() => handle.click())
    await waitFor(() => offset(panel) === 100)
    await act(() => press(handle, 'ArrowUp'))
    await waitFor(() => offset(panel) === 0)
    equal(handle.getAttribute('aria-label'), 'Collapse drawer')
    equal(handle.getAttribute('aria-expanded'), 'true')
    // Up at the largest point stays; a click wraps to the first.
    await act(() => press(handle, 'ArrowUp'))
    equal(offset(panel), 0)
    await act(() => handle.click())
    await waitFor(() => offset(panel) === 200)
    await act(() => press(handle, 'ArrowDown'))
    equal(offset(panel), 200, 'Down at the smallest point does not close')
    ok(panel.open)
  })

  it('follows a controlled snap index', async (t) => {
    let snap = 1
    let view: Handle | undefined
    function Controlled(handle: Handle) {
      view = handle
      return () => (
        <Drawer
          title="Controlled"
          defaultOpen
          snapPoints={['100px', '300px']}
          snap={snap}
          onSnapChange={(next) => {
            snap = next
            void handle.update()
          }}
        >
          <div style="height: 600px">Body</div>
        </Drawer>
      )
    }
    const { $, act, cleanup } = render(<Controlled />)
    t.after(cleanup)
    const panel = $('dialog.rf-drawer') as HTMLDialogElement
    await waitFor(() => panel.open && offset(panel) === 0)
    snap = 0
    await act(() => view!.update())
    await waitFor(() => offset(panel) === 200)
  })

  it('scales a marked page back while a bottom drawer is open', async (t) => {
    const { $, act, cleanup } = render(
      <div data-rf-drawer-background>
        <Drawer trigger="Open" title="Sheet" scaleBackground>
          <p>Body</p>
        </Drawer>
      </div>,
    )
    t.after(cleanup)
    const root = document.documentElement
    ok(!root.hasAttribute('data-rf-drawer-scaled'))
    await act(() => ($('button[aria-haspopup]') as HTMLButtonElement).click())
    const panel = $('dialog.rf-drawer') as HTMLDialogElement
    await waitFor(() => panel.open && root.hasAttribute('data-rf-drawer-scaled'))
    panel.dispatchEvent(new Event('cancel', { cancelable: true }))
    await waitFor(() => !panel.open && !root.hasAttribute('data-rf-drawer-scaled'))
  })
})

describe('Nested drawers', () => {
  it('steps the open drawer back while another opens in front of it', async (t) => {
    const { $, $$, act, cleanup } = render(
      <Drawer trigger="Filters" title="Filters" defaultOpen>
        <Drawer trigger="Pick a color" title="Color">
          <div style="height: 300px">Colors</div>
        </Drawer>
      </Drawer>,
    )
    t.after(cleanup)
    const [outer, inner] = Array.from($$('dialog.rf-drawer')) as HTMLDialogElement[]
    await waitFor(() => outer!.open)
    ok(!outer!.hasAttribute('data-behind'))

    const open = Array.from($$('button')).find(
      (button) => button.textContent === 'Pick a color',
    ) as HTMLButtonElement
    open.focus()
    await act(() => open.click())
    await waitFor(() => inner!.open)
    ok(outer!.hasAttribute('data-behind'), 'the drawer behind steps back')
    ok(!inner!.hasAttribute('data-behind'))

    // Dragging the front drawer brings the one behind forward in step.
    const height = inner!.getBoundingClientRect().height
    const start = center(inner!)
    pointer(inner!, 'pointerdown', start)
    pointer(inner!, 'pointermove', { clientX: start.clientX, clientY: start.clientY + 10 })
    pointer(inner!, 'pointermove', { clientX: start.clientX, clientY: start.clientY + height / 2 })
    const behind = parseFloat(outer!.style.getPropertyValue('--rf-drawer-behind'))
    ok(behind > 0.4 && behind < 0.6, `halfway closed, halfway back: ${behind}`)
    pointer(inner!, 'pointerup', { clientX: start.clientX, clientY: start.clientY + 10 })
    await waitFor(() => outer!.style.getPropertyValue('--rf-drawer-behind') === '1')

    // Escape closes only the front drawer and returns focus inside the one behind.
    inner!.dispatchEvent(new Event('cancel', { cancelable: true }))
    await waitFor(() => !inner!.open)
    ok(outer!.open, 'the drawer behind stays open')
    // The dialog's close event, a task later, brings it back.
    await waitFor(() => !outer!.hasAttribute('data-behind'))
    await waitFor(() => document.activeElement === open)
  })
})
