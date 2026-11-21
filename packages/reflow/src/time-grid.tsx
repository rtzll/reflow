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
  return [Math.floor(minutes / 60), minutes % 60].map((n) => String(n).padStart(2, '0')).join(':')
}

// Events that overlap transitively share a width. Reuse a lane as soon as its
// previous event ends, including when an event starts at that exact minute.
function positionEvents<E extends TimeGridEvent>(events: readonly E[], dayCount: number) {
  const positioned: { event: E; lane: number; lanes: number }[] = []
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
}

export function TimeGrid<E extends TimeGridEvent>(handle: Handle<TimeGridProps<E>>) {
  let board: HTMLDivElement
  let gesture: Gesture<E> | undefined
  let cursor: TimeGridRange | undefined
  const helpId = handle.id + '-help'
  const boardRef = ref((node, signal) => {
    board = node as HTMLDivElement
    board.ownerDocument.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Escape' || (!gesture && !cursor)) return
        e.preventDefault()
        if (gesture && board.hasPointerCapture(gesture.pointer))
          board.releasePointerCapture(gesture.pointer)
        gesture = undefined
        cursor = undefined
        handle.update()
      },
      { signal },
    )
  })

  return () => {
    const {
      events,
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
    const first = clamp(
      handle.props.startMinute ??
        Math.floor(
          Math.min(540, (handle.props.endMinute ?? 1440) - 1, ...events.map((e) => e.start)) / 60,
        ) * 60,
      0,
      1439,
    )
    const last = clamp(
      handle.props.endMinute ??
        Math.ceil(Math.max(1020, ...events.map((e) => e.start + e.duration)) / 60) * 60,
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
    const described = [helpId, describedBy].filter(Boolean).join(' ')
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
      const end = Math.min(last, range.start + range.duration)
      return {
        '--day': range.day,
        '--lane': lane,
        '--lanes': lanes,
        top: `${(100 * (start - first)) / span}%`,
        height: `calc(${(100 * (end - start)) / span}% - 2px)`,
      }
    }

    function begin(e: PointerEvent, event?: E) {
      if (gesture || !days.length || !e.isPrimary || e.button !== 0) return
      if (event ? !onEventChange : !onCreate || e.target !== board) return
      const rect = board.getBoundingClientRect()
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
      }
      cursor = undefined
      board.setPointerCapture(e.pointerId)
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
        gesture.preview =
          mode === 'resize'
            ? {
                ...anchor,
                duration:
                  delta === 0
                    ? anchor.duration
                    : clamp(
                        anchor.duration + delta,
                        Math.min(step, last - anchor.start),
                        last - anchor.start,
                      ),
              }
            : {
                ...anchor,
                day: gesture.singleDay
                  ? anchor.day
                  : clamp(
                      anchor.day + Math.round((e.clientX - gesture.x) / gesture.dayWidth),
                      0,
                      days.length - 1,
                    ),
                start:
                  delta === 0 || anchor.duration > span
                    ? anchor.start
                    : clamp(anchor.start + delta, first, last - anchor.duration),
              }
      }
      return true
    }

    function finish(e: PointerEvent) {
      if (!gesture || e.pointerId !== gesture.pointer) return
      track(e)
      const { event, preview, anchor, mode, x, y } = gesture
      const dragged = Math.hypot(e.clientX - x, e.clientY - y) >= dragThreshold
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
      const min = event && handle.props.startMinute === undefined ? 0 : first
      const max = event && handle.props.endMinute === undefined ? 1440 : last
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          next.day = clamp(next.day + (e.key === 'ArrowRight' ? 1 : -1), 0, days.length - 1)
          if (!event && showsSingleDay(board)) next.day = compactDay
          break
        case 'ArrowDown':
        case 'ArrowUp': {
          const delta = e.key === 'ArrowDown' ? step : -step
          if (e.shiftKey)
            next.duration = clamp(
              next.duration + delta,
              Math.min(step, max - next.start),
              max - next.start,
            )
          else if (!event) {
            next.start = clamp(next.start + delta, min, first + (Math.ceil(span / step) - 1) * step)
            next.duration = Math.min(Math.max(step, next.duration), last - next.start)
          } else if (next.duration <= max - min)
            next.start = clamp(next.start + delta, min, max - next.duration)
          break
        }
        case 'Enter':
          e.preventDefault()
          cursor = undefined
          handle.update()
          onCreate?.(next)
          return
        default:
          return
      }
      e.preventDefault()
      if (event) {
        onEventChange?.({ ...event, ...next })
        handle.queueTask(() =>
          board.querySelector<HTMLButtonElement>(`[data-event="${CSS.escape(event.id)}"]`)?.focus(),
        )
      } else cursor = next
      handle.update()
    }

    return (
      <div
        class="rf-time-grid"
        data-compact={handle.props.compactDay !== undefined || undefined}
        style={{ '--day-count': Math.max(1, days.length), '--hours': span / 60 }}
      >
        <div class="rf-time-grid-times" aria-hidden="true">
          {hours.map((hour) => (
            <span key={hour}>{clock(hour)}</span>
          ))}
        </div>
        <div
          class="rf-time-grid-board"
          role="group"
          aria-label={handle.props.label}
          aria-describedby={described}
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
            displayed.filter(
              (e) => e.duration > 0 && e.start < last && e.start + e.duration > first,
            ),
            days.length,
          ).map(({ event, lane, lanes }) => {
            const label =
              getEventLabel?.(event) ??
              `${event.title}, ${days[event.day]}, ${clock(event.start)}–${clock(event.start + event.duration)}`
            return (
              <button
                key={event.id}
                type="button"
                class={classList('rf-time-grid-event', getEventClass?.(event))}
                data-event={event.id}
                data-visible={event.day === compactDay}
                data-short={event.duration <= 30}
                data-editable={!!onEventChange || undefined}
                aria-label={label}
                title={label}
                aria-pressed={
                  onSelect || selectedId !== undefined ? event.id === selectedId : undefined
                }
                aria-describedby={described}
                disabled={!onSelect && !onActivate && !onEventChange}
                style={placement(event, lane, lanes)}
                mix={[
                  on('pointerdown', (e) => begin(e, event)),
                  on('keydown', (e) => keydown(e, event)),
                  on('click', () => (onSelect ?? onActivate)?.(event)),
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
              {clock(gesture.preview.start + gesture.preview.duration)}
            </span>
          )}
          {selectedRange && (
            <div class="rf-time-grid-event rf-time-grid-range" style={placement(selectedRange)}>
              {clock(selectedRange.start)}–{clock(selectedRange.start + selectedRange.duration)}
            </div>
          )}
        </div>
        <span class="rf-time-grid-help" role="status">
          {cursor &&
            `${days[cursor.day]}, ${clock(cursor.start)}–${clock(cursor.start + cursor.duration)}`}
        </span>
        <span id={helpId} class="rf-time-grid-help">
          {onCreate &&
            'Focus the schedule and use arrows to choose a slot, Shift with Up or Down to change its duration, and Enter to create. '}
          {onEventChange && 'On an event, use arrows to move and Shift with Up or Down to resize. '}
          {onActivate && 'Press Enter on an event to open it.'}
        </span>
      </div>
    )
  }
}
