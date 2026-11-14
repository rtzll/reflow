import { attrs, ref } from 'remix/component'
import { spring } from '@remix-run/ui/animation'

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
