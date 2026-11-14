import { isMacPlatform } from './behaviors/shortcut.ts'
import { on, ref } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import { Button } from './button.tsx'
import { Icon } from './icon.tsx'
import { fluidHover } from './systems/fluid-hover.ts'

export interface AskUserOption {
  id?: string
  title: string
  description?: string
}

export interface AskUserQuestion {
  id?: string
  title: string
  /** Options to choose from. Omit them only for a `freeText` question. */
  options?: readonly AskUserOption[]
  multiSelect?: boolean
  allowOther?: boolean
  otherPlaceholder?: string
  skippable?: boolean
  nextLabel?: string
  /** `inline` puts title and description on one line, `stacked` puts the description below. */
  layout?: 'inline' | 'stacked'
  /** Which side of the row the numbered chip sits on. */
  chipPosition?: 'left' | 'right'
  /** A single open-ended field as the whole answer, returned in `otherText`. */
  freeText?: boolean
  freeTextPlaceholder?: string
  /** Starts the field at multi-line height (default). `false` makes Enter submit. */
  freeTextMultiline?: boolean
  /** Runs on submit. A returned message blocks navigation and shows in the footer. */
  freeTextValidate?: (value: string) => string | null | undefined
}

export interface AskUserAnswer {
  questionId: string
  selectedIds: string[]
  otherText?: string
  skipped?: boolean
}

export interface AskUserQuestionsProps {
  questions: readonly AskUserQuestion[]
  currentIndex?: number
  defaultCurrentIndex?: number
  onCurrentIndexChange?: (index: number) => void
  answers?: Record<string, AskUserAnswer>
  defaultAnswers?: Record<string, AskUserAnswer>
  onAnswersChange?: (answers: Record<string, AskUserAnswer>) => void
  onComplete?: (answers: Record<string, AskUserAnswer>) => void
  onSkip?: (questionId: string, index: number) => void
  skipLabel?: string
}

const noOptions: readonly AskUserOption[] = []

function questionKey(question: AskUserQuestion, index: number) {
  return question.id ?? `q-${index}`
}

function optionKey(option: AskUserOption, index: number) {
  return option.id ?? `o-${index}`
}

// Several flows can share a page and the 1-9 shortcut is document-wide, so only one answers a key:
// the one holding focus, or the most recently mounted when focus is outside all of them.
const instances: HTMLElement[] = []
// Script-initiated focus (the mousedown redirect onto a row) reads as :focus-visible, so it is flagged.
let pointerRedirect = false

/** Grows a textarea to its content and flags rows that wrap, so the chip can follow the first line. */
function fit(field: HTMLTextAreaElement) {
  field.style.height = '0px'
  field.style.height = `${field.scrollHeight}px`
  const lineHeight = parseFloat(getComputedStyle(field).lineHeight) || 18
  field
    .closest('[data-rf-question-row]')
    ?.toggleAttribute('data-multiline', field.scrollHeight > lineHeight * 1.5)
}

