import { shortcutKeys } from './shortcut.ts'
import { attrs, on, ref } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import { spring } from '@remix-run/ui/animation'
import * as menu from '@remix-run/ui/menu'
import * as tabs from '@remix-run/ui/tabs'
import { Button } from './basic.tsx'

const hoverHost = '[data-rf-hover-host]'
const hoverItem = '[data-rf-hover-item]'
const travel = spring.transition(['transform', 'width', 'height'], 'snappy', {
  duration: 110,
})
const fastTravel = spring.transition(['transform', 'width', 'height'], 'snappy', {
  duration: 56,
})
const selectionTravel = spring.transition(['transform', 'width', 'height'], 'snappy', {
  duration: 110,
})

export interface FluidHoverOptions {
  /** Track the pointer on one axis or across a two-dimensional grid. */
  axis?: 'x' | 'y' | 'both'
  /** Keep a highlight in gaps by picking the closest enabled item. */
  nearest?: boolean
  /** Read the active item from a primitive's state instead of tracking pointer events. */
  highlightedSelector?: string
  /** Track a second highlight for the selected item. */
  selectedSelector?: string
  /** Match the row that owns keyboard focus when the focus target is nested. */
  focusSelector?: string
  /** Move the hover layer with the fast spring tier instead of the default. */
  fastHover?: boolean
  /** Let the hover layer sit on the selected item too, stacked over the selection layer, instead of handing off to it. */
  stackSelection?: boolean
}

/**
 * Attach to a positioned list with data-rf-hover-item on its rows.
 * Provide a child marked data-rf-hover-layer, with optional selection and focus layers.
 */
