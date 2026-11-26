import { on, ref, type Handle } from 'remix/component'
import { Icon } from './icon.tsx'
import { fluidHover } from './systems/fluid-hover.ts'
import { classList, type ControlSize } from './systems/styling.ts'

export interface ReactionItem {
  emoji: string
  /** Accessible label for the reaction (e.g. `'Thumbs up'`). */
  label: string
  count: number
  /** Whether the current viewer has toggled this reaction on. */
  reacted?: boolean
  /** Optional list of names for tooltip context. */
  users?: readonly string[]
}

export interface ReactionOption {
  emoji: string
  label: string
}

export interface ReactionBarProps {
  /** Current reactions shown as interactive pills. */
  reactions: readonly ReactionItem[]
  /** Called when a reaction pill or picker option is toggled. */
  onToggle?: (emoji: string, nextReacted: boolean) => void
  /** Reactions offered inside the `+` add picker. */
  available?: readonly ReactionOption[]
  /** Shows the `+` picker trigger button. Default `true`. */
  allowAdd?: boolean
  /** Accessible name for the reaction group. Default `'Reactions'`. */
  label?: string
  /** Controls pill padding and font size. */
  size?: ControlSize
  class?: string
}

const DEFAULT_OPTIONS: readonly ReactionOption[] = [
  { emoji: '👍', label: 'Thumbs up' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '❤️', label: 'Heart' },
  { emoji: '👀', label: 'Eyes' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '🤔', label: 'Thinking' },
]

/**
 * Compact pill reaction strip with fluid hover, active toggle state,
 * and an anchored `+` picker for discussion threads and code reviews.
 */
export function ReactionBar(handle: Handle<ReactionBarProps>) {
  let pickerOpen = false
  let alignEnd = false
  let addBtnEl: HTMLButtonElement | null = null
  let pickerEl: HTMLDivElement | null = null

  function closePicker(restoreFocus: boolean) {
    if (!pickerOpen) return
    pickerOpen = false
    void handle.update()
    if (restoreFocus) {
      queueMicrotask(() => addBtnEl?.focus())
    }
  }

  function openPicker() {
    alignEnd = Boolean(
      addBtnEl &&
      typeof window !== 'undefined' &&
      window.innerWidth - addBtnEl.getBoundingClientRect().left < 220,
    )
    pickerOpen = true
    void handle.update()
    queueMicrotask(() => {
      pickerEl?.querySelector<HTMLButtonElement>('.rf-reaction-option')?.focus()
    })
  }

  const mountBar = ref<HTMLDivElement>((node, signal) => {
    const onPointerDown = (event: PointerEvent) => {
      if (!pickerOpen) return
      if (!node.contains(event.target as Node)) {
        closePicker(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && pickerOpen) {
        event.preventDefault()
        closePicker(true)
      }
    }
    document.addEventListener('pointerdown', onPointerDown, { signal })
    document.addEventListener('keydown', onKeyDown, { signal })
  })

  const mountAddBtn = ref<HTMLButtonElement>((node) => {
    addBtnEl = node
  })

  const mountPicker = ref<HTMLDivElement>((node) => {
    pickerEl = node
  })

  return () => {
    const props = handle.props
    const available = props.available ?? DEFAULT_OPTIONS
    const byEmoji = new Map(props.reactions.map((r) => [r.emoji, r]))
    const visible = props.reactions.filter((r) => r.count > 0)

    function toggle(emoji: string) {
      const existing = byEmoji.get(emoji)
      const next = !existing?.reacted
      props.onToggle?.(emoji, next)
    }

    return (
      <div
        class={classList('rf-reaction-bar', props.class)}
        data-size={props.size}
        role="group"
        aria-label={props.label ?? 'Reactions'}
        mix={[mountBar, fluidHover()]}
      >
        <span data-rf-hover-layer="" class="rf-highlight rf-hover-highlight" aria-hidden="true" />
        {visible.map((item) => {
          const title = item.users?.length
            ? `${item.label} · ${item.users.join(', ')}`
            : `${item.label} (${item.count})`
          return (
            <button
              key={item.emoji}
              type="button"
              class="rf-reaction-pill"
              data-rf-hover-item=""
              data-reacted={item.reacted ? 'true' : undefined}
              aria-pressed={Boolean(item.reacted)}
              aria-label={`${item.label}, ${item.count}`}
              title={title}
              mix={on('click', () => toggle(item.emoji))}
            >
              <span class="rf-reaction-emoji" aria-hidden="true">
                {item.emoji}
              </span>
              <span class="rf-reaction-count">{item.count}</span>
            </button>
          )
        })}

        {(props.allowAdd ?? true) && available.length > 0 && (
          <div class="rf-reaction-add-wrap">
            <button
              type="button"
              class="rf-reaction-add"
              data-rf-hover-item=""
              aria-label="Add reaction"
              aria-haspopup="menu"
              aria-expanded={pickerOpen}
              mix={[
                mountAddBtn,
                on('click', () => {
                  if (pickerOpen) closePicker(false)
                  else openPicker()
                }),
              ]}
            >
              <Icon name="plus" size={13} />
            </button>

            {pickerOpen && (
              <div
                class="rf-reaction-picker"
                data-align={alignEnd ? 'end' : undefined}
                role="menu"
                aria-label="Choose a reaction"
                mix={[
                  mountPicker,
                  on<HTMLDivElement, 'keydown'>('keydown', (event) => {
                    const buttons = Array.from(
                      event.currentTarget.querySelectorAll<HTMLButtonElement>(
                        '.rf-reaction-option',
                      ),
                    )
                    if (buttons.length === 0) return
                    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement)
                    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                      event.preventDefault()
                      buttons[(idx + 1 + buttons.length) % buttons.length]?.focus()
                    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                      event.preventDefault()
                      buttons[(idx - 1 + buttons.length) % buttons.length]?.focus()
                    } else if (event.key === 'Home') {
                      event.preventDefault()
                      buttons[0]?.focus()
                    } else if (event.key === 'End') {
                      event.preventDefault()
                      buttons[buttons.length - 1]?.focus()
                    }
                  }),
                ]}
              >
                {available.map((opt) => {
                  const active = Boolean(byEmoji.get(opt.emoji)?.reacted)
                  return (
                    <button
                      key={opt.emoji}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={active}
                      aria-label={opt.label}
                      title={opt.label}
                      class="rf-reaction-option"
                      data-active={active ? 'true' : undefined}
                      mix={on('click', () => {
                        closePicker(true)
                        toggle(opt.emoji)
                      })}
                    >
                      {opt.emoji}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}
