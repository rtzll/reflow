import { Dropdown, Tabs } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

function press(node: Element, key: string) {
  node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

async function waitFor(check: () => boolean) {
  for (let i = 0; i < 60; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected interactive state did not settle')
}

describe('Reflow interactive controls', () => {
  it('moves focus past disabled tabs and selects only after explicit activation', async (t) => {
    const { $, act, cleanup } = render(
      <Tabs
        label="Workspace"
        items={[
          { value: 'overview', label: 'Overview', panel: 'Project summary' },
          { value: 'members', label: 'Members', disabled: true },
          { value: 'activity', label: 'Activity', panel: 'Recent changes' },
        ]}
      />,
    )
    t.after(cleanup)

    const overview = $('[role="tab"][aria-label="Overview"]')
    const activity = $('[role="tab"][aria-label="Activity"]')
    const selection = $('[data-rf-selection-layer]')
    const ring = $('[data-rf-focus-layer]')
    ok(overview instanceof HTMLElement)
    ok(activity instanceof HTMLElement)
    ok(selection instanceof HTMLElement)
    ok(ring instanceof HTMLElement)

    equal(overview.getAttribute('aria-selected'), 'true')
    await waitFor(() => selection.hasAttribute('data-visible'))
    const firstPosition = selection.style.transform

    overview.focus()
    await waitFor(() => ring.hasAttribute('data-visible'))
    const firstFocusPosition = ring.style.transform
    await act(() => press(overview, 'ArrowRight'))
    equal(document.activeElement, activity)
    await waitFor(() => ring.style.transform !== firstFocusPosition)
    equal(selection.style.transform, firstPosition)
    equal(overview.getAttribute('aria-selected'), 'true')
    equal($('[role="tabpanel"]:not([hidden])')?.textContent, 'Project summary')
    await act(() => press(activity, 'Enter'))
    equal(activity.getAttribute('aria-selected'), 'true')
    equal($('[role="tabpanel"]:not([hidden])')?.textContent, 'Recent changes')
    await waitFor(() => selection.style.transform !== firstPosition)
  })

  it('opens a submenu by keyboard, selects its item, and restores the trigger focus', async (t) => {
    let selected = ''
    const { $, act, cleanup } = render(
      <Dropdown
        label="Actions"
        items={[
          { value: 'disabled', label: 'Disabled', disabled: true },
          {
            value: 'more',
            label: 'More',
            children: [{ value: 'rename', label: 'Rename' }],
          },
        ]}
        onSelect={(value) => {
          selected = value
        }}
      />,
    )
    t.after(cleanup)

    const trigger = $('button[aria-haspopup="menu"]')
    const submenu = $('[role="menuitem"][aria-haspopup="menu"]')
    const rename = $('[role="menu"][aria-label="More"] [role="menuitem"]')
    ok(trigger instanceof HTMLElement)
    ok(submenu instanceof HTMLElement)
    ok(rename instanceof HTMLElement)

    trigger.focus()
    await act(() => press(trigger, 'ArrowDown'))
    await waitFor(() => document.activeElement === submenu)
    equal(trigger.getAttribute('aria-expanded'), 'true')

    await act(() => press(submenu, 'ArrowRight'))
    await waitFor(() => document.activeElement === rename)
    equal(submenu.getAttribute('aria-expanded'), 'true')

    await act(() => press(rename, 'Enter'))
    await waitFor(() => selected === 'rename' && document.activeElement === trigger)
    equal(trigger.getAttribute('aria-expanded'), 'false')
  })
})

it('searches a menu and restores the unfiltered list when reopened', async (t) => {
  let selected = ''
  const { $, act, cleanup } = render(
    <Dropdown
      label="Actions"
      searchable
      items={[
        { value: 'edit', label: 'Edit' },
        { value: 'archive', label: 'Archive', disabled: true },
        { value: 'rename', label: 'Rename' },
      ]}
      onSelect={(value) => {
        selected = value
      }}
    />,
  )
  t.after(cleanup)
  const trigger = $('button[aria-haspopup="menu"]')
  const search = $('input[role="searchbox"]')
  ok(trigger instanceof HTMLButtonElement)
  ok(search instanceof HTMLInputElement)
  await act(() => trigger.click())
  await waitFor(() => document.activeElement === search)

  await act(() => {
    search.value = 'unknown'
    search.dispatchEvent(new InputEvent('input', { bubbles: true }))
  })
  equal($('[role="status"]')?.textContent, 'No results')
  equal($('[role="menuitem"]'), null)

  await act(() => {
    search.value = 'name'
    search.dispatchEvent(new InputEvent('input', { bubbles: true }))
  })
  const match = $('[role="menuitem"]')
  ok(match instanceof HTMLElement)
  equal(match.textContent, 'Rename')
  await act(() => press(search, 'ArrowDown'))
  await waitFor(() => document.activeElement === match)
  await act(() => press(match, 'Enter'))
  await waitFor(() => selected === 'rename' && document.activeElement === trigger)

  await act(() => trigger.click())
  await waitFor(() => document.activeElement === search)
  equal(search.value, '')
  equal($('[role="menuitem"]')?.textContent, 'Edit')
})

it('keeps checkbox menus open for pointer and keyboard selections, then restores focus on Escape', async (t) => {
  const changes: Array<[string, boolean | undefined]> = []
  const { $, act, cleanup } = render(
    <Dropdown
      label="Status"
      items={[
        { value: 'open', label: 'Open', type: 'checkbox' },
        { value: 'done', label: 'Done', type: 'checkbox' },
      ]}
      onSelect={(value, checked) => {
        changes.push([value, checked])
      }}
    />,
  )
  t.after(cleanup)
  const trigger = $('button[aria-haspopup="menu"]') as HTMLButtonElement
  await act(() => trigger.click())
  const open = $('[data-persistent-menu-item="open"]') as HTMLElement
  const done = $('[data-persistent-menu-item="done"]') as HTMLElement
  await waitFor(() => document.activeElement?.getAttribute('role') === 'menu')
  await act(() => open.click())
  equal(open.getAttribute('aria-checked'), 'true')
  equal(trigger.getAttribute('aria-expanded'), 'true')
  await act(() => press(open, 'ArrowDown'))
  await waitFor(() => document.activeElement === done)
  await act(() => press(done, ' '))
  equal(done.getAttribute('aria-checked'), 'true')
  equal(trigger.getAttribute('aria-expanded'), 'true')
  equal(
    JSON.stringify(changes),
    JSON.stringify([
      ['open', true],
      ['done', true],
    ]),
  )
  await act(() => press(done, 'Enter'))
  equal(done.getAttribute('aria-checked'), 'false')
  await act(() => press(done, 'Escape'))
  await waitFor(() => document.activeElement === trigger)
  equal(trigger.getAttribute('aria-expanded'), 'false')
})

it('flips a dropdown above the trigger and keeps its submenu inside the viewport', async (t) => {
  const { $, act, cleanup } = render(
    <div style={{ position: 'fixed', bottom: '12px', right: '12px' }}>
      <Dropdown
        label="Long menu"
        align="end"
        items={[
          { value: 'more', label: 'More', children: [{ value: 'detail', label: 'Detail' }] },
          ...Array.from({ length: 32 }, (_, index) => ({
            value: String(index),
            label: `Option ${index}`,
          })),
        ]}
      />
    </div>,
  )
  t.after(cleanup)
  const trigger = $('button[aria-haspopup="menu"]') as HTMLButtonElement
  await act(() => trigger.click())
  const popup = $('.rf-dropdown-surface') as HTMLElement
  await waitFor(() => popup.dataset.anchorPlacement?.startsWith('top') === true)
  const parent = $('[role="menuitem"][aria-haspopup="menu"]') as HTMLElement
  parent.focus()
  await act(() => press(parent, 'ArrowRight'))
  const child = $('.rf-dropdown-surface[data-menu-submenu]') as HTMLElement
  await waitFor(() => child.matches(':popover-open') && child.hasAttribute('data-anchor-placement'))
  const bounds = child.getBoundingClientRect()
  ok(
    bounds.left >= 0 &&
      bounds.right <= innerWidth &&
      bounds.top >= 0 &&
      bounds.bottom <= innerHeight,
  )
  await act(() => press(document.activeElement!, 'Escape'))
  await waitFor(() => document.activeElement === trigger)
})
