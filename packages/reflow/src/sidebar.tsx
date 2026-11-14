import { Icon } from './icon.tsx'
import { on, ref, type Handle, type RemixNode } from 'remix/component'
import {
  Button,
  Card,
  CardGroup,
  CardHeader,
  CardTitle,
  CardDescription,
  CardMedia,
  CardImage,
} from './basic.tsx'
import { fluidHover } from './systems/fluid-hover.ts'
import { ScrollArea } from './scroll-area.tsx'
import { Drawer } from './drawer.tsx'

export interface SidebarItem {
  label: string
  /** Omit on a row with children: the row then folds and unfolds them instead of navigating. */
  href?: string
  badge?: RemixNode
  icon?: RemixNode
  /** A status dot in the icon column: `active` and `unread` fill it, `idle` rings it. */
  status?: 'active' | 'unread' | 'idle'
  onClick?: (event: MouseEvent) => void
  children?: readonly SidebarItem[]
  defaultExpanded?: boolean
  /** Row actions, revealed on hover or focus. */
  actions?: RemixNode
  /** How many 24px actions `actions` holds, so the label leaves room for them. Default 1. */
  actionCount?: number
}

export interface SidebarSection {
  label?: string
  items: readonly SidebarItem[]
  defaultCollapsed?: boolean
  collapsible?: boolean
  actions?: RemixNode
}

export interface SidebarProps {
  sections: readonly SidebarSection[]
  activeHref?: string
  header?: RemixNode
  footer?: RemixNode
  /** Content in the inset top bar, alongside the built-in navigation control. */
  toolbar?: RemixNode
  children: RemixNode
  label?: string
  /** `default` draws a hairline against the content, `floating` lifts the rail into a card, `inset` lifts the content into one. */
  variant?: 'default' | 'floating' | 'inset'
  style?: Record<string, string | number | undefined>
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  defaultCollapsed?: boolean
  fixed?: boolean
  /** Reveal the collapsed rail as a temporary overlay from its edge. */
  peek?: 'none' | 'hover' | 'click'
  searchable?: boolean
  /** The key hint shown in the search field on hover or focus. Pass null to drop it. */
  searchShortcut?: string | null
  /** Header actions shown after the search field. */
  searchActions?: RemixNode
  onWidthChange?: (width: number) => void
  callout?: RemixNode
}

/** How far past the minimum width a drag has to travel before it previews the collapse. */
const collapseSlop = 56

type NavigationProps = Pick<
  SidebarProps,
  | 'sections'
  | 'activeHref'
  | 'label'
  | 'header'
  | 'footer'
  | 'searchable'
  | 'searchShortcut'
  | 'searchActions'
  | 'variant'
  | 'callout'
> & {
  onNavigate?: () => void
}

