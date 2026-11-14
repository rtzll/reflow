import { on, ref, type Handle, type Props, type RemixNode } from 'remix/component'

export interface ToolbarProps extends Omit<Props<'div'>, 'children' | 'role' | 'aria-label'> {
  label: string
  orientation?: 'horizontal' | 'vertical'
  children: RemixNode
}

const controlSelector = 'button, a[href], [role="button"]'
const innerWidget =
  '[role="toolbar"], [role="tablist"], [role="radiogroup"], [role="menu"], [role="listbox"], dialog'

/** Groups action controls into one tab stop. Text inputs keep their own tab stops. */
export function Toolbar(handle: Handle<ToolbarProps>) {
  let active: HTMLElement | undefined
  const original = new Map<HTMLElement, string | null>()

  function isEnabled(item: HTMLElement) {
    return (
      item.getClientRects().length > 0 &&
      getComputedStyle(item).visibility === 'visible' &&
      !item.matches(':disabled, [aria-disabled="true"]') &&
      !item.closest('[inert], [hidden], [aria-hidden="true"]')
    )
  }

  function restore(item: HTMLElement, value: string | null) {
    if (value === null) item.removeAttribute('tabindex')
    else item.setAttribute('tabindex', value)
  }

  function sync(root: HTMLDivElement, focused?: HTMLElement) {
    const controls = [...root.querySelectorAll<HTMLElement>(controlSelector)].filter(
      (item) =>
        item.parentElement?.closest(innerWidget) === root &&
        (original.has(item) || item.tabIndex >= 0),
    )
    for (const [item, value] of original) {
      if (controls.includes(item)) continue
      restore(item, value)
      original.delete(item)
    }
    const items = controls.filter(isEnabled)
    if (focused && items.includes(focused)) active = focused
    else if (!active || !items.includes(active)) active = items[0]
    for (const item of controls) {
      if (!original.has(item)) original.set(item, item.getAttribute('tabindex'))
      const tabIndex = item === active ? 0 : -1
      if (item.tabIndex !== tabIndex) item.tabIndex = tabIndex
    }
    return items
  }

  const mount = ref<HTMLDivElement>((root, signal) => {
    const synchronize = () => sync(root)
    const mutation = new MutationObserver(synchronize)
    mutation.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'hidden',
        'aria-hidden',
        'disabled',
        'aria-disabled',
        'inert',
        'class',
        'style',
      ],
    })
    const resize = new ResizeObserver(synchronize)
    resize.observe(root)
    sync(root)
    signal.addEventListener(
      'abort',
      () => {
        mutation.disconnect()
        resize.disconnect()
        for (const [item, value] of original) restore(item, value)
        original.clear()
      },
      { once: true },
    )
  })

  return () => {
    const { label, orientation = 'horizontal', class: className, mix, ...props } = handle.props
    return (
      <div
        {...props}
        role="toolbar"
        aria-label={label}
        aria-orientation={orientation}
        class={className ? `rf-toolbar ${className}` : 'rf-toolbar'}
        mix={[
          mount,
          on<HTMLDivElement, 'focusin'>('focusin', (event) => {
            if (event.target instanceof HTMLElement) sync(event.currentTarget, event.target)
          }),
          on<HTMLDivElement, 'keydown'>('keydown', (event) => {
            if (
              event.defaultPrevented ||
              event.isComposing ||
              event.shiftKey ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey ||
              !(event.target instanceof HTMLElement)
            )
              return
            const items = sync(event.currentTarget)
            const index = items.indexOf(event.target)
            if (index < 0) return
            const vertical = orientation === 'vertical'
            const rtl = !vertical && getComputedStyle(event.currentTarget).direction === 'rtl'
            const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
            const backward = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
            let target: HTMLElement | undefined
            if (event.key === forward) target = items[(index + 1) % items.length]
            else if (event.key === backward)
              target = items[(index + items.length - 1) % items.length]
            else if (event.key === 'Home') target = items[0]
            else if (event.key === 'End') target = items.at(-1)
            if (!target) return
            event.preventDefault()
            sync(event.currentTarget, target)
            target.focus()
          }),
          mix,
        ]}
      />
    )
  }
}
