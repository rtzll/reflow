import { shortcutKeys } from './behaviors/shortcut.ts'
import { hoverIntent } from './behaviors/hover-intent.ts'
import { fluidHover } from './systems/fluid-hover.ts'
import { attrs, on, ref } from 'remix/component'
import type { Handle, MixInput, RemixNode } from 'remix/component'
import * as menu from '@remix-run/ui/menu'
import { Button } from './button.tsx'

export interface DropdownItem {
  /** Checkbox rows stay open by default. Override for an action with different dismissal behavior. */
  closeOnSelect?: boolean
  group?: string
  value: string
  label: string
  icon?: RemixNode
  shortcut?: string
  disabled?: boolean
  separatorBefore?: boolean
  type?: 'checkbox' | 'radio'
  checked?: boolean
  children?: readonly DropdownItem[]
}

export interface DropdownProps {
  label: string
  triggerContent?: RemixNode
  items: readonly DropdownItem[]
  onSelect?: (value: string, checked?: boolean) => void
  size?: 'default' | 'compact'
  align?: 'start' | 'end'
  /** `bare` renders an unstyled button trigger that takes its look from `triggerClass`, for sidebar rows and actions. */
  variant?: 'outline' | 'ghost' | 'bare'
  triggerClass?: string
  /** Extra behavior on the trigger, such as a Tooltip's trigger props. */
  triggerMix?: MixInput
  /** Which side of the trigger the menu opens on. Default bottom. */
  side?: 'top' | 'bottom'
  searchable?: boolean
  searchPlaceholder?: string
  inline?: boolean
  creatable?: boolean
  onCreate?: (value: string) => void
  /** Show the trailing chevron on the trigger. Default true. */
  chevron?: boolean
  /** Text shown when a search matches nothing. */
  emptyMessage?: string
  /** Opens the menu when a mouse rests on the trigger and closes it once the pointer leaves the trigger and the menu. A click pins it open; touch and the keyboard open it as usual. */
  openOnHover?: boolean
  /** With openOnHover: ms the pointer rests on the trigger before the menu opens. Default 100. */
  delay?: number
  /** With openOnHover: ms before the menu closes once the pointer has left, long enough to cross the gap to the menu. Default 150. */
  closeDelay?: number
}

/** The part of a menu context the hover control drives. */
interface HoverMenu {
  readonly isOpen: boolean
  readonly state: string
  open(options?: { strategy?: 'list' | 'none' }): Promise<void>
  closeAll(options?: { focusRoot?: boolean }): Promise<void>
}

/**
 * Hover intent shared by a hover-opening trigger and its menu surface, as in
 * the reference. A menu opened by hover closes when the pointer leaves both;
 * one opened by a click or the keyboard, or pinned by a click, stays until it
 * is dismissed as usual. A hover open is a preview, so it leaves focus in place.
 */
function createHoverControl(signal: AbortSignal) {
  let menu: HoverMenu | undefined
  // True while the open menu is one the hover timer opened.
  let hoverOpened = false
  const intent = hoverIntent(signal, {
    open() {
      // A menu already open from a click or a pin stays the reader's.
      if (!menu || menu.isOpen) return
      // The menu ignores opens while a close is still settling; keep
      // asking while the pointer rests on the trigger.
      if (menu.state !== 'idle') {
        intent.enter(16)
        return
      }
      hoverOpened = true
      void menu.open({ strategy: 'none' })
    },
    close() {
      if (!menu || !hoverOpened) return
      hoverOpened = false
      if (menu.isOpen) void menu.closeAll({ focusRoot: false })
    },
  })
  return {
    attach(next: HoverMenu) {
      menu = next
    },
    cancel: intent.cancel,
    enter: intent.enter,
    leave: intent.leave,
    /** A click on a hover-opened trigger pins the menu instead of closing it. Returns true when it pinned. */
    pin() {
      intent.cancel()
      const pinned = hoverOpened && !!menu?.isOpen
      hoverOpened = false
      return pinned
    },
    /** Any other open (click, keyboard) belongs to the reader. */
    release() {
      hoverOpened = false
    },
  }
}

