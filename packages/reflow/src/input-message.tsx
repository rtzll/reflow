import { partitionFiles } from './behaviors/file-selection.ts'
import { Icon } from './icon.tsx'
import { transitionMessage } from './systems/message-transition.ts'
import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { Button } from './button.tsx'
import { Textarea } from './textarea.tsx'
import type { ControlSize } from './systems/styling.ts'
import { QueuedStack } from './queued-stack.tsx'
import { fluidHover } from './systems/fluid-hover.ts'
import { Tooltip } from './tooltip.tsx'
import {
  TriggerMenu,
  type TriggerMenuFieldProps,
  type TriggerMenuTrigger,
} from './trigger-menu.tsx'

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
  triggers?: readonly TriggerMenuTrigger[]
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
    const { accepted: additions, rejected } = partitionFiles(
      incoming,
      handle.props.accept ?? 'image/png,image/jpeg,application/pdf',
    )
    const remaining = limit - files.length
    error =
      rejected.length > 0
        ? 'Some files have an unsupported type.'
        : additions.length > remaining
          ? `You can attach up to ${limit} files.`
          : ''
    changeFiles([...files, ...additions.slice(0, Math.max(0, remaining))])
  }

  function changeQueue(next: ComposerQueuedMessage[]) {
    // When the last queued message leaves with focus inside the queue, the
    // message box takes focus, so the keyboard does not fall back to the page.
    const active = document.activeElement
    const composer = next.length === 0 ? active?.closest('.rf-queue-wrap')?.closest('form') : null
    if (handle.props.queue === undefined) queued = next
    handle.props.onQueueChange?.(next)
    handle.update()
    if (composer)
      handle.queueTask(() =>
        composer.querySelector<HTMLTextAreaElement>('textarea')?.focus({ preventScroll: true }),
      )
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
    const renderField = (triggerField?: TriggerMenuFieldProps) => (
      <Textarea
        rows={minRows}
        aria-label={label}
        aria-describedby={showSuggestion ? suggestionId : undefined}
        autoResize
        aria-controls={
          triggerField?.['aria-controls'] ??
          (!draft && suggestions.length ? `${handle.id}-suggestions` : undefined)
        }
        aria-autocomplete={triggerField?.['aria-autocomplete']}
        aria-activedescendant={
          triggerField?.['aria-activedescendant'] ??
          (!draft && activeSuggestion >= 0
            ? `${handle.id}-suggestion-${activeSuggestion}`
            : undefined)
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
          triggerField?.mix,
          on<HTMLTextAreaElement, 'input'>('input', (event) => {
            historyIndex = undefined
            changeDraft(event.currentTarget.value)
          }),
          on<HTMLTextAreaElement, 'keydown'>('keydown', (event) => {
            if (event.isComposing || event.defaultPrevented) return
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
                const next = historyIndex >= history.length ? historyDraft : history[historyIndex]
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
    )
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
          {handle.props.triggers?.length ? (
            <TriggerMenu triggers={handle.props.triggers} renderField={renderField} />
          ) : (
            renderField()
          )}
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
