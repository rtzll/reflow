import {
  formatShortcut,
  isMacPlatform,
  matchesShortcut,
  parseShortcut,
  shortcutKeys,
} from './behaviors/shortcut.ts'
import { on, ref } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import { Button } from './basic.tsx'
import { Icon } from './icon.tsx'
import { Tabs } from './interactive.tsx'
import { fluidHover } from './systems/fluid-hover.ts'
import { ScrollArea } from './scroll-area.tsx'
import { Dialog } from './overlays.tsx'

export interface CommandItem {
  value: string
  label: string
  description?: string
  group?: string
  /** Quick filter membership; defaults to the displayed group. */
  filter?: string
  keywords?: readonly string[]
  disabled?: boolean
  /** Display hint for a shortcut provided by the consumer. */
  shortcut?: string
  icon?: RemixNode
  /** Overrides the highlighted command label in the Enter hint. */
  action?: string
}

export interface CommandMenuProps {
  items: readonly CommandItem[]
  /** Replaces the label and description of a row. The icon and shortcut caps stay. */
  renderItem?: (item: CommandItem) => RemixNode
  /** `true` shows the default key hints; a node replaces them. Omitted, there is no footer. */
  footer?: RemixNode | boolean
  label?: string
  placeholder?: string
  /** Filter names to expose above the results. Items default to their group. */
  filters?: readonly string[]
  /** Command values to show first while the unfiltered query is empty. */
  suggestions?: readonly string[]
  /** Shown when nothing matches. */
  emptyMessage?: string
  /** Heading of the suggestions group. */
  suggestionsLabel?: string
  /** Compact controls (borderless selects, ghost buttons) in a row under the field. */
  controls?: RemixNode
  /** Supply a trigger to open the menu in a modal. */
  trigger?: RemixNode
  /** Set when the menu is rendered inside a consumer-provided dialog. */
  inDialog?: boolean
  /** The combo that toggles a modal menu: `true` or omitted is Mod+K, `false` binds nothing. */
  shortcut?: boolean | string
  onSelect?: (value: string) => void
}

const allFilter = '\u0000all'

function commandShortcut(keys: string | readonly string[], mac = false) {
  const caps = (typeof keys === 'string' ? [keys] : keys).flatMap((key) => formatShortcut(key, mac))
  return (
    <span class="rf-command-shortcut">
      {caps.map((key, index) => (
        <kbd key={index}>{key}</kbd>
      ))}
    </span>
  )
}

/** Shortcut keycaps for a trigger or a custom footer: `<CommandShortcut keys="mod+p" />`. */
export function CommandShortcut(handle: Handle<{ keys: string | readonly string[] }>) {
  let mac = false
  const mount = ref((node, signal) => {
    if (!isMacPlatform()) return
    mac = true
    void handle.update()
    signal.addEventListener(
      'abort',
      () => {
        mac = false
      },
      { once: true },
    )
  })
  return () => (
    <span class="rf-command-shortcut" mix={mount}>
      {(typeof handle.props.keys === 'string' ? [handle.props.keys] : handle.props.keys)
        .flatMap((key) => formatShortcut(key, mac))
        .map((key, index) => (
          <kbd key={index}>{key}</kbd>
        ))}
    </span>
  )
}