type HoverControl = ReturnType<typeof createHoverControl>

function hoverTrigger(hover: HoverControl, delay: number, closeDelay: number) {
  return [
    on<HTMLElement, 'pointerenter'>('pointerenter', (event) => {
      if (event.pointerType === 'mouse') hover.enter(delay)
    }),
    on<HTMLElement, 'pointerleave'>('pointerleave', (event) => {
      if (event.pointerType === 'mouse') hover.leave(closeDelay)
    }),
    // Capture runs before the menu trigger's own click toggle.
    on<HTMLElement, 'click'>(
      'click',
      (event) => {
        if (!hover.pin()) return
        event.preventDefault()
        event.stopImmediatePropagation()
      },
      true,
    ),
    on<HTMLElement, 'keydown'>('keydown', () => hover.release()),
  ]
}

export function Dropdown(handle: Handle<DropdownProps>) {
  const hover = createHoverControl(handle.signal)
  let query = ''
  let created: DropdownItem[] = []
  const createValue = `${handle.id}-create`
  function setQuery(next: string) {
    if (query === next) return
    query = next
    void handle.update()
  }

  return () => {
    const {
      label,
      items,
      size,
      align = 'start',
      variant = 'outline',
      searchable,
      searchPlaceholder = 'Search…',
      delay = 100,
      closeDelay = 150,
    } = handle.props
    const hovering = !!handle.props.openOnHover && !handle.props.inline
    const hoverMix = hovering ? hoverTrigger(hover, delay, closeDelay) : undefined
    const allItems = [
      ...items,
      ...created.filter((entry) => !items.some((item) => item.value === entry.value)),
    ]
    const create =
      handle.props.creatable &&
      query.trim() &&
      !allItems.some((item) => item.label.toLowerCase() === query.trim().toLowerCase())
    const displayedItems = create
      ? [
          ...allItems,
          {
            value: createValue,
            label: `Create “${query.trim()}”`,
            closeOnSelect: !allItems.some((item) => item.type === 'checkbox'),
          },
        ]
      : allItems
    return (
      <div
        class="rf-dropdown"
        data-density={size}
        mix={menu.onMenuSelect((event) => {
          if (event.item.value === createValue) {
            const value = query.trim()
            created = [...created, { value, label: value }]
            handle.props.onCreate?.(value)
            handle.props.onSelect?.(value)
            setQuery('')
            return
          }
          handle.props.onSelect?.(event.item.value ?? event.item.name, event.item.checked)
        })}
      >
        <menu.Context label={label}>
          {!handle.props.inline && variant === 'bare' && (
            <button
              type="button"
              aria-label={label}
              class={`rf-dropdown-trigger ${handle.props.triggerClass ?? ''}`}
              mix={[
                menu.trigger({
                  placement: `${handle.props.side ?? 'bottom'}-${align}`,
                  offset: 6,
                }),
                hoverMix,
                handle.props.triggerMix,
              ]}
            >
              {handle.props.triggerContent ?? label}
            </button>
          )}
          {!handle.props.inline && variant !== 'bare' && (
            <Button
              class="rf-dropdown-trigger"
              variant={variant === 'ghost' ? 'ghost' : 'tertiary'}
              size={size}
              trailingIcon={
                handle.props.chevron === false ? undefined : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="m4 6 4 4 4-4"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                )
              }
              mix={[
                menu.trigger({
                  placement: `${handle.props.side ?? 'bottom'}-${align}`,
                  offset: 6,
                }),
                hoverMix,
                handle.props.triggerMix,
              ]}
            >
              {handle.props.triggerContent ?? label}
            </Button>
          )}
          <DropdownSurface
            inline={handle.props.inline}
            hover={hovering ? { control: hover, closeDelay } : undefined}
            items={displayedItems}
            emptyMessage={handle.props.emptyMessage}
            search={
              searchable || handle.props.creatable
                ? { query, setQuery, placeholder: searchPlaceholder }
                : undefined
            }
          />
        </menu.Context>
      </div>
    )
  }
}