export function fluidHover({
  axis = 'y',
  nearest = false,
  highlightedSelector,
  selectedSelector,
  focusSelector = ':focus-visible',
  fastHover = false,
  stackSelection = false,
}: FluidHoverOptions = {}) {
  return [
    attrs({ 'data-rf-hover-host': '' }),
    ref((element, signal) => {
      if (!(element instanceof HTMLElement)) return

      const node = element
      const layer = node.querySelector<HTMLElement>(':scope > [data-rf-hover-layer]')
      const selection = node.querySelector<HTMLElement>(':scope > [data-rf-selection-layer]')
      const focusRing = node.querySelector<HTMLElement>(':scope > [data-rf-focus-layer]')
      focusRing?.style.setProperty('--rf-highlight-travel', fastTravel)
      // A host without a hover layer (InputGroup draws hover on each row) still
      // tracks [data-rf-hovered]; a detached element absorbs the layer writes.
      const hover = layer ?? node.ownerDocument.createElement('div')

      hover.style.setProperty('--rf-highlight-travel', fastHover ? fastTravel : travel)
      selection?.style.setProperty('--rf-highlight-travel', selectionTravel)
      let items: HTMLElement[] = []
      let pointer: { x: number; y: number; target: HTMLElement | null } | null = null
      let frame = 0
      let active: HTMLElement | null = null

      function owns(item: Element) {
        return item.closest(hoverHost) === node
      }

      function place(layer: HTMLElement, item: HTMLElement) {
        const rect = item.getBoundingClientRect()
        const parent = node.getBoundingClientRect()
        // Translate back into local CSS pixels when the preview scales its contents.
        const scaleX = parent.width / node.offsetWidth || 1
        const scaleY = parent.height / node.offsetHeight || 1
        const x = (rect.left - parent.left) / scaleX + node.scrollLeft - node.clientLeft
        const y = (rect.top - parent.top) / scaleY + node.scrollTop - node.clientTop
        layer.style.transform = `translate(${x}px, ${y}px)`
        layer.style.width = `${rect.width / scaleX}px`
        layer.style.height = `${rect.height / scaleY}px`
      }

      // With a selection layer, the hover layer grows out of the selected item
      // and returns to it when the pointer leaves, as the reference's tabs do.
      function measure(
        layer: HTMLElement,
        item: HTMLElement | null,
        origin: HTMLElement | null = null,
        leaving = false,
      ) {
        if (!item || item.getClientRects().length === 0) {
          if (
            origin &&
            leaving &&
            layer.hasAttribute('data-visible') &&
            origin.getClientRects().length > 0
          ) {
            layer.setAttribute('data-moving', '')
            place(layer, origin)
          }
          layer.removeAttribute('data-visible')
          return false
        }

        const entering = !layer.hasAttribute('data-visible')
        if (entering && origin && origin.getClientRects().length > 0) {
          layer.removeAttribute('data-moving')
          place(layer, origin)
          void layer.offsetWidth
          layer.setAttribute('data-moving', '')
        } else {
          layer.toggleAttribute('data-moving', !entering)
        }
        place(layer, item)
        layer.setAttribute('data-visible', '')
        return true
      }

      function closestItem(x: number, y: number, candidates: HTMLElement[]) {
        let closest: HTMLElement | null = null
        let minDistance = Infinity
        for (const item of candidates) {
          if (item.getClientRects().length === 0) continue
          const rect = item.getBoundingClientRect()
          const dx = Math.max(rect.left - x, 0, x - rect.right)
          const dy = Math.max(rect.top - y, 0, y - rect.bottom)
          const distance = axis === 'x' ? dx : axis === 'y' ? dy : Math.hypot(dx, dy)
          if (distance < minDistance) {
            closest = item
            minDistance = distance
          }
        }
        return closest
      }

      function update() {
        frame = 0
        const candidates = items.filter(
          (item) => !item.matches(':disabled, [aria-disabled="true"]'),
        )
        if (focusRing) {
          const focused = candidates.find(
            (item) => item.matches(focusSelector) && !item.closest('[inert]'),
          )
          measure(focusRing, focused ?? null)
        }
        const selected = selectedSelector
          ? (items.find((item) => item.matches(selectedSelector)) ?? null)
          : null
        let next: HTMLElement | null = null
        if (highlightedSelector) {
          next = candidates.find((item) => item.matches(highlightedSelector)) ?? null
        } else if (pointer) {
          // Re-hit-test after scrolling or resizing. The pointer may be stationary.
          const hit = node.ownerDocument.elementFromPoint(pointer.x, pointer.y)
          const target = (hit ?? pointer.target)?.closest<HTMLElement>(hoverItem)
          if (target && candidates.includes(target)) next = target
          else if (nearest && hit && node.contains(hit)) {
            next = closestItem(pointer.x, pointer.y, candidates)
          }
        }

        if (next === selected && !stackSelection) next = null
        if (active !== next) {
          active?.removeAttribute('data-rf-hovered')
          next?.setAttribute('data-rf-hovered', '')
          active = next
        }
        const wasVisible = hover.hasAttribute('data-visible')
        measure(hover, next, stackSelection ? null : selected, !next && !pointer)
        // Park the idle hover layer on the selected item so it grows from there.
        if (layer && selected && !next && !wasVisible && !stackSelection) {
          if (selected.getClientRects().length > 0) place(hover, selected)
        }
        if (selection) node.toggleAttribute('data-rf-has-selection', measure(selection, selected))
      }

      function schedule() {
        if (!frame) frame = requestAnimationFrame(update)
      }

      const size = new ResizeObserver(schedule)
      function syncItems() {
        size.disconnect()
        items = Array.from(node.querySelectorAll<HTMLElement>(hoverItem)).filter(owns)
        size.observe(node)
        for (const item of items) size.observe(item)
        schedule()
      }

      const changes = new MutationObserver((records) => {
        if (records.some((record) => record.type === 'childList')) syncItems()
        else schedule()
      })
      changes.observe(node, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          'aria-selected',
          'aria-current',
          'aria-disabled',
          'checked',
          'data-highlighted',
          'data-rf-selected',
          'disabled',
          'hidden',
        ],
      })

      if (!highlightedSelector) {
        node.addEventListener(
          'pointermove',
          (event) => {
            if (event.pointerType === 'touch') return
            pointer = {
              x: event.clientX,
              y: event.clientY,
              target: event.target instanceof HTMLElement ? event.target : null,
            }
            schedule()
          },
          { signal, passive: true },
        )
        const clearPointer = () => {
          pointer = null
          schedule()
        }
        node.addEventListener('pointerleave', clearPointer, { signal })
        node.addEventListener('keydown', clearPointer, { signal })
      }

      if (focusRing) {
        node.addEventListener('focusin', schedule, { signal })
        node.addEventListener('focusout', schedule, { signal })
      }
      if (selection) {
        node.addEventListener('change', schedule, { signal })
        node.closest('form')?.addEventListener('reset', schedule, { signal })
      }
      node.addEventListener('scroll', schedule, { signal, passive: true })
      syncItems()
      signal.addEventListener(
        'abort',
        () => {
          changes.disconnect()
          size.disconnect()
          cancelAnimationFrame(frame)
          active?.removeAttribute('data-rf-hovered')
          hover.removeAttribute('data-visible')
          selection?.removeAttribute('data-visible')
          focusRing?.removeAttribute('data-visible')
          node.removeAttribute('data-rf-has-selection')
        },
        { once: true },
      )
    }),
  ]
}