export function AskUserQuestions(handle: Handle<AskUserQuestionsProps>) {
  let latest: Record<string, AskUserAnswer> = handle.props.defaultAnswers ?? {}
  let localIndex = handle.props.defaultCurrentIndex ?? 0
  let error: string | null = null
  let mac = false
  let root: HTMLElement | null = null
  let keyboardFocus = false
  let restoreRowFocus = false
  let shownQuestion: string | undefined
  const titleBase = `${handle.id}-title`
  const hover = fluidHover({ fastHover: true })

  function view() {
    const { questions } = handle.props
    const raw = handle.props.currentIndex ?? localIndex
    const index = Math.max(
      0,
      Math.min(Number.isFinite(raw) ? Math.trunc(raw) : 0, Math.max(0, questions.length - 1)),
    )
    const question = questions[index] as AskUserQuestion | undefined
    const id = question ? questionKey(question, index) : ''
    return {
      questions,
      index,
      question,
      id,
      total: questions.length,
      answer: latest[id] as AskUserAnswer | undefined,
    }
  }

  function write(
    update: (previous: Record<string, AskUserAnswer>) => Record<string, AskUserAnswer>,
  ) {
    const next = update(latest)
    latest = next
    handle.props.onAnswersChange?.(next)
    void handle.update()
    return next
  }

  function put(id: string, patch: (previous: AskUserAnswer | undefined) => Partial<AskUserAnswer>) {
    return write((previous) => ({
      ...previous,
      [id]: {
        questionId: id,
        selectedIds: previous[id]?.selectedIds ?? [],
        otherText: previous[id]?.otherText,
        skipped: false,
        ...patch(previous[id]),
      },
    }))
  }

  function rowsElement() {
    return root?.querySelector<HTMLElement>('.rf-question-options') ?? null
  }

  function go(next: number) {
    restoreRowFocus =
      keyboardFocus && !!rowsElement()?.contains(root?.ownerDocument.activeElement ?? null)
    if (handle.props.currentIndex === undefined) localIndex = next
    handle.props.onCurrentIndexChange?.(next)
    error = null
    void handle.update()
  }

  function advance(snapshot: Record<string, AskUserAnswer>) {
    const { index, total } = view()
    if (index >= total - 1) handle.props.onComplete?.(snapshot)
    else go(index + 1)
  }

  function choose(optionId: string) {
    const { id, question } = view()
    if (!question) return
    if (question.multiSelect) {
      put(id, (previous) => {
        const set = new Set(previous?.selectedIds ?? [])
        if (!set.delete(optionId)) set.add(optionId)
        return { selectedIds: Array.from(set) }
      })
      return
    }
    const text = latest[id]?.otherText
    advance(put(id, () => ({ selectedIds: [optionId], otherText: text || undefined })))
  }

  function changeOther(text: string) {
    const { id } = view()
    error = null
    put(id, () => ({ otherText: text }))
  }

  function submitText() {
    const { id, question } = view()
    if (!question) return
    const text = (latest[id]?.otherText ?? '').trim()
    if (!text) return
    const message = question.freeText ? question.freeTextValidate?.(text) : undefined
    if (message) {
      error = message
      void handle.update()
      return
    }
    error = null
    advance(put(id, () => ({ otherText: text })))
  }

  function skip() {
    const { id, index } = view()
    const snapshot = write((previous) => ({
      ...previous,
      [id]: {
        questionId: id,
        selectedIds: previous[id]?.selectedIds ?? [],
        otherText: previous[id]?.otherText,
        skipped: true,
      },
    }))
    handle.props.onSkip?.(id, index)
    advance(snapshot)
  }

  function back() {
    const { index } = view()
    if (index > 0) go(index - 1)
  }

  function submitMulti() {
    advance(latest)
  }

  function rowAt(position: number) {
    return rowsElement()?.querySelector<HTMLElement>(`[data-rf-index="${position}"]`) ?? null
  }

  function placeRing(row: HTMLElement | null) {
    const layer = root?.querySelector<HTMLElement>('.rf-question-ring')
    if (!layer) return
    if (!row) {
      layer.removeAttribute('data-visible')
      return
    }
    layer.toggleAttribute('data-moving', layer.hasAttribute('data-visible'))
    layer.style.transform = `translate(${row.offsetLeft - 2}px, ${row.offsetTop - 2}px)`
    layer.style.width = `${row.offsetWidth + 4}px`
    layer.style.height = `${row.offsetHeight + 4}px`
    layer.setAttribute('data-visible', '')
  }

  // Digits answer without focus in the card, but never from a text field, and only for one instance.
  function digit(event: KeyboardEvent) {
    const { question } = view()
    if (
      !question ||
      !root ||
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    )
      return
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      return
    if (!root.contains(target)) {
      if (instances.some((node) => node !== root && node.contains(target))) return
      const wrapped = instances.filter((node) => target.contains(node))
      const pool = wrapped.length > 0 ? wrapped : instances
      if (pool[pool.length - 1] !== root) return
    }
    if (!/^[1-9]$/.test(event.key)) return
    const position = Number(event.key) - 1
    const options = question.options ?? noOptions
    if (position < options.length && !question.freeText) {
      event.preventDefault()
      choose(optionKey(options[position], position))
    } else if (position === options.length && question.allowOther && !question.freeText) {
      event.preventDefault()
      root.querySelector<HTMLTextAreaElement>('.rf-question-other textarea')?.focus()
    }
  }

  const mount = ref((node, signal) => {
    if (!(node instanceof HTMLElement)) return
    root = node
    instances.push(node)
    if (isMacPlatform()) {
      mac = true
      void handle.update()
    }
    const live = requestAnimationFrame(() =>
      requestAnimationFrame(() => node.setAttribute('data-rf-live', '')),
    )
    signal.addEventListener('abort', () => cancelAnimationFrame(live), { once: true })
    node.ownerDocument.addEventListener('keydown', digit, { signal })
    signal.addEventListener(
      'abort',
      () => {
        const position = instances.indexOf(node)
        if (position !== -1) instances.splice(position, 1)
        if (root === node) root = null
      },
      { once: true },
    )
  })

  // The frame follows the step's height and springs to it, so the footer rides the change.
  const frame = ref((node, signal) => {
    if (!(node instanceof HTMLElement) || typeof ResizeObserver === 'undefined') return
    const content = node.firstElementChild
    if (!(content instanceof HTMLElement)) return
    let ready = 0
    const observer = new ResizeObserver(() => {
      node.style.height = `${content.offsetHeight}px`
      if (!ready)
        ready = requestAnimationFrame(() => {
          node.dataset.rfReady = ''
        })
    })
    observer.observe(content)
    signal.addEventListener(
      'abort',
      () => {
        observer.disconnect()
        cancelAnimationFrame(ready)
      },
      { once: true },
    )
  })

  function navigate(event: KeyboardEvent) {
    const { question, index, total } = view()
    const target = event.target
    if (!question || !(target instanceof HTMLElement)) return
    const text = target instanceof HTMLTextAreaElement
    const vertical = event.key === 'ArrowDown' || event.key === 'ArrowUp'
    if (text && !vertical) return
    if (text && event.key === 'ArrowUp' && target.selectionStart > 0) return
    if (text && event.key === 'ArrowDown' && target.selectionEnd < target.value.length) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'ArrowLeft') {
        if (index > 0) back()
      } else if (question.skippable !== false && total > 1) skip()
      return
    }
    const rows = rowsElement()
    const count = rows?.querySelectorAll('[data-rf-question-row]').length ?? 0
    if (!rows || count === 0) return
    if (vertical || event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      event.stopPropagation()
      const focused = target.closest<HTMLElement>('[data-rf-question-row]')
      const current = focused ?? rows.querySelector<HTMLElement>('[data-rf-hovered]')
      const base = current ? Number(current.dataset.rfIndex) : -1
      let next: number
      if (event.key === 'Home') next = 0
      else if (event.key === 'End') next = count - 1
      else next = ((event.key === 'ArrowDown' ? base + 1 : base - 1) + count) % count
      const row = rowAt(next)
      const field = row?.querySelector<HTMLTextAreaElement>('textarea')
      if (field) field.focus()
      else row?.focus()
      return
    }
    if (
      (event.key === ' ' || event.key === 'Enter') &&
      !event.metaKey &&
      !event.ctrlKey &&
      target.hasAttribute('data-rf-choice')
    ) {
      event.preventDefault()
      choose(target.dataset.rfChoice as string)
    }
  }

  function rootKey(event: KeyboardEvent) {
    const { question, id } = view()
    if (!question || event.key !== 'Enter' || !(mac ? event.metaKey : event.ctrlKey)) return
    if (!question.multiSelect && !question.freeText) return
    event.preventDefault()
    const text = (latest[id]?.otherText ?? '').trim()
    if (question.freeText) {
      if (text) submitText()
      return
    }
    if ((latest[id]?.selectedIds.length ?? 0) > 0 || text) submitMulti()
  }

  function rowMousedown(event: MouseEvent) {
    const row = event.currentTarget as HTMLElement
    const target = event.target as HTMLElement
    const interactive = target.closest('button, a[href], input, select, textarea')
    if (interactive && interactive !== row) return
    event.preventDefault()
    pointerRedirect = true
    try {
      row.focus()
    } finally {
      pointerRedirect = false
    }
  }

  function chip(content: number, filled: boolean, multi: boolean, arrow: RemixNode) {
    return (
      <span class="rf-question-slot">
        <span
          class="rf-question-chip"
          data-filled={filled || undefined}
          data-multi={multi || undefined}
          aria-hidden="true"
        >
          {content}
        </span>
        {arrow}
      </span>
    )
  }

  return () => {
    const { skipLabel = 'Skip' } = handle.props
    latest = handle.props.answers ?? latest
    const { index, question, id, total, answer } = view()
    if (!question)
      return (
        <section class="rf-questions" data-empty>
          <p>No questions.</p>
        </section>
      )

    const multi = question.multiSelect === true
    const skippable = question.skippable !== false
    const freeText = question.freeText === true
    const allowOther = !freeText && question.allowOther === true
    const options = question.options ?? noOptions
    const selected = answer?.selectedIds ?? []
    const otherText = answer?.otherText ?? ''
    const stacked = question.layout === 'stacked'
    const chipLeft = question.chipPosition === 'left'
    const titleId = `${titleBase}-${id}`
    const multiline = question.freeTextMultiline !== false
    const showBack = total > 1 && index > 0
    const showSkip = total > 1 && skippable
    const showSubmit = multi || freeText
    const showFooter = showBack || showSkip || showSubmit
    const firstSelected = options.findIndex((option, position) =>
      selected.includes(optionKey(option, position)),
    )
    const hasText = otherText.trim().length > 0
    const label = question.nextLabel ?? (index >= total - 1 ? 'Finish' : 'Continue')
    const errorId = `${titleId}-error`

    handle.queueTask(() => {
      if (!root) return
      for (const field of root.querySelectorAll('textarea')) fit(field)
      const field = root.querySelector<HTMLTextAreaElement>('textarea')
      if (field && field.value !== otherText) {
        field.value = otherText
        fit(field)
      }
      const changed = shownQuestion !== id
      shownQuestion = id
      const restore = restoreRowFocus
      restoreRowFocus = false
      if (!changed) return
      keyboardFocus = restore
      placeRing(null)
      if (freeText) {
        field?.focus({ preventScroll: true })
        return
      }
      // Keep keyboard navigation in the new answer list. A pointer selection
      // leaves focus to the browser when the old row is removed.
      if (restore) rowAt(0)?.focus({ preventScroll: true })
    })

    const arrowFor = (submit?: () => void) => (
      <span
        class="rf-question-arrow"
        aria-hidden={submit ? undefined : 'true'}
        role={submit ? 'button' : undefined}
        aria-label={submit ? 'Submit answer' : undefined}
        mix={
          submit
            ? on<HTMLSpanElement, 'click'>('click', (event) => {
                event.stopPropagation()
                submit()
              })
            : undefined
        }
      >
        <Icon name="arrow-right" size={14} />
      </span>
    )

    const title = (text: string, checked: boolean) => (
      <span class="rf-question-title-grid">
        <span aria-hidden="true">{text}</span>
        <span data-checked={checked || undefined}>{text}</span>
      </span>
    )

    return (
      <section
        class="rf-questions"
        aria-label={undefined}
        data-question-id={id}
        mix={[mount, on<HTMLElement, 'keydown'>('keydown', rootKey)]}
      >
        <div class="rf-questions-header">
          <span>
            Question {index + 1} of {total}
          </span>
        </div>
        <div class="rf-questions-frame" mix={frame}>
          <div class="rf-questions-content" data-footer={showFooter || undefined}>
            <div class="rf-questions-step" key={id}>
              <h3 id={titleId} class="rf-question-title">
                {question.title}
              </h3>
              {freeText ? (
                <div
                  class="rf-question-free"
                  data-filled={otherText.length > 0 || undefined}
                  data-multiline={multiline || undefined}
                  mix={on<HTMLDivElement, 'click'>('click', (event) =>
                    event.currentTarget.querySelector('textarea')?.focus(),
                  )}
                >
                  <textarea
                    rows={1}
                    value={otherText}
                    placeholder={question.freeTextPlaceholder ?? 'Type your answer…'}
                    aria-labelledby={titleId}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? errorId : undefined}
                    mix={[
                      on<HTMLTextAreaElement, 'input'>('input', (event) => {
                        changeOther(event.currentTarget.value)
                        fit(event.currentTarget)
                      }),
                      on<HTMLTextAreaElement, 'keydown'>('keydown', (event) => {
                        if (
                          event.key !== 'Enter' ||
                          event.isComposing ||
                          event.shiftKey ||
                          event.metaKey ||
                          event.ctrlKey
                        )
                          return
                        if (!multiline) {
                          event.preventDefault()
                          submitText()
                        }
                      }),
                    ]}
                  />
                </div>
              ) : (
                <div
                  class="rf-question-options"
                  role={multi ? 'group' : 'radiogroup'}
                  aria-labelledby={titleId}
                  data-rf-multi={multi || undefined}
                  mix={[
                    hover,
                    on<HTMLDivElement, 'keydown'>('keydown', navigate),
                    on<HTMLDivElement, 'focusin'>('focusin', (event) => {
                      const target = event.target as HTMLElement
                      const row = target.closest<HTMLElement>('[data-rf-question-row]')
                      if (!row) return
                      keyboardFocus = !pointerRedirect && target.matches(':focus-visible')
                      placeRing(
                        keyboardFocus && !row.classList.contains('rf-question-other') ? row : null,
                      )
                    }),
                    on<HTMLDivElement, 'focusout'>('focusout', (event) => {
                      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
                      keyboardFocus = false
                      placeRing(null)
                    }),
                  ]}
                  data-chip-position={chipLeft ? 'left' : 'right'}
                >
                  <div class="rf-highlight" aria-hidden="true" data-rf-hover-layer />
                  <div class="rf-question-ring" aria-hidden="true" />
                  {options.map((option, position) => {
                    const optionId = optionKey(option, position)
                    const checked = selected.includes(optionId)
                    const arrow = !multi ? arrowFor() : null
                    return (
                      <div
                        key={optionId}
                        class="rf-question-row"
                        data-rf-question-row
                        data-rf-hover-item
                        data-rf-index={position}
                        data-rf-choice={optionId}
                        data-state={checked ? 'checked' : 'unchecked'}
                        data-arrow={!multi || undefined}
                        data-top-align={stacked || undefined}
                        role={multi ? 'checkbox' : 'radio'}
                        aria-checked={checked ? 'true' : 'false'}
                        aria-keyshortcuts={position < 9 ? String(position + 1) : undefined}
                        tabindex={
                          position === firstSelected || (firstSelected === -1 && position === 0)
                            ? 0
                            : -1
                        }
                        mix={[
                          on<HTMLDivElement, 'mousedown'>('mousedown', rowMousedown),
                          on<HTMLDivElement, 'click'>('click', () => choose(optionId)),
                        ]}
                      >
                        {chipLeft && chip(position + 1, checked, multi, null)}
                        <span class="rf-question-body" data-layout={stacked ? 'stacked' : 'inline'}>
                          {stacked ? (
                            <>
                              {title(option.title, checked)}
                              {option.description && (
                                <span class="rf-question-description">{option.description}</span>
                              )}
                            </>
                          ) : (
                            <span>
                              {title(option.title, checked)}
                              {option.description && (
                                <>
                                  {' '}
                                  <span class="rf-question-description">{option.description}</span>
                                </>
                              )}
                            </span>
                          )}
                        </span>
                        {chipLeft ? (
                          !multi ? (
                            <span class="rf-question-slot">{arrow}</span>
                          ) : null
                        ) : (
                          chip(position + 1, checked, multi, arrow)
                        )}
                      </div>
                    )
                  })}
                  {allowOther &&
                    (() => {
                      const position = options.length
                      const submit = !multi && hasText ? submitText : undefined
                      const arrow = !multi ? arrowFor(submit) : null
                      return (
                        <div
                          class="rf-question-row rf-question-other"
                          key="other"
                          data-rf-question-row
                          data-rf-hover-item
                          data-rf-index={position}
                          data-state={otherText.length > 0 ? 'checked' : 'unchecked'}
                          data-empty={otherText.length === 0 || undefined}
                          data-arrow={(!multi && hasText) || undefined}
                          mix={[
                            on<HTMLDivElement, 'mousedown'>('mousedown', rowMousedown),
                            on<HTMLDivElement, 'click'>('click', (event) =>
                              event.currentTarget.querySelector('textarea')?.focus(),
                            ),
                          ]}
                        >
                          {chipLeft && chip(position + 1, otherText.length > 0, multi, null)}
                          <span class="rf-question-body" data-layout="inline">
                            <span class="rf-question-field">
                              <textarea
                                rows={1}
                                value={otherText}
                                placeholder={
                                  question.otherPlaceholder ?? 'Describe in your own words…'
                                }
                                aria-label={
                                  question.otherPlaceholder ?? 'Describe in your own words'
                                }
                                mix={[
                                  on<HTMLTextAreaElement, 'input'>('input', (event) => {
                                    changeOther(event.currentTarget.value)
                                    fit(event.currentTarget)
                                  }),
                                  on<HTMLTextAreaElement, 'click'>('click', (event) =>
                                    event.stopPropagation(),
                                  ),
                                  on<HTMLTextAreaElement, 'keydown'>('keydown', (event) => {
                                    // Enter submits a single-select answer; multi-select keeps Enter for newlines and uses the mod combo.
                                    if (
                                      event.key !== 'Enter' ||
                                      event.isComposing ||
                                      event.shiftKey ||
                                      multi
                                    )
                                      return
                                    if (event.metaKey || event.ctrlKey) return
                                    event.preventDefault()
                                    submitText()
                                  }),
                                ]}
                              />
                            </span>
                          </span>
                          {chipLeft ? (
                            <span class="rf-question-slot">{arrow}</span>
                          ) : (
                            chip(position + 1, otherText.length > 0, multi, arrow)
                          )}
                        </div>
                      )
                    })()}
                </div>
              )}
            </div>
          </div>
        </div>
        {showFooter && (
          <div class="rf-questions-footer">
            <div class="rf-questions-actions">
              <div class="rf-questions-start">
                {showBack && (
                  <div class="rf-question-action" key="back">
                    <Button
                      variant="ghost"
                      size="compact"
                      leadingIcon={
                        <Icon
                          name="arrow-right"
                          size={14}
                          class="rf-question-key rf-question-flip"
                        />
                      }
                      mix={on('click', back)}
                    >
                      Back
                    </Button>
                  </div>
                )}
                {error && (
                  <p id={errorId} class="rf-question-error" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <div class="rf-questions-end">
                {showSkip && (
                  <div class="rf-question-action" key="skip">
                    <Button
                      variant="ghost"
                      size="compact"
                      trailingIcon={<Icon name="arrow-right" size={14} class="rf-question-key" />}
                      mix={on('click', skip)}
                    >
                      {skipLabel}
                    </Button>
                  </div>
                )}
                {showSubmit && (
                  <div class="rf-question-action" key="continue">
                    <Button
                      size="compact"
                      class="rf-question-submit"
                      disabled={freeText ? !hasText : selected.length === 0 && !hasText}
                      aria-keyshortcuts={mac ? 'Meta+Enter' : 'Control+Enter'}
                      mix={on('click', freeText ? submitText : submitMulti)}
                    >
                      <span class="rf-question-submit-label">
                        {label}
                        <kbd aria-hidden="true">{mac ? '⌘' : '⌃'}↵</kbd>
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    )
  }
}