function SidebarNavigation(handle: Handle<NavigationProps>) {
  let filter = ''
  const menu = fluidHover({
    selectedSelector: '[aria-current="page"]',
    fastHover: true,
    stackSelection: true,
  })
  return () => {
    const {
      sections,
      activeHref,
      header,
      footer,
      label = 'Workspace',
      searchable,
      searchShortcut = '⌘K',
      searchActions,
      callout,
      onNavigate,
    } = handle.props
    const term = filter.trim().toLowerCase()
    return (
      <div class="rf-sidebar-inner">
        {(header || searchable || searchActions) && (
          <div class="rf-sidebar-header">
            {header}
            {(searchable || searchActions) && (
              <div>
                {searchable && (
                  <div class="rf-sidebar-search">
                    <Icon name="search" />
                    <input
                      type="search"
                      class="rf-sidebar-input"
                      aria-label="Filter navigation"
                      placeholder="Search…"
                      value={filter}
                      mix={on<HTMLInputElement, 'input'>('input', (event) => {
                        filter = event.currentTarget.value
                        handle.update()
                      })}
                    />
                    {searchShortcut && <kbd aria-hidden="true">{searchShortcut}</kbd>}
                  </div>
                )}
                {searchActions}
              </div>
            )}
          </div>
        )}
        <ScrollArea className="rf-sidebar-scroll" label={`${label} scroll area`} fade tabIndex={-1}>
          <nav class="rf-sidebar-nav" aria-label={label}>
            {sections.map((section) => {
              const items = section.items.filter((item) => matchesSidebarItem(item, term))
              if (!items.length) return null
              const key = section.label ?? section.items[0]?.href ?? section.items[0]?.label
              const stop = tabStop(items, activeHref)
              const list = (
                <ul key={key} mix={[menu, on<HTMLUListElement, 'keydown'>('keydown', moveFocus)]}>
                  <li
                    class="rf-highlight rf-sidebar-selection"
                    aria-hidden="true"
                    data-rf-selection-layer
                  />
                  <li class="rf-highlight rf-focus-ring" aria-hidden="true" data-rf-focus-layer />
                  <li
                    class="rf-highlight rf-sidebar-highlight"
                    aria-hidden="true"
                    data-rf-hover-layer
                  />
                  {items.map((item) => (
                    <SidebarBranch
                      key={item.href ?? item.label}
                      item={item}
                      activeHref={activeHref}
                      onNavigate={onNavigate}
                      term={term}
                      stop={stop}
                    />
                  ))}
                </ul>
              )
              const group =
                section.label && section.collapsible !== false ? (
                  <details
                    class="rf-sidebar-group"
                    key={key}
                    open={Boolean(term) || !section.defaultCollapsed}
                  >
                    <summary>
                      <span class="rf-sidebar-group-label">{section.label}</span>
                      <span class="rf-sidebar-group-chevron" aria-hidden="true">
                        <Icon name="chevron-right" />
                      </span>
                    </summary>
                    <div class="rf-sidebar-group-body">{list}</div>
                  </details>
                ) : (
                  <div class="rf-sidebar-group" key={key}>
                    {section.label && <div class="rf-sidebar-static-label">{section.label}</div>}
                    {list}
                  </div>
                )
              return section.actions ? (
                <div key={key} class="rf-sidebar-section">
                  {group}
                  <div class="rf-sidebar-section-actions">{section.actions}</div>
                </div>
              ) : (
                group
              )
            })}
          </nav>
        </ScrollArea>
        {callout && <div class="rf-sidebar-callout">{callout}</div>}
        {footer && <div class="rf-sidebar-footer">{footer}</div>}
      </div>
    )
  }
}

/** The trailing room a row reserves: the badge's slot, the action run, and one 4px gap. */
function gutter(actions: number, badge: boolean) {
  if (!actions && !badge) return 8
  const run =
    (badge ? 24 : 0) + (actions ? actions * 24 + (actions - 1) * 4 : 0) + (badge && actions ? 4 : 0)
  return (badge ? 8 : 6) + run + 4
}

function itemKey(item: SidebarItem) {
  return item.href ?? item.label
}

/** One tab stop per menu: the current page when it is in the menu, otherwise its first row. */
function tabStop(items: readonly SidebarItem[], activeHref?: string): string | undefined {
  const find = (list: readonly SidebarItem[]): string | undefined => {
    for (const item of list) {
      if (activeHref !== undefined && item.href === activeHref) return itemKey(item)
      const inner = item.children && find(item.children)
      if (inner) return inner
    }
  }
  return find(items) ?? (items[0] && itemKey(items[0]))
}

/** Arrow keys, Home and End move focus between the rows a menu shows, wrapping at the ends. */
function moveFocus(event: KeyboardEvent & { currentTarget: HTMLUListElement }) {
  if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key))
    return
  const rows = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('.rf-sidebar-link'),
  ).filter((row) => !row.closest('[inert]'))
  const index = rows.indexOf(event.target as HTMLElement)
  if (index === -1) return
  event.preventDefault()
  event.stopPropagation()
  if (event.key === 'Home') rows[0]?.focus()
  else if (event.key === 'End') rows[rows.length - 1]?.focus()
  else {
    const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1
    rows[(index + step + rows.length) % rows.length]?.focus()
  }
}

function matchesSidebarItem(item: SidebarItem, term: string): boolean {
  return (
    item.label.toLowerCase().includes(term) ||
    !!item.children?.some((child) => matchesSidebarItem(child, term))
  )
}