export function CommandMenu(handle: Handle<CommandMenuProps>) {
  const listId = `${handle.id}-list`
  let query = ''
  let activeFilter: string | undefined
  let highlighted: string | undefined
  let openState = false
  let list: HTMLElement | null = null
  const scroller = () => list?.closest<HTMLElement>('.rf-scroll-viewport') ?? null
  let scrollToSelection = false
  let shownHeight = 0
  let mac = false

  function matches(item: CommandItem) {
    const text = [item.label, item.description, ...(item.keywords ?? [])].join(' ').toLowerCase()
    return query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .every((term) => text.includes(term))
  }

  function visibleGroups() {
    const groups = new Map<string, CommandItem[]>()
    const { items, suggestions } = handle.props
    const suggested =
      !activeFilter && !query.trim() && suggestions
        ? suggestions.flatMap((value) =>
            items.filter((item) => item.value === value && !item.disabled),
          )
        : []
    if (suggested.length) groups.set(handle.props.suggestionsLabel ?? 'Suggestions', suggested)
    for (const item of items) {
      if (suggested.includes(item)) continue
      if (
        activeFilter &&
        handle.props.filters?.includes(activeFilter) &&
        (item.filter ?? item.group) !== activeFilter
      )
        continue
      if (!matches(item)) continue
      const group = item.group ?? ''
      const members = groups.get(group) ?? []
      members.push(item)
      groups.set(group, members)
    }
    return groups
  }

  function setOpen(next: boolean) {
    openState = next
    if (!next) {
      query = ''
      activeFilter = undefined
      highlighted = undefined
    }
    void handle.update()
  }

  function select(item: CommandItem) {
    if (item.disabled) return
    handle.props.onSelect?.(item.value)
    if (openState) setOpen(false)
  }

  function setFilter(filter: string | undefined) {
    activeFilter = filter
    highlighted = undefined
    scroller()?.scrollTo(0, 0)
    void handle.update()
  }

  function setQuery(next: string) {
    query = next
    highlighted = undefined
    scroller()?.scrollTo(0, 0)
    void handle.update()
  }

  function keydown(event: KeyboardEvent, inDialog: boolean) {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.keyCode === 229 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return
    const { filters } = handle.props
    if (
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
      filters?.length &&
      !event.shiftKey
    ) {
      event.preventDefault()
      const tabs = [undefined, ...filters]
      const current = Math.max(0, tabs.indexOf(activeFilter))
      const step = event.key === 'ArrowRight' ? 1 : -1
      setFilter(tabs[(current + step + tabs.length) % tabs.length])
      return
    }
    if (event.key === 'Escape' && !inDialog && query) {
      event.preventDefault()
      setQuery('')
      return
    }
    const enabled = Array.from(visibleGroups().values())
      .flat()
      .filter((item) => !item.disabled)
    if (!enabled.length) return
    const index = Math.max(
      0,
      enabled.findIndex((item) => item.value === highlighted),
    )
    if (event.key === 'Enter') {
      event.preventDefault()
      select(enabled[index])
      return
    }
    let next: number
    switch (event.key) {
      case 'ArrowDown':
        next = (index + 1) % enabled.length
        break
      case 'ArrowUp':
        next = (index - 1 + enabled.length) % enabled.length
        break
      case 'Home':
        if (query || event.shiftKey) return
        next = 0
        break
      case 'End':
        if (query || event.shiftKey) return
        next = enabled.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    highlighted = enabled[next].value
    scrollToSelection = true
    void handle.update()
  }

  const shortcut = ref((node, signal) => {
    if (isMacPlatform()) {
      mac = true
      void handle.update()
    }
    node.ownerDocument.addEventListener(
      'keydown',
      (event) => {
        const { trigger, shortcut: combo } = handle.props
        if (
          event.defaultPrevented ||
          event.isComposing ||
          event.repeat ||
          trigger == null ||
          combo === false
        )
          return
        const parsed = parseShortcut(typeof combo === 'string' ? combo : 'mod+k')
        if (!matchesShortcut(event, parsed)) return
        // Several menus can share a page. An open one answers first, then the first with a visible trigger.
        const answers = Array.from(
          node.ownerDocument.querySelectorAll<HTMLElement>('[data-rf-command-host]'),
        )
        const open = answers.find((host) => host.dataset.rfCommandOpen === 'true')
        const owner =
          open ?? answers.find((host) => host.querySelector('button')?.getClientRects().length)
        if (owner !== node) return
        event.preventDefault()
        setOpen(!openState)
      },
      { signal },
    )
  })

  // The frame follows the column's height and springs to it, as the reference panel does. It is measured, never "auto".
  const frame = ref((node, signal) => {
    if (!(node instanceof HTMLElement) || typeof ResizeObserver === 'undefined') return
    const column = node.firstElementChild
    if (!(column instanceof HTMLElement)) return
    let ready = 0
    const observer = new ResizeObserver(() => {
      node.style.height = `${column.offsetHeight}px`
      if (!ready)
        ready = requestAnimationFrame(() => {
          node.dataset.rfReady = ''
        })
    })
    observer.observe(column)
    signal.addEventListener(
      'abort',
      () => {
        observer.disconnect()
        cancelAnimationFrame(ready)
      },
      { once: true },
    )
  })

  const hover = fluidHover({ highlightedSelector: '[aria-selected="true"]', fastHover: true })
  const listRef = ref((node, signal) => {
    if (!(node instanceof HTMLElement)) return
    list = node
    signal.addEventListener(
      'abort',
      () => {
        if (list === node) list = null
      },
      { once: true },
    )
  })

  return () => {
    const {
      label = 'Command menu',
      placeholder = 'Type a command or search…',
      filters,
      trigger,
    } = handle.props
    const inDialog = trigger != null || handle.props.inDialog === true
    const filter = activeFilter && filters?.includes(activeFilter) ? activeFilter : undefined
    const groups = visibleGroups()
    const visible = Array.from(groups.values()).flat()
    const active =
      visible.find((item) => item.value === highlighted && !item.disabled) ??
      visible.find((item) => !item.disabled)
    const optionId = (item: CommandItem) => `${listId}-${visible.indexOf(item)}`
    // No results keeps the height the rows last showed, so the message sits where they were.
    handle.queueTask(() => {
      if (!list) return
      if (!visible.length) {
        list.style.minHeight = shownHeight ? `${shownHeight}px` : ''
        return
      }
      list.style.minHeight = ''
      shownHeight = Math.min(list.offsetHeight, scroller()?.clientHeight ?? Infinity)
    })
    if (scrollToSelection) {
      handle.queueTask(() => {
        list?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
        scrollToSelection = false
      })
    }

    const body = (
      <section
        class="rf-command"
        aria-label={label}
        data-in-dialog={inDialog || undefined}
        mix={trigger == null ? shortcut : undefined}
      >
        <div class="rf-command-frame" mix={frame}>
          <div class="rf-command-column">
            <div class="rf-command-search">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              >
                <path d="m16 16 5 5m-3-10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
              </svg>
              <input
                role="combobox"
                type="text"
                autocorrect="off"
                spellcheck={false}
                aria-label="Search commands"
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={active ? optionId(active) : undefined}
                placeholder={placeholder}
                autocomplete="off"
                autofocus={inDialog}
                value={query}
                mix={[
                  on<HTMLInputElement, 'input'>('input', (event) =>
                    setQuery(event.currentTarget.value),
                  ),
                  on<HTMLInputElement, 'keydown'>('keydown', (event) => keydown(event, inDialog)),
                ]}
              />
            </div>
            {filters && filters.length > 0 ? (
              <div class="rf-command-filters">
                <div
                  class="rf-command-tabs"
                  mix={on('mousedown', (event) => event.preventDefault())}
                >
                  <Tabs
                    label="Filter results"
                    size="compact"
                    items={[
                      { value: allFilter, label: 'All' },
                      ...filters.map((group) => ({ value: group, label: group })),
                    ]}
                    value={filter ?? allFilter}
                    onValueChange={(value) => setFilter(value === allFilter ? undefined : value)}
                  />
                </div>
                {handle.props.controls != null && (
                  <div class="rf-command-controls">{handle.props.controls}</div>
                )}
              </div>
            ) : (
              handle.props.controls != null && (
                <div class="rf-command-controls" data-standalone>
                  {handle.props.controls}
                </div>
              )
            )}
            <ScrollArea label="Commands" fade={32} tabIndex={-1} className="rf-command-scroll">
              <div
                id={listId}
                class="rf-command-results"
                role="listbox"
                aria-label="Commands"
                data-empty={!visible.length || undefined}
                mix={[hover, listRef]}
              >
                <div class="rf-highlight" aria-hidden="true" data-rf-hover-layer />
                {Array.from(groups, ([group, entries]) => (
                  <div role="group" aria-label={group || 'Suggestions'} key={group}>
                    {group && (
                      <div class="rf-command-group-label" aria-hidden="true">
                        {group}
                      </div>
                    )}
                    {entries.map((item) => (
                      <div
                        key={item.value}
                        id={optionId(item)}
                        role="option"
                        class="rf-command-option"
                        aria-disabled={item.disabled || undefined}
                        aria-selected={item === active}
                        data-rf-hover-item
                        mix={[
                          on<HTMLDivElement, 'pointermove'>('pointermove', (event) => {
                            // A move, not an enter: a row that appears under a parked pointer must not take the highlight.
                            if (event.pointerType === 'touch' || item.disabled || active === item)
                              return
                            highlighted = item.value
                            void handle.update()
                          }),
                          on<HTMLDivElement, 'pointerdown'>('pointerdown', (event) => {
                            if (event.pointerType === 'mouse') event.preventDefault()
                          }),
                          on<HTMLDivElement, 'click'>('click', () => select(item)),
                        ]}
                      >
                        {item.icon != null && (
                          <span class="rf-command-option-icon" aria-hidden="true">
                            {item.icon}
                          </span>
                        )}
                        {handle.props.renderItem ? (
                          <span class="rf-command-option-text">
                            {handle.props.renderItem(item)}
                          </span>
                        ) : (
                          <span class="rf-command-option-text">
                            <span>{item.label}</span>
                            {item.description && <span>{item.description}</span>}
                          </span>
                        )}
                        {item.shortcut && commandShortcut(item.shortcut, mac)}
                      </div>
                    ))}
                  </div>
                ))}
                {!visible.length && (
                  <div role="status" aria-live="polite" class="rf-command-empty">
                    {handle.props.emptyMessage ?? 'No results.'}
                  </div>
                )}
              </div>
            </ScrollArea>
            {handle.props.footer != null &&
              handle.props.footer !== false &&
              (handle.props.footer !== true ? (
                <footer class="rf-command-footer">{handle.props.footer}</footer>
              ) : (
                <footer class="rf-command-footer" aria-hidden="true">
                  <span>Select {commandShortcut(['up', 'down'], mac)}</span>
                  {filters && filters.length > 0 && (
                    <span>Tabs {commandShortcut(['left', 'right'], mac)}</span>
                  )}
                  {inDialog && <span>Close {commandShortcut(['esc'], mac)}</span>}
                  {active && (
                    <span class="rf-command-footer-action">
                      <span>{active.action ?? active.label}</span>
                      {commandShortcut(['enter'], mac)}
                    </span>
                  )}
                </footer>
              ))}
          </div>
        </div>
      </section>
    )

    return trigger != null ? (
      <div
        class="rf-command-dialog"
        data-rf-command-host
        data-rf-command-open={openState}
        mix={shortcut}
      >
        <Button
          variant="secondary"
          aria-haspopup="dialog"
          aria-expanded={openState}
          mix={on('click', () => setOpen(true))}
        >
          {trigger}
        </Button>
        <Dialog
          title={label}
          open={openState}
          size="lg"
          position="top"
          showCloseButton={false}
          onOpenChange={setOpen}
        >
          {body}
        </Dialog>
      </div>
    ) : (
      body
    )
  }
}

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