interface MenuSearch {
  query: string
  setQuery(query: string): void
  placeholder: string
}

function matchesMenuQuery(item: DropdownItem, query: string): boolean {
  return (
    item.label.toLowerCase().includes(query) ||
    !!item.children?.some((child) => matchesMenuQuery(child, query))
  )
}

function DropdownSurface(
  handle: Handle<{
    items: readonly DropdownItem[]
    search?: MenuSearch
    inline?: boolean
    emptyMessage?: string
    /** Set on the root surface of an openOnHover Dropdown. */
    hover?: { control: HoverControl; closeDelay: number }
  }>,
) {
  const context = handle.context.get(menu.Context)
  handle.props.hover?.control.attach(context)
  const highlight = fluidHover({ highlightedSelector: '[data-highlighted]' })
  const checked = new Map<string, boolean>()

  // Remix UI 0.13.1 unconditionally closes after its activation path. Keep
  // registration, navigation and popup behavior, but commit persistent rows
  // before that path runs (the selection event itself is not cancelable).
  function selectPersistent(event: MouseEvent | KeyboardEvent) {
    if (event instanceof KeyboardEvent && !['Enter', ' '].includes(event.key)) return
    const node =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-persistent-menu-item]')
        : null
    if (!node || node.closest('[role="menu"]') !== event.currentTarget) return
    const item = handle.props.items.find((item) => item.value === node.dataset.persistentMenuItem)
    if (!item || item.disabled) return
    event.preventDefault()
    event.stopPropagation()
    const next =
      item.type === 'checkbox'
        ? !(item.checked ?? checked.get(item.value) ?? false)
        : item.type === 'radio'
          ? true
          : undefined
    if (next !== undefined) checked.set(item.value, next)
    node.focus()
    context.highlight(node.id)
    node.dispatchEvent(
      new menu.MenuSelectEvent({
        id: node.id,
        name: item.value,
        value: item.value,
        label: item.label,
        type: item.type ?? 'item',
        checked: next,
      }),
    )
    void handle.update()
  }
  let field: HTMLInputElement | null = null
  const searchRef = ref((node, signal) => {
    if (!(node instanceof HTMLInputElement)) return
    field = node
    signal.addEventListener(
      'abort',
      () => {
        if (field === node) field = null
      },
      { once: true },
    )
  })

  return () => {
    const { search } = handle.props
    const normalized = search?.query.trim().toLowerCase()
    const items = normalized
      ? handle.props.items.filter((item) => matchesMenuQuery(item, normalized))
      : handle.props.items

    return (
      <div
        class="rf-menu-surface rf-dropdown-surface"
        data-inline={handle.props.inline || undefined}
        mix={[
          !handle.props.inline && menu.popover(),
          // A hover-opened menu stays while the pointer is over it, submenus
          // included (they render inside this surface), and closes once the
          // pointer leaves both the menu and its trigger.
          handle.props.hover && [
            on<HTMLElement, 'pointerenter'>('pointerenter', (event) => {
              if (event.pointerType === 'mouse') handle.props.hover?.control.cancel()
            }),
            on<HTMLElement, 'pointerleave'>('pointerleave', (event) => {
              const hover = handle.props.hover
              if (event.pointerType === 'mouse' && hover) hover.control.leave(hover.closeDelay)
            }),
          ],
          search &&
            on('toggle', (event) => {
              if (event.newState === 'open') field?.focus()
              else handle.props.search?.setQuery('')
            }),
        ]}
      >
        {search && (
          <div class="rf-menu-search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m21 21-4.34-4.34" />
              <circle cx="11" cy="11" r="8" />
            </svg>
            <input
              type="text"
              role="searchbox"
              spellcheck="false"
              aria-label={search.placeholder}
              placeholder={search.placeholder}
              autocomplete="off"
              value={search.query}
              mix={[
                searchRef,
                on('input', (event) => {
                  context.highlight(null)
                  search.setQuery(event.currentTarget.value)
                }),
                on('keydown', (event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault()
                    context.navigate(event.key === 'ArrowDown' ? 'first' : 'last')
                  } else if (event.key === 'Enter') {
                    event.preventDefault()
                    context.navigate('first')
                    if (document.activeElement instanceof HTMLElement)
                      document.activeElement.click()
                  } else if (event.key === 'Tab') {
                    void context.closeAll({ focusRoot: false })
                  }
                }),
              ]}
            />
          </div>
        )}
        <div
          class="rf-menu-list"
          tabIndex={handle.props.inline ? 0 : undefined}
          mix={[
            menu.list(),
            on<HTMLElement, 'click'>('click', selectPersistent, true),
            on<HTMLElement, 'keydown'>('keydown', selectPersistent, true),
            handle.props.inline && attrs({ tabIndex: 0 }),
            highlight,
            search &&
              on(
                'keydown',
                (event) => {
                  if (
                    !field ||
                    event.isComposing ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.altKey ||
                    !(event.target instanceof Element) ||
                    event.target.closest('[role="menu"]') !== event.currentTarget ||
                    (event.key.length !== 1 && event.key !== 'Backspace') ||
                    event.key === ' '
                  )
                    return
                  event.preventDefault()
                  event.stopPropagation()
                  field.focus()
                  context.highlight(null)
                  search.setQuery(
                    event.key === 'Backspace'
                      ? search.query.slice(0, -1)
                      : search.query + event.key,
                  )
                },
                true,
              ),
          ]}
        >
          <span class="rf-highlight rf-menu-hover" aria-hidden="true" data-rf-hover-layer />
          {/* As in the reference, one focus ring glides between rows on keyboard navigation. */}
          <span class="rf-highlight rf-focus-ring" aria-hidden="true" data-rf-focus-layer />
          {items.length === 0 && search && (
            <div class="rf-menu-empty" role="status">
              {handle.props.emptyMessage ?? 'No results'}
            </div>
          )}
          {items.map((item, index) => (
            <div key={item.value} role="none" class="rf-menu-entry">
              {item.separatorBefore && (index > 0 || !normalized) && (
                <div class="rf-menu-separator" role="separator" />
              )}
              {item.group && item.group !== items[index - 1]?.group && (
                <div class="rf-menu-group-label">{item.group}</div>
              )}
              {item.children && item.children.length > 0 ? (
                <menu.Context label={item.label}>
                  <div
                    class="rf-menu-item"
                    data-rf-hover-item
                    mix={menu.submenuTrigger({
                      value: item.value,
                      label: item.label,
                      disabled: item.disabled,
                    })}
                  >
                    <DropdownItemContent item={item} submenu />
                  </div>
                  <DropdownSurface items={item.children} />
                </menu.Context>
              ) : (
                <div
                  class="rf-menu-item"
                  data-rf-hover-item
                  data-persistent-menu-item={
                    (item.closeOnSelect ?? item.type !== 'checkbox') ? undefined : item.value
                  }
                  mix={menu.item({
                    name: item.value,
                    value: item.value,
                    label: item.label,
                    type: item.type,
                    checked: item.checked ?? checked.get(item.value),
                    disabled: item.disabled,
                  })}
                >
                  <DropdownItemContent item={item} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
}

function DropdownItemContent(handle: Handle<{ item: DropdownItem; submenu?: boolean }>) {
  return () => {
    const { item, submenu } = handle.props
    return (
      <>
        {item.icon != null && (
          <span class="rf-menu-icon" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span class="rf-menu-label" data-label={item.label}>
          <span>{item.label}</span>
        </span>
        {item.shortcut && (
          <span class="rf-menu-shortcut">
            {shortcutKeys(item.shortcut).map((key, index) => (
              <kbd key={index}>{key}</kbd>
            ))}
          </span>
        )}
        {item.type && !submenu && (
          <span class="rf-menu-check" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="m4 12 5 5L20 6"
                pathLength="1"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        )}
        {submenu && (
          <svg
            class="rf-menu-chevron"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m6 4 4 4-4 4"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        )}
      </>
    )
  }
}
