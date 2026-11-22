import { ContextMenu, Tree } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'
import type { Handle } from 'remix/component'

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

it('opens and leaves a submenu by keyboard and dispatches the chosen leaf to the invoking row', async (t) => {
  const selected: string[] = []
  const { $, act, cleanup } = render(
    <ContextMenu
      label="File actions"
      target="button"
      items={[
        {
          value: 'copy',
          label: 'Copy',
          children: [
            { value: 'path', label: 'Relative path', icon: <span>→</span>, shortcut: 'Alt+P' },
          ],
        },
      ]}
      onSelect={(action, target) => selected.push(action + ':' + target.id)}
    >
      <button id="source">Source</button>
      <button id="readme">README</button>
    </ContextMenu>,
  )
  t.after(cleanup)
  const row = $('#readme')!
  await act(() => press(row, 'ContextMenu'))
  const root = $('[role="menu"][aria-label="File actions"]')!
  const parent = $('[role="menuitem"][aria-haspopup="menu"]')!
  const path = $('[role="menu"][aria-label="Copy"] [role="menuitem"]')!
  await untilFocused(root)
  await act(() => press(root, 'ArrowDown'))
  await untilFocused(parent)
  await act(() => press(parent, 'ArrowRight'))
  await untilFocused(path)
  equal(path.querySelector('[aria-hidden="true"]')?.textContent, '→')
  equal(Array.from(path.querySelectorAll('kbd'), (key) => key.textContent).join('+'), 'Alt+P')
  await act(() => press(path, 'ArrowLeft'))
  await untilFocused(parent)
  equal(selected.length, 0)
  await act(() => press(parent, 'ArrowRight'))
  await untilFocused(path)
  await act(() => press(path, 'Enter'))
  await untilFocused(row)
  equal(selected.join(), 'path:readme')
})

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

it('dismisses the previous menu when another region opens its own actions', async (t) => {
  const { $, $$, act, cleanup } = render(
    <>
      {['Files', 'Tabs'].map((label) => (
        <ContextMenu
          key={label}
          label={label}
          target="button"
          items={[{ value: 'open', label: 'Open' }]}
        >
          <button>{label}</button>
        </ContextMenu>
      ))}
    </>,
  )
  t.after(cleanup)
  for (const button of $$('button')) {
    await act(() =>
      button.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
    )
    await untilFocused($('[role="menu"][aria-label="' + button.textContent + '"]')!)
  }
  equal($$(':popover-open').length, 1)
})

it('builds the items for the row that opened the menu', async (t) => {
  const { $, $$, act, cleanup } = render(
    <ContextMenu
      label="Ticket actions"
      target="button"
      items={(row) => [
        { value: 'todo', label: 'Move to Todo', disabled: row.dataset.status === 'todo' },
        { value: 'done', label: 'Move to Done', disabled: row.dataset.status === 'done' },
      ]}
    >
      <button data-status="todo">First</button>
      <button data-status="done">Second</button>
    </ContextMenu>,
  )
  t.after(cleanup)
  const disabled = () =>
    Array.from($$('[role="menuitem"][aria-disabled="true"]'), (item) => item.textContent).join()
  const [first, second] = Array.from($$('button'))
  await act(() => press(first!, 'ContextMenu'))
  await untilFocused($('[role="menu"]')!)
  equal(disabled(), 'Move to Todo')
  await act(() => press($('[role="menu"]')!, 'Escape'))
  await untilFocused(first!)
  await act(() => press(second!, 'ContextMenu'))
  await untilFocused($('[role="menu"]')!)
  equal(disabled(), 'Move to Done')
})