export interface TabItem {
  value: string
  label: string
  panel?: RemixNode
  icon?: RemixNode
  disabled?: boolean
}

export interface TabsProps {
  label: string
  items: readonly TabItem[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  variant?: 'pill' | 'underline'
  activeLabel?: boolean
  size?: 'default' | 'compact'
}

export function Tabs(handle: Handle<TabsProps>) {
  const indicators = fluidHover({
    axis: 'x',
    selectedSelector: '[aria-selected="true"]',
    fastHover: true,
  })
  return () => {
    const {
      label,
      items,
      defaultValue,
      value,
      onValueChange,
      variant = 'pill',
      activeLabel,
      size,
    } = handle.props
    const initial = items.find((item) => item.value === defaultValue && !item.disabled)?.value

    return (
      <tabs.Context activeTab={value} defaultActiveTab={initial} onActiveTabChange={onValueChange}>
        <div class="rf-tabs" data-variant={variant} data-density={size} mix={tabs.root()}>
          <div
            class="rf-tabs-list"
            aria-label={label}
            mix={[
              tabs.list(),
              indicators,
              on(
                'keydown',
                (event) => {
                  if (
                    !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(
                      event.key,
                    )
                  )
                    return
                  const enabled = Array.from(
                    event.currentTarget.querySelectorAll<HTMLButtonElement>(
                      '[role="tab"]:not(:disabled)',
                    ),
                  )
                  const index = enabled.indexOf(event.target as HTMLButtonElement)
                  if (index < 0) return
                  event.preventDefault()
                  event.stopPropagation()
                  const next =
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? enabled.length - 1
                        : (index +
                            (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) +
                            enabled.length) %
                          enabled.length
                  enabled[next]?.focus()
                },
                true,
              ),
            ]}
          >
            <span
              class="rf-highlight rf-tab-selection"
              aria-hidden="true"
              data-rf-selection-layer
            />
            <span class="rf-highlight rf-tab-hover" aria-hidden="true" data-rf-hover-layer />
            <span class="rf-highlight rf-focus-ring" aria-hidden="true" data-rf-focus-layer />
            {items.map((item) => (
              <button
                key={item.value}
                class="rf-tab"
                type="button"
                aria-label={item.label}
                data-rf-hover-item
                data-active-label={activeLabel && item.icon != null ? '' : undefined}
                mix={tabs.tab({ name: item.value, disabled: item.disabled })}
              >
                {item.icon != null && (
                  <span class="rf-tab-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span class="rf-tab-label" data-label={item.label}>
                  <span>{item.label}</span>
                </span>
              </button>
            ))}
          </div>
          {items.map((item) => (
            <div
              key={item.value}
              class="rf-tab-panel"
              tabIndex={item.panel != null ? 0 : undefined}
              mix={tabs.panel({ name: item.value })}
            >
              {item.panel}
            </div>
          ))}
        </div>
      </tabs.Context>
    )
  }
}

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
}

export function Dropdown(handle: Handle<DropdownProps>) {
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
    } = handle.props
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
              mix={menu.trigger({
                placement: `${handle.props.side ?? 'bottom'}-${align}`,
                offset: 6,
              })}
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
              mix={menu.trigger({
                placement: `${handle.props.side ?? 'bottom'}-${align}`,
                offset: 6,
              })}
            >
              {handle.props.triggerContent ?? label}
            </Button>
          )}
          <DropdownSurface
            inline={handle.props.inline}
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
  }>,
) {
  const context = handle.context.get(menu.Context)
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
          {handle.props.inline && (
            <span class="rf-highlight rf-focus-ring" aria-hidden="true" data-rf-focus-layer />
          )}
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