function SidebarBranch(
  handle: Handle<{
    item: SidebarItem
    activeHref?: string
    onNavigate?: () => void
    term: string
    nested?: boolean
    stop?: string
  }>,
) {
  let expanded = handle.props.item.defaultExpanded ?? true
  return () => {
    const { item, activeHref, onNavigate, term, nested, stop } = handle.props
    const children = item.children?.filter((child) => matchesSidebarItem(child, term))
    const showChildren = Boolean(term) || expanded
    const hasChildren = Boolean(children?.length)
    const toggles = hasChildren && item.href === undefined
    const childrenId = `${handle.id}-children`
    const toggle = () => {
      expanded = !expanded
      handle.update()
    }
    const tabIndex = stop === itemKey(item) ? 0 : -1
    const content = (
      <>
        {item.icon ? (
          <span class="rf-sidebar-icon" aria-hidden="true">
            {item.icon}
          </span>
        ) : item.status ? (
          <span class="rf-sidebar-icon" aria-hidden="true">
            <span class="rf-sidebar-dot" />
          </span>
        ) : null}
        <span class="rf-sidebar-label" data-text={item.label}>
          <span>{item.label}</span>
        </span>
        {item.status === 'unread' && <span class="rf-basic-sr-only">, unread</span>}
        {toggles && (
          <span class="rf-sidebar-chevron" aria-hidden="true">
            <Icon name="chevron-right" />
          </span>
        )}
      </>
    )
    return (
      <li class="rf-sidebar-branch">
        <div
          class="rf-sidebar-entry"
          data-sub={nested || undefined}
          data-branch={(hasChildren && !toggles) || undefined}
          data-badge={item.badge != null || undefined}
          data-actions={item.actions ? '' : undefined}
          style={{
            '--rf-sb-gutter': `${gutter(0, item.badge != null)}px`,
            '--rf-sb-gutter-hover': `${gutter(item.actions ? (item.actionCount ?? 1) : 0, item.badge != null)}px`,
          }}
        >
          {toggles ? (
            <button
              type="button"
              class="rf-sidebar-link"
              data-rf-hover-item
              tabIndex={tabIndex}
              aria-expanded={showChildren}
              aria-controls={childrenId}
              mix={on('click', (event) => {
                item.onClick?.(event)
                toggle()
              })}
            >
              {content}
            </button>
          ) : (
            <a
              class="rf-sidebar-link"
              data-rf-hover-item
              tabIndex={tabIndex}
              href={item.href}
              aria-current={item.href === activeHref ? 'page' : undefined}
              data-status={item.status}
              mix={
                (item.onClick || onNavigate) &&
                on('click', (event) => {
                  item.onClick?.(event)
                  onNavigate?.()
                })
              }
            >
              {content}
            </a>
          )}
          {item.badge != null && <span class="rf-sidebar-badge">{item.badge}</span>}
          {item.actions && <span class="rf-sidebar-item-actions">{item.actions}</span>}
          {hasChildren && !toggles ? (
            <button
              type="button"
              class="rf-sidebar-expand"
              aria-label={`${showChildren ? 'Collapse' : 'Expand'} ${item.label}`}
              aria-expanded={showChildren}
              aria-controls={childrenId}
              mix={on('click', toggle)}
            >
              <Icon name="chevron-right" />
            </button>
          ) : null}
        </div>
        {hasChildren ? (
          <div class="rf-sidebar-sub" data-state={showChildren ? 'open' : 'closed'}>
            <ul id={childrenId} class="rf-sidebar-children" inert={!showChildren}>
              {children!.map((child) => (
                <SidebarBranch
                  key={child.href ?? child.label}
                  item={child}
                  activeHref={activeHref}
                  onNavigate={onNavigate}
                  term={term}
                  stop={stop}
                  nested
                />
              ))}
            </ul>
          </div>
        ) : null}
      </li>
    )
  }
}

