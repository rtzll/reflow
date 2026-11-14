import {
  formatShortcut,
  isMacPlatform,
  matchesShortcut,
  parseShortcut,
} from './behaviors/shortcut.ts'
import { on, ref } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import { Button } from './button.tsx'
import { Tabs } from './tabs.tsx'
import { fluidHover } from './systems/fluid-hover.ts'
import { ScrollArea } from './scroll-area.tsx'
import { Dialog } from './dialog.tsx'
import { navigationIndex } from './behaviors/list-navigation.ts'

export interface CommandItem {
  value: string
  label: string
  description?: string
  group?: string
  /** Quick filter membership; defaults to the displayed group. */
  filter?: string
  keywords?: readonly string[]
  disabled?: boolean
  /** Display hint for a shortcut provided by the consumer. */
  shortcut?: string
  icon?: RemixNode
  /** Overrides the highlighted command label in the Enter hint. */
  action?: string
}

export interface CommandMenuProps {
  items: readonly CommandItem[]
  /** Replaces the label and description of a row. The icon and shortcut caps stay. */
  renderItem?: (item: CommandItem) => RemixNode
  /** `true` shows the default key hints; a node replaces them. Omitted, there is no footer. */
  footer?: RemixNode | boolean
  label?: string
  placeholder?: string
  /** Filter names to expose above the results. Items default to their group. */
  filters?: readonly string[]
  /** Command values to show first while the unfiltered query is empty. */
  suggestions?: readonly string[]
  /** Shown when nothing matches. */
  emptyMessage?: string
  /** Heading of the suggestions group. */
  suggestionsLabel?: string
  /** Compact controls (borderless selects, ghost buttons) in a row under the field. */
  controls?: RemixNode
  /** Supply a trigger to open the menu in a modal. */
  trigger?: RemixNode
  /** Set when the menu is rendered inside a consumer-provided dialog. */
  inDialog?: boolean
  /** The combo that toggles a modal menu: `true` or omitted is Mod+K, `false` binds nothing. */
  shortcut?: boolean | string
  onSelect?: (value: string) => void
}

const allFilter = '\u0000all'

function commandShortcut(keys: string | readonly string[], mac = false) {
  const caps = (typeof keys === 'string' ? [keys] : keys).flatMap((key) => formatShortcut(key, mac))
  return (
    <span class="rf-command-shortcut">
      {caps.map((key, index) => (
        <kbd key={index}>{key}</kbd>
      ))}
    </span>
  )
}

/** Shortcut keycaps for a trigger or a custom footer: `<CommandShortcut keys="mod+p" />`. */
export function CommandShortcut(handle: Handle<{ keys: string | readonly string[] }>) {
  let mac = false
  const mount = ref((node, signal) => {
    if (!isMacPlatform()) return
    mac = true
    void handle.update()
    signal.addEventListener(
      'abort',
      () => {
        mac = false
      },
      { once: true },
    )
  })
  return () => (
    <span class="rf-command-shortcut" mix={mount}>
      {(typeof handle.props.keys === 'string' ? [handle.props.keys] : handle.props.keys)
        .flatMap((key) => formatShortcut(key, mac))
        .map((key, index) => (
          <kbd key={index}>{key}</kbd>
        ))}
    </span>
  )
}

