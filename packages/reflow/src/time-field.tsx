import { on, ref, type Handle } from 'remix/component'
import * as popover from '@remix-run/ui/popover'
import * as listbox from '@remix-run/ui/listbox'
import { Icon } from './icon.tsx'
import { fluidHover } from './interactive.tsx'

// Time parsing and same-day slot behavior follow Fluid Functionalism's
// date-picker-core (MIT, attribution and license in ../NOTICE).
export function parseTime(input: string): number | null {
  const text = input.trim().toLowerCase().replace(/\s+/g, '')
  const match = /^(\d{1,2})(?:[:.h](\d{2})?|(\d{2}))?(a|am|p|pm)?$/.exec(text)
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2] ?? match[3] ?? 0)
  if (minutes > 59) return null
  if (match[4]) {
    if (hours < 1 || hours > 12) return null
    hours = (hours % 12) + (match[4].startsWith('p') ? 12 : 0)
  } else if (hours > 23) return null
  return hours * 60 + minutes
}

export function timeValue(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function timeDuration(minutes: number) {
  return (
    [minutes >= 60 ? `${Math.floor(minutes / 60)}h` : '', minutes % 60 ? `${minutes % 60}min` : '']
      .filter(Boolean)
      .join(' ') || '0min'
  )
}

interface TimeFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  after?: string
  step?: number
  hourCycle?: 12 | 24
  locale?: string
  disabled?: boolean
  end?: boolean
  duration?: string
}

