import { on, ref, type Handle } from 'remix/component'
import { classList } from './systems/styling.ts'

/** One column index and a same-day interval in whole wall-clock minutes. */
export interface TimeGridRange {
  day: number
  start: number
  duration: number
}
export interface TimeGridEvent extends TimeGridRange {
  id: string
  title: string
  /** Shows the event in the all-day strip; `start` and `duration` are ignored. */
  allDay?: boolean
  /** Consecutive days an all-day event covers. Default 1. */
  span?: number
}

export interface TimeGridProps<Event extends TimeGridEvent = TimeGridEvent> {
  label: string
  /** Accessible column names, in display order. The owner renders its own date headers. */
  days: readonly string[]
  events: readonly Event[]
  /** Inclusive start and exclusive end. Omitted bounds fit the events and include 09:00–17:00. */
  startMinute?: number
  endMinute?: number
  /** Positive whole minutes, measured from the start of the grid. Defaults to 15. */
  stepMinutes?: number
  /** When provided, show only this day at viewport widths up to 800px. */
  compactDay?: number
  selectedId?: string
  /** A click, Space, or the start of a drag on an event. */
  onSelect?: (event: Event) => void
  /**
   * Enter on an event. A click activates only when `onSelect` is omitted, so with both,
   * a click selects and the owner offers its own way to open the selection.
   */
  onActivate?: (event: Event) => void
  /** Apply the requested change in the owner to commit it. Extra event fields are preserved. */
  onEventChange?: (event: Event) => void
  /** A drag across open time, or Enter on the keyboard slot. A click alone creates nothing. */
  onCreate?: (range: TimeGridRange) => void
  getEventLabel?: (event: Event) => string
  getEventClass?: (event: Event) => string
  describedBy?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
// The stylesheet collapses a compact grid to the chosen day at narrow widths.
function showsSingleDay(board: HTMLElement) {
  return getComputedStyle(board).getPropertyValue('--visible-days').trim() === '1'
}
// Pointer travel below this is a click, not a drag.
const dragThreshold = 4
function clock(minutes: number) {
  const safe = Math.max(0, Math.round(minutes))
  return [Math.floor(safe / 60), safe % 60].map((n) => String(n).padStart(2, '0')).join(':')
}

function validMinute(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : undefined
}

// One column's part of a timed event: the whole event, or for an overnight event
// its part before midnight and the part that continues in the next column.
interface Piece<E> extends TimeGridRange {
  event: E
  continues: boolean
}

// Splits overnight events at midnight. The part after midnight goes to the next
// column, when there is one; on the last column the event stops at midnight.
function pieces<E extends TimeGridEvent>(events: readonly E[], dayCount: number) {
  const out: Piece<E>[] = []
  for (const event of events) {
    const end = event.start + event.duration
    out.push({
      event,
      day: event.day,
      start: event.start,
      duration: Math.min(end, 1440) - event.start,
      continues: false,
    })
    if (end > 1440 && event.day + 1 < dayCount)
      out.push({ event, day: event.day + 1, start: 0, duration: end - 1440, continues: true })
  }
  return out
}

// Rows for the all-day strip: each event takes the first row free across its days.
function stackAllDay<E extends TimeGridEvent>(events: readonly E[], dayCount: number) {
  const rows: boolean[][] = []
  return events
    .map((event) => ({ event, day: clamp(event.day, 0, Math.max(0, dayCount - 1)) }))
    .map(({ event, day }) => ({
      event,
      day,
      span: clamp(Math.trunc(event.span ?? 1) || 1, 1, dayCount - day),
    }))
    .sort((a, b) => a.day - b.day || b.span - a.span)
    .map((entry) => {
      let row = 0
      while (rows[row]?.slice(entry.day, entry.day + entry.span).some(Boolean)) row++
      rows[row] ??= []
      for (let day = entry.day; day < entry.day + entry.span; day++) rows[row]![day] = true
      return { ...entry, row }
    })
}

// Events that overlap transitively share a width. Reuse a lane as soon as its
// previous event ends, including when an event starts at that exact minute.
function positionEvents<P extends TimeGridRange>(events: readonly P[], dayCount: number) {
  const positioned: { event: P; lane: number; lanes: number }[] = []
  for (let day = 0; day < dayCount; day++) {
    const sorted = events.filter((event) => event.day === day).sort((a, b) => a.start - b.start)
    let groupStart = positioned.length
    let groupEnd = -1
    let laneEnds: number[] = []
    function finishGroup() {
      for (let i = groupStart; i < positioned.length; i++) positioned[i]!.lanes = laneEnds.length
    }
    for (const event of sorted) {
      if (event.start >= groupEnd) {
        finishGroup()
        groupStart = positioned.length
        laneEnds = []
      }
      let lane = laneEnds.findIndex((end) => end <= event.start)
      if (lane === -1) lane = laneEnds.length
      const end = event.start + event.duration
      laneEnds[lane] = end
      groupEnd = Math.max(groupEnd, end)
      positioned.push({ event, lane, lanes: 1 })
    }
    finishGroup()
  }
  return positioned
}

interface Gesture<E> {
  pointer: number
  mode: 'create' | 'move' | 'resize'
  event?: E
  anchor: TimeGridRange
  preview: TimeGridRange
  x: number
  y: number
  dayWidth: number
  readoutPoint?: { x: number; y: number }
  singleDay: boolean
  dragged: boolean
}

export function TimeGrid<E extends TimeGridEvent>(handle: Handle<TimeGridProps<E>>) {
  let board: HTMLDivElement
  let strip: HTMLDivElement | undefined
  let gesture: Gesture<E> | undefined
  // A pointer moving an all-day event by whole days.
  let dayDrag: { pointer: number; event: E; x: number; dayWidth: number; day: number } | undefined
  let cursor: TimeGridRange | undefined
  let statusMessage = ''
  let suppressClick = false
  const boardHelpId = handle.id + '-board-help'
  const eventHelpId = handle.id + '-event-help'
  const boardRef = ref((node, signal) => {
    board = node as HTMLDivElement
    board.ownerDocument.addEventListener(
      'keydown',
      (e) => {
        if (e.defaultPrevented || e.key !== 'Escape' || (!gesture && !cursor && !dayDrag)) return
        e.preventDefault()
        if (gesture) {
          if (gesture.event) suppressClick = true
          if (board.hasPointerCapture(gesture.pointer)) board.releasePointerCapture(gesture.pointer)
        }
        if (dayDrag) suppressClick = true
        dayDrag = undefined
        gesture = undefined
        cursor = undefined
        handle.update()
      },
      { signal },
    )
  })

  const stripRef = ref((node) => {
    strip = node as HTMLDivElement
  })

  return () => {
    const {
      events: allEvents,
      days,
      selectedId,
      onEventChange,
      onSelect,
      onActivate,
      onCreate,
      getEventLabel,
      getEventClass,
      describedBy,
    } = handle.props
    const events = allEvents.filter((event) => !event.allDay)
    const allDayEvents = allEvents.filter((event) => event.allDay)
    // An overnight event continues in the next column, when there is one.
    const overnight = (event: TimeGridRange) =>
      event.start + event.duration > 1440 && event.day + 1 < days.length
    const explicitStart = validMinute(handle.props.startMinute)
    const explicitEnd = validMinute(handle.props.endMinute)
    const first = clamp(
      explicitStart ??
        Math.floor(
          Math.min(
            540,
            (explicitEnd ?? 1440) - 1,
            ...events.map((e) => (overnight(e) ? 0 : e.start)),
          ) / 60,
        ) * 60,
      0,
      1439,
    )
    const last = clamp(
      explicitEnd ??
        Math.ceil(
          Math.max(1020, first + 1, ...events.map((e) => Math.min(1440, e.start + e.duration))) /
            60,
        ) * 60,
      first + 1,
      1440,
    )
    const span = last - first
    const requestedStep = handle.props.stepMinutes ?? 15
    const step = Math.min(
      span,
      Number.isSafeInteger(requestedStep) && requestedStep > 0 ? requestedStep : 15,
    )
    const hours = Array.from({ length: Math.ceil(span / 60) }, (_, i) => first + 60 * i)
    const compactDay = clamp(handle.props.compactDay ?? 0, 0, Math.max(0, days.length - 1))
    // How far an event on this day may end: past midnight into the next column
    // when the window reaches midnight and that column exists.
    const limit = (day: number, end = last) => (end === 1440 && day + 1 < days.length ? 2880 : end)
    function describe(event: E) {
      const custom = getEventLabel?.(event)
      if (custom) return custom
      if (event.allDay) {
        const span = clamp(
          Math.trunc(event.span ?? 1) || 1,
          1,
          Math.max(1, days.length - event.day),
        )
        return span > 1
          ? `${event.title}, ${days[event.day]} to ${days[event.day + span - 1]}, all day`
          : `${event.title}, ${days[event.day]}, all day`
      }
      const end = event.start + event.duration
      return overnight(event)
        ? `${event.title}, ${days[event.day]}, ${clock(event.start)}–${days[event.day + 1]}, ${clock(end - 1440)}`
        : `${event.title}, ${days[event.day]}, ${clock(event.start)}–${clock(Math.min(end, 1440))}`
    }
    if (cursor && (!onCreate || !days.length || cursor.day >= days.length)) cursor = undefined
    const hasBoardHelp = !!onCreate
    const hasEventHelp = !!onEventChange || !!onActivate
    const boardDescribed =
      [hasBoardHelp ? boardHelpId : '', describedBy].filter(Boolean).join(' ') || undefined
    const eventDescribed =
      [hasEventHelp ? eventHelpId : '', describedBy].filter(Boolean).join(' ') || undefined
    const selectedRange = gesture?.mode === 'create' ? gesture.preview : cursor
    const dragged = gesture?.event
    const displayed =
      dragged && gesture
        ? events.map((e) => (e.id === dragged.id ? { ...e, ...gesture!.preview } : e))
        : events

    const point = gesture?.readoutPoint
    if (point) {
      handle.queueTask(() => {
        const readout = board.querySelector<HTMLElement>('.rf-time-grid-readout')
        if (!readout) return
        // Keep the label outside the card, inside both the grid and the visible viewport.
        const rect = board.getBoundingClientRect()
        const { width, height } = readout.getBoundingClientRect()
        const left = Math.max(0, rect.left) + 4
        const right = Math.min(document.documentElement.clientWidth, rect.right) - 4
        const top = Math.max(0, rect.top) + 4
        const bottom = Math.min(document.documentElement.clientHeight, rect.bottom) - 4
        const x = clamp(point.x + 12, left, Math.max(left, right - width))
        const above = point.y - 12 - height
        const y = clamp(above >= top ? above : point.y + 12, top, Math.max(top, bottom - height))
        readout.style.left = x - rect.left + 'px'
        readout.style.top = y - rect.top + 'px'
      })
    }

    function placement(range: TimeGridRange, lane = 0, lanes = 1) {
      const start = Math.max(first, range.start)
      const end = Math.max(start, Math.min(last, range.start + range.duration))
      return {
        '--day': range.day,
        '--lane': lane,
        '--lanes': lanes,
        top: `${(100 * (start - first)) / span}%`,
        height: `calc(${(100 * (end - start)) / span}% - 2px)`,
      }
    }

    function begin(e: PointerEvent, event?: E) {
      suppressClick = false
      if (gesture || !days.length || !e.isPrimary || e.button !== 0) return
      if (event ? !onEventChange : !onCreate || e.target !== board) return
      const rect = board.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const singleDay = showsSingleDay(board)
      const dayWidth = rect.width / (singleDay ? 1 : days.length)
      const offset = clamp(((e.clientY - rect.top) / rect.height) * span, 0, span - 1)
      const slot = first + step * Math.floor(offset / step)
      const anchor: TimeGridRange = event
        ? { day: event.day, start: event.start, duration: event.duration }
        : {
            day: singleDay
              ? compactDay
              : clamp(Math.floor((e.clientX - rect.left) / dayWidth), 0, days.length - 1),
            start: slot,
            duration: Math.min(step, last - slot),
          }
      const resize = e.target instanceof Element && e.target.closest('.rf-time-grid-resize')
      gesture = {
        pointer: e.pointerId,
        mode: event ? (resize ? 'resize' : 'move') : 'create',
        event,
        anchor,
        preview: anchor,
        x: e.clientX,
        y: e.clientY,
        dayWidth,
        singleDay,
        dragged: false,
      }
      cursor = undefined
      try {
        board.setPointerCapture(e.pointerId)
      } catch {
        // Ignore synthetic or ended pointers that cannot be captured.
      }
      if (event) onSelect?.(event)
      handle.update()
    }

    function move(e: PointerEvent) {
      if (track(e)) handle.update()
    }

    // Update the gesture preview from the pointer; reports whether it applied.
    function track(e: PointerEvent) {
      if (e.pointerId !== gesture?.pointer || !gesture) return false
      const { anchor, mode } = gesture
      const rect = board.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return false
      if (
        !gesture.dragged &&
        Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) >= dragThreshold
      )
        gesture.dragged = true
      if (mode === 'create') {
        const offset = clamp(((e.clientY - rect.top) / rect.height) * span, 0, span)
        const lower = first + step * Math.floor(offset / step)
        const upper = Math.min(last, lower + step)
        const end = first + offset < (lower + upper) / 2 ? lower : upper
        gesture.preview = {
          day: anchor.day,
          start: Math.min(anchor.start, end),
          duration: end === anchor.start ? anchor.duration : Math.abs(end - anchor.start),
        }
      } else {
        if (
          gesture.readoutPoint ||
          Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) >= dragThreshold
        ) {
          gesture.readoutPoint = { x: e.clientX, y: e.clientY }
        }
        const delta = step * Math.round((((e.clientY - gesture.y) / rect.height) * span) / step)
        const reach = limit(anchor.day)
        const maxDuration = Math.min(1440, Math.max(anchor.duration, reach - anchor.start))
        const minDuration = Math.min(
          maxDuration,
          Math.max(
            Math.min(step, Math.max(1, last - anchor.start)),
            Math.max(0, first - anchor.start) + 1,
          ),
        )
        const day = gesture.singleDay
          ? anchor.day
          : clamp(
              anchor.day + Math.round((e.clientX - gesture.x) / gesture.dayWidth),
              0,
              days.length - 1,
            )
        gesture.preview =
          mode === 'resize'
            ? {
                ...anchor,
                duration:
                  delta === 0
                    ? anchor.duration
                    : delta > 0 && anchor.start + anchor.duration >= reach
                      ? anchor.duration
                      : clamp(
                          anchor.duration + delta,
                          minDuration,
                          Math.min(maxDuration, reach - anchor.start),
                        ),
              }
            : {
                ...anchor,
                day,
                start:
                  delta === 0 || anchor.duration > limit(day) - first
                    ? anchor.start
                    : clamp(
                        anchor.start + delta,
                        first,
                        Math.min(1439, limit(day) - anchor.duration),
                      ),
              }
      }
      return true
    }

