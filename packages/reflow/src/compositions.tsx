import { Icon } from './icon.tsx'
import { messageTransitionName, transitionMessage } from './message-transition.ts'
import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { prefersReducedMotion } from '@remix-run/ui/animation'
import { Badge, Button, Textarea, type BadgeColor, type ControlSize } from './basic.tsx'
import { Accordion } from './groups.tsx'
import { QueuedStack } from './queued-stack.tsx'
import { fluidHover } from './interactive.tsx'
import { motion } from './systems.ts'
import { Tooltip } from './overlays.tsx'

export interface CarouselDotsProps {
  count: number
  current: number
  onChange: (index: number) => void
  labels?: readonly string[]
  label?: string
  progressDuration?: number
  autoplay?: { duration: number; paused?: boolean }
}

export function CarouselDots(handle: Handle<CarouselDotsProps>) {
  const trackVisibility = ref((element, signal) => {
    const observer = new IntersectionObserver(([entry]) =>
      element.toggleAttribute('data-rf-onscreen', entry?.isIntersecting ?? false),
    )
    observer.observe(element)
    signal.addEventListener('abort', () => observer.disconnect(), { once: true })
  })
  return () => {
    const {
      count,
      current,
      onChange,
      labels,
      label = 'Choose a slide',
      progressDuration,
      autoplay,
    } = handle.props
    const duration = autoplay?.duration ?? progressDuration
    return (
      <nav
        class="rf-carousel-dots"
        aria-label={label}
        data-rf-autoplay={autoplay ? '' : undefined}
        data-rf-paused={autoplay?.paused ? '' : undefined}
        mix={[
          fluidHover({ axis: 'x', nearest: true, fastHover: true }),
          autoplay && trackVisibility,
        ]}
      >
        <div class="rf-highlight" aria-hidden="true" data-rf-hover-layer />
        {Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index) => (
          <button
            key={index}
            type="button"
            data-rf-hover-item
            aria-label={labels?.[index] ?? `Go to slide ${index + 1}`}
            aria-current={index === current ? 'true' : undefined}
            mix={on('click', () => onChange(index))}
          >
            <span aria-hidden="true" class="rf-carousel-dot">
              {index === current ? (
                <span
                  style={{ animationDuration: `${duration && duration > 0 ? duration : 0}ms` }}
                  mix={autoplay && on('animationend', () => onChange((current + 1) % count))}
                />
              ) : null}
            </span>
          </button>
        ))}
      </nav>
    )
  }
}

export interface ChatAttachment {
  name: string
  url?: string
  detail?: string
  type?: string
  previewUrl?: string
}

export interface ChatMessageProps {
  transitionId?: string
  role: 'user' | 'assistant'
  children?: RemixNode
  attachments?: readonly ChatAttachment[]
  label?: string
  size?: ControlSize
  time?: string
  actions?: RemixNode
  animate?: boolean
}