export function TimeField(handle: Handle<TimeFieldProps>) {
  let open = false
  let draft: string | null = null
  let active: string | null = null
  let input: HTMLInputElement | undefined
  let options: listbox.ListboxRef | undefined
  const highlight = fluidHover({ highlightedSelector: '[data-highlighted]' })

  return () => {
    const {
      value,
      label,
      disabled,
      end,
      after,
      duration,
      hourCycle = 12,
      locale = 'en-US',
    } = handle.props
    const floor = after === undefined ? -1 : (parseTime(after) ?? -1)
    const step = Number.isFinite(handle.props.step)
      ? Math.max(1, Math.round(handle.props.step!))
      : 15
    const slots: number[] = []
    for (let minute = floor < 0 ? 0 : floor + step; minute < 1440; minute += step)
      slots.push(minute)
    if (!slots.length && floor >= 0 && floor < 1439) slots.push(1439)
    const format = (minute: number) =>
      new Intl.DateTimeFormat(locale, {
        hour: hourCycle === 12 ? 'numeric' : '2-digit',
        minute: '2-digit',
        hourCycle: hourCycle === 12 ? 'h12' : 'h23',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(2000, 0, 1, 0, minute)))
    const current = parseTime(value)
    const display = current === null ? '' : format(current)
    const listId = `${handle.id}-times`

    function scrollActive(center = false) {
      handle.queueTask(() =>
        options?.active?.node.scrollIntoView({ block: center ? 'center' : 'nearest' }),
      )
    }
    function show() {
      if (disabled || open) return
      open = true
      const nearest = slots.reduce<number | undefined>(
        (best, minute) =>
          best === undefined || Math.abs(minute - (current ?? 0)) < Math.abs(best - (current ?? 0))
            ? minute
            : best,
        undefined,
      )
      active = nearest === undefined ? null : timeValue(nearest)
      void handle.update()
      scrollActive(true)
    }
    function close(commit: boolean) {
      if (commit && draft !== null) {
        const minute = parseTime(draft)
        if (minute !== null && minute > floor) handle.props.onChange(timeValue(minute))
      }
      draft = null
      open = false
      void handle.update()
    }
    function choose(next: string | null) {
      if (next === null) return
      handle.props.onChange(next)
      close(false)
      input?.focus()
    }

    return (
      <popover.Context>
        <span
          class="rf-date-time"
          data-rf-hover-item
          mix={popover.anchor({ placement: 'bottom-start', offset: 6 })}
        >
          <Icon name={end ? 'arrow-right' : 'clock'} />
          <span class="rf-date-time-field">
            <span class="rf-date-sizer" aria-hidden="true">
              {hourCycle === 12 ? '12:00 AM' : '00:00'}
            </span>
            <input
              type="text"
              role="combobox"
              aria-label={label}
              disabled={disabled}
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="none"
              aria-haspopup="listbox"
              aria-activedescendant={
                open
                  ? options?.options.find((option) => option.value === active)?.node.id
                  : undefined
              }
              autocomplete="off"
              spellcheck={false}
              placeholder={hourCycle === 12 ? 'hh:mm aa' : 'hh:mm'}
              value={draft ?? display}
              mix={[
                ref((node) => {
                  input = node
                }),
                on('click', () => {
                  if (!open) {
                    show()
                    input?.select()
                  }
                }),
                on('input', (event) => {
                  draft = event.currentTarget.value
                  show()
                  const parsed = parseTime(draft)
                  if (parsed !== null && slots.length) {
                    active = timeValue(
                      slots.reduce((best, minute) =>
                        Math.abs(minute - parsed) < Math.abs(best - parsed) ? minute : best,
                      ),
                    )
                    scrollActive(true)
                  }
                  void handle.update()
                }),
                on('blur', () => close(true)),
                on('keydown', (event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault()
                    if (!open) {
                      show()
                      return
                    }
                    const index = slots.findIndex((minute) => timeValue(minute) === active)
                    const next =
                      slots[
                        Math.max(
                          0,
                          Math.min(slots.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)),
                        )
                      ]
                    if (next !== undefined) {
                      active = timeValue(next)
                      draft = format(next)
                      void handle.update()
                      scrollActive()
                    }
                  } else if (event.key === 'Enter') {
                    event.preventDefault()
                    if (draft !== null) close(true)
                    else choose(active)
                  } else if (event.key === 'Escape' && (open || draft !== null)) {
                    event.preventDefault()
                    event.stopPropagation()
                    close(false)
                  } else if (event.key === 'Tab') close(true)
                }),
              ]}
            />
          </span>
          {duration && (
            <span class="rf-date-duration" data-duration>
              {duration}
            </span>
          )}
        </span>
        <div
          class="rf-menu-surface rf-time-surface"
          data-duration={after !== undefined || undefined}
          mix={[
            popover.surface({
              open,
              closeOnAnchorClick: false,
              restoreFocusOnHide: false,
              onHide: (request) => close(request?.reason !== 'escape-key'),
            }),
            on('toggle', (event) => {
              if (event.newState === 'open') scrollActive(true)
            }),
            on('pointerdown', (event) => {
              if (event.target instanceof Element && event.target.closest('[role="option"]'))
                event.preventDefault()
            }),
          ]}
        >
          <listbox.Context
            value={value}
            activeValue={active}
            ref={(next) => {
              options = next
            }}
            onSelect={choose}
            onHighlight={(next) => {
              active = next
              void handle.update()
            }}
          >
            <div
              id={listId}
              aria-label={`${label} slots`}
              class="rf-time-list"
              mix={[listbox.list(), highlight]}
            >
              <span class="rf-highlight rf-menu-hover" aria-hidden="true" data-rf-hover-layer />
              {slots.map((minute) => (
                <div
                  key={minute}
                  class="rf-time-option"
                  data-rf-hover-item
                  mix={listbox.option({ value: timeValue(minute), label: format(minute) })}
                >
                  <span>{format(minute)}</span>
                  {floor >= 0 && (
                    <span class="rf-date-duration">{timeDuration(minute - floor)}</span>
                  )}
                </div>
              ))}
              {!slots.length && (
                <div role="status" class="rf-menu-empty">
                  No later times
                </div>
              )}
            </div>
          </listbox.Context>
        </div>
      </popover.Context>
    )
  }
}
