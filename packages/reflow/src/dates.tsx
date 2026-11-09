import { Icon } from './icon.tsx'
import { TimeField, parseTime, timeValue as serializeTime } from './time-field.tsx'
import { on, ref } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import * as popover from '@remix-run/ui/popover'
import { fluidHover } from './interactive.tsx'
import { Tooltip } from './overlays.tsx'
import { motion } from './systems.ts'
import { prefersReducedMotion } from '@remix-run/ui/animation'

export interface DateRange {
  start: string
  end?: string
}

export type DateValue = string | DateRange | null

export interface CalendarProps {
  label?: string
  mode?: 'single' | 'range'
  value?: DateValue
  defaultValue?: DateValue
  onValueChange?: (value: DateValue) => void
  min?: string
  max?: string
  isDateDisabled?: (date: string) => boolean
  defaultMonth?: string
  /** Calendar day in YYYY-MM-DD. Supply the same value on server and client to pin today. */
  today?: string
  name?: string
  weekStartsOn?: 0 | 1
  showWeekNumbers?: boolean
  numberOfMonths?: 1 | 2
  orientation?: 'horizontal' | 'vertical'
  booked?: readonly string[]
  available?: readonly string[]
  minNights?: number
  maxNights?: number
  dayDetail?: (date: string) => RemixNode
  cellSize?: number
}

export interface DatePickerProps extends CalendarProps {
  placeholder?: string
  disabled?: boolean
  closeOnSelect?: boolean
  /** Add a button that clears the selected date or range. */
  clearable?: boolean
  size?: 'default' | 'compact'
  variant?: 'outline' | 'ghost'
  time?: boolean
  timeRange?: boolean
  /** Minutes between suggested time slots. */
  step?: number
  hourCycle?: 12 | 24
  locale?: string
  timeValue?: string
  defaultTime?: string
  onTimeChange?: (value: string) => void
  endTimeValue?: string
  defaultEndTime?: string
  onEndTimeChange?: (value: string) => void
  presets?: readonly { label: string; value: DateValue }[]
}

const dayMs = 86_400_000
const monthLabel = new Intl.DateTimeFormat('en', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const dayLabel = new Intl.DateTimeFormat('en', {
  dateStyle: 'full',
  timeZone: 'UTC',
})
const weekdayLabel = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  timeZone: 'UTC',
})

function calendarDate(year: number, month: number, day: number) {
  const date = new Date(0)
  date.setUTCFullYear(year, month, day)
  return date
}

function iso(date: Date) {
  const year = date.getUTCFullYear()
  if (year < 1 || year > 9999) return ''
  return date.toISOString().slice(0, 10)
}

function parse(date: string | undefined) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const [year, month, day] = date.split('-').map(Number)
  const parsed = calendarDate(year, month - 1, day)
  return iso(parsed) === date ? parsed : null
}

function today(zone: 'utc' | 'local' = 'utc') {
  const now = new Date()
  return zone === 'local'
    ? calendarDate(now.getFullYear(), now.getMonth(), now.getDate())
    : calendarDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

function monthStart(date: Date) {
  return calendarDate(date.getUTCFullYear(), date.getUTCMonth(), 1)
}

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * dayMs)
}

function addMonths(date: Date, amount: number) {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + amount
  const lastDay = calendarDate(year, month + 1, 0).getUTCDate()
  return calendarDate(year, month, Math.min(date.getUTCDate(), lastDay))
}

function clamp(date: Date, min: Date, max: Date) {
  return date < min ? min : date > max ? max : date
}

function dateLimits(props: CalendarProps) {
  const min = parse(props.min) ?? calendarDate(1, 0, 1)
  const max = parse(props.max) ?? calendarDate(9999, 11, 31)
  return { min, max: max < min ? min : max }
}

function initialDate(props: CalendarProps, today: Date) {
  const value = props.value === undefined ? props.defaultValue : props.value
  const selected = typeof value === 'string' ? value : value?.start
  const { min, max } = dateLimits(props)
  return clamp(parse(selected) ?? parse(props.defaultMonth) ?? today, min, max)
}