export function ChatMessage(handle: Handle<ChatMessageProps>) {
  // As in the reference, a message glides to its new place when the
  // conversation re-renders around it, such as earlier messages moving up as a
  // new one is sent and the transcript scrolls to it. Its place is read before
  // the update lands and again on the next frame, once the transcript has
  // scrolled. A message still playing its entrance does not glide.
  let element: HTMLElement | null = null
  let entered = false
  let glide: Animation | undefined

  const track = ref((node, signal) => {
    if (!(node instanceof HTMLElement)) return
    element = node
    entered = !node.hasAttribute('data-animate') || node.getAnimations().length === 0
    const settle = (event: AnimationEvent) => {
      if (event.target === node) entered = true
    }
    node.addEventListener('animationend', settle, { signal })
    node.addEventListener('animationcancel', settle, { signal })
    signal.addEventListener(
      'abort',
      () => {
        glide?.cancel()
        if (element === node) element = null
      },
      { once: true },
    )
  })

  function followMove() {
    const node = element
    if (
      !node ||
      !entered ||
      !node.isConnected ||
      prefersReducedMotion() ||
      document.documentElement.hasAttribute('data-rf-message-transition')
    )
      return
    // Where the message shows now, a glide in flight included.
    const before = node.getBoundingClientRect().top
    const glideFrom = (shown: number) => {
      if (element !== node || !node.isConnected) return
      glide?.cancel()
      const offset = shown - node.getBoundingClientRect().top
      if (Math.abs(offset) < 0.5) return
      glide = node.animate(
        [{ transform: `translateY(${offset}px)` }, { transform: 'none' }],
        motion.moderate,
      )
      // A starting animation holds its first frame from now, not from its
      // first tick, so the next paint already shows the old place.
      glide.currentTime = 0
    }
    // Glide as soon as the update lands, so no frame shows the jump. If the
    // transcript scrolls before the next frame, the glide restarts from the
    // same place against the scrolled layout.
    handle.queueTask(() => {
      glideFrom(before)
      const started = glide
      const shown = node.getBoundingClientRect().top
      requestAnimationFrame(() => {
        // The message has not been painted elsewhere yet, so a restart is seamless.
        if (glide === started && Math.abs(node.getBoundingClientRect().top - shown) >= 0.5) {
          glideFrom(before)
        }
      })
    })
  }

  return () => {
    const { role, label, attachments, children, size, time, actions, animate = true } = handle.props
    followMove()
    return (
      <article
        class="rf-chat-message"
        data-role={role}
        data-size={size}
        data-animate={animate ? '' : undefined}
        aria-label={label ?? (role === 'user' ? 'You' : 'Assistant')}
        mix={track}
      >
        {attachments?.length ? (
          <ul class="rf-chat-attachments" aria-label="Attachments">
            {attachments.map((attachment, index) => (
              <li
                key={index}
                class="rf-chat-thumb"
                title={attachment.detail ? `${attachment.name} (${attachment.detail})` : undefined}
              >
                {attachment.previewUrl ? (
                  <img src={attachment.previewUrl} alt={attachment.name} />
                ) : (
                  <span class="rf-chat-thumb-glyph" role="img" aria-label={attachment.name}>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                      <path d="M14 3v5h5" />
                    </svg>
                  </span>
                )}
                {attachment.url && <a href={attachment.url} aria-label={attachment.name} />}
              </li>
            ))}
          </ul>
        ) : null}
        {children != null && children !== '' && (
          <div
            class="rf-chat-body"
            style={
              handle.props.transitionId
                ? { viewTransitionName: messageTransitionName(handle.props.transitionId) }
                : undefined
            }
          >
            {children}
          </div>
        )}
        {((role === 'user' && time) || actions) && (
          <div class="rf-chat-meta">
            {role === 'user' && time && <span class="rf-chat-time">{time}</span>}
            {actions != null && <span class="rf-chat-actions">{actions}</span>}
          </div>
        )}
      </article>
    )
  }
}

export interface ComposerMessage {
  queuedId?: string
  text: string
  files: readonly File[]
}

export interface ComposerQueuedMessage extends ComposerMessage {
  id: string
}

export interface InputMessageProps {
  transitionMessages?: boolean
  queue?: readonly ComposerQueuedMessage[]
  onQueueChange?: (queue: ComposerQueuedMessage[]) => void
  showQueue?: boolean
  value?: string
  onValueChange?: (value: string) => void
  files?: readonly File[]
  onFilesChange?: (files: File[]) => void
  accept?: string
  filePreviewSize?: number
  minRows?: number
  maxRows?: number
  size?: ControlSize
  history?: readonly string[]
  suggestions?: readonly string[]
  status?: 'idle' | 'streaming'
  onStop?: () => void
  onSend: (message: ComposerMessage) => void | Promise<void>
  label?: string
  placeholder?: string
  placeholderSuggestion?: string
  defaultValue?: string
  disabled?: boolean
  attachments?: boolean
  maxFiles?: number
  actions?: RemixNode
  rightActions?: RemixNode
}