export function Sidebar(handle: Handle<SidebarProps>) {
  let width = handle.props.defaultWidth ?? 256
  let collapsed = handle.props.defaultCollapsed ?? false
  let resizing = false
  let peeking = false
  let exitingPeek: Animation | undefined
  let peekTimer: ReturnType<typeof setTimeout> | undefined
  let drag:
    | { id: number; start: number; width: number; moved: boolean; collapsed: boolean }
    | undefined
  let drawerOpen = false
  const panelId = `${handle.id}-sidebar`
  const setDrawer = (open: boolean) => {
    if (drawerOpen === open) return
    drawerOpen = open
    void handle.update()
  }

  function limits() {
    const minimum = handle.props.minWidth ?? 160
    return { minimum, maximum: Math.max(minimum, handle.props.maxWidth ?? 360) }
  }

  function setWidth(next: number) {
    const { minimum, maximum } = limits()
    width = Math.min(maximum, Math.max(minimum, Math.round(next)))
    handle.props.onWidthChange?.(width)
    handle.update()
  }

  let layout: HTMLElement | undefined
  const cancelPeekTimer = () => {
    clearTimeout(peekTimer)
    peekTimer = undefined
  }
  function dismissPeek(restoreFocus = false) {
    cancelPeekTimer()
    if (!peeking) return
    if (
      restoreFocus ||
      layout?.querySelector('.rf-sidebar-panel')?.contains(document.activeElement)
    ) {
      layout?.querySelector<HTMLElement>('.rf-sidebar-peek-trigger')?.focus()
    }
    const panel = layout?.querySelector<HTMLElement>('.rf-sidebar-panel')
    if (panel && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const animation = panel.animate(
        [{ translate: getComputedStyle(panel).translate }, { translate: '-108% 0' }],
        { duration: 120, easing: 'ease-out', fill: 'forwards' },
      )
      exitingPeek = animation
      void animation.finished.then(
        () => {
          if (exitingPeek !== animation) return
          exitingPeek = undefined
          animation.cancel()
          if (!handle.signal.aborted) handle.update()
        },
        () => {},
      )
    }
    peeking = false
    handle.update()
  }
  function revealPeek() {
    cancelPeekTimer()
    if (
      !collapsed ||
      resizing ||
      handle.props.fixed ||
      !handle.props.peek ||
      handle.props.peek === 'none'
    )
      return
    const wasExiting = Boolean(exitingPeek)
    const panel = layout?.querySelector<HTMLElement>('.rf-sidebar-panel')
    const start = wasExiting && panel ? getComputedStyle(panel).translate : '-108% 0'
    exitingPeek?.cancel()
    exitingPeek = undefined
    peeking = true
    handle.update()
    handle.queueTask(() => {
      if (peeking && panel && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        panel.animate([{ translate: start }, { translate: '0 0' }], {
          duration: 200,
          easing: getComputedStyle(panel)
            .getPropertyValue('--rf-spring-moderate')
            .trim()
            .replace(/^\S+\s+/, ''),
        })
      }
    })
  }
  const armPeek = () => {
    if (handle.props.peek !== 'hover') return
    cancelPeekTimer()
    peekTimer = setTimeout(revealPeek, 150)
  }
  const captureLayout = ref((node, signal) => {
    if (!(node instanceof HTMLElement)) return
    layout = node
    signal.addEventListener(
      'abort',
      () => {
        cancelPeekTimer()
        exitingPeek?.cancel()
      },
      { once: true },
    )
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!peeking || !(event.target instanceof Node)) return
        const trigger =
          event.target instanceof Element &&
          event.target.closest('.rf-sidebar-peek-trigger, .rf-sidebar-toggle')
        if (
          !node.querySelector('.rf-sidebar-panel')?.contains(event.target) &&
          !(trigger && node.contains(trigger))
        )
          dismissPeek()
      },
      { signal },
    )
    document.addEventListener(
      'keydown',
      (event) => {
        if (peeking && event.key === 'Escape' && !event.defaultPrevented) {
          event.preventDefault()
          dismissPeek(true)
        }
      },
      { signal },
    )
    document.addEventListener(
      'pointermove',
      (event) => {
        if (!peeking || handle.props.peek !== 'hover' || event.pointerType === 'touch') return
        const panel = node.querySelector('.rf-sidebar-panel')
        const box = panel?.getBoundingClientRect()
        if (!box) return
        if (
          (event.clientX >= box.left - 8 &&
            event.clientX <= box.right + 8 &&
            event.clientY >= box.top - 8 &&
            event.clientY <= box.bottom + 8) ||
          panel?.contains(document.activeElement)
        )
          cancelPeekTimer()
        else if (!peekTimer) peekTimer = setTimeout(() => dismissPeek(), 250)
      },
      { signal },
    )
  })

  function toggle() {
    cancelPeekTimer()
    exitingPeek?.cancel()
    exitingPeek = undefined
    const wasPeeking = peeking
    peeking = false
    collapsed = !collapsed
    // The collapsing rail becomes inert: keep focus on the page instead of dropping it.
    const panel = layout?.querySelector('.rf-sidebar-panel')
    const restoreFocus = (collapsed || wasPeeking) && panel?.contains(document.activeElement)
    const focusToggle = () => layout?.querySelector<HTMLElement>('.rf-sidebar-toggle')?.focus()
    if (restoreFocus) focusToggle()
    handle.update()
    if (restoreFocus) handle.queueTask(focusToggle)
  }

  return () => {
    const {
      sections,
      activeHref,
      header,
      footer,
      label = 'Workspace',
      searchable,
      searchShortcut,
      searchActions,
      variant = 'default',
      style,
      children,
      toolbar,
      callout,
      fixed,
    } = handle.props
    const navigation = {
      sections,
      activeHref,
      header,
      footer,
      label,
      searchable,
      searchShortcut,
      searchActions,
      variant,
      callout,
    }
    const { minimum: minWidth, maximum: maxWidth } = limits()
    const renderedWidth = Math.min(maxWidth, Math.max(minWidth, width))
    const toggleLabel = collapsed ? 'Show sidebar' : 'Hide sidebar'
    const isCollapsed = collapsed && !fixed
    const canPeek = isCollapsed && !resizing && handle.props.peek && handle.props.peek !== 'none'
    if (!canPeek) {
      peeking = false
      exitingPeek?.cancel()
      exitingPeek = undefined
      cancelPeekTimer()
    }
    return (
      <section
        class="rf-sidebar-layout"
        data-collapsed={isCollapsed || undefined}
        data-variant={variant === 'default' ? undefined : variant}
        data-peeking={peeking || undefined}
        data-peek-overlay={peeking || Boolean(exitingPeek) || undefined}
        data-fixed={fixed || undefined}
        data-resizing={resizing || undefined}
        style={{ ...style, '--rf-sidebar-width': `${renderedWidth}px` }}
        mix={[
          captureLayout,
          on('keydown', (event) => {
            if (
              fixed ||
              event.defaultPrevented ||
              event.metaKey ||
              event.ctrlKey ||
              event.altKey ||
              (event.key !== '[' && event.key !== ']') ||
              (event.target instanceof Element &&
                event.target.closest('input, textarea, select, [contenteditable]'))
            )
              return
            if (matchMedia('(max-width: 767px)').matches) return
            event.preventDefault()
            toggle()
          }),
        ]}
      >
        {canPeek && (
          <button
            type="button"
            class="rf-sidebar-peek-trigger"
            aria-label="Peek sidebar"
            aria-controls={panelId}
            aria-expanded={peeking}
            mix={[
              on('click', () => (peeking ? dismissPeek(true) : revealPeek())),
              on('pointerenter', (event) => {
                if (event.pointerType !== 'touch') armPeek()
              }),
              on('pointerleave', () => {
                if (!peeking) cancelPeekTimer()
              }),
            ]}
          />
        )}
        <aside id={panelId} class="rf-sidebar-panel" inert={(isCollapsed && !peeking) || undefined}>
          <div class="rf-sidebar-card">
            {peeking && (
              <Button
                class="rf-sidebar-pin"
                variant="ghost"
                size="icon-compact"
                aria-label="Pin sidebar"
                mix={on('click', toggle)}
              >
                <Icon name="panel-left" />
              </Button>
            )}
            <SidebarNavigation {...navigation} onNavigate={() => dismissPeek(true)} />
          </div>
          {!fixed && (
            <div
              class="rf-sidebar-grip"
              role="separator"
              tabIndex={0}
              aria-label="Resize sidebar"
              aria-orientation="vertical"
              aria-valuenow={renderedWidth}
              aria-valuemin={minWidth}
              aria-valuemax={maxWidth}
              title="Drag to resize, click to collapse"
              mix={[
                on<HTMLElement, 'pointerdown'>('pointerdown', (event) => {
                  if (!event.isPrimary || event.button !== 0) return
                  event.preventDefault()
                  drag = {
                    id: event.pointerId,
                    start: event.clientX,
                    width: renderedWidth,
                    moved: false,
                    collapsed: false,
                  }
                  event.currentTarget.setPointerCapture(event.pointerId)
                }),
                on('pointermove', (event) => {
                  if (drag?.id !== event.pointerId) return
                  const delta = event.clientX - drag.start
                  if (!drag.moved && Math.abs(delta) < 4) return
                  if (!drag.moved) {
                    drag.moved = true
                    resizing = true
                  }
                  const raw = drag.width + delta
                  // Dragged well past the minimum: preview the collapse, but keep the
                  // gesture alive so pulling back re-opens it.
                  if (raw < minWidth - collapseSlop) {
                    if (!drag.collapsed) {
                      drag.collapsed = true
                      collapsed = true
                      handle.update()
                    }
                    return
                  }
                  if (drag.collapsed) {
                    drag.collapsed = false
                    collapsed = false
                  }
                  setWidth(raw)
                }),
                on('pointerup', (event) => {
                  const finished = drag
                  if (finished?.id !== event.pointerId) return
                  drag = undefined
                  resizing = false
                  // A press that never turned into a drag is the collapse click.
                  if (!finished.moved) toggle()
                  else handle.update()
                }),
                on('pointercancel', () => {
                  drag = undefined
                  resizing = false
                  handle.update()
                }),
                on('keydown', (event) => {
                  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    event.preventDefault()
                    setWidth(renderedWidth + (event.key === 'ArrowLeft' ? -10 : 10))
                  }
                }),
              ]}
            />
          )}
        </aside>
        <div class="rf-sidebar-main">
          {(!fixed || toolbar != null) && (
            <div class="rf-sidebar-toolbar">
              {!fixed && (
                <>
                  <Button
                    class="rf-sidebar-toggle"
                    variant="ghost"
                    size="icon"
                    aria-controls={panelId}
                    aria-expanded={!collapsed}
                    aria-label={toggleLabel}
                    mix={[
                      on('click', toggle),
                      on('pointerenter', (event) => {
                        if (event.pointerType !== 'touch') armPeek()
                      }),
                      on('pointerleave', () => {
                        if (!peeking) cancelPeekTimer()
                      }),
                    ]}
                  >
                    <Icon name="panel-left" />
                  </Button>
                  <Drawer
                    side="left"
                    title={label}
                    flush
                    class="rf-sidebar-drawer"
                    open={drawerOpen}
                    onOpenChange={setDrawer}
                    renderTrigger={(trigger) => (
                      <Button
                        class="rf-sidebar-drawer-trigger"
                        variant="ghost"
                        size="compact"
                        {...trigger}
                      >
                        Open navigation
                      </Button>
                    )}
                  >
                    <button
                      type="button"
                      class="rf-basic-sr-only"
                      mix={on('click', () => setDrawer(false))}
                    >
                      Close navigation
                    </button>
                    <SidebarNavigation
                      {...navigation}
                      variant="default"
                      onNavigate={() => setDrawer(false)}
                    />
                  </Drawer>
                </>
              )}
              {toolbar != null && <div class="rf-sidebar-toolbar-content">{toolbar}</div>}
            </div>
          )}
          {children}
        </div>
      </section>
    )
  }
}

