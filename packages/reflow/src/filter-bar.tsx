import { on, ref, type Handle } from 'remix/component'
import { parseFacetQuery, type FacetToken, type ParsedFacetQuery } from './behaviors/facet-query.ts'
import { Icon } from './icon.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface FilterSuggestion {
  /** Facet key (e.g. `'author'`, `'status'`, `'label'`). */
  key: string
  /** Optional display label; defaults to `key`. */
  label?: string
  /** Optional description shown beside the key in autocomplete. */
  description?: string
  /** Suggested values offered after typing `key:`. */
  values?: readonly string[]
}

export interface FilterPreset {
  id: string
  label: string
  query: string
}

export interface FilterBarProps {
  /** Controlled raw query string (e.g. `'status:open author:alex timeout'`). */
  value?: string
  /** Initial query when uncontrolled. */
  defaultValue?: string
  /** Called whenever the query changes with the serialized string and parsed tokens. */
  onValueChange?: (value: string, parsed: ParsedFacetQuery) => void
  /** Facet keys and optional values for inline autocomplete. */
  suggestions?: readonly FilterSuggestion[]
  /** Optional quick filter presets shown below the bar. */
  presets?: readonly FilterPreset[]
  /** Placeholder text when empty. */
  placeholder?: string
  /** Shows a clear button when any facet or text is present. Default `true`. */
  clearable?: boolean
  /** Disables editing and preset buttons. */
  disabled?: boolean
  /** Accessible name for the filter input. Default `'Filter'`. */
  label?: string
  /** Controls height and chip spacing. */
  size?: ControlSize
  class?: string
}

interface MenuOption {
  id: string
  kind: 'key' | 'value'
  key: string
  value?: string
  label: string
  detail?: string
}

function serializeQuery(facets: readonly FacetToken[], freeText: string): string {
  const parts = facets.map((facet) => `${facet.key}:${facet.value}`)
  const trimmed = freeText.trim()
  if (trimmed) parts.push(trimmed)
  return parts.join(' ')
}

function buildOptions(
  inputText: string,
  suggestions: readonly FilterSuggestion[],
  existingFacets: readonly FacetToken[],
): MenuOption[] {
  const trimmed = inputText.trim()
  const colon = trimmed.indexOf(':')

  if (colon > 0) {
    const key = trimmed.slice(0, colon).toLowerCase()
    const prefix = trimmed.slice(colon + 1).toLowerCase()
    const match = suggestions.find((s) => s.key.toLowerCase() === key)
    if (!match?.values?.length) return []
    return match.values
      .filter((val) => val.toLowerCase().includes(prefix))
      .map((val) => ({
        id: `val:${match.key}:${val}`,
        kind: 'value' as const,
        key: match.key,
        value: val,
        label: `${match.key}:${val}`,
        detail: match.label ?? match.key,
      }))
  }

  const lower = trimmed.toLowerCase()
  const used = new Set(existingFacets.map((f) => f.key.toLowerCase()))
  return suggestions
    .filter(
      (s) =>
        !lower ||
        s.key.toLowerCase().includes(lower) ||
        (s.label && s.label.toLowerCase().includes(lower)),
    )
    .sort((a, b) => Number(used.has(a.key.toLowerCase())) - Number(used.has(b.key.toLowerCase())))
    .map((s) => ({
      id: `key:${s.key}`,
      kind: 'key' as const,
      key: s.key,
      label: `${s.key}:`,
      detail: s.description ?? (s.values?.length ? s.values.slice(0, 3).join(', ') : s.label),
    }))
}

/**
 * Structured `key:value` query bar with inline removable facet chips,
 * keyboard backspace-to-pop, autocomplete suggestions, and quick filter presets.
 */