export function InputMessage(handle: Handle<InputMessageProps>) {
  let draft = handle.props.defaultValue ?? ''
  let files: File[] = []
  let sending = false
  let error = ''
  let queued: ComposerQueuedMessage[] = []
  let queueSequence = 0
  let previousStatus = handle.props.status
  let drainPending = false
  let activeSuggestion = -1
  let hoveredSuggestion = -1
  let dragOver = false
  const exiting = new Map<File, ReturnType<typeof setTimeout>>()
  handle.signal.addEventListener(
    'abort',
    () => {
      for (const timer of exiting.values()) clearTimeout(timer)
      exiting.clear()
    },
    { once: true },
  )
  let historyIndex: number | undefined
  let historyDraft = ''
  let fileInput: HTMLInputElement | undefined
  const suggestionHover = fluidHover({ highlightedSelector: '[data-highlighted]', fastHover: true })
  const inputRef = ref((node) => {
    if (node instanceof HTMLInputElement) fileInput = node
  })

  function changeDraft(value: string) {
    activeSuggestion = -1
    if (handle.props.value === undefined) draft = value
    handle.props.onValueChange?.(value)
    handle.update()
  }

  function changeFiles(value: File[]) {
    if (handle.props.files === undefined) files = value
    handle.props.onFilesChange?.(value)
    handle.update()
  }

  function removeFile(file: File) {
    error = ''
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finishRemoval(file)
    if (exiting.has(file)) return
    // The fade normally finishes the removal first. Keep a fallback for hidden or unstyled composers.
    exiting.set(
      file,
      setTimeout(() => finishRemoval(file), 400),
    )
    handle.update()
  }

  function finishRemoval(file: File) {
    clearTimeout(exiting.get(file))
    exiting.delete(file)
    if (!files.includes(file)) return
    changeFiles(files.filter((item) => item !== file))
  }

  function setDragOver(value: boolean) {
    if (dragOver === value) return
    dragOver = value
    handle.update()
  }

  function addFiles(incoming: FileList | null) {
    if (!incoming || handle.props.disabled || sending) return
    const limit = Math.max(1, handle.props.maxFiles ?? 5)
    const allowed = (handle.props.accept ?? 'image/png,image/jpeg,application/pdf')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
    const additions = Array.from(incoming).filter(
      (file) =>
        !allowed.length ||
        allowed.some((type) =>
          type.startsWith('.')
            ? file.name.toLowerCase().endsWith(type)
            : type.endsWith('/*')
              ? file.type.startsWith(type.slice(0, -1))
              : file.type === type,
        ),
    )
    const remaining = limit - files.length
    error =
      additions.length !== incoming.length
        ? 'Some files have an unsupported type.'
        : additions.length > remaining
          ? `You can attach up to ${limit} files.`
          : ''
    changeFiles([...files, ...additions.slice(0, Math.max(0, remaining))])
  }

  function changeQueue(next: ComposerQueuedMessage[]) {
    if (handle.props.queue === undefined) queued = next
    handle.props.onQueueChange?.(next)
    handle.update()
  }

  async function sendQueued(id: string) {
    if (sending || handle.props.disabled) return
    const current = handle.props.queue ?? queued
    const message = current.find((item) => item.id === id)
    if (!message) return
    const { text, files: attachments } = message
    drainPending = false
    sending = true
    error = ''
    async function dispatch() {
      if (handle.signal.aborted) return
      changeQueue(current.filter((item) => item.id !== id))
      await handle.props.onSend({ text, files: attachments, queuedId: id })
      if (!handle.signal.aborted) await handle.update()
    }
    try {
      if (handle.props.transitionMessages) await transitionMessage(dispatch, handle.signal)
      else await dispatch()
    } catch {
      if (handle.signal.aborted) return
      changeQueue([message, ...(handle.props.queue ?? queued).filter((item) => item.id !== id)])
      error = 'Could not send the message. Try again.'
    } finally {
      sending = false
      if (!handle.signal.aborted) handle.update()
    }
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    if (handle.props.disabled || sending || (!draft.trim() && files.length === 0)) return
    if (handle.props.status === 'streaming') {
      changeQueue([
        ...(handle.props.queue ?? queued),
        { id: `${handle.id}-queued-${++queueSequence}`, text: draft.trim(), files: [...files] },
      ])
      changeDraft('')
      changeFiles([])
      return
    }
    sending = true
    error = ''
    handle.update()
    try {
      await handle.props.onSend({ text: draft.trim(), files: [...files] })
      if (handle.signal.aborted) return
      changeDraft('')
      changeFiles([])
      historyIndex = undefined
    } catch {
      error = 'Could not send the message. Try again.'
    } finally {
      sending = false
      if (!handle.signal.aborted) handle.update()
    }
  }

  return () => {
    draft = handle.props.value ?? draft
    files = [...(handle.props.files ?? files)]
    const queue = handle.props.queue ?? queued
    if (previousStatus === 'streaming' && handle.props.status === 'idle')
      drainPending = queue.length > 0
    if (drainPending && !sending && queue.length && handle.props.status === 'idle') {
      const id = queue[0].id
      handle.queueTask(() => {
        if (handle.props.status === 'idle') void sendQueued(id)
      })
    }
    previousStatus = handle.props.status
    const {
      label = 'Message',
      placeholder = 'Ask me anything…',
      placeholderSuggestion,
      disabled,
      actions,
      rightActions,
      attachments = true,
      size,
      minRows = 1,
      maxRows = 8,
      history = [],
      suggestions = [],
      status,
    } = handle.props
    const showSuggestion =
      !draft &&
      Boolean(placeholderSuggestion) &&
      !disabled &&
      !sending &&
      !(dragOver && attachments)
    const suggestionId = `${handle.id}-suggestion`
    return (
      <form
        class="rf-composer"
        aria-label={label}
        data-size={size}
        data-dragover={dragOver || undefined}
        style={{
          '--rf-file-preview-size': `${handle.props.filePreviewSize ?? 80}px`,
          '--rf-composer-max-rows': maxRows,
        }}
        mix={[
          on<HTMLFormElement, 'submit'>('submit', submit),
          // Pressing the composer's own surface focuses the field, like the reference; controls keep their behavior.
          on<HTMLFormElement, 'mousedown'>('mousedown', (event) => {
            const target = event.target
            if (disabled || !(target instanceof Element) || target instanceof HTMLTextAreaElement)
              return
            if (
              target.closest(
                'button, a, input, select, textarea, [contenteditable], [role="button"], [role="option"], .rf-queue',
              )
            )
              return
            event.preventDefault()
            event.currentTarget.querySelector('textarea')?.focus()
          }),
          attachments &&
            on('dragover', (event) => {
              if (!disabled && !sending && event.dataTransfer?.types.includes('Files')) {
                event.preventDefault()
                setDragOver(true)
              }
            }),
          attachments &&
            on<HTMLFormElement, 'dragleave'>('dragleave', (event) => {
              if (
                !(event.relatedTarget instanceof Node) ||
                !event.currentTarget.contains(event.relatedTarget)
              )
                setDragOver(false)
            }),
          attachments &&
            on('paste', (event) => {
              if (!event.clipboardData?.files.length) return
              event.preventDefault()
              addFiles(event.clipboardData.files)
            }),
          attachments &&
            on('drop', (event) => {
              setDragOver(false)
              if (!event.dataTransfer?.files.length) return
              event.preventDefault()
              addFiles(event.dataTransfer.files)
            }),
        ]}
      >
        {handle.props.showQueue !== false && (
          <QueuedStack
            transitionMessages={handle.props.transitionMessages}
            messages={queue.map((message) => ({
              id: message.id,
              content:
                message.text ||
                `${message.files.length} attachment${message.files.length === 1 ? '' : 's'}`,
            }))}
            onOrderChange={(ids) =>
              changeQueue(ids.flatMap((id) => queue.filter((message) => message.id === id)))
            }
            onRemove={(id) => changeQueue(queue.filter((message) => message.id !== id))}
            onSend={sendQueued}
            onEdit={(id) => {
              const message = queue.find((item) => item.id === id)
              if (!message || disabled || sending) return
              changeDraft(message.text)
              changeFiles([...message.files])
              changeQueue(queue.filter((item) => item.id !== id))
            }}
          />
        )}
        <div
          class="rf-composer-files-region"
          data-open={files.some((file) => !exiting.has(file)) || undefined}
        >
          <div>
            <ul class="rf-composer-files" aria-label="Files to send">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  data-exiting={exiting.has(file) || undefined}
                  mix={on<HTMLLIElement, 'transitionend'>('transitionend', (event) => {
                    if (
                      event.target === event.currentTarget &&
                      event.propertyName === 'opacity' &&
                      exiting.has(file)
                    )
                      finishRemoval(file)
                  })}
                >
                  <FilePreview file={file} />
                  <Tooltip
                    content="Remove"
                    side="top"
                    renderTrigger={(trigger) => (
                      <button
                        type="button"
                        class="rf-composer-file-remove"
                        aria-label={`Remove ${file.name}`}
                        disabled={disabled || sending}
                        aria-describedby={trigger['aria-describedby']}
                        mix={[
                          trigger.mix,
                          on('click', (event) => {
                            event.stopPropagation()
                            removeFile(file)
                          }),
                        ]}
                      >
                        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    )}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div class="rf-composer-field">
          <Textarea
            rows={minRows}
            aria-label={label}
            aria-describedby={showSuggestion ? suggestionId : undefined}
            autoResize
            aria-controls={!draft && suggestions.length ? `${handle.id}-suggestions` : undefined}
            aria-activedescendant={
              !draft && activeSuggestion >= 0
                ? `${handle.id}-suggestion-${activeSuggestion}`
                : undefined
            }
            placeholder={
              dragOver && attachments
                ? 'Drop files here to add to chat'
                : showSuggestion
                  ? undefined
                  : placeholder
            }
            value={draft}
            disabled={disabled || sending}
            mix={[
              on<HTMLTextAreaElement, 'input'>('input', (event) => {
                historyIndex = undefined
                changeDraft(event.currentTarget.value)
              }),
              on<HTMLTextAreaElement, 'keydown'>('keydown', (event) => {
                if (event.isComposing) return
                if (
                  !draft &&
                  suggestions.length &&
                  (event.key === 'ArrowDown' || (event.key === 'ArrowUp' && activeSuggestion >= 0))
                ) {
                  event.preventDefault()
                  hoveredSuggestion = -1
                  activeSuggestion =
                    event.key === 'ArrowDown'
                      ? Math.min(suggestions.length - 1, activeSuggestion + 1)
                      : Math.max(-1, activeSuggestion - 1)
                  handle.update()
                  return
                }
                if (!draft && activeSuggestion >= 0 && event.key === 'Enter') {
                  event.preventDefault()
                  changeDraft(suggestions[activeSuggestion])
                  return
                }
                if (event.key === 'Tab' && !event.shiftKey && !draft && placeholderSuggestion) {
                  event.preventDefault()
                  changeDraft(placeholderSuggestion)
                } else if (
                  (event.key === 'ArrowUp' || event.key === 'ArrowDown') &&
                  !event.shiftKey &&
                  history.length
                ) {
                  const field = event.currentTarget
                  const atStart = !field.value.slice(0, field.selectionStart).includes('\n')
                  const atEnd = !field.value.slice(field.selectionEnd).includes('\n')
                  if (event.key === 'ArrowUp' && atStart) {
                    event.preventDefault()
                    if (historyIndex === undefined) {
                      historyDraft = draft
                      historyIndex = history.length
                    }
                    historyIndex = Math.max(0, historyIndex - 1)
                    changeDraft(history[historyIndex])
                  } else if (event.key === 'ArrowDown' && atEnd && historyIndex !== undefined) {
                    event.preventDefault()
                    historyIndex++
                    const next =
                      historyIndex >= history.length ? historyDraft : history[historyIndex]
                    if (historyIndex >= history.length) historyIndex = undefined
                    changeDraft(next)
                  }
                } else if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }),
            ]}
          />
          {showSuggestion && (
            <>
              <span class="rf-composer-suggestion" aria-hidden="true">
                <span>
                  <span>{placeholderSuggestion}</span>
                  <kbd>Tab</kbd>
                </span>
              </span>
              <span class="rf-basic-sr-only" id={suggestionId}>
                Press Tab to enter “{placeholderSuggestion}”.
              </span>
            </>
          )}
        </div>
        <div class="rf-composer-actions">
          {attachments && (
            <>
              <input
                type="file"
                accept={handle.props.accept ?? 'image/png,image/jpeg,application/pdf'}
                multiple
                hidden
                mix={[
                  inputRef,
                  on<HTMLInputElement, 'change'>('change', (event) => {
                    addFiles(event.currentTarget.files)
                    event.currentTarget.value = ''
                  }),
                ]}
              />
              <Button
                variant="ghost"
                size="icon-compact"
                aria-label="Attach files"
                disabled={disabled || sending}
                mix={on('click', () => fileInput?.click())}
              >
                <Icon name="plus" />
              </Button>
            </>
          )}
          {actions}
          {rightActions != null && <div class="rf-composer-right-actions">{rightActions}</div>}
          {status === 'streaming' && !draft.trim() && !files.length ? (
            <Button
              class="rf-composer-send"
              size="icon-compact"
              aria-label="Stop response"
              disabled={disabled}
              mix={on('click', () => handle.props.onStop?.())}
            >
              <Icon name="square-stop" />
            </Button>
          ) : (
            <Button
              class="rf-composer-send"
              size="icon-compact"
              type="submit"
              aria-label={status === 'streaming' ? 'Queue message' : 'Send message'}
              loading={sending}
              disabled={disabled || (!draft.trim() && files.length === 0)}
            >
              <Icon name="arrow-up" />
            </Button>
          )}
        </div>
        {suggestions.length > 0 && (
          <div
            class="rf-composer-suggestions-region"
            data-open={!draft || undefined}
            inert={Boolean(draft)}
          >
            <div>
              <div
                class="rf-composer-suggestions"
                id={`${handle.id}-suggestions`}
                role="listbox"
                aria-label="Suggested prompts"
                mix={[
                  suggestionHover,
                  on('pointerleave', () => {
                    if (hoveredSuggestion >= 0) {
                      hoveredSuggestion = -1
                      handle.update()
                    }
                  }),
                ]}
              >
                <div class="rf-highlight" aria-hidden="true" data-rf-hover-layer />
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion}
                    id={`${handle.id}-suggestion-${index}`}
                    role="option"
                    data-rf-hover-item
                    aria-selected={index === activeSuggestion}
                    aria-disabled={disabled || sending || undefined}
                    data-highlighted={
                      index === (hoveredSuggestion >= 0 ? hoveredSuggestion : activeSuggestion) ||
                      undefined
                    }
                    mix={[
                      on('pointermove', () => {
                        if (hoveredSuggestion !== index) {
                          hoveredSuggestion = index
                          handle.update()
                        }
                      }),
                      on('click', () => {
                        if (!disabled && !sending) changeDraft(suggestion)
                      }),
                    ]}
                  >
                    <span>{suggestion}</span>
                    {index === activeSuggestion ? (
                      <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                        <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                        <path d="m9 10-5 5 5 5" />
                      </svg>
                    ) : index === 0 && activeSuggestion < 0 ? (
                      <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                        <path d="M12 5v14" />
                        <path d="m19 12-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" data-idle>
                        <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                        <path d="m9 10-5 5 5 5" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {error && (
          <p class="rf-composer-error" role="alert">
            {error}
          </p>
        )}
      </form>
    )
  }
}

function FilePreview(handle: Handle<{ file: File }>) {
  let image: HTMLImageElement | undefined
  let previousFile: File | undefined
  let url: string | undefined
  function updateImage() {
    if (!image || previousFile === handle.props.file) return
    if (url) URL.revokeObjectURL(url)
    previousFile = handle.props.file
    url = URL.createObjectURL(previousFile)
    image.src = url
  }
  const capture = ref((element, signal) => {
    if (!(element instanceof HTMLImageElement)) return
    image = element
    updateImage()
    signal.addEventListener(
      'abort',
      () => {
        if (url) URL.revokeObjectURL(url)
        image = undefined
      },
      { once: true },
    )
  })
  return () => {
    handle.queueTask(updateImage)
    const file = handle.props.file
    return (
      <div class="rf-file-thumb">
        {file.type.startsWith('image/') ? (
          <img alt={file.name} mix={capture} />
        ) : (
          <div role="img" aria-label={file.name}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5" />
            </svg>
          </div>
        )}
      </div>
    )
  }
}

const thinkingLabels = ['Thinking', 'Moonwalking', 'Planning', 'Refining']

export function ThinkingIndicator(
  handle: Handle<{ labels?: readonly string[]; interval?: number; showIcon?: boolean }>,
) {
  let position = 0
  const cycle = ref((_node, signal) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(
      () => {
        const count = handle.props.labels?.length || thinkingLabels.length
        position = (position + 1) % count
        handle.update()
      },
      Math.max(500, handle.props.interval ?? 4000),
    )
    signal.addEventListener('abort', () => clearInterval(timer), { once: true })
  })
  return () => {
    const labels = handle.props.labels?.length ? handle.props.labels : thinkingLabels
    const widestLabel = labels.reduce(
      (longest, label) => (label.length > longest.length ? label : longest),
      '',
    )
    return (
      <span class="rf-thinking" role="status" mix={cycle}>
        <span class="rf-basic-sr-only">Thinking…</span>
        {handle.props.showIcon !== false && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        )}
        <span class="rf-thinking-words" aria-hidden="true">
          <span class="rf-thinking-sizer">{widestLabel}</span>
          <span class="rf-thinking-word" key={position}>
            {labels[position % labels.length]}
          </span>
        </span>
      </span>
    )
  }
}

export interface ThinkingStep {
  value: string
  title: string
  description?: string
  content?: RemixNode
  icon?: RemixNode
  status?: 'pending' | 'active' | 'complete'
}

export interface ThinkingStepsProps {
  steps?: readonly ThinkingStep[]
  /** Custom disclosure heading. Keep its contents non-interactive. */
  heading?: RemixNode
  /** Custom disclosure body, in place of the generated steps. */
  children?: RemixNode
  defaultValue?: string
  label?: string
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: 'accordion' | 'timeline'
  size?: ControlSize
}

export function ThinkingSteps(handle: Handle<ThinkingStepsProps>) {
  let localOpen = handle.props.defaultOpen ?? handle.props.variant === 'timeline'
  return () => {
    const {
      steps = [],
      label,
      heading,
      children,
      open,
      onOpenChange,
      defaultValue,
      variant,
      size,
    } = handle.props
    const expanded = open ?? localOpen
    const timeline = variant === 'timeline'
    const list =
      children ??
      (timeline ? (
        <ol class="rf-thinking-timeline">
          {steps
            .filter((step) => step.status !== 'pending')
            .map((step, index) => (
              <li
                key={step.value}
                data-status={step.status ?? 'complete'}
                style={{ '--rf-step-delay': `${Math.min(index, 6) * 24}ms` }}
              >
                <div class="rf-thinking-step-body">
                  <span class="rf-thinking-timeline-icon" aria-hidden="true">
                    {step.icon ?? <span class="rf-thinking-timeline-dot" />}
                  </span>
                  <div class="rf-thinking-timeline-row">
                    <span class="rf-thinking-timeline-title">
                      {step.title}
                      {step.status === 'active' && !step.title.endsWith('…') ? '…' : ''}
                    </span>
                    <span class="rf-basic-sr-only"> ({step.status ?? 'complete'})</span>
                    {step.description && (
                      <span class="rf-thinking-timeline-description">{step.description}</span>
                    )}
                    {step.content != null && (
                      <div class="rf-thinking-timeline-content">{step.content}</div>
                    )}
                  </div>
                </div>
              </li>
            ))}
        </ol>
      ) : (
        <Accordion
          defaultValue={defaultValue}
          items={steps.map((step) => ({
            ...step,
            content: step.content,
            title: (
              <span class="rf-step-title" data-status={step.status ?? 'pending'}>
                <span aria-hidden="true">{step.status === 'complete' ? '✓' : '○'}</span>
                {step.title}
                <span class="rf-basic-sr-only"> ({step.status ?? 'pending'})</span>
              </span>
            ),
          }))}
        />
      ))
    return label || heading != null ? (
      <details
        class="rf-thinking-steps rf-thinking-steps-disclosure"
        data-variant={variant}
        data-density={size}
        open={expanded}
      >
        <summary
          aria-label={heading != null ? label : undefined}
          mix={on('click', (event) => {
            event.preventDefault()
            if (open === undefined) localOpen = !expanded
            onOpenChange?.(!expanded)
            handle.update()
          })}
        >
          {heading ??
            (timeline ? (
              <span class="rf-thinking-disclosure-label">
                <span aria-hidden="true">{label}</span>
                <span>{label}</span>
              </span>
            ) : (
              label
            ))}
          <Icon name="chevron-right" />
        </summary>
        {list}
      </details>
    ) : (
      <div class="rf-thinking-steps" data-variant={variant} data-density={size}>
        {list}
      </div>
    )
  }
}

/** A step's secondary disclosure, with native keyboard and no-script behavior. */
export function ThinkingStepDetails(
  handle: Handle<{
    summary: string
    details?: readonly string[]
    defaultOpen?: boolean
    children?: RemixNode
  }>,
) {
  let open = handle.props.defaultOpen ?? false
  return () => {
    const { summary, details, children } = handle.props
    return (
      <details class="rf-thinking-step-details" open={open}>
        <summary
          mix={on('click', (event) => {
            event.preventDefault()
            open = !open
            handle.update()
          })}
        >
          {summary}
        </summary>
        {details && (
          <ul>
            {details.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        )}
        {children}
      </details>
    )
  }
}

export function ThinkingStepSources(handle: Handle<{ children: RemixNode }>) {
  return () => <div class="rf-thinking-step-sources">{handle.props.children}</div>
}

export function ThinkingStepSource(
  handle: Handle<{ children: RemixNode; href?: string; color?: BadgeColor; delay?: number }>,
) {
  return () => {
    const { children, href, color = 'gray', delay = 0 } = handle.props
    const badge = (
      <Badge size="compact" variant="solid" color={color}>
        {children}
      </Badge>
    )
    const style = { '--rf-thinking-part-delay': `${Math.max(0, delay)}ms` }
    return href ? (
      <a href={href} class="rf-thinking-step-source" style={style}>
        {badge}
      </a>
    ) : (
      <span class="rf-thinking-step-source" style={style}>
        {badge}
      </span>
    )
  }
}

export function ThinkingStepImage(
  handle: Handle<{
    src: string
    alt?: string
    caption?: string
    width?: number
    height?: number
    delay?: number
  }>,
) {
  return () => {
    const { src, alt = '', caption, width, height, delay = 0 } = handle.props
    return (
      <figure
        class="rf-thinking-step-image"
        style={{ '--rf-thinking-part-delay': `${Math.max(0, delay)}ms` }}
      >
        <img src={src} alt={alt} width={width} height={height} />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    )
  }
}
