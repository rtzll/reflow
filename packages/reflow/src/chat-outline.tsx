import { on, ref, type Handle } from 'remix/component'
import { Dropdown } from './dropdown.tsx'
import { Icon } from './icon.tsx'
import { Tooltip } from './tooltip.tsx'

export interface ChatOutlineItem {
  /** The `id` of the message element, such as a ChatMessage's `id`. */
  id: string
  label: string
  /** A line shown under the label in the rail's preview, such as the start of the reply. */
  preview?: string
}

export interface ChatOutlineProps {
  /** The turns to list, oldest first. With none, nothing renders. */
  items: readonly ChatOutlineItem[]
  /** Names the trigger and the menu. Default "Conversation outline". */
  label?: string
  size?: 'default' | 'compact'
  align?: 'start' | 'end'
  /**
   * `menu` lists the turns behind an icon button. `rail` draws a tick per
   * turn beside the transcript, the one in view longer, with a preview on
   * hover or focus. Default `menu`.
   */
  variant?: 'menu' | 'rail'
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
  let scroller: HTMLElement | Window | null = null
  let listening: AbortController | undefined
  let frame = 0
  let endChoice: HTMLElement | undefined
  let wasAtEnd = false

  // Follows the transcript the items live in. An app can swap the whole
  // conversation, and with it the scroll container, under one outline.
  function follow(target: HTMLElement | undefined) {
    const next = (target && scrollParent(target)) ?? window
    if (next === scroller) return
    endChoice = undefined
    wasAtEnd = false
    listening?.abort()
    listening = new AbortController()
    scroller = next
    next.addEventListener('scroll', schedule, { passive: true, signal: listening.signal })
  }

  function box() {
    const pane = scroller instanceof HTMLElement ? scroller : null
    const root = pane ?? document.scrollingElement ?? document.documentElement
    const height = pane?.clientHeight ?? window.innerHeight
    return {
      top: pane?.getBoundingClientRect().top ?? 0,
      height,
      scrollTop: root.scrollTop,
      maxScrollTop: root.scrollHeight - height,
    }
  }

  function elements() {
    return handle.props.items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null)
  }

  function update() {
    frame = 0
    const targets = elements()
    if (!targets.length) return
    follow(targets[0])
    const { top, height, scrollTop, maxScrollTop } = box()
    const atEnd = scrollTop >= maxScrollTop - 1
    if (wasAtEnd && !atEnd) endChoice = undefined
    wasAtEnd = atEnd
    const line = top + height * readingLine
    let next = targets[0].id
    for (const element of targets) {
      if (element.getBoundingClientRect().top <= line) next = element.id
      else break
    }
    // Several turns can share the last reachable scroll position.
    if (atEnd && endChoice && targets.includes(endChoice)) {
      const y = endChoice.getBoundingClientRect().top
      if (y >= top - 1 && y < top + height) next = endChoice.id
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
    // Focus also passes through the menu's rows, which sit inside this
    // wrapper; only the trigger getting it back means the menu has closed.
    node.addEventListener(
      'focusin',
      (event) => {
        // Move on after the menu has finished handing focus back.
        if (pendingFocus && (event.target as Element).closest('.rf-dropdown-trigger')) {
          clearTimeout(focusTimer)
          focusTimer = setTimeout(focusPending)
        }
      },
      { signal },
    )
    follow(elements()[0])
    window.addEventListener('resize', schedule, { passive: true, signal })
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(focusTimer)
        cancelAnimationFrame(frame)
        listening?.abort()
        scroller = null
      },
      { once: true },
    )
    schedule()
  })

  function jump(id: string) {
    const target = document.getElementById(id)
    if (!target) return
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    follow(target)
    const { top, scrollTop, maxScrollTop } = box()
    const inset = scroller instanceof HTMLElement ? peek : 0
    const destination = Math.max(0, scrollTop + target.getBoundingClientRect().top - top - inset)
    endChoice = destination >= maxScrollTop - 1 ? target : undefined
    if (scroller instanceof HTMLElement) {
      scroller.scrollTo({ top: destination, behavior })
    } else target.scrollIntoView({ block: 'start', behavior })
    // The rail keeps focus, so its ticks can be stepped through.
    if (handle.props.variant !== 'rail') {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      // The menu hands focus back to its trigger once it has closed; move it
      // on to the message then, or after a moment if focus never comes back.
      pendingFocus = target
      clearTimeout(focusTimer)
      focusTimer = setTimeout(focusPending, 400)
    }
    current = id
    handle.update()
  }

  return () => {
    const { items, label = 'Conversation outline', size = 'compact', align = 'end' } = handle.props
    if (!items.length) return null
    // A new turn can arrive without a scroll; check again after it renders.
    handle.queueTask(schedule)
    const checked = current ?? items[0].id
    if (handle.props.variant === 'rail')
      return (
        <nav class="rf-chat-outline-rail" aria-label={label} mix={watch}>
          <ol
            mix={on<HTMLOListElement, 'keydown'>('keydown', (event) => {
              // Up and Down step between ticks; Home and End reach the ends.
              const ticks = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
              const index = ticks.indexOf(document.activeElement as HTMLButtonElement)
              if (index < 0) return
              const next =
                event.key === 'ArrowDown'
                  ? index + 1
                  : event.key === 'ArrowUp'
                    ? index - 1
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? ticks.length - 1
                        : -1
              if (next < 0 || next >= ticks.length) return
              event.preventDefault()
              ticks[next].focus()
            })}
          >
            {items.map((item) => (
              <li key={item.id}>
                <Tooltip
                  side="right"
                  content={
                    <span class="rf-chat-outline-preview">
                      <strong>{item.label}</strong>
                      {item.preview && <span>{item.preview}</span>}
                    </span>
                  }
                  renderTrigger={(trigger) => (
                    <button
                      type="button"
                      class="rf-chat-outline-tick"
                      aria-label={item.label}
                      aria-current={item.id === checked ? 'location' : undefined}
                      mix={[trigger.mix, on('click', () => jump(item.id))]}
                    />
                  )}
                />
              </li>
            ))}
          </ol>
        </nav>
      )
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