it('unmounts closed menus, leaves empty item lists to the browser, and ignores synthetic keyboard contextmenu events', async (t) => {
  let builds = 0
  const { $, act, cleanup } = render(
    <div>
      <ContextMenu
        label="Dynamic actions"
        target="button"
        items={(row) => {
          builds++
          return row.id === 'empty' ? [] : [{ value: 'open', label: 'Open' }]
        }}
      >
        <button id="normal">Normal</button>
        <button id="empty">Empty</button>
      </ContextMenu>
      <p id="outside">Blank</p>
    </div>,
  )
  t.after(cleanup)

  const empty = $('#empty') as HTMLButtonElement
  await act(() => {
    ok(empty.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })))
  })
  equal($('[role="menu"]'), null)

  const normal = $('#normal') as HTMLButtonElement
  builds = 0
  await act(() => press(normal, 'ContextMenu'))
  const menu = $('[role="menu"]')!
  await untilFocused(menu)
  equal(builds, 1)

  // A synthetic contextmenu event following the keyboard open should not remount the menu.
  await act(() => {
    equal(
      normal.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 0 }),
      ),
      false,
    )
  })
  equal(builds, 1)
  equal($('[role="menu"]'), menu)

  // Right-clicking blank space dismisses and unmounts the closed menu surface.
  await act(() => {
    $('#outside')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
  })
  for (let i = 0; i < 60 && $('[role="menu"]'); i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 10))
  }
  equal($('[role="menu"]'), null)
})

it('runs an item from its shortcut on the focused row only when shortcuts are on', async (t) => {
  const selected: string[] = []
  function key(node: Element, init: KeyboardEventInit) {
    return node.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }),
    )
  }
  const items = (row: HTMLElement) => [
    { value: 'copy', label: 'Copy path', shortcut: '⌘C' },
    { value: 'delete', label: 'Delete', shortcut: '⌫', disabled: row.id === 'readme' },
    {
      value: 'share',
      label: 'Share',
      shortcut: 'S',
      children: [{ value: 'link', label: 'Copy link', shortcut: '⇧⌘L' }],
    },
    { value: 'pin', label: 'Pin', type: 'checkbox' as const, checked: false, shortcut: 'mod+p' },
  ]
  function Files(handle: Handle<{ shortcuts?: boolean }>) {
    return () => (
      <ContextMenu
        label="File actions"
        target="[data-file]"
        items={items}
        shortcuts={handle.props.shortcuts}
        onSelect={(action, target, checked) =>
          selected.push(action + ':' + target.id + (checked === undefined ? '' : ':' + checked))
        }
      >
        <div id="source" data-file tabIndex={0}>
          Source <input aria-label="Rename source" />
        </div>
        <div id="readme" data-file tabIndex={0}>
          README
        </div>
      </ContextMenu>
    )
  }
  const { $, act, cleanup } = render(<Files shortcuts />)
  t.after(cleanup)
  const source = $('#source') as HTMLElement
  const readme = $('#readme') as HTMLElement

  // ⌘ means Command on a Mac and Ctrl elsewhere.
  await act(() => key(source, { key: 'c', code: 'KeyC', metaKey: true }))
  await act(() => key(source, { key: 'c', code: 'KeyC', ctrlKey: true }))
  equal(key(source, { key: 'Backspace' }), false, 'a handled shortcut prevents the default')
  await act(() => key(readme, { key: 'Backspace' }))
  // Submenu leaves run; the submenu's own row does not.
  await act(() => key(readme, { key: 'l', code: 'KeyL', metaKey: true, shiftKey: true }))
  await act(() => key(readme, { key: 's', code: 'KeyS' }))
  await act(() => key(readme, { key: 'p', code: 'KeyP', metaKey: true }))
  // Typing in a field inside a row is left alone, as is an already handled key.
  await act(() => key($('input') as HTMLElement, { key: 'Backspace' }))
  const handled = new KeyboardEvent('keydown', {
    key: 'Backspace',
    bubbles: true,
    cancelable: true,
  })
  handled.preventDefault()
  source.dispatchEvent(handled)
  equal(selected.join(' '), 'copy:source copy:source delete:source link:readme pin:readme:true')
  equal($('[role="menu"]'), null, 'shortcuts run without opening the menu')

  selected.length = 0
  const off = render(<Files />)
  t.after(off.cleanup)
  await off.act(() =>
    key(off.$('#source') as HTMLElement, { key: 'c', code: 'KeyC', metaKey: true }),
  )
  equal(selected.length, 0)
})
