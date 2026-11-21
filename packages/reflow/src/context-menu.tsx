import * as menu from '@remix-run/ui/menu'
import * as popover from '@remix-run/ui/popover'
import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { DropdownSurface, type DropdownItem } from './dropdown.tsx'
import type { ControlSize } from './systems/styling.ts'

export interface ContextMenuProps {
  /** Accessible name of the menu. */
  label: string
  /** CSS selector for focusable descendants that have these actions. */
  target: string
  children: RemixNode
  /** The menu's items, or a function that builds them for the row that opened it. */
  items: readonly DropdownItem[] | ((target: HTMLElement) => readonly DropdownItem[])
  size?: ControlSize
  /** The target is the matched element that opened the menu. */
  onSelect?: (value: string, target: HTMLElement, checked?: boolean) => void
}

interface Invocation {
  row: HTMLElement
  anchor: { x: number; y: number; width?: number; height?: number }
  items: readonly DropdownItem[]
}

export function ContextMenu(handle: Handle<ContextMenuProps>) {
  let invocation: Invocation | undefined
  let generation = 0
  let lastKeyboardOpen: { row: HTMLElement; time: number } | undefined

  function isSyntheticKeyboardContextMenu(event: MouseEvent, row?: HTMLElement) {
    if (!lastKeyboardOpen) return false
    if (performance.now() - lastKeyboardOpen.time > 250) return false
    if (
      row
        ? row !== lastKeyboardOpen.row
        : !(event.target instanceof Node && lastKeyboardOpen.row.contains(event.target))
    )
      return false
    const pointerType = 'pointerType' in event ? (event as PointerEvent).pointerType : ''
    return pointerType === '' || (event.button === 0 && event.clientX === 0 && event.clientY === 0)
  }

  function open(event: MouseEvent | KeyboardEvent) {
    if (event.defaultPrevented || !(event.target instanceof Element)) return
    if (event instanceof KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return
      if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return
    }
    if (
      event.target.closest('input, textarea, select') ||
      event.target.closest<HTMLElement>('[contenteditable]')?.isContentEditable
    )
      return
    const row = event.target.closest(handle.props.target)
    if (
      !(row instanceof HTMLElement) ||
      !(event.currentTarget instanceof HTMLElement) ||
      row === event.currentTarget ||
      !event.currentTarget.contains(row)
    )
      return
    if (!(event instanceof KeyboardEvent) && isSyntheticKeyboardContextMenu(event, row)) {
      event.preventDefault()
      return
    }
    const { items } = handle.props
    const resolved = typeof items === 'function' ? items(row) : items
    if (!resolved.length) return
    event.preventDefault()
    if (event instanceof KeyboardEvent) {
      const rect = row.getBoundingClientRect()
      lastKeyboardOpen = { row, time: performance.now() }
      invocation = {
        row,
        anchor: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        items: resolved,
      }
    } else {
      lastKeyboardOpen = undefined
      invocation = {
        row,
        anchor: { x: event.clientX, y: event.clientY },
        items: resolved,
      }
    }
    generation++
    void handle.update()
  }

  return () => {
    const active = invocation
    const activeGeneration = generation
    return (
      <>
        <div
          class="rf-context-menu"
          mix={[
            on<HTMLElement, 'contextmenu'>('contextmenu', open),
            on<HTMLElement, 'keydown'>('keydown', open),
          ]}
        >
          {handle.props.children}
        </div>
        {active && (
          <menu.Context key={activeGeneration} label={handle.props.label}>
            <ContextMenuPopup
              invocation={active}
              size={handle.props.size}
              onSelect={handle.props.onSelect}
              isSyntheticContextMenu={(event) => isSyntheticKeyboardContextMenu(event)}
              onClose={() => {
                if (generation === activeGeneration && invocation === active) {
                  invocation = undefined
                  void handle.update()
                }
              }}
            />
          </menu.Context>
        )}
      </>
    )
  }
}

function ContextMenuPopup(
  handle: Handle<
    Pick<ContextMenuProps, 'size' | 'onSelect'> & {
      invocation: Invocation
      isSyntheticContextMenu: (event: MouseEvent) => boolean
      onClose: () => void
    }
  >,
) {
  const context = handle.context.get(menu.Context)
  const panel = handle.context.get(popover.Context)
  const { row, anchor, items } = handle.props.invocation
  let closeTimer: number | undefined
  let closeFrame: number | undefined
  let container: HTMLDivElement | undefined

  function cancelPendingClose() {
    if (closeTimer !== undefined) {
      clearTimeout(closeTimer)
      closeTimer = undefined
    }
    if (closeFrame !== undefined) {
      cancelAnimationFrame(closeFrame)
      closeFrame = undefined
    }
  }

  function scheduleClose() {
    cancelPendingClose()
    const check = () => {
      closeFrame = undefined
      if (handle.signal.aborted || context.isOpen) return
      if (context.state === 'idle') {
        // Yield one task so closeAll() finishes restoring trigger focus before unmount.
        closeTimer = window.setTimeout(() => {
          closeTimer = undefined
          if (!handle.signal.aborted && !context.isOpen && context.state === 'idle') {
            handle.props.onClose()
          }
        }, 0)
        return
      }
      closeFrame = requestAnimationFrame(check)
    }
    closeFrame = requestAnimationFrame(check)
  }

  const mount = ref<HTMLDivElement>((node, signal) => {
    container = node
    node.addEventListener(
      'toggle',
      (event) => {
        if (event.target !== context.surfaceNode) return
        if ((event as ToggleEvent).newState === 'closed') scheduleClose()
        else cancelPendingClose()
      },
      { capture: true, signal },
    )
    node.ownerDocument.addEventListener(
      'contextmenu',
      (event) => {
        if (handle.props.isSyntheticContextMenu(event)) return
        if (event.target instanceof Node && container?.contains(event.target)) return
        if (context.isOpen || context.state !== 'idle') {
          context.unregisterTrigger(row)
          void context.closeAll({ focusRoot: false })
        }
      },
      { signal },
    )
    signal.addEventListener('abort', cancelPendingClose)
  })

  handle.queueTask(() => {
    panel.anchor = { target: anchor, options: { placement: 'bottom-start', offset: 2 } }
    context.registerTrigger(row, row.id)
    void context.open()
  })

  return () => (
    <div
      data-density={handle.props.size}
      mix={[
        mount,
        menu.onMenuSelect((event) => {
          handle.props.onSelect?.(event.item.value ?? event.item.name, row, event.item.checked)
        }),
        // Let the browser continue Tab navigation from the invoking row.
        on<HTMLElement, 'keydown'>(
          'keydown',
          (event) => {
            if (event.key === 'Tab' && !event.defaultPrevented && row.isConnected) {
              row.focus({ preventScroll: true })
            }
          },
          true,
        ),
        on('focusout', (event) => {
          // The primitive normally restores its trigger after the exit animation.
          // Let a control the user or the action already focused keep focus.
          if (
            (context.isOpen || context.state !== 'idle') &&
            event.relatedTarget instanceof Node &&
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            context.unregisterTrigger(row)
            void context.closeAll({ focusRoot: false })
          }
        }),
      ]}
    >
      <DropdownSurface items={items} />
    </div>
  )
}
