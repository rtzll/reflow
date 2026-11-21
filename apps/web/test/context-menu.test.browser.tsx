import { ContextMenu, Tree } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

function press(node: Element, key: string, shiftKey = false) {
  return node.dispatchEvent(
    new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
  )
}

async function untilFocused(element: Element) {
  for (let i = 0; i < 120 && document.activeElement !== element; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  equal(document.activeElement, element)
}

it('opens file actions from the focused row, restores focus on Escape and targets that file on selection', async (t) => {
  const actions: string[] = []
  const { $, act, cleanup } = render(
    <ContextMenu
      label="File actions"
      target='[role="treeitem"][aria-selected]'
      items={[{ value: 'open', label: 'Open file' }]}
      onSelect={(action, target) => actions.push(action + ':' + target.dataset.treeValue)}
    >
      <Tree
        label="Project files"
        defaultValue="source"
        items={[
          { value: 'source', label: 'Source' },
          { value: 'readme', label: 'README.md' },
        ]}
      />
    </ContextMenu>,
  )
  t.after(cleanup)
  const readme = $('[aria-label="README.md"]') as HTMLElement
  const source = $('[aria-label="Source"]')!
  await act(() => readme.focus())
  await act(() => press(readme, 'F10', true))
  const menu = $('[role="menu"][aria-label="File actions"]')!
  await untilFocused(menu)
  await act(() => press(menu, 'Escape'))
  await untilFocused(readme)
  equal(source.getAttribute('aria-selected'), 'true')
  equal(actions.length, 0)

  await act(() => press(readme, 'ContextMenu'))
  const reopened = $('[role="menu"][aria-label="File actions"]')!
  await untilFocused(reopened)
  await act(() => press(reopened, 'ArrowDown'))
  const item = $('[role="menuitem"]')!
  await untilFocused(item)
  await act(() => press(item, 'Enter'))
  await untilFocused(readme)
  equal(actions.join(), 'open:readme')
})

it('leaves editing, unmatched elements and handled context clicks to their owners', async (t) => {
  const { $, act, cleanup } = render(
    <ContextMenu label="Actions" target=".file" items={[{ value: 'open', label: 'Open' }]}>
      <div class="file" tabIndex={0}>
        <input />
        <textarea />
        <select />
        <div contenteditable="true">
          <span>Editable</span>
        </div>
        <button>Handles its own menu</button>
      </div>
      <p>Blank space</p>
    </ContextMenu>,
  )
  t.after(cleanup)
  $('button')!.addEventListener('contextmenu', (event) => event.preventDefault())
  for (const selector of ['input', 'textarea', 'select', '[contenteditable] span', 'p']) {
    const element = $(selector)!
    await act(() => {
      ok(element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })))
      ok(press(element, 'F10', true))
    })
  }
  await act(() =>
    $('button')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
  )
  equal($('[role="menu"]'), null)
})

it('keeps focus on an outside control that dismisses the menu', async (t) => {
  const { $, act, cleanup } = render(
    <div>
      <ContextMenu label="Actions" target="button" items={[{ value: 'open', label: 'Open' }]}>
        <button id="file">File</button>
      </ContextMenu>
      <button id="outside">Another control</button>
    </div>,
  )
  t.after(cleanup)
  const file = $('#file') as HTMLButtonElement
  const outside = $('#outside') as HTMLButtonElement
  await act(() => press(file, 'ContextMenu'))
  const menu = $('[role="menu"]')!
  await untilFocused(menu)
  await act(() => {
    outside.focus()
    outside.click()
  })
  // Browser tests load no CSS. Allow the popover's closing frames to finish.
  for (let frame = 0; frame < 3; frame++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  equal(document.activeElement, outside)
  equal($(':popover-open'), null)
})

it('releases the page scroll lock when an open context menu leaves the page', async () => {
  const overflow = document.documentElement.style.overflow
  const { $, act, cleanup } = render(
    <ContextMenu label="Actions" target="button" items={[{ value: 'open', label: 'Open' }]}>
      <button>File</button>
    </ContextMenu>,
  )
  try {
    await act(() => press($('button')!, 'ContextMenu'))
    await untilFocused($('[role="menu"]')!)
  } finally {
    cleanup()
  }
  equal(document.documentElement.style.overflow, overflow)
})
