import { ref, type Handle } from 'remix/component'
import { Dropdown } from './dropdown.tsx'
import { Icon } from './icon.tsx'

export interface ChatOutlineItem {
  /** The `id` of the message element, such as a ChatMessage's `id`. */
  id: string
  label: string
}

export interface ChatOutlineProps {
  /** The turns to list, oldest first. With none, nothing renders. */
  items: readonly ChatOutlineItem[]
  /** Names the trigger and the menu. Default "Conversation outline". */
  label?: string
  size?: 'default' | 'compact'
  align?: 'start' | 'end'
}

// The turn in view is the last one whose top has passed this fraction of the
// transcript's height.
const readingLine = 1 / 3
// Space left above a message the outline jumps to.
const peek = 16
// Past this many turns the menu gains a search field.
const searchFrom = 9

function scrollParent(element: HTMLElement) {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY
    if (overflow === 'auto' || overflow === 'scroll') return node
  }
  return null
}

/**
 * Lists the turns of a conversation behind an icon button, checks the one in
 * view, and jumps to the one chosen. Built on Dropdown; place it in
 * ChatLayout's header. See docs/chat-outline.md.
 */
export function ChatOutline(handle: Handle<ChatOutlineProps>) {
  let current: string | undefined
  let scroller: HTMLElement | null = null
  let frame = 0

  function elements() {
    return handle.props.items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null)
  }

  function update() {
    frame = 0
    const targets = elements()
    if (!targets.length) return
    scroller ??= scrollParent(targets[0])
    const top = scroller ? scroller.getBoundingClientRect().top : 0
    const height = scroller ? scroller.clientHeight : window.innerHeight
    const line = top + height * readingLine
    let next = targets[0].id
    for (const element of targets) {
      if (element.getBoundingClientRect().top <= line) next = element.id
      else break
    }
    if (next === current) return
    current = next
    handle.update()
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update)
  }

  // The message to focus once the menu has handed focus back to its trigger.
  let pendingFocus: HTMLElement | undefined
  let focusTimer: ReturnType<typeof setTimeout> | undefined
  function focusPending() {
    clearTimeout(focusTimer)
    const target = pendingFocus
    pendingFocus = undefined
    target?.focus({ preventScroll: true })
  }

  const watch = ref((node, signal) => {
    node.addEventListener('focusin', () => pendingFocus && focusPending(), { signal })
    signal.addEventListener('abort', () => clearTimeout(focusTimer), { once: true })
    const targets = elements()
    scroller = targets.length ? scrollParent(targets[0]) : null
    ;(scroller ?? window).addEventListener('scroll', schedule, { passive: true, signal })
    window.addEventListener('resize', schedule, { passive: true, signal })
    signal.addEventListener('abort', () => cancelAnimationFrame(frame), { once: true })
    schedule()
  })

  function jump(id: string) {
    const target = document.getElementById(id)
    if (!target) return
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    scroller ??= scrollParent(target)
    if (scroller) {
      const offset = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top
      scroller.scrollTo({ top: scroller.scrollTop + offset - peek, behavior })
    } else target.scrollIntoView({ block: 'start', behavior })
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    // The menu hands focus back to its trigger once it has closed; move it on
    // to the message then, or after a moment if focus never comes back.
    pendingFocus = target
    clearTimeout(focusTimer)
    focusTimer = setTimeout(focusPending, 400)
    current = id
    handle.update()
  }

  return () => {
    const { items, label = 'Conversation outline', size = 'compact', align = 'end' } = handle.props
    if (!items.length) return null
    // A new turn can arrive without a scroll; check again after it renders.
    handle.queueTask(schedule)
    const checked = current ?? items[0].id
    return (
      <span class="rf-chat-outline" mix={watch}>
        <Dropdown
          label={label}
          size={size}
          align={align}
          variant="ghost"
          chevron={false}
          triggerContent={<Icon name="menu" />}
          searchable={items.length >= searchFrom}
          searchPlaceholder="Search messages…"
          items={items.map((item) => ({
            value: item.id,
            label: item.label,
            type: 'radio' as const,
            checked: item.id === checked,
          }))}
          onSelect={jump}
        />
      </span>
    )
  }
}
