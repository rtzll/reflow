import { Icon } from './icon.tsx'
import { TimeField, parseTime, timeValue as serializeTime } from './time-field.tsx'
import { on, ref } from 'remix/component'
import type { Handle } from 'remix/component'
import * as popover from '@remix-run/ui/popover'
import { fluidHover } from './systems/fluid-hover.ts'
import { onFormReset } from './behaviors/form-reset.ts'
import {
  type DateValue,
  type CalendarProps,
  parse,
  today,
  Calendar,
  DateInputs,
} from './calendar.tsx'

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
          onFormReset(() => {
            selection = handle.props.defaultValue ?? null
            localTime = handle.props.defaultTime ?? '09:00'
            localEndTime = handle.props.defaultEndTime ?? '17:00'
            calendarKey++
            changeOpen(false)
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
