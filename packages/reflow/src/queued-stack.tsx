import { messageTransitionName, transitionMessage } from './message-transition.ts'
import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { Button } from './basic.tsx'

const interactiveContent = 'button, a, input, select, textarea, [contenteditable]'

export interface QueuedMessage {
  id: string
  content: RemixNode
}

export interface QueuedStackProps {
  messages: readonly QueuedMessage[]
  onOrderChange: (ids: string[]) => void
  onSend: (id: string) => void | Promise<void>
  onRemove?: (id: string) => void
  onEdit?: (id: string) => void
  label?: string
  transitionMessages?: boolean
}

export function QueuedStack(handle: Handle<QueuedStackProps>) {
  let expanded = false
  let list: HTMLOListElement | undefined
  let drag:
    | { id: string; pointer: number; origin: number; grabOffset: number; started: boolean }
    | undefined
  const listRef = ref((node) => {
    if (node instanceof HTMLOListElement) list = node
  })
  const sending = new Set<string>()

  async function send(id: string) {
    if (sending.has(id)) return
    sending.add(id)
    async function update() {
      await handle.props.onSend(id)
      if (!handle.signal.aborted) await handle.update()
    }
    try {
      if (handle.props.transitionMessages) await transitionMessage(update, handle.signal)
      else await update()
    } finally {
      sending.delete(id)
    }
  }

  function move(id: string, target: number) {
    const ids = handle.props.messages.map((message) => message.id)
    const from = ids.indexOf(id)
    if (from < 0 || target < 0 || target >= ids.length || from === target) return
    ids.splice(from, 1)
    ids.splice(target, 0, id)
    handle.props.onOrderChange(ids)
  }

  function endDrag(event: PointerEvent) {
    if (!drag || drag.pointer !== event.pointerId) return
    list?.removeAttribute('data-dragging')
    list?.querySelector('[data-dragged]')?.removeAttribute('data-dragged')
    drag = undefined
  }

  return () => {
    const { messages, onRemove, onEdit, label = 'Queued messages' } = handle.props
    if (!messages.length) expanded = false
    return (
      <div class="rf-queue-wrap" hidden={!messages.length} data-expanded={expanded || undefined}>
        {messages.length > 1 && (
          <button
            type="button"
            class="rf-queue-toggle"
            aria-expanded={expanded}
            aria-controls={handle.id}
            mix={on('click', () => {
              expanded = !expanded
              handle.update()
            })}
          >
            {expanded ? 'Collapse queue' : `${messages.length} queued messages`}
          </button>
        )}
        <ol
          id={handle.id}
          class="rf-queue"
          aria-label={label}
          hidden={!messages.length}
          mix={[
            listRef,
            on<HTMLOListElement, 'pointermove'>('pointermove', (event) => {
              if (!drag || drag.pointer !== event.pointerId) return
              if (!drag.started && Math.abs(event.clientY - drag.origin) < 4) return
              const rows = Array.from(event.currentTarget.children) as HTMLElement[]
              const row = rows.find((row) => row.dataset.queueId === drag?.id)
              if (!row) return
              drag.started = true
              event.currentTarget.dataset.dragging = ''
              row.dataset.dragged = ''
              const top =
                event.clientY - event.currentTarget.getBoundingClientRect().top - drag.grabOffset
              row.style.setProperty('--rf-drag-offset', `${top - row.offsetTop}px`)
              const center = top + row.offsetHeight / 2
              const index = rows.indexOf(row)
              const below = center > row.offsetTop + row.offsetHeight / 2
              const next = below
                ? rows.findLastIndex((item) => center > item.offsetTop + item.offsetHeight / 2)
                : rows.findIndex((item) => center < item.offsetTop + item.offsetHeight / 2)
              if (next !== -1 && next !== index) {
                move(drag.id, next)
                handle.queueTask(() => {
                  if (drag && row.isConnected)
                    row.style.setProperty('--rf-drag-offset', `${top - row.offsetTop}px`)
                })
              }
            }),
            on<HTMLOListElement, 'pointerup'>('pointerup', endDrag),
            on<HTMLOListElement, 'pointercancel'>('pointercancel', endDrag),
            on<HTMLOListElement, 'lostpointercapture'>('lostpointercapture', endDrag),
          ]}
        >
          {messages.map((message, index) => (
            <li
              key={message.id}
              data-queue-id={message.id}
              style={{
                '--rf-queue-depth': Math.min(index, 2),
                viewTransitionName: handle.props.transitionMessages
                  ? messageTransitionName(message.id)
                  : undefined,
              }}
              tabIndex={0}
              aria-label={onEdit ? `Queued message ${index + 1}, press Enter to edit` : undefined}
              mix={[
                onEdit &&
                  on('dblclick', (event) => {
                    if (!(event.target instanceof Element && event.target.closest('button')))
                      onEdit(message.id)
                  }),
                onEdit &&
                  on('keydown', (event) => {
                    if (event.target === event.currentTarget && event.key === 'Enter') {
                      event.preventDefault()
                      onEdit(message.id)
                    }
                  }),
                on<HTMLLIElement, 'pointerdown'>('pointerdown', (event) => {
                  if (!list || !event.isPrimary || event.button !== 0) return
                  if (event.target instanceof Element && event.target.closest(interactiveContent))
                    return
                  if (event.pointerType === 'touch' && !expanded && messages.length > 1) return
                  event.preventDefault()
                  drag = {
                    id: message.id,
                    pointer: event.pointerId,
                    origin: event.clientY,
                    grabOffset: event.clientY - event.currentTarget.getBoundingClientRect().top,
                    started: false,
                  }
                  list.setPointerCapture(event.pointerId)
                }),
                on<HTMLLIElement, 'pointerup'>('pointerup', (event) => {
                  if (
                    !event.isPrimary ||
                    event.pointerType !== 'touch' ||
                    expanded ||
                    messages.length < 2
                  )
                    return
                  if (event.target instanceof Element && event.target.closest(interactiveContent))
                    return
                  expanded = true
                  handle.update()
                }),
              ]}
            >
              <span class="rf-queue-content">{message.content}</span>
              <div class="rf-queue-actions">
                <Button
                  size="icon-compact"
                  variant="ghost"
                  disabled={index === 0}
                  aria-label={`Move message ${index + 1} up`}
                  mix={on('click', () => move(message.id, index - 1))}
                >
                  ↑
                </Button>
                <Button
                  size="icon-compact"
                  variant="ghost"
                  disabled={index === messages.length - 1}
                  aria-label={`Move message ${index + 1} down`}
                  mix={on('click', () => move(message.id, index + 1))}
                >
                  ↓
                </Button>
                {onRemove && (
                  <Button
                    size="icon-compact"
                    variant="ghost"
                    aria-label={`Remove message ${index + 1}`}
                    mix={on('click', () => onRemove(message.id))}
                  >
                    ×
                  </Button>
                )}
                <Button
                  size="compact"
                  variant="secondary"
                  mix={on('click', () => send(message.id))}
                >
                  Send
                </Button>
              </div>
            </li>
          ))}
        </ol>
      </div>
    )
  }
}
