import * as menu from '@remix-run/ui/menu'
import * as popover from '@remix-run/ui/popover'
import { on, type Handle, type RemixNode } from 'remix/component'
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
  anchor: HTMLElement | { x: number; y: number }
}

export function ContextMenu(handle: Handle<ContextMenuProps>) {
  let invocation: Invocation | undefined
  let generation = 0

  function open(event: MouseEvent | KeyboardEvent) {
    if (event.defaultPrevented || !(event.target instanceof Element)) return
    if (
      event instanceof KeyboardEvent &&
      event.key !== 'ContextMenu' &&
      !(event.shiftKey && event.key === 'F10')
    )
      return
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
    event.preventDefault()
    invocation = {
      row,
      anchor: event instanceof KeyboardEvent ? row : { x: event.clientX, y: event.clientY },
    }
    generation++
    void handle.update()
  }

  return () => {
    const { items } = handle.props
    return (
      <>
        <div
          mix={[
            on<HTMLElement, 'contextmenu'>('contextmenu', open),
            on<HTMLElement, 'keydown'>('keydown', open),
          ]}
        >
          {handle.props.children}
        </div>
        {invocation && (
          <menu.Context key={generation} label={handle.props.label}>
            <ContextMenuPopup
              invocation={invocation}
              items={typeof items === 'function' ? items(invocation.row) : items}
              size={handle.props.size}
              onSelect={handle.props.onSelect}
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
      items: readonly DropdownItem[]
      invocation: Invocation
    }
  >,
) {
  const context = handle.context.get(menu.Context)
  const panel = handle.context.get(popover.Context)
  const { row, anchor } = handle.props.invocation
  handle.queueTask(() => {
    panel.anchor = { target: anchor, options: { placement: 'bottom-start', offset: 2 } }
    context.registerTrigger(row, row.id)
    void context.open()
  })

  return () => (
    <div
      data-density={handle.props.size}
      mix={[
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
            context.isOpen &&
            event.relatedTarget instanceof Node &&
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            context.unregisterTrigger(row)
            void context.closeAll({ focusRoot: false })
          }
        }),
      ]}
    >
      <DropdownSurface items={handle.props.items} />
    </div>
  )
}
