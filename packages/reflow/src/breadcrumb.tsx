import { on, ref } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import { Icon } from './icon.tsx'
import { Dropdown, fluidHover, type DropdownItem } from './interactive.tsx'

export interface BreadcrumbItem {
  label: string
  /** Where the step goes. The last item is the current page and is not a link. */
  href?: string
  icon?: RemixNode
  /** Turns a step before the current page into a menu trigger, such as its siblings. */
  menu?: readonly DropdownItem[]
  onMenuSelect?: (value: string, checked?: boolean) => void
}

export interface BreadcrumbProps {
  /** The trail, ending with the current page. */
  items: readonly BreadcrumbItem[]
  /** Names the navigation landmark. Default "Breadcrumb". */
  label?: string
  size?: 'default' | 'compact'
  /** Trailing glyph of every step but the last. Defaults to a chevron; null drops it. */
  separator?: RemixNode | null
  /** Hide middle steps behind an ellipsis menu while the trail is wider than its container. The first step, the last link and the current page always stay. */
  collapse?: boolean
  /** Open step menus and the ellipsis menu when a mouse rests on them, as Dropdown's openOnHover. */
  openOnHover?: boolean
}

const fallbackEllipsisWidth = 44

/**
 * A trail of links to the current page, as in the reference. Every step shares
 * one fluid hover scope, and the separator is part of each step, so the
 * highlight glides along the trail without going dark between steps.
 */
export function Breadcrumb(handle: Handle<BreadcrumbProps>) {
  let list: HTMLOListElement | null = null
  let hidden = 0
  // Natural widths per step, remembered so a hidden step returns as soon as it fits.
  let widths: number[] = []
  let ellipsisWidth = 0

  const listRef = ref((node, signal) => {
    if (!(node instanceof HTMLOListElement)) return
    list = node
    const observer = new ResizeObserver(() => measure())
    if (node.parentElement) observer.observe(node.parentElement)
    signal.addEventListener('abort', () => {
      observer.disconnect()
      if (list === node) list = null
    })
  })

  function naturalWidth(item: HTMLElement) {
    let width = item.getBoundingClientRect().width
    // The current page shrinks to fit; add back what its label hides.
    if (item.querySelector('[aria-current="page"]')) {
      for (const label of item.querySelectorAll<HTMLElement>('.rf-breadcrumb-label')) {
        width += label.scrollWidth - label.clientWidth
      }
    }
    return width
  }

  function measure() {
    const nav = list?.parentElement
    if (!list || !nav) return
    const count = handle.props.items.length
    const items = Array.from(list.children) as HTMLElement[]
    const steps = items.filter((item) => !item.hasAttribute('data-ellipsis'))
    const ellipsis = items.find((item) => item.hasAttribute('data-ellipsis'))
    if (ellipsis) ellipsisWidth = naturalWidth(ellipsis)
    // The rendered steps are 0, then hidden + 1 onward.
    steps.forEach((item, i) => {
      const index = hidden > 0 && i > 0 ? i + hidden : i
      if (index < count) widths[index] = naturalWidth(item)
    })
    let next = 0
    if (handle.props.collapse) {
      const available = nav.clientWidth
      const width = (i: number) => widths[i] ?? 0
      let total = 0
      for (let i = 0; i < count; i++) total += width(i)
      const maxHidden = Math.max(0, count - 3)
      if (total > available + 0.5) {
        let shown = total + (ellipsisWidth || fallbackEllipsisWidth)
        while (next < maxHidden && shown > available + 0.5) {
          shown -= width(1 + next)
          next++
        }
      }
    }
    if (next !== hidden) {
      hidden = next
      void handle.update()
    }
  }

  // Show the full name of a cut step on hover and focus.
  function showFullName(event: Event) {
    const crumb =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('.rf-breadcrumb-crumb')
        : null
    const label = crumb?.querySelector<HTMLElement>('.rf-breadcrumb-label')
    if (!crumb || !label) return
    if (label.scrollWidth > label.clientWidth + 0.5) crumb.title = label.textContent ?? ''
    else crumb.removeAttribute('title')
  }

  return () => {
    const { items, label = 'Breadcrumb', size, separator, collapse, openOnHover } = handle.props
    widths.length = items.length
    const hide = collapse ? Math.min(hidden, Math.max(0, items.length - 3)) : 0
    // Every render: a label change can change a step's width.
    if (collapse) handle.queueTask(() => measure())

    const trailing =
      separator === null ? null : (
        <span class="rf-breadcrumb-separator" aria-hidden="true">
          {separator ?? <Icon name="chevron-right" />}
        </span>
      )
    const content = (item: BreadcrumbItem) => (
      <>
        {item.icon}
        <span class="rf-breadcrumb-label">{item.label}</span>
      </>
    )

    const step = (item: BreadcrumbItem, index: number) => {
      const last = index === items.length - 1
      if (last) {
        return (
          <span
            class="rf-breadcrumb-crumb rf-breadcrumb-page"
            role="link"
            aria-disabled="true"
            aria-current="page"
          >
            {content(item)}
          </span>
        )
      }
      if (item.menu) {
        return (
          <Dropdown
            label={item.label}
            variant="bare"
            triggerClass="rf-breadcrumb-crumb"
            size={size}
            openOnHover={openOnHover}
            items={item.menu}
            onSelect={item.onMenuSelect}
            triggerContent={
              <>
                {content(item)}
                {trailing}
              </>
            }
          />
        )
      }
      return (
        <a class="rf-breadcrumb-crumb" href={item.href}>
          {content(item)}
          {trailing}
        </a>
      )
    }

    const hiddenItems = items.slice(1, 1 + hide)
    const visible = items
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => index === 0 || index > hide)

    const ellipsis = hide > 0 && (
      <li key="ellipsis" class="rf-breadcrumb-item" data-rf-hover-item data-ellipsis>
        <Dropdown
          label={`Show ${hide} hidden ${hide === 1 ? 'step' : 'steps'}`}
          variant="bare"
          triggerClass="rf-breadcrumb-crumb"
          size={size}
          openOnHover={openOnHover}
          items={hiddenItems.map((hiddenItem, offset) => ({
            value: String(offset),
            label: hiddenItem.label,
            icon: hiddenItem.icon,
            disabled: !hiddenItem.href,
          }))}
          onSelect={(value) => {
            const href = hiddenItems[Number(value)]?.href
            if (href) window.location.assign(href)
          }}
          triggerContent={
            <>
              <Icon name="more-horizontal" />
              {trailing}
            </>
          }
        />
      </li>
    )
    const rows = visible.flatMap(({ item, index }) => [
      <li key={index} class="rf-breadcrumb-item" data-rf-hover-item>
        {step(item, index)}
      </li>,
      index === 0 && ellipsis,
    ])

    return (
      <nav
        class="rf-breadcrumb"
        aria-label={label}
        data-density={size}
        data-separator={separator === undefined ? 'chevron' : undefined}
        mix={[
          fluidHover({ axis: 'x', focusSelector: ':has(:focus-visible)' }),
          on<HTMLElement, 'pointerover'>('pointerover', showFullName),
          on<HTMLElement, 'focusin'>('focusin', showFullName),
        ]}
      >
        <span class="rf-highlight rf-breadcrumb-hover" aria-hidden="true" data-rf-hover-layer />
        <span class="rf-highlight rf-focus-ring" aria-hidden="true" data-rf-focus-layer />
        <ol class="rf-breadcrumb-list" mix={listRef}>
          {rows}
        </ol>
      </nav>
    )
  }
}