    function finish(e: PointerEvent) {
      if (!gesture || e.pointerId !== gesture.pointer) return
      track(e)
      const { event, preview, anchor, mode, x, y } = gesture
      const dragged = gesture.dragged || Math.hypot(e.clientX - x, e.clientY - y) >= dragThreshold
      gesture = undefined
      handle.update()
      if (!event) {
        if (dragged) onCreate?.(preview)
      } else {
        const current = events.find((item) => item.id === event.id)
        if (!current) return
        if (
          preview.start !== anchor.start ||
          preview.day !== anchor.day ||
          preview.duration !== anchor.duration
        )
          onEventChange?.({ ...current, ...preview })
        else if (!onSelect && mode === 'move' && !dragged) onActivate?.(current)
      }
    }

    function cancel(e: PointerEvent) {
      if (gesture?.pointer !== e.pointerId) return
      gesture = undefined
      handle.update()
    }

    function keydown(e: KeyboardEvent, event?: E) {
      if (e.altKey || e.metaKey || e.ctrlKey || (!event && e.target !== board)) return
      if (e.key === 'Enter' && event) {
        if (onActivate) {
          e.preventDefault()
          onSelect?.(event)
          onActivate(event)
        }
        return
      }
      if (event ? !onEventChange : !onCreate || !days.length) return
      const next: TimeGridRange = {
        ...(event ?? cursor ?? { day: compactDay, start: first, duration: step }),
      }
      // A keyboard edit in an automatically fitted window may reveal another hour.
      const min = event && explicitStart === undefined ? 0 : first
      const max = event ? limit(next.day, explicitEnd === undefined ? 1440 : last) : last
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          next.day = showsSingleDay(board)
            ? event
              ? event.day
              : compactDay
            : clamp(next.day + (e.key === 'ArrowRight' ? 1 : -1), 0, days.length - 1)
          break
        case 'ArrowDown':
        case 'ArrowUp': {
          const delta = e.key === 'ArrowDown' ? step : -step
          if (e.shiftKey) {
            if (delta > 0 && next.start + next.duration >= max) break
            const maxDuration = Math.min(event ? 1440 : Infinity, Math.max(1, max - next.start))
            const minDuration = Math.min(
              maxDuration,
              Math.max(Math.min(step, maxDuration), Math.max(0, first - next.start) + 1),
            )
            next.duration = clamp(next.duration + delta, minDuration, maxDuration)
          } else if (!event) {
            next.start = clamp(next.start + delta, min, first + (Math.ceil(span / step) - 1) * step)
            next.duration = Math.min(Math.max(step, next.duration), last - next.start)
          } else if (next.duration <= max - min)
            next.start = clamp(next.start + delta, min, Math.min(1439, max - next.duration))
          break
        }
        case 'Enter':
          e.preventDefault()
          cursor = undefined
          statusMessage = ''
          handle.update()
          onCreate?.(next)
          return
        default:
          return
      }
      e.preventDefault()
      if (event) {
        if (
          next.day === event.day &&
          next.start === event.start &&
          next.duration === event.duration
        )
          return
        const updated = { ...event, ...next }
        statusMessage = describe(updated)
        onEventChange?.(updated)
        handle.queueTask(() =>
          board.querySelector<HTMLButtonElement>(`[data-event="${CSS.escape(event.id)}"]`)?.focus(),
        )
      } else {
        statusMessage = ''
        cursor = next
      }
      handle.update()
    }

    // The all-day strip, with a dragged event shown at its new day.
    const allDayStack = stackAllDay(
      allDayEvents.map((event) =>
        dayDrag && dayDrag.event.id === event.id ? { ...event, day: dayDrag.day } : event,
      ),
      days.length,
    )
    const allDayRows = allDayStack.reduce((rows, entry) => Math.max(rows, entry.row + 1), 0)

    function allDayKey(e: KeyboardEvent, event: E) {
      if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return
      if (e.key === 'Enter') {
        if (onActivate) {
          e.preventDefault()
          onSelect?.(event)
          onActivate(event)
        }
        return
      }
      if (!onEventChange || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
      e.preventDefault()
      if (showsSingleDay(board)) return
      const day = clamp(event.day + (e.key === 'ArrowRight' ? 1 : -1), 0, days.length - 1)
      if (day === event.day) return
      const updated = { ...event, day }
      statusMessage = describe(updated)
      onEventChange(updated)
      handle.queueTask(() =>
        strip?.querySelector<HTMLButtonElement>(`[data-event="${CSS.escape(event.id)}"]`)?.focus(),
      )
      handle.update()
    }

    function beginDay(e: PointerEvent, event: E) {
      suppressClick = false
      if (!onEventChange || !strip || dayDrag || !e.isPrimary || e.button !== 0) return
      const rect = strip.getBoundingClientRect()
      if (rect.width <= 0 || showsSingleDay(board)) return
      onSelect?.(event)
      dayDrag = {
        pointer: e.pointerId,
        event,
        x: e.clientX,
        dayWidth: rect.width / days.length,
        day: event.day,
      }
      try {
        strip.setPointerCapture(e.pointerId)
      } catch {
        // Ignore synthetic or ended pointers that cannot be captured.
      }
    }

    function dragDay(e: PointerEvent) {
      if (!dayDrag || e.pointerId !== dayDrag.pointer) return false
      // A span that runs past the last column is cut off there, as it is shown.
      dayDrag.day = clamp(
        dayDrag.event.day + Math.round((e.clientX - dayDrag.x) / dayDrag.dayWidth),
        0,
        days.length - 1,
      )
      return true
    }

    function moveDay(e: PointerEvent) {
      if (dragDay(e)) handle.update()
    }

    function finishDay(e: PointerEvent) {
      if (!dragDay(e) || !dayDrag) return
      const { event, day } = dayDrag
      dayDrag = undefined
      handle.update()
      if (day === event.day) return
      suppressClick = true
      const current = allEvents.find((item) => item.id === event.id)
      if (current) onEventChange?.({ ...current, day })
    }

    function cancelDay(e: PointerEvent) {
      if (dayDrag?.pointer !== e.pointerId) return
      dayDrag = undefined
      handle.update()
    }

    const rangeAnnouncement = cursor
      ? `${days[cursor.day]}, ${clock(cursor.start)}–${clock(cursor.start + cursor.duration)}`
      : statusMessage

    return (
      <div
        class="rf-time-grid"
        data-compact={handle.props.compactDay !== undefined || undefined}
        style={{ '--day-count': Math.max(1, days.length), '--hours': span / 60 }}
      >
        {allDayStack.length > 0 && [
          <span key="all-day-label" class="rf-time-grid-all-day-label" aria-hidden="true">
            All day
          </span>,
          <div
            key="all-day"
            class="rf-time-grid-all-day"
            role="group"
            aria-label={`${handle.props.label}, all day`}
            style={{ '--rows': allDayRows }}
            mix={[
              stripRef,
              on<HTMLDivElement, 'pointermove'>('pointermove', moveDay),
              on<HTMLDivElement, 'pointerup'>('pointerup', finishDay),
              on<HTMLDivElement, 'pointercancel'>('pointercancel', cancelDay),
            ]}
          >
            {allDayStack.map(({ event, day, span: days_, row }) => {
              const label = describe(event)
              return (
                <button
                  key={event.id}
                  type="button"
                  class={classList('rf-time-grid-event', getEventClass?.(event))}
                  data-event={event.id}
                  data-visible={compactDay >= day && compactDay < day + days_}
                  data-editable={!!onEventChange || undefined}
                  aria-label={label}
                  title={label}
                  aria-pressed={
                    onSelect || selectedId !== undefined ? event.id === selectedId : undefined
                  }
                  aria-describedby={eventDescribed}
                  disabled={!onSelect && !onActivate && !onEventChange}
                  style={{ '--day': day, '--span': days_, '--row': row }}
                  mix={[
                    on('pointerdown', (e) => beginDay(e, event)),
                    on('keydown', (e) => allDayKey(e, event)),
                    on('click', () => {
                      if (suppressClick) {
                        suppressClick = false
                        return
                      }
                      ;(onSelect ?? onActivate)?.(event)
                    }),
                  ]}
                >
                  <strong>{event.title}</strong>
                </button>
              )
            })}
          </div>,
        ]}
        <div class="rf-time-grid-times" aria-hidden="true">
          {hours.map((hour) => (
            <span key={hour}>{clock(hour)}</span>
          ))}
        </div>
        <div
          class="rf-time-grid-board"
          role="group"
          aria-label={handle.props.label}
          aria-describedby={boardDescribed}
          tabindex={onCreate && days.length ? 0 : undefined}
          data-create={!!onCreate || undefined}
          mix={[
            boardRef,
            on('pointerdown', (e) => begin(e)),
            on<HTMLDivElement, 'pointermove'>('pointermove', move),
            on<HTMLDivElement, 'pointerup'>('pointerup', finish),
            on<HTMLDivElement, 'pointercancel'>('pointercancel', cancel),
            on<HTMLDivElement, 'lostpointercapture'>('lostpointercapture', cancel),
            on('keydown', (e) => keydown(e)),
            on('blur', () => {
              if (cursor) {
                cursor = undefined
                handle.update()
              }
            }),
          ]}
        >
          {positionEvents(
            pieces(displayed, days.length).filter(
              (piece) =>
                piece.duration > 0 && piece.start < last && piece.start + piece.duration > first,
            ),
            days.length,
          ).map(({ event: piece, lane, lanes }) => {
            const { event } = piece
            const visibleDuration =
              Math.min(last, piece.start + piece.duration) - Math.max(first, piece.start)
            // The part after midnight belongs to the event's button: a pointer
            // can press or drag it, and assistive technology reads the button.
            if (piece.continues)
              return (
                <div
                  key={event.id + '-next'}
                  class={classList('rf-time-grid-event', getEventClass?.(event))}
                  data-continues={event.id}
                  data-visible={piece.day === compactDay}
                  data-short={visibleDuration <= 30}
                  data-editable={!!onEventChange || undefined}
                  data-pressed={event.id === selectedId || undefined}
                  aria-hidden="true"
                  style={placement(piece, lane, lanes)}
                  mix={[
                    on('pointerdown', (e) => begin(e, event)),
                    on('click', () => {
                      if (suppressClick) {
                        suppressClick = false
                        return
                      }
                      ;(onSelect ?? onActivate)?.(event)
                    }),
                  ]}
                >
                  <strong>{event.title}</strong>
                </div>
              )
            const label = describe(event)
            return (
              <button
                key={event.id}
                type="button"
                class={classList('rf-time-grid-event', getEventClass?.(event))}
                data-event={event.id}
                data-visible={event.day === compactDay}
                data-short={visibleDuration <= 30}
                data-editable={!!onEventChange || undefined}
                aria-label={label}
                title={label}
                aria-pressed={
                  onSelect || selectedId !== undefined ? event.id === selectedId : undefined
                }
                aria-describedby={eventDescribed}
                disabled={!onSelect && !onActivate && !onEventChange}
                data-overnight={overnight(event) || undefined}
                style={placement(piece, lane, lanes)}
                mix={[
                  on('pointerdown', (e) => begin(e, event)),
                  on('keydown', (e) => keydown(e, event)),
                  on('click', () => {
                    if (suppressClick) {
                      suppressClick = false
                      return
                    }
                    ;(onSelect ?? onActivate)?.(event)
                  }),
                ]}
              >
                <span class="rf-time-grid-time">{clock(event.start)}</span>
                <strong>{event.title}</strong>
                {onEventChange && (
                  <span
                    class="rf-time-grid-resize"
                    aria-hidden="true"
                    title="Drag to change duration"
                  />
                )}
              </button>
            )
          })}
          {point && gesture && (
            <span class="rf-time-grid-readout" aria-hidden="true">
              {days[gesture.preview.day]} · {clock(gesture.preview.start)}–
              {overnight(gesture.preview)
                ? `${days[gesture.preview.day + 1]} ${clock(gesture.preview.start + gesture.preview.duration - 1440)}`
                : clock(Math.min(1440, gesture.preview.start + gesture.preview.duration))}
            </span>
          )}
          {selectedRange && (
            <div
              class="rf-time-grid-event rf-time-grid-range"
              data-visible={selectedRange.day === compactDay}
              style={placement(selectedRange)}
            >
              {clock(selectedRange.start)}–{clock(selectedRange.start + selectedRange.duration)}
            </div>
          )}
        </div>
        <span class="rf-basic-sr-only" role="status">
          {rangeAnnouncement}
        </span>
        {hasBoardHelp && (
          <span id={boardHelpId} class="rf-basic-sr-only">
            Focus the schedule and use arrows to choose a slot, Shift with Up or Down to change its
            duration, and Enter to create.
          </span>
        )}
        {hasEventHelp && (
          <span id={eventHelpId} class="rf-basic-sr-only">
            {onEventChange &&
              'On an event, use arrows to move and Shift with Up or Down to resize. '}
            {onActivate && 'Press Enter on an event to open it.'}
          </span>
        )}
      </div>
    )
  }
}
