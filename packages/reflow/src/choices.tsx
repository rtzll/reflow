import { Icon } from './icon.tsx'
import { createMixin, on, ref } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import {
  animateEntrance,
  animateLayout,
  prefersReducedMotion,
  spring,
} from '@remix-run/ui/animation'
import * as popover from '@remix-run/ui/popover'
import * as select from '@remix-run/ui/select'
import { fluidHover } from './systems/fluid-hover.ts'
import { ScrollArea } from './scroll-area.tsx'
import { navigationIndex } from './behaviors/list-navigation.ts'

export interface ChoiceOption {
  value: string
  label: string
  icon?: RemixNode
  disabled?: boolean
  searchValue?: string | string[]
  /** Label for a contiguous group of options in Select. */
  group?: string
}

export interface ChoiceProps {
  label: string
  options: readonly ChoiceOption[]
  name?: string
  defaultValue?: string
  value?: string | null
  onValueChange?: (value: string | null) => void
  disabled?: boolean
  placeholder?: string
  variant?: 'bordered' | 'ghost'
  size?: 'default' | 'compact'
}

const positionPickerPopup = createMixin<HTMLElement, [matchField?: boolean]>((handle) => {
  const context = handle.context.get(popover.Context)
  return (matchField) =>
    on<HTMLElement, 'beforetoggle'>(
      'beforetoggle',
      (event) => {
        if (event.newState !== 'open' || !context.anchor) return
        const { target } = context.anchor
        const field =
          matchField && target instanceof HTMLElement
            ? target.closest<HTMLElement>('.rf-picker-field')
            : null
        if (field) {
          event.currentTarget.style.setProperty('--rf-picker-field-width', `${field.offsetWidth}px`)
        }
        context.anchor = {
          target: field ?? target,
          options: { placement: 'bottom-start', offset: 6 },
        }
      },
      true,
    )
})

function onFormReset(reset: () => void) {
  return ref((node, signal) => {
    node.closest('form')?.addEventListener(
      'reset',
      (event) => {
        queueMicrotask(() => {
          if (!signal.aborted && !event.defaultPrevented) reset()
        })
      },
      { signal },
    )
  })
}

export interface SelectProps extends ChoiceProps {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export function Select(handle: Handle<SelectProps>) {
  let resetKey = 0
  let root: HTMLElement | undefined
  let restoreFocus = false
  let previousValue = handle.props.value
  const reset = onFormReset(() => {
    resetKey++
    void handle.update()
  })
  const highlight = fluidHover({
    highlightedSelector: '[data-highlighted="true"]',
  })