export interface SidebarCallout {
  id: string
  title: string
  description?: string
  icon?: RemixNode
  image?: string
  /** Strength of the accent tint on the icon tile, from 0 to 1. */
  tint?: number
  href: string
}

/** A measured, dismissible pile of real Cards. Keyboard focus opens the inline pile too. */
export function SidebarCalloutStack(
  handle: Handle<{
    items: readonly SidebarCallout[]
    variant?: 'inline' | 'banner'
    onEmpty?: () => void
  }>,
) {
  const dismissed = new Set<string>()
  const heights = new Map<string, number>()
  let hovered = false
  let focused = false
  let root: HTMLElement | undefined
  return () => {
    const { items, variant = 'inline' } = handle.props
    const cards = items.filter((item) => !dismissed.has(item.id))
    const expanded = variant === 'inline' && (hovered || focused)
    const height = (id: string) => heights.get(id) ?? (variant === 'inline' ? 76 : 180)
    const total = expanded
      ? cards.reduce((sum, item) => sum + height(item.id) + 4, -4)
      : cards.length
        ? height(cards[0]!.id) + Math.min(cards.length - 1, 2) * 12
        : 0
    return (
      <div
        class="rf-sidebar-callout-stack"
        aria-label="Announcements"
        hidden={!cards.length}
        style={{ height: `${Math.max(0, total)}px` }}
        mix={[
          ref((node) => {
            root = node
          }),
          on('pointerenter', (event) => {
            if (event.pointerType !== 'touch') {
              hovered = true
              handle.update()
            }
          }),
          on('pointerleave', () => {
            hovered = false
            handle.update()
          }),
          on('focusin', () => {
            focused = true
            handle.update()
          }),
          on('focusout', (event) => {
            if (!(event.relatedTarget instanceof Node) || !root?.contains(event.relatedTarget)) {
              focused = false
              handle.update()
            }
          }),
        ]}
      >
        {cards.map((item, index) => {
          const offset = expanded
            ? cards.slice(0, index).reduce((sum, card) => sum + height(card.id) + 4, 0)
            : Math.min(index, 2) * 12
          return (
            <div
              key={item.id}
              class="rf-sidebar-callout-layer"
              inert={(index > 0 && !expanded) || undefined}
              style={{
                opacity: !expanded && index > 2 ? 0 : 1,
                transform: `translateY(-${offset}px) scale(${expanded ? 1 : 1 - Math.min(index, 2) * 0.05})`,
                zIndex: cards.length - index,
              }}
              mix={ref((node, signal) => {
                const observer = new ResizeObserver(() => {
                  if (node instanceof HTMLElement && heights.get(item.id) !== node.offsetHeight) {
                    heights.set(item.id, node.offsetHeight)
                    handle.update()
                  }
                })
                observer.observe(node)
                signal.addEventListener('abort', () => observer.disconnect(), { once: true })
              })}
            >
              <CardGroup orientation={variant === 'inline' ? 'inline' : 'card'} fluidHover={false}>
                <Card
                  size="compact"
                  href={item.href}
                  label={item.title}
                  dismissible
                  onDismiss={(event) => {
                    event.preventDefault()
                    const layer = (event.currentTarget as HTMLElement).closest<HTMLElement>(
                      '.rf-sidebar-callout-layer',
                    )
                    if (layer?.hasAttribute('data-exiting')) return
                    const remove = () => {
                      if (handle.signal.aborted) return
                      dismissed.add(item.id)
                      if (!handle.props.items.some((card) => !dismissed.has(card.id)))
                        handle.props.onEmpty?.()
                      handle.update()
                      handle.queueTask(() =>
                        (
                          root?.querySelector<HTMLElement>('.rf-card-dismiss') ??
                          root
                            ?.closest('.rf-sidebar-inner')
                            ?.querySelector<HTMLElement>('.rf-sidebar-footer button')
                        )?.focus(),
                      )
                    }
                    if (!layer || matchMedia('(prefers-reduced-motion: reduce)').matches) {
                      remove()
                      return
                    }
                    layer.setAttribute('data-exiting', '')
                    const animation = layer.animate(
                      [
                        { opacity: 1, scale: 1 },
                        { opacity: 0, scale: 0.9 },
                      ],
                      { duration: 120, easing: 'ease-out', fill: 'forwards' },
                    )
                    void animation.finished.then(remove, () => {})
                  }}
                >
                  {variant === 'banner' && item.image ? (
                    <CardImage src={item.image} alt="" />
                  ) : (
                    <CardMedia
                      treatment="icon"
                      style={
                        item.tint === undefined
                          ? undefined
                          : { '--rf-callout-tint': `${Math.round(item.tint * 25)}%` }
                      }
                    >
                      {item.icon}
                    </CardMedia>
                  )}
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </CardGroup>
            </div>
          )
        })}
      </div>
    )
  }
}