export function CommandMenu(handle: Handle<CommandMenuProps>) {
  const listId = `${handle.id}-list`
  let query = ''
  let activeFilter: string | undefined
  let highlighted: string | undefined
  let openState = false
  let list: HTMLElement | null = null
  const scroller = () => list?.closest<HTMLElement>('.rf-scroll-viewport') ?? null
  let scrollToSelection = false
  let shownHeight = 0
  let mac = false

  function matches(item: CommandItem) {
    const text = [item.label, item.description, ...(item.keywords ?? [])].join(' ').toLowerCase()
    return query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .every((term) => text.includes(term))
  }

  function visibleGroups() {
    const groups = new Map<string, CommandItem[]>()
    const { items, suggestions } = handle.props
    const suggested =
      !activeFilter && !query.trim() && suggestions
        ? suggestions.flatMap((value) =>
            items.filter((item) => item.value === value && !item.disabled),
          )
        : []
    if (suggested.length) groups.set(handle.props.suggestionsLabel ?? 'Suggestions', suggested)
    for (const item of items) {
      if (suggested.includes(item)) continue
      if (
        activeFilter &&
        handle.props.filters?.includes(activeFilter) &&
        (item.filter ?? item.group) !== activeFilter
      )
        continue
      if (!matches(item)) continue
      const group = item.group ?? ''
      const members = groups.get(group) ?? []
      members.push(item)
      groups.set(group, members)
    }
    return groups
  }

  function setOpen(next: boolean) {
    openState = next
    if (!next) {
      query = ''
      activeFilter = undefined
      highlighted = undefined
    }
    void handle.update()
  }

  function select(item: CommandItem) {
    if (item.disabled) return
    handle.props.onSelect?.(item.value)
    if (openState) setOpen(false)
  }

  function setFilter(filter: string | undefined) {
    activeFilter = filter
    highlighted = undefined
    scroller()?.scrollTo(0, 0)
    void handle.update()
  }

  function setQuery(next: string) {
    query = next
    highlighted = undefined
    scroller()?.scrollTo(0, 0)
    void handle.update()
  }

  function keydown(event: KeyboardEvent, inDialog: boolean) {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.keyCode === 229 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return
    const { filters } = handle.props
    if (
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
      filters?.length &&
      !event.shiftKey
    ) {
      event.preventDefault()
      const tabs = [undefined, ...filters]
      const current = Math.max(0, tabs.indexOf(activeFilter))
      const step = event.key === 'ArrowRight' ? 1 : -1
      setFilter(tabs[(current + step + tabs.length) % tabs.length])
      return
    }
    if (event.key === 'Escape' && !inDialog && query) {
      event.preventDefault()
      setQuery('')
      return
    }
    const enabled = Array.from(visibleGroups().values())
      .flat()
      .filter((item) => !item.disabled)
    if (!enabled.length) return
    const index = Math.max(
      0,
      enabled.findIndex((item) => item.value === highlighted),
    )
    if (event.key === 'Enter') {
      event.preventDefault()
      select(enabled[index])
      return
    }
    const next = navigationIndex(event.key, index, enabled.length, {
      orientation: 'vertical',
      homeEnd: !query && !event.shiftKey,
    })
    if (next === undefined) return
    event.preventDefault()
    highlighted = enabled[next].value
    scrollToSelection = true
    void handle.update()
  }

  const shortcut = ref((node, signal) => {
    if (isMacPlatform()) {
      mac = true
      void handle.update()
    }
    node.ownerDocument.addEventListener(
      'keydown',
      (event) => {
        const { trigger, shortcut: combo } = handle.props
        if (
          event.defaultPrevented ||
          event.isComposing ||
          event.repeat ||
          trigger == null ||
          combo === false
        )
          return
        const parsed = parseShortcut(typeof combo === 'string' ? combo : 'mod+k')
        if (!matchesShortcut(event, parsed)) return
        // Several menus can share a page. An open one answers first, then the first with a visible trigger.
        const answers = Array.from(
          node.ownerDocument.querySelectorAll<HTMLElement>('[data-rf-command-host]'),
        )
        const open = answers.find((host) => host.dataset.rfCommandOpen === 'true')
        const owner =
          open ?? answers.find((host) => host.querySelector('button')?.getClientRects().length)
        if (owner !== node) return
        event.preventDefault()
        setOpen(!openState)
      },
      { signal },
    )
  })

  // The frame follows the column's height and springs to it, as the reference panel does. It is measured, never "auto".
  const frame = ref((node, signal) => {
    if (!(node instanceof HTMLElement) || typeof ResizeObserver === 'undefined') return
    const column = node.firstElementChild
    if (!(column instanceof HTMLElement)) return
    let ready = 0
    const observer = new ResizeObserver(() => {
      node.style.height = `${column.offsetHeight}px`
      if (!ready)
        ready = requestAnimationFrame(() => {
          node.dataset.rfReady = ''
        })
    })
    observer.observe(column)
    signal.addEventListener(
      'abort',
      () => {
        observer.disconnect()
        cancelAnimationFrame(ready)
      },
      { once: true },
    )
  })

  const hover = fluidHover({ highlightedSelector: '[aria-selected="true"]', fastHover: true })
  const listRef = ref((node, signal) => {
    if (!(node instanceof HTMLElement)) return
    list = node
    signal.addEventListener(
      'abort',
      () => {
        if (list === node) list = null
      },
      { once: true },
    )
  })

  return () => {
    const {
      label = 'Command menu',
      placeholder = 'Type a command or search…',
      filters,
      trigger,
    } = handle.props
    const inDialog = trigger != null || handle.props.inDialog === true
    const filter = activeFilter && filters?.includes(activeFilter) ? activeFilter : undefined
    const groups = visibleGroups()
    const visible = Array.from(groups.values()).flat()
    const active =
      visible.find((item) => item.value === highlighted && !item.disabled) ??
      visible.find((item) => !item.disabled)
    const optionId = (item: CommandItem) => `${listId}-${visible.indexOf(item)}`
    // No results keeps the height the rows last showed, so the message sits where they were.
    handle.queueTask(() => {
      if (!list) return
      if (!visible.length) {
        list.style.minHeight = shownHeight ? `${shownHeight}px` : ''
        return
      }
      list.style.minHeight = ''
      shownHeight = Math.min(list.offsetHeight, scroller()?.clientHeight ?? Infinity)
    })
    if (scrollToSelection) {
      handle.queueTask(() => {
        list?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
        scrollToSelection = false
      })
    }

    const body = (
      <section
        class="rf-command"
        aria-label={label}
        data-in-dialog={inDialog || undefined}
        mix={trigger == null ? shortcut : undefined}
      >
        <div class="rf-command-frame" mix={frame}>
          <div class="rf-command-column">
            <div class="rf-command-search">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              >
                <path d="m16 16 5 5m-3-10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
              </svg>
              <input
                role="combobox"
                type="text"
                autocorrect="off"
                spellcheck={false}
                aria-label="Search commands"
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={active ? optionId(active) : undefined}
                placeholder={placeholder}
                autocomplete="off"
                autofocus={inDialog}
                value={query}
                mix={[
                  on<HTMLInputElement, 'input'>('input', (event) =>
                    setQuery(event.currentTarget.value),
                  ),
                  on<HTMLInputElement, 'keydown'>('keydown', (event) => keydown(event, inDialog)),
                ]}
              />
            </div>
            {filters && filters.length > 0 ? (
              <div class="rf-command-filters">
                <div
                  class="rf-command-tabs"
                  mix={on('mousedown', (event) => event.preventDefault())}
                >
                  <Tabs
                    label="Filter results"
                    size="compact"
                    items={[
                      { value: allFilter, label: 'All' },
                      ...filters.map((group) => ({ value: group, label: group })),
                    ]}
                    value={filter ?? allFilter}
                    onValueChange={(value) => setFilter(value === allFilter ? undefined : value)}
                  />
                </div>
                {handle.props.controls != null && (
                  <div class="rf-command-controls">{handle.props.controls}</div>
                )}
              </div>
            ) : (
              handle.props.controls != null && (
                <div class="rf-command-controls" data-standalone>
                  {handle.props.controls}
                </div>
              )
            )}
            <ScrollArea label="Commands" fade={32} tabIndex={-1} className="rf-command-scroll">
              <div
                id={listId}
                class="rf-command-results"
                role="listbox"
                aria-label="Commands"
                data-empty={!visible.length || undefined}
                mix={[hover, listRef]}
              >
                <div class="rf-highlight" aria-hidden="true" data-rf-hover-layer />
                {Array.from(groups, ([group, entries]) => (
                  <div role="group" aria-label={group || 'Suggestions'} key={group}>
                    {group && (
                      <div class="rf-command-group-label" aria-hidden="true">
                        {group}
                      </div>
                    )}
                    {entries.map((item) => (
                      <div
                        key={item.value}
                        id={optionId(item)}
                        role="option"
                        class="rf-command-option"
                        aria-disabled={item.disabled || undefined}
                        aria-selected={item === active}
                        data-rf-hover-item
                        mix={[
                          on<HTMLDivElement, 'pointermove'>('pointermove', (event) => {
                            // A move, not an enter: a row that appears under a parked pointer must not take the highlight.
                            if (event.pointerType === 'touch' || item.disabled || active === item)
                              return
                            highlighted = item.value
                            void handle.update()
                          }),
                          on<HTMLDivElement, 'pointerdown'>('pointerdown', (event) => {
                            if (event.pointerType === 'mouse') event.preventDefault()
                          }),
                          on<HTMLDivElement, 'click'>('click', () => select(item)),
                        ]}
                      >
                        {item.icon != null && (
                          <span class="rf-command-option-icon" aria-hidden="true">
                            {item.icon}
                          </span>
                        )}
                        {handle.props.renderItem ? (
                          <span class="rf-command-option-text">
                            {handle.props.renderItem(item)}
                          </span>
                        ) : (
                          <span class="rf-command-option-text">
                            <span>{item.label}</span>
                            {item.description && <span>{item.description}</span>}
                          </span>
                        )}
                        {item.shortcut && commandShortcut(item.shortcut, mac)}
                      </div>
                    ))}
                  </div>
                ))}
                {!visible.length && (
                  <div role="status" aria-live="polite" class="rf-command-empty">
                    {handle.props.emptyMessage ?? 'No results.'}
                  </div>
                )}
              </div>
            </ScrollArea>
            {handle.props.footer != null &&
              handle.props.footer !== false &&
              (handle.props.footer !== true ? (
                <footer class="rf-command-footer">{handle.props.footer}</footer>
              ) : (
                <footer class="rf-command-footer" aria-hidden="true">
                  <span>Select {commandShortcut(['up', 'down'], mac)}</span>
                  {filters && filters.length > 0 && (
                    <span>Tabs {commandShortcut(['left', 'right'], mac)}</span>
                  )}
                  {inDialog && <span>Close {commandShortcut(['esc'], mac)}</span>}
                  {active && (
                    <span class="rf-command-footer-action">
                      <span>{active.action ?? active.label}</span>
                      {commandShortcut(['enter'], mac)}
                    </span>
                  )}
                </footer>
              ))}
          </div>
        </div>
      </section>
    )

    return trigger != null ? (
      <div
        class="rf-command-dialog"
        data-rf-command-host
        data-rf-command-open={openState}
        mix={shortcut}
      >
        <Button
          variant="secondary"
          aria-haspopup="dialog"
          aria-expanded={openState}
          mix={on('click', () => setOpen(true))}
        >
          {trigger}
        </Button>
        <Dialog
          title={label}
          open={openState}
          size="lg"
          position="top"
          showCloseButton={false}
          onOpenChange={setOpen}
        >
          {body}
        </Dialog>
      </div>
    ) : (
      body
    )
  }
}