export function FilterBar(handle: Handle<FilterBarProps>) {
  let uncontrolled = handle.props.defaultValue ?? ''
  let draft = ''
  let open = false
  let activeIndex = 0
  let inputEl: HTMLInputElement | null = null

  function currentRaw(): string {
    return handle.props.value !== undefined ? handle.props.value : uncontrolled
  }

  // Sync draft with any external freeText when controlled value changes externally.
  let lastSyncedRaw = currentRaw()
  draft = parseFacetQuery(lastSyncedRaw).freeText

  function emit(facets: readonly FacetToken[], nextFree: string) {
    const nextRaw = serializeQuery(facets, nextFree)
    lastSyncedRaw = nextRaw
    if (handle.props.value === undefined) uncontrolled = nextRaw
    handle.props.onValueChange?.(nextRaw, parseFacetQuery(nextRaw))
    void handle.update()
  }

  const mountRoot = ref<HTMLDivElement>((node, signal) => {
    const onPointerDown = (event: PointerEvent) => {
      if (!open) return
      if (!node.contains(event.target as Node)) {
        open = false
        void handle.update()
      }
    }
    document.addEventListener('pointerdown', onPointerDown, { signal })
  })

  const mountInput = ref<HTMLInputElement>((node) => {
    inputEl = node
  })

  return () => {
    const props = handle.props
    const raw = currentRaw()
    if (raw !== lastSyncedRaw) {
      lastSyncedRaw = raw
      draft = parseFacetQuery(raw).freeText
    }

    const parsed = parseFacetQuery(raw)
    const facets = parsed.facets
    const suggestions = props.suggestions ?? []
    const options = buildOptions(draft, suggestions, facets)
    const showMenu = open && !props.disabled && options.length > 0
    if (activeIndex >= options.length) activeIndex = 0

    const listboxId = `${handle.id}-listbox`
    const hasContent = facets.length > 0 || draft.trim().length > 0

    function commitDraft(text: string) {
      const tokenParsed = parseFacetQuery(text)
      if (tokenParsed.facets.length > 0) {
        const merged = [...facets]
        for (const f of tokenParsed.facets) {
          if (!merged.some((m) => m.key === f.key && m.value === f.value)) {
            merged.push(f)
          }
        }
        draft = tokenParsed.freeText
        emit(merged, draft)
      } else {
        draft = text
        emit(facets, draft)
      }
    }

    function removeFacet(index: number) {
      const next = facets.filter((_, i) => i !== index)
      emit(next, draft)
      inputEl?.focus()
    }

    function applyOption(option: MenuOption) {
      if (option.kind === 'key') {
        draft = `${option.key}:`
        open = true
        activeIndex = 0
        void handle.update()
        inputEl?.focus()
      } else if (option.value !== undefined) {
        const next = [...facets]
        if (!next.some((f) => f.key === option.key && f.value === option.value)) {
          next.push({ key: option.key, value: option.value })
        }
        draft = ''
        activeIndex = 0
        emit(next, '')
        inputEl?.focus()
      }
    }

    function clearAll() {
      draft = ''
      open = false
      emit([], '')
      inputEl?.focus()
    }

    function selectPreset(preset: FilterPreset) {
      const nextParsed = parseFacetQuery(preset.query)
      draft = nextParsed.freeText
      open = false
      emit(nextParsed.facets, draft)
      inputEl?.focus()
    }

    return (
      <div
        class={classList('rf-filter-bar', props.class)}
        data-size={props.size === 'compact' ? 'compact' : undefined}
        data-disabled={props.disabled ? 'true' : undefined}
        mix={mountRoot}
      >
        <div
          class="rf-filter-bar-box"
          mix={on('click', (event) => {
            if ((event.target as HTMLElement).closest('button')) return
            inputEl?.focus()
          })}
        >
          <span class="rf-filter-bar-icon" aria-hidden="true">
            <Icon name="search" size={14} />
          </span>

          {facets.map((facet, index) => (
            <span key={`${facet.key}:${facet.value}:${index}`} class="rf-filter-chip">
              <span class="rf-filter-chip-key">{facet.key}</span>
              <span class="rf-filter-chip-sep" aria-hidden="true">
                :
              </span>
              <span class="rf-filter-chip-val">{facet.value}</span>
              {!props.disabled && (
                <button
                  type="button"
                  class="rf-filter-chip-remove"
                  aria-label={`Remove ${facet.key}:${facet.value}`}
                  mix={on('click', () => removeFacet(index))}
                >
                  <Icon name="x" size={11} />
                </button>
              )}
            </span>
          ))}

          <input
            type="text"
            class="rf-filter-bar-input"
            role="combobox"
            aria-label={props.label ?? 'Filter'}
            aria-autocomplete="list"
            aria-expanded={showMenu}
            aria-controls={showMenu ? listboxId : undefined}
            aria-activedescendant={
              showMenu && options[activeIndex] ? `${handle.id}-opt-${activeIndex}` : undefined
            }
            placeholder={
              facets.length === 0 ? (props.placeholder ?? 'Filter by key:value or text…') : ''
            }
            value={draft}
            disabled={props.disabled}
            mix={[
              mountInput,
              on('focus', () => {
                if (suggestions.length > 0) {
                  open = true
                  void handle.update()
                }
              }),
              on<HTMLInputElement, 'input'>('input', (event) => {
                const val = event.currentTarget.value
                // Commit a completed facet token when user types trailing whitespace.
                if (/\s$/.test(val) && /\S+:\S+\s$/.test(val)) {
                  commitDraft(val.trim())
                  open = suggestions.length > 0
                  activeIndex = 0
                  return
                }
                draft = val
                open = suggestions.length > 0
                activeIndex = 0
                emit(facets, draft)
              }),
              on<HTMLInputElement, 'keydown'>('keydown', (event) => {
                if (event.key === 'Backspace' && draft === '' && facets.length > 0) {
                  event.preventDefault()
                  removeFacet(facets.length - 1)
                  return
                }
                if (event.key === 'Escape') {
                  if (open) {
                    event.preventDefault()
                    open = false
                    void handle.update()
                  }
                  return
                }
                if (event.key === 'ArrowDown' && showMenu) {
                  event.preventDefault()
                  activeIndex = (activeIndex + 1) % options.length
                  void handle.update()
                  return
                }
                if (event.key === 'ArrowUp' && showMenu) {
                  event.preventDefault()
                  activeIndex = (activeIndex - 1 + options.length) % options.length
                  void handle.update()
                  return
                }
                if (event.key === 'Enter') {
                  if (showMenu && options[activeIndex]) {
                    event.preventDefault()
                    applyOption(options[activeIndex]!)
                    return
                  }
                  if (draft.includes(':')) {
                    event.preventDefault()
                    commitDraft(draft)
                  }
                }
              }),
            ]}
          />

          {(props.clearable ?? true) && hasContent && !props.disabled && (
            <button
              type="button"
              class="rf-filter-bar-clear"
              aria-label="Clear filter"
              mix={on('click', clearAll)}
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>

        {showMenu && (
          <ul
            id={listboxId}
            class="rf-filter-menu"
            role="listbox"
            aria-label={`${props.label ?? 'Filter'} suggestions`}
          >
            {options.map((option, idx) => (
              <li
                key={option.id}
                id={`${handle.id}-opt-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                class="rf-filter-option"
                data-active={idx === activeIndex ? 'true' : undefined}
                mix={[
                  on('pointerenter', () => {
                    activeIndex = idx
                    void handle.update()
                  }),
                  on('pointerdown', (event) => {
                    event.preventDefault()
                    applyOption(option)
                  }),
                ]}
              >
                <span class="rf-filter-option-label">{option.label}</span>
                {option.detail && <span class="rf-filter-option-detail">{option.detail}</span>}
              </li>
            ))}
          </ul>
        )}

        {props.presets && props.presets.length > 0 && (
          <div class="rf-filter-presets" role="group" aria-label="Quick filters">
            {props.presets.map((preset) => {
              const active = raw.trim() === preset.query.trim()
              return (
                <button
                  key={preset.id}
                  type="button"
                  class="rf-filter-preset"
                  aria-pressed={active}
                  disabled={props.disabled}
                  mix={on('click', () => selectPreset(preset))}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }
}