function getWeekNumber(date: Date) {
  const thursday = addDays(date, 3 - ((date.getUTCDay() + 6) % 7))
  const yearStart = calendarDate(thursday.getUTCFullYear(), 0, 1)
  return 1 + Math.floor((thursday.getTime() - yearStart.getTime()) / (7 * dayMs))
}

function orderedRange(start: string, end: string): DateRange {
  return start <= end ? { start, end } : { start: end, end: start }
}

function unavailableDate(props: CalendarProps, day: string) {
  return (
    !!props.booked?.includes(day) ||
    (props.available !== undefined && !props.available.includes(day)) ||
    !!props.isDateDisabled?.(day)
  )
}

function blockedRange(props: CalendarProps, range: DateRange) {
  const endValue = range.end
  if (!endValue) return false
  if (props.booked?.some((day) => day >= range.start && day <= endValue)) return true
  if (!props.available && !props.isDateDisabled) return false
  const start = parse(range.start)
  const end = parse(range.end)
  if (!start || !end) return true
  for (let day = start; day <= end; day = addDays(day, 1)) {
    if (unavailableDate(props, iso(day))) return true
  }
  return false
}

export function Calendar(handle: Handle<CalendarProps>) {
  let selection = handle.props.defaultValue ?? null
  const initialDay = today()
  let mounted = false
  const referenceDay = () => parse(handle.props.today) ?? (mounted ? today('local') : initialDay)
  let focused = initialDate(handle.props, referenceDay())
  let firstMonth = monthStart(focused)
  let hovered: string | null = null
  let previousRange: DateValue = selection
  let grid: HTMLElement | null = null
  const hover = fluidHover({ axis: 'both', selectedSelector: '[data-rf-selected]' })
  const gridRef = ref((node, signal) => {
    if (!(node instanceof HTMLElement)) return
    grid = node
    if (!mounted) {
      const before = referenceDay()
      mounted = true
      const after = referenceDay()
      if (before.getTime() !== after.getTime()) {
        const initial = initialDate(handle.props, before)
        if (focused.getTime() === initial.getTime()) {
          focused = initialDate(handle.props, after)
          firstMonth = monthStart(focused)
        }
        void handle.update()
      }
    }
    node.closest('form')?.addEventListener(
      'reset',
      (event) =>
        queueMicrotask(() => {
          if (signal.aborted || event.defaultPrevented || handle.props.value !== undefined) return
          selection = handle.props.defaultValue ?? null
          focused = initialDate(handle.props, referenceDay())
          firstMonth = monthStart(focused)
          hovered = null
          void handle.update()
        }),
      { signal },
    )
    signal.addEventListener(
      'abort',
      () => {
        if (grid === node) grid = null
      },
      { once: true },
    )
  })

  function showMonth(next: Date) {
    if (next.getTime() === firstMonth.getTime()) return
    const direction = next > firstMonth ? 1 : -1
    firstMonth = next
    handle.queueTask(() => {
      if (!grid || prefersReducedMotion()) return
      for (const element of grid.querySelectorAll('.rf-calendar-months-label, .rf-calendar-grid')) {
        for (const animation of element.getAnimations()) {
          if (animation.id === 'reflow-calendar-month') animation.cancel()
        }
        const label = element.classList.contains('rf-calendar-months-label')
        const animation = element.animate(
          label
            ? [
                { opacity: 0, translate: `${direction * 8}px` },
                { opacity: 1, translate: '0px' },
              ]
            : [{ opacity: 0.45 }, { opacity: 1 }],
          motion.moderate,
        )
        animation.id = 'reflow-calendar-month'
      }
    })
  }

  function focusDay(next: Date) {
    const props = handle.props
    const { min, max } = dateLimits(props)
    const direction = next < focused ? -1 : 1
    let candidate = clamp(next, min, max)
    while (unavailableDate(props, iso(candidate))) {
      candidate = addDays(candidate, direction)
      if (candidate < min || candidate > max) return
    }
    focused = candidate
    const value = props.value === undefined ? selection : props.value
    const date = iso(focused)
    if (props.mode === 'range' && value && typeof value === 'object' && !value.end) {
      hovered = unavailableDate(props, date) ? null : date
    }
    const month = monthStart(focused)
    if (month < firstMonth || month >= addMonths(firstMonth, props.numberOfMonths ?? 1)) {
      showMonth(month)
    }
    void handle.update().then((signal) => {
      if (!signal.aborted) {
        grid?.querySelector<HTMLElement>(`[data-rf-day="${iso(focused)}"]`)?.focus()
      }
    })
  }

  function selectDay(day: string) {
    const props = handle.props
    const { min, max } = dateLimits(props)
    if (day < iso(min) || day > iso(max) || unavailableDate(props, day)) return
    const current = props.value === undefined ? selection : props.value
    const range = typeof current === 'object' && current !== null ? current : null
    let next =
      props.mode === 'range'
        ? range?.start && !range.end
          ? orderedRange(range.start, day)
          : { start: day }
        : day

    if (props.mode === 'range' && next && typeof next === 'object') {
      if (next.end) {
        if (blockedRange(props, next)) next = { start: day }
        else {
          const nights = (parse(next.end)!.getTime() - parse(next.start)!.getTime()) / dayMs
          if (nights < (props.minNights ?? 0) || nights > (props.maxNights ?? Infinity)) return
        }
      } else previousRange = current
    }
    if (props.value === undefined) selection = next
    hovered = null
    props.onValueChange?.(next)
    void handle.update()
  }

  return () => {
    const props = handle.props
    const {
      label = 'Calendar',
      mode = 'single',
      weekStartsOn = 0,
      showWeekNumbers = false,
      numberOfMonths = 1,
      orientation = 'horizontal',
      booked = [],
      dayDetail,
      cellSize,
      name,
    } = props
    const { min, max } = dateLimits(props)
    firstMonth = clamp(firstMonth, monthStart(min), monthStart(max))
    focused = clamp(focused, min, max)
    const current = props.value === undefined ? selection : props.value
    const value = mode === 'single' && typeof current === 'string' ? current : null
    const range = mode === 'range' && current && typeof current === 'object' ? current : null
    const todayIso = iso(referenceDay())
    const rangePreview =
      range?.start && !range.end && hovered ? orderedRange(range.start, hovered) : null
    const validPreview = rangePreview && !blockedRange(props, rangePreview) ? rangePreview : null
    const months = Array.from({ length: numberOfMonths }, (_, index) =>
      addMonths(firstMonth, index),
    ).filter((month) => iso(month) && month <= monthStart(max))
    const weekdays = Array.from({ length: 7 }, (_, index) =>
      weekdayLabel.format(calendarDate(2024, 0, 7 + ((index + weekStartsOn) % 7))),
    )
    const displayedDate =
      focused < firstMonth || focused >= addMonths(firstMonth, months.length)
        ? clamp(firstMonth, min, max)
        : focused

    function moveMonth(amount: number) {
      const target = addMonths(firstMonth, amount)
      const nextMonth = clamp(target, monthStart(min), monthStart(max))
      const year = nextMonth.getUTCFullYear()
      const month = nextMonth.getUTCMonth()
      const lastDay = calendarDate(year, month + 1, 0).getUTCDate()
      showMonth(nextMonth)
      focused = clamp(calendarDate(year, month, Math.min(focused.getUTCDate(), lastDay)), min, max)
      hovered = null
      void handle.update()
    }

    function monthButton(direction: 'left' | 'right', disabled: boolean) {
      const label = direction === 'left' ? 'Previous month' : 'Next month'
      return (
        <Tooltip
          content={label}
          side="bottom"
          renderTrigger={(trigger) => (
            <button
              {...trigger}
              type="button"
              class="rf-calendar-nav"
              data-direction={direction === 'left' ? 'previous' : 'next'}
              data-rf-hover-item
              aria-label={label}
              disabled={disabled}
              mix={[trigger.mix, on('click', () => moveMonth(direction === 'left' ? -1 : 1))]}
            >
              <DateArrow direction={direction} />
            </button>
          )}
        />
      )
    }

    function onDayKey(event: KeyboardEvent, day: Date) {
      let next: Date
      switch (event.key) {
        case 'Escape':
          if (range?.start && !range.end) {
            event.preventDefault()
            if (props.value === undefined) selection = previousRange
            props.onValueChange?.(previousRange)
            hovered = null
            void handle.update()
          }
          return
        case 'ArrowLeft':
          next = addDays(day, -1)
          break
        case 'ArrowRight':
          next = addDays(day, 1)
          break
        case 'ArrowUp':
          next = addDays(day, -7)
          break
        case 'ArrowDown':
          next = addDays(day, 7)
          break
        case 'Home':
          next = addDays(day, -((day.getUTCDay() + 7 - weekStartsOn) % 7))
          break
        case 'End':
          next = addDays(day, 6 - ((day.getUTCDay() + 7 - weekStartsOn) % 7))
          break
        case 'PageUp':
          next = addMonths(day, event.shiftKey ? -12 : -1)
          break
        case 'PageDown':
          next = addMonths(day, event.shiftKey ? 12 : 1)
          break
        default:
          return
      }
      event.preventDefault()
      focusDay(next)
    }

    // As in the reference: side by side, each title is centered over its
    // month, previous sits at the far left and next at the far right. One
    // month, or months stacked, keep the title left and both arrows together
    // on the first month's right.
    const sideBySide = months.length > 1 && orientation !== 'vertical'
    // Stacked months share one weekday row above them, as in the reference;
    // each month's own header stays in its table for screen readers.
    const stacked = months.length > 1 && orientation === 'vertical'
    const previousDisabled = firstMonth <= monthStart(min)
    const nextDisabled = firstMonth >= monthStart(max)

    return (
      <section
        class="rf-calendar"
        aria-label={label}
        data-orientation={orientation}
        data-week-numbers={showWeekNumbers ? '' : undefined}
        data-stacked={stacked ? '' : undefined}
        style={
          cellSize && Number.isFinite(cellSize) && cellSize > 0
            ? { '--rf-date-cell-size': `${cellSize}px` }
            : undefined
        }
      >
        {stacked && (
          <div class="rf-calendar-weekdays" aria-hidden="true">
            {showWeekNumbers && <span class="rf-calendar-weekdays-week" />}
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday.slice(0, 2)}</span>
            ))}
          </div>
        )}
        <div
          class="rf-calendar-months"
          mix={[
            gridRef,
            hover,
            on('pointerleave', () => {
              if (hovered === null) return
              hovered = null
              void handle.update()
            }),
          ]}
        >
          <span class="rf-highlight rf-calendar-hover" aria-hidden="true" data-rf-hover-layer />
          <span
            class="rf-highlight rf-calendar-preview-end"
            aria-hidden="true"
            data-rf-selection-layer
          />
          {months.map((month, index) => {
            const firstDayOffset = (month.getUTCDay() + 7 - weekStartsOn) % 7
            const start = addDays(month, -firstDayOffset)
            const daysInMonth = addDays(addMonths(month, 1), -1).getUTCDate()
            const weekCount = Math.ceil((firstDayOffset + daysInMonth) / 7)
            const weeks = Array.from({ length: weekCount }, (_, row) =>
              Array.from({ length: 7 }, (_, column) => addDays(start, row * 7 + column)),
            )
            const monthIso = iso(month).slice(0, 7)

            return (
              <div class="rf-calendar-month" key={index}>
                <div class="rf-calendar-header" data-centered={sideBySide ? '' : undefined}>
                  {sideBySide && index === 0 && monthButton('left', previousDisabled)}
                  <div
                    class="rf-calendar-months-label"
                    aria-live={index === 0 ? 'polite' : undefined}
                    aria-atomic={index === 0 ? 'true' : undefined}
                  >
                    {monthLabel.format(month)}
                  </div>
                  {sideBySide
                    ? index === months.length - 1 && monthButton('right', nextDisabled)
                    : index === 0 && (
                        <>
                          {monthButton('left', previousDisabled)}
                          {monthButton('right', nextDisabled)}
                        </>
                      )}
                </div>
                <table class="rf-calendar-grid" role="grid" aria-label={monthLabel.format(month)}>
                  <thead>
                    <tr>
                      {showWeekNumbers && (
                        <th scope="col" class="rf-calendar-week" abbr="Week number">
                          <span class="rf-basic-sr-only">Week number</span>
                        </th>
                      )}
                      {weekdays.map((weekday) => (
                        <th key={weekday} scope="col" abbr={weekday}>
                          {weekday.slice(0, 2)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((week) => (
                      <tr key={week[0].getTime()}>
                        {showWeekNumbers && (
                          <th scope="row" class="rf-calendar-week">
                            {getWeekNumber(week[0])}
                          </th>
                        )}
                        {week.map((day) => {
                          const dayIso = iso(day)
                          const outside = !dayIso.startsWith(monthIso)
                          if (!dayIso || (months.length > 1 && outside))
                            return <td key={day.getTime()} />

                          const unavailable =
                            day < min || day > max || unavailableDate(props, dayIso)
                          const selected =
                            dayIso === value || dayIso === range?.start || dayIso === range?.end
                          const insideRange =
                            !!range?.end && dayIso > range.start && dayIso < range.end
                          const preview =
                            !!validPreview?.end &&
                            dayIso >= validPreview.start &&
                            dayIso <= validPreview.end
                          const reserved = booked.includes(dayIso)

                          return (
                            <td
                              key={dayIso}
                              role="gridcell"
                              aria-selected={selected || insideRange}
                              data-in-range={insideRange ? '' : undefined}
                              data-range-edge={
                                range?.end && range.start !== range.end
                                  ? dayIso === range.start
                                    ? 'start'
                                    : dayIso === range.end
                                      ? 'end'
                                      : undefined
                                  : preview &&
                                      validPreview &&
                                      validPreview.start !== validPreview.end
                                    ? dayIso === validPreview.start
                                      ? 'start'
                                      : dayIso === validPreview.end
                                        ? 'end'
                                        : undefined
                                    : undefined
                              }
                              data-preview={preview ? '' : undefined}
                            >
                              <button
                                type="button"
                                class="rf-calendar-day"
                                tabIndex={dayIso === iso(displayedDate) && !outside ? 0 : -1}
                                aria-label={dayLabel.format(day) + (reserved ? ', booked' : '')}
                                aria-current={dayIso === todayIso ? 'date' : undefined}
                                aria-disabled={unavailable ? 'true' : undefined}
                                data-selected={selected ? '' : undefined}
                                data-outside={outside ? '' : undefined}
                                data-booked={reserved ? '' : undefined}
                                data-rf-selected={
                                  preview && dayIso === hovered && dayIso !== range?.start
                                    ? ''
                                    : undefined
                                }
                                data-rf-day={dayIso}
                                data-rf-hover-item
                                mix={[
                                  on('click', () => {
                                    if (unavailable) return
                                    if (outside) showMonth(monthStart(day))
                                    focused = day
                                    selectDay(dayIso)
                                  }),
                                  on('keydown', (event) => onDayKey(event, day)),
                                  on('pointerenter', (event) => {
                                    if (
                                      !range?.start ||
                                      range.end ||
                                      unavailable ||
                                      event.pointerType === 'touch'
                                    )
                                      return
                                    hovered = dayIso
                                    void handle.update()
                                  }),
                                  on('focus', () => {
                                    if (!outside && focused.getTime() !== day.getTime()) {
                                      focused = day
                                      if (range?.start && !range.end && !unavailable)
                                        hovered = dayIso
                                      void handle.update()
                                    }
                                  }),
                                ]}
                              >
                                {day.getUTCDate()}
                                {dayDetail && (
                                  <span class="rf-calendar-detail">{dayDetail(dayIso)}</span>
                                )}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
        {mode === 'range' && (
          <div class="rf-calendar-status" aria-live="polite">
            {range?.start && !range.end ? 'Choose an end date' : 'Choose a date range'}
          </div>
        )}
        {name && <DateInputs name={name} value={current} mode={mode} />}
      </section>
    )
  }
}

function formatPickerDate(date: Date, withWeekday: boolean, withYear: boolean) {
  return new Intl.DateTimeFormat('en', {
    weekday: withWeekday ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
    year: withYear ? 'numeric' : undefined,
    timeZone: 'UTC',
  })
    .format(date)
    .replace(/^(\w{3}), /, '$1 ')
}

const sizerWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const sizerMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

// Every candidate of a segment stacked in one grid cell: the widest sets the
// width, so the trigger does not resize while the picked day changes.
function Stack(handle: Handle<{ items: readonly string[] }>) {
  return () => (
    <span class="rf-date-stack">
      {handle.props.items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </span>
  )
}

function CaptionSizer(
  handle: Handle<{ mode?: 'single' | 'range'; withYear: boolean; placeholder: string }>,
) {
  return () => {
    const { mode, withYear, placeholder } = handle.props
    return (
      <span class="rf-date-sizer" aria-hidden="true">
        {!withYear &&
          (mode === 'range' ? (
            <span>
              <Stack items={sizerMonths} /> 28 → <Stack items={sizerMonths} /> 28
            </span>
          ) : (
            <span>
              <Stack items={sizerWeekdays} /> <Stack items={sizerMonths} /> 28
            </span>
          ))}
        <span>{placeholder}</span>
      </span>
    )
  }
}

// "1h 45min" between two HH:mm times on the same day; nothing when the end is not after the start.
function formatDuration(start: string, end: string) {
  const minutes = (value: string) => {
    const [hours, rest] = value.split(':').map(Number)
    return hours * 60 + rest
  }
  const total = minutes(end) - minutes(start)
  if (!Number.isFinite(total) || total <= 0) return ''
  const hours = Math.floor(total / 60)
  const rest = total % 60
  return [hours ? `${hours}h` : '', rest ? `${rest}min` : ''].filter(Boolean).join(' ')
}

function sameValue(a: DateValue | undefined, b: DateValue) {
  if (typeof a === 'object' && a && typeof b === 'object' && b)
    return a.start === b.start && a.end === b.end
  return a === b
}

export function DatePicker(handle: Handle<DatePickerProps>) {
  const hover = fluidHover({ axis: 'x' })
  const initialDay = today()
  let mounted = false
  let localTime = handle.props.defaultTime ?? '09:00'
  let localEndTime = handle.props.defaultEndTime ?? '17:00'
  let calendarKey = 0
  let trigger: HTMLButtonElement | undefined
  const triggerRef = ref((node) => {
    if (node instanceof HTMLButtonElement) trigger = node
    if (mounted) return
    mounted = true
    if (
      !parse(handle.props.today) &&
      today('local').getUTCFullYear() !== initialDay.getUTCFullYear()
    ) {
      void handle.update()
    }
  })
  let selection = handle.props.defaultValue ?? null
  let open = false

  function changeOpen(next: boolean) {
    open = next
    void handle.update()
  }

  return () => {
    const {
      label = 'Choose a date',
      placeholder = handle.props.mode === 'range' ? 'Pick dates' : 'Pick a date',
      disabled,
      closeOnSelect = true,
      clearable = false,
      size,
      variant = 'outline',
      name,
      time = false,
      timeRange = false,
      timeValue,
      onTimeChange,
      endTimeValue,
      onEndTimeChange,
      presets,
      step,
      hourCycle,
      locale,
      ...calendar
    } = handle.props
    const selectedTime = timeValue ?? localTime
    const selectedEndTime = endTimeValue ?? localEndTime
    const value = calendar.value === undefined ? selection : calendar.value
    const start = parse(typeof value === 'string' ? value : value?.start)
    const end = parse(typeof value === 'object' ? value?.end : undefined)
    const year = (parse(calendar.today) ?? (mounted ? today('local') : initialDay)).getUTCFullYear()
    const withYear =
      (start !== null && start.getUTCFullYear() !== year) ||
      (end !== null && end.getUTCFullYear() !== year)
    const dateCaption = start
      ? calendar.mode === 'range'
        ? `${formatPickerDate(start, false, withYear)} →${end ? ` ${formatPickerDate(end, false, withYear)}` : ''}`
        : formatPickerDate(start, true, withYear)
      : placeholder
    const caption = dateCaption

    const duration = timeRange ? formatDuration(selectedTime, selectedEndTime) : ''

    function updateTime(which: 'start' | 'end', next: string) {
      if (!next) return
      if (which === 'start') {
        if (timeRange) {
          const duration = Math.max(
            0,
            (parseTime(selectedEndTime) ?? 0) - (parseTime(selectedTime) ?? 0),
          )
          const shifted = serializeTime(Math.min(1439, (parseTime(next) ?? 0) + duration))
          if (endTimeValue === undefined) localEndTime = shifted
          onEndTimeChange?.(shifted)
        }
        if (timeValue === undefined) localTime = next
        onTimeChange?.(next)
      } else {
        if (endTimeValue === undefined) localEndTime = next
        onEndTimeChange?.(next)
      }
      void handle.update()
    }

    // A preset sets the range and leaves the popup open.
    function applyDate(next: DateValue) {
      if (calendar.value === undefined) selection = next
      handle.props.onValueChange?.(next)
      void handle.update()
    }

    function changeDate(next: DateValue) {
      if (calendar.value === undefined) selection = next
      handle.props.onValueChange?.(next)
      if (closeOnSelect && (typeof next === 'string' || next?.end)) changeOpen(false)
      else void handle.update()
    }

    return (
      <div
        class="rf-date-picker"
        data-density={size}
        data-variant={variant}
        mix={[
          hover,
          ref((element, signal) => {
            element.closest('form')?.addEventListener(
              'reset',
              (event) =>
                queueMicrotask(() => {
                  if (signal.aborted || event.defaultPrevented) return
                  selection = handle.props.defaultValue ?? null
                  localTime = handle.props.defaultTime ?? '09:00'
                  localEndTime = handle.props.defaultEndTime ?? '17:00'
                  calendarKey++
                  changeOpen(false)
                }),
              { signal },
            )
          }),
        ]}
      >
        <span class="rf-highlight rf-date-hover" aria-hidden="true" data-rf-hover-layer />
        <popover.Context>
          <button
            type="button"
            class="rf-date-trigger"
            disabled={disabled}
            aria-label={`${label}: ${caption}`}
            aria-haspopup="dialog"
            aria-expanded={open ? 'true' : 'false'}
            aria-controls={`${handle.id}-picker`}
            data-placeholder={start ? undefined : ''}
            data-rf-hover-item
            mix={[
              triggerRef,
              popover.anchor({ placement: 'bottom-start', offset: 6 }),
              popover.focusOnHide(),
              on('click', () => changeOpen(!open)),
            ]}
          >
            {variant === 'outline' && <Icon name="calendar" />}
            <span class="rf-date-caption">
              <span>{caption}</span>
              <CaptionSizer mode={calendar.mode} withYear={withYear} placeholder={placeholder} />
            </span>
          </button>
          <div
            class="rf-menu-surface rf-date-surface"
            data-side-presets={(calendar.mode === 'range' && !!presets?.length) || undefined}
            role="dialog"
            aria-label={label}
            id={`${handle.id}-picker`}
            mix={[
              popover.surface({
                open,
                closeOnAnchorClick: false,
                onHide: () => changeOpen(false),
              }),
              on('toggle', (event) => {
                if (event.newState === 'open') {
                  event.currentTarget
                    .querySelector<HTMLElement>('[data-rf-day][tabindex="0"]')
                    ?.focus()
                }
              }),
            ]}
          >
            <div class="rf-date-body">
              {presets && (
                <div class="rf-date-preset-column">
                  <div
                    class="rf-date-presets"
                    role="group"
                    aria-label="Date presets"
                    mix={fluidHover({ axis: 'y' })}
                  >
                    <span
                      class="rf-highlight rf-date-preset-hover"
                      aria-hidden="true"
                      data-rf-hover-layer
                    />
                    {presets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        data-rf-hover-item
                        aria-pressed={sameValue(value, preset.value) ? 'true' : 'false'}
                        mix={on('click', () => {
                          calendarKey++
                          applyDate(preset.value)
                        })}
                      >
                        <span class="rf-date-preset-label">
                          <span>{preset.label}</span>
                          <span aria-hidden="true">{preset.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div class="rf-date-main">
                <Calendar
                  key={calendarKey}
                  {...calendar}
                  label={label}
                  value={value}
                  onValueChange={changeDate}
                />
              </div>
            </div>
          </div>
        </popover.Context>
        {clearable && start && (
          <button
            type="button"
            class="rf-date-clear"
            aria-label="Clear date"
            disabled={disabled}
            data-rf-hover-item
            mix={on('click', () => {
              trigger?.focus()
              calendarKey++
              changeOpen(false)
              applyDate(null)
            })}
          >
            <Icon name="x" />
          </button>
        )}
        {(time || timeRange) && (
          <div
            class="rf-date-inline-times"
            role="group"
            aria-label={timeRange ? 'Time range' : 'Time'}
          >
            <span class="rf-date-divider" aria-hidden="true" />
            <TimeField
              label={timeRange ? 'Start time' : 'Time'}
              value={selectedTime}
              onChange={(next) => updateTime('start', next)}
              disabled={disabled}
              step={step}
              hourCycle={hourCycle}
              locale={locale}
            />
            {timeRange && (
              <TimeField
                label="End time"
                value={selectedEndTime}
                after={selectedTime}
                onChange={(next) => updateTime('end', next)}
                disabled={disabled}
                step={step}
                hourCycle={hourCycle}
                locale={locale}
                duration={duration}
                end
              />
            )}
          </div>
        )}
        {name && (time || timeRange) && (
          <>
            <input type="hidden" name={`${name}.time`} value={selectedTime} disabled={disabled} />
            {(calendar.mode === 'range' || timeRange) && (
              <input
                type="hidden"
                name={`${name}.endTime`}
                value={selectedEndTime}
                disabled={disabled}
              />
            )}
          </>
        )}
        {name && <DateInputs name={name} value={value} mode={calendar.mode} disabled={disabled} />}
      </div>
    )
  }
}

function DateInputs(
  handle: Handle<{
    name: string
    value: DateValue
    mode?: 'single' | 'range'
    disabled?: boolean
  }>,
) {
  return () => {
    const { name, value, mode, disabled } = handle.props
    if (mode === 'range') {
      const range = typeof value === 'object' ? value : null
      return (
        <>
          <input
            type="hidden"
            name={`${name}.start`}
            value={range?.start ?? ''}
            disabled={disabled}
          />
          <input type="hidden" name={`${name}.end`} value={range?.end ?? ''} disabled={disabled} />
        </>
      )
    }
    return (
      <input
        type="hidden"
        name={name}
        value={typeof value === 'string' ? value : ''}
        disabled={disabled}
      />
    )
  }
}

function DateArrow(handle: Handle<{ direction: 'left' | 'right' }>) {
  return () => (
    <Icon name={handle.props.direction === 'left' ? 'chevron-left' : 'chevron-right'} size={14} />
  )
}