  return () => {
    const {
      label,
      options,
      name,
      defaultValue,
      disabled,
      placeholder = 'Choose an option…',
      variant = 'bordered',
      size,
    } = handle.props
    if (previousValue !== handle.props.value && root?.contains(root.ownerDocument.activeElement))
      restoreFocus = true
    previousValue = handle.props.value
    const requested = handle.props.value === undefined ? defaultValue : handle.props.value
    const initial = options.find((option) => option.value === requested && !option.disabled)
    if (restoreFocus)
      handle.queueTask(() => {
        root?.querySelector<HTMLButtonElement>('button')?.focus()
        restoreFocus = false
      })

    return (
      <div
        class="rf-picker rf-select"
        data-variant={variant}
        data-density={size}
        mix={[
          reset,
          ref((node) => {
            root = node as HTMLElement
          }),
          select.onSelectChange((event) => {
            if (handle.props.value !== undefined) {
              restoreFocus = !!root?.contains(root.ownerDocument.activeElement)
              resetKey++
            }
            handle.props.onValueChange?.(event.value)
            if (handle.props.value !== undefined) void handle.update()
          }),
        ]}
      >
        <select.Context
          key={`${resetKey}:${handle.props.value === undefined ? '' : (handle.props.value ?? 'empty')}`}
          defaultLabel={initial?.label ?? placeholder}
          defaultValue={initial?.value}
          disabled={disabled}
          name={name}
        >
          <button
            type="button"
            class="rf-picker-trigger"
            id={handle.props.id}
            aria-label={label}
            aria-describedby={handle.props['aria-describedby']}
            aria-invalid={handle.props['aria-invalid']}
            mix={select.trigger()}
          >
            <SelectValue options={options} />
            <ChoiceChevron />
          </button>
          <popover.Context>
            <div
              class="rf-menu-surface rf-picker-surface rf-select-surface"
              mix={[positionPickerPopup(), select.popover()]}
            >
              <div class="rf-menu-list" aria-label={label} mix={[select.list(), highlight]}>
                <span class="rf-highlight rf-picker-hover" aria-hidden="true" data-rf-hover-layer />
                {options.map((option, index) => (
                  <>
                    {option.group && option.group !== options[index - 1]?.group && (
                      <div class="rf-menu-group-label" aria-hidden="true">
                        {option.group}
                      </div>
                    )}
                    <div
                      key={option.value}
                      class="rf-picker-option"
                      data-rf-hover-item
                      aria-label={option.group ? `${option.group}, ${option.label}` : undefined}
                      mix={select.option({
                        value: option.value,
                        label: option.label,
                        textValue: option.searchValue,
                        disabled: option.disabled,
                      })}
                    >
                      <ChoiceContent option={option} />
                    </div>
                  </>
                ))}
              </div>
            </div>
          </popover.Context>
          <input type="hidden" mix={select.hiddenInput()} />
        </select.Context>
      </div>
    )
  }
}

function SelectValue(handle: Handle<{ options: readonly ChoiceOption[] }>) {
  const context = handle.context.get(select.Context)
  return () => {
    const selected = handle.props.options.find((option) => option.value === context.value)
    return (
      <span class="rf-picker-value" data-placeholder={context.value == null ? '' : undefined}>
        {selected?.icon != null && (
          <span class="rf-picker-icon" aria-hidden="true">
            {selected.icon}
          </span>
        )}
        <span class="rf-picker-label">{context.displayedLabel}</span>
      </span>
    )
  }
}

export interface ComboboxProps extends ChoiceProps {
  leadingIcon?: RemixNode
  multiple?: boolean
  values?: readonly string[]
  defaultValues?: readonly string[]
  onValuesChange?: (values: string[]) => void
  creatable?: boolean
  onCreate?: (value: string) => void
  emptyMessage?: string
  hideSelected?: boolean
  error?: boolean
}

const chipSpring = spring('snappy', { duration: 135 })

const exitChip = createMixin<HTMLElement, []>(
  (handle) => {
    let node: HTMLElement
    handle.addEventListener('insert', (event) => {
      node = event.node
    })
    handle.addEventListener('reclaimed', (event) => {
      node = event.node
    })
    handle.addEventListener('beforeRemove', (event) => {
      if (!node?.isConnected || prefersReducedMotion()) return
      const { offsetLeft, offsetTop, offsetWidth } = node
      event.persistNode(async (signal) => {
        if (signal.aborted) return
        // Keep the departing chip visible while letting its row close immediately.
        Object.assign(node.style, {
          position: 'absolute',
          left: `${offsetLeft}px`,
          top: `${offsetTop}px`,
          width: `${offsetWidth}px`,
        })
        node.inert = true
        const animation = node.animate(
          [
            { opacity: 1, scale: 1 },
            { opacity: 0, scale: 0.9 },
          ],
          chipSpring,
        )
        const cancel = () => animation.cancel()
        signal.addEventListener('abort', cancel, { once: true })
        try {
          await animation.finished
        } catch {
          // A new selection can reclaim the same keyed chip during its exit.
        } finally {
          signal.removeEventListener('abort', cancel)
          if (signal.aborted) {
            Object.assign(node.style, { position: '', left: '', top: '', width: '' })
            node.inert = false
          }
        }
      })
    })
    return () => handle.element
  },
  { ssr: false },
)

export function Combobox(handle: Handle<ComboboxProps>) {
  let selection = handle.props.defaultValue ?? null
  let selections = [...(handle.props.defaultValues ?? [])]
  let query = ''
  let editing = false
  let open = false
  let active: string | undefined
  let input: HTMLInputElement | undefined
  let chipRows: HTMLDivElement | undefined
  const trackChipRows = ref<HTMLDivElement>((rows, signal) => {
    chipRows = rows
    const field = rows.parentElement
    if (!field) return
    function measure() {
      const height = rows.offsetHeight
      if (height) field?.style.setProperty('--rf-picker-rows-height', `${height}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(rows)
    signal.addEventListener(
      'abort',
      () => {
        observer.disconnect()
        field.style.removeProperty('--rf-picker-rows-height')
        if (chipRows === rows) chipRows = undefined
      },
      { once: true },
    )
  })
  let created: ChoiceOption[] = []
  const listId = `${handle.id}-list`
  const highlight = fluidHover({ highlightedSelector: '[data-highlighted="true"]' })
  const reset = onFormReset(() => {
    selection = handle.props.defaultValue ?? null
    selections = [...(handle.props.defaultValues ?? [])]
    query = ''
    editing = false
    open = false
    void handle.update()
  })

  function changeOpen(next: boolean) {
    open = next
    if (!next) {
      editing = false
      query = ''
      active = undefined
    }
    void handle.update()
  }

  return () => {
    const props = handle.props
    const {
      label,
      name,
      disabled,
      multiple,
      variant = 'bordered',
      size,
      placeholder = 'Search…',
      emptyMessage = 'No results found.',
    } = props
    const options = [
      ...props.options,
      ...created.filter((item) => !props.options.some((option) => option.value === item.value)),
    ]
    const selected = props.value === undefined ? selection : props.value
    const selectedValues = props.values ?? selections
    const selectedOption = options.find((option) => option.value === selected)
    const term = query.trim().toLowerCase()
    const filtered = options.filter((option) => {
      if (multiple && props.hideSelected && selectedValues.includes(option.value)) return false
      const keywords =
        typeof option.searchValue === 'string' ? [option.searchValue] : (option.searchValue ?? [])
      return [option.label, option.value, ...keywords].some((text) =>
        text.toLowerCase().includes(term),
      )
    })
    const canCreate =
      props.creatable &&
      query.trim() &&
      !options.some((option) => option.label.toLowerCase() === term)
    const visible = canCreate
      ? [...filtered, { value: query.trim(), label: `Create “${query.trim()}”` }]
      : filtered
    const enabled = visible.filter((option) => !option.disabled)
    if (active && !enabled.some((option) => option.value === active)) active = undefined
    function openWithHighlight() {
      active = enabled.find((option) => option.value === selected)?.value ?? enabled[0]?.value
      changeOpen(true)
    }

    const optionId = (value: string) =>
      `${handle.id}-option-${visible.findIndex((option) => option.value === value)}`

    function changeValues(next: string[]) {
      if (props.values === undefined) selections = next
      props.onValuesChange?.(next)
      void handle.update()
    }

    function choose(option: ChoiceOption) {
      if (disabled || option.disabled) return
      if (canCreate && option === visible.at(-1)) {
        created = [...created, { value: option.value, label: query.trim() }]
        props.onCreate?.(option.value)
      }
      if (multiple) {
        changeValues(
          selectedValues.includes(option.value)
            ? selectedValues.filter((value) => value !== option.value)
            : [...selectedValues, option.value],
        )
        query = ''
        editing = true
      } else {
        if (props.value === undefined) selection = option.value
        props.onValueChange?.(option.value)
        changeOpen(false)
      }
      void handle.update().then((signal) => {
        if (!signal.aborted) input?.focus()
      })
    }

    function focusChip(value?: string) {
      const chip = [
        ...(chipRows?.querySelectorAll<HTMLButtonElement>('[data-rf-chip-remove]') ?? []),
      ].find((button) => button.dataset.rfChipRemove === value && !button.closest('[inert]'))
      const target = chip ?? input
      target?.focus()
    }

    function navigateChip(event: KeyboardEvent, index: number) {
      if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return
      const previous = getComputedStyle(input!).direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
      const next = previous === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft'
      if (event.key === previous || event.key === next) {
        event.preventDefault()
        focusChip(selectedValues[event.key === previous ? Math.max(0, index - 1) : index + 1])
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        changeValues(selectedValues.filter((_, position) => position !== index))
        focusChip(selectedValues[index - 1])
      } else if (event.key === 'Escape' && open) {
        event.preventDefault()
        changeOpen(false)
        input?.focus()
      }
    }

    function navigate(event: KeyboardEvent) {
      if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        changeOpen(false)
        return
      }
      if (event.key === 'Tab') {
        changeOpen(false)
        return
      }
      const towardChips =
        input &&
        event.key === (getComputedStyle(input).direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft')
      if (
        multiple &&
        towardChips &&
        !event.shiftKey &&
        selectedValues.length &&
        input?.selectionStart === 0 &&
        input.selectionEnd === 0
      ) {
        event.preventDefault()
        focusChip(selectedValues.at(-1))
        return
      }
      if (event.key === 'Backspace' && multiple && !query && selectedValues.length) {
        changeValues(selectedValues.slice(0, -1))
        return
      }
      if (event.key === 'Enter' && open && active) {
        const option = enabled.find((item) => item.value === active)
        if (option) {
          event.preventDefault()
          choose(option)
        }
        return
      }
      const next = navigationIndex(
        event.key,
        enabled.findIndex((option) => option.value === active),
        enabled.length,
        { orientation: 'vertical', homeEnd: open },
      )
      if (next === undefined) return
      event.preventDefault()
      active = enabled[next].value
      open = true
      void handle.update().then((signal) => {
        if (!signal.aborted)
          input?.ownerDocument
            .getElementById(optionId(active!))
            ?.scrollIntoView({ block: 'nearest' })
      })
    }

    const reduced = prefersReducedMotion()
    const editor = (
      <input
        class="rf-picker-input"
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-invalid={props.error || undefined}
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active ? optionId(active) : undefined}
        placeholder={multiple && selectedValues.length ? '' : placeholder}
        disabled={disabled}
        autocomplete="off"
        value={editing || multiple ? query : (selectedOption?.label ?? '')}
        style={multiple ? { '--rf-picker-query-length': query.length + 1 } : undefined}
        mix={[
          ref((node) => {
            input = node as HTMLInputElement
          }),
          on('click', () => {
            if (!open) openWithHighlight()
          }),
          on<HTMLInputElement, 'input'>('input', (event) => {
            query = event.currentTarget.value
            editing = true
            open = true
            active = undefined
            if (!multiple) {
              if (props.value === undefined) selection = null
              props.onValueChange?.(null)
            }
            void handle.update()
          }),
          on<HTMLInputElement, 'keydown'>('keydown', navigate),
        ]}
      />
    )

    return (
      <div class="rf-picker rf-combobox" data-variant={variant} data-density={size} mix={reset}>
        <popover.Context>
          <div
            class="rf-picker-field"
            data-multiple={multiple || undefined}
            data-error={props.error || undefined}
            style={multiple ? { '--rf-picker-resize': chipSpring.toString() } : undefined}
            mix={[
              popover.anchor({ placement: 'bottom-start', offset: 6 }),
              on('click', (event) => {
                if (event.target === event.currentTarget || event.target === chipRows) {
                  input?.focus()
                  if (!open) openWithHighlight()
                }
              }),
            ]}
          >
            {props.leadingIcon != null && (
              <span class="rf-picker-icon rf-combobox-leading" aria-hidden="true">
                {props.leadingIcon}
              </span>
            )}
            {multiple ? (
              <div
                class="rf-picker-chips"
                data-has-chips={selectedValues.length > 0 || undefined}
                mix={trackChipRows}
              >
                {selectedValues.map((value, index) => {
                  const option = options.find((item) => item.value === value)
                  return (
                    <span
                      class="rf-picker-chip"
                      key={value}
                      mix={[
                        animateLayout(reduced ? false : { ...chipSpring, size: false }),
                        animateEntrance(
                          reduced
                            ? false
                            : { ...chipSpring, initial: false, opacity: 0, scale: 0.9 },
                        ),
                        exitChip(),
                      ]}
                    >
                      {option?.icon}
                      <span class="rf-picker-label">{option?.label ?? value}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${option?.label ?? value}`}
                        disabled={disabled}
                        data-rf-chip-remove={value}
                        mix={[
                          on('click', () => {
                            changeValues(selectedValues.filter((item) => item !== value))
                            input?.focus()
                          }),
                          on('keydown', (event) => navigateChip(event, index)),
                        ]}
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </span>
                  )
                })}
                {editor}
              </div>
            ) : (
              editor
            )}
            <button
              type="button"
              class="rf-picker-toggle"
              aria-label={open ? 'Close options' : 'Open options'}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={listId}
              tabIndex={-1}
              disabled={disabled}
              mix={[
                on('mousedown', (event) => event.preventDefault()),
                on('click', () => {
                  input?.focus()
                  if (open) changeOpen(false)
                  else openWithHighlight()
                }),
              ]}
            >
              <ChoiceChevron />
            </button>
          </div>
          <div
            class="rf-menu-surface rf-picker-surface rf-combobox-surface"
            mix={[
              positionPickerPopup(true),
              popover.surface({ open, onHide: () => changeOpen(false), closeOnAnchorClick: false }),
            ]}
          >
            <ScrollArea label={`${label} options`} fade={32} tabIndex={-1}>
              <div
                class="rf-menu-list"
                id={listId}
                role="listbox"
                aria-label={label}
                aria-multiselectable={multiple || undefined}
                mix={highlight}
              >
                <span class="rf-highlight rf-picker-hover" aria-hidden="true" data-rf-hover-layer />
                {visible.map((option) => (
                  <div
                    key={option.value}
                    id={optionId(option.value)}
                    class="rf-picker-option"
                    role="option"
                    aria-selected={
                      multiple ? selectedValues.includes(option.value) : selected === option.value
                    }
                    aria-disabled={option.disabled || undefined}
                    data-highlighted={active === option.value ? 'true' : undefined}
                    data-rf-hover-item
                    mix={[
                      on('mousedown', (event) => event.preventDefault()),
                      on('pointermove', () => {
                        if (!option.disabled && active !== option.value) {
                          active = option.value
                          void handle.update()
                        }
                      }),
                      on('click', () => choose(option)),
                    ]}
                  >
                    <ChoiceContent option={option} combobox />
                  </div>
                ))}
                {!visible.length && (
                  <div class="rf-picker-empty" role="status">
                    {emptyMessage}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </popover.Context>
        {name &&
          (multiple ? (
            selectedValues.map((value) => (
              <input key={value} type="hidden" name={name} value={value} disabled={disabled} />
            ))
          ) : (
            <input type="hidden" name={name} value={selected ?? ''} disabled={disabled} />
          ))}
      </div>
    )
  }
}

function ChoiceChevron() {
  return () => <Icon name="chevron-down" class="rf-picker-chevron" />
}

function ChoiceContent(handle: Handle<{ option: ChoiceOption; combobox?: boolean }>) {
  return () => {
    const { option } = handle.props
    return (
      <>
        {option.icon != null && (
          <span class="rf-picker-icon" aria-hidden="true">
            {option.icon}
          </span>
        )}
        <span class="rf-picker-label">{option.label}</span>
        {handle.props.combobox ? (
          <svg
            class="rf-picker-check"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 12 9 17 20 6" pathLength="1" />
          </svg>
        ) : (
          <Icon name="check" size={13} class="rf-picker-check" />
        )}
      </>
    )
  }
}
