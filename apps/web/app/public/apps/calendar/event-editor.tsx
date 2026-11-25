import { Button, Dialog, TimeField } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'
import { calendars, days, timeLabel, type WeekEvent } from './events.ts'

interface EditorProps {
  draft: WeekEvent | undefined
  save: (event: WeekEvent) => void
  close: () => void
}

export function EventEditor(handle: Handle<EditorProps>) {
  function submit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault()
    const draft = handle.props.draft
    if (!draft) return
    const form = e.currentTarget
    const data = new FormData(form)
    const title = String(data.get('title')).trim()
    const day = Number(data.get('day'))
    const calendar = calendars.find((name) => name === data.get('calendar'))
    if (!title) {
      const field = form.elements.namedItem('title') as HTMLInputElement
      field.setCustomValidity('Enter an event title.')
      field.reportValidity()
      return
    }
    if (!calendar || !form.reportValidity()) return
    if (allDay) {
      const { start: _start, duration: _duration, ...rest } = draft
      handle.props.save({
        ...rest,
        title,
        day,
        calendar,
        start: 0,
        duration: 0,
        allDay: true,
        span: Number(data.get('span')),
      })
      return
    }
    const [hour, minute] = String(data.get('start') || start)
      .split(':')
      .map(Number)
    // A timed event may run past midnight into the next day, up to 24 hours.
    const { allDay: _allDay, span: _span, ...timed } = draft
    handle.props.save({
      ...timed,
      title,
      day,
      calendar,
      start: hour! * 60 + minute!,
      duration: Number(data.get('duration')),
    })
  }
  // Whether the form edits an all-day event; set when it opens and by its checkbox.
  let allDay = false
  let start = '09:00'
  let editing: WeekEvent | undefined

  return () => {
    const { draft, close } = handle.props
    if (draft !== editing) {
      editing = draft
      allDay = !!draft?.allDay
      start = timeLabel(draft?.allDay ? 540 : (draft?.start ?? 540))
    }
    return (
      <Dialog
        open={!!draft}
        title={draft?.id ? 'Edit event' : 'New event'}
        onOpenChange={(open) => {
          if (!open) close()
        }}
      >
        {draft && (
          <form
            class="week-form"
            mix={[
              on('submit', submit),
              on('input', (e) => {
                if (e.target instanceof HTMLInputElement) e.target.setCustomValidity('')
              }),
            ]}
          >
            <label>
              Event title
              <input name="title" required maxlength={100} defaultValue={draft.title} autofocus />
            </label>
            <div class="week-form-field">
              <label for="week-day">Day</label>
              <select id="week-day" name="day" defaultValue={String(draft.day)}>
                {days.map((name, i) => (
                  <option key={name} value={String(i)}>
                    {name}, November {16 + i}
                  </option>
                ))}
              </select>
            </div>
            <label class="week-form-check">
              <input
                type="checkbox"
                name="allDay"
                checked={allDay}
                mix={on<HTMLInputElement, 'change'>('change', (e) => {
                  allDay = e.currentTarget.checked
                  void handle.update()
                })}
              />
              All day
            </label>
            {allDay ? (
              <label>
                Days
                <input
                  name="span"
                  type="number"
                  required
                  min={1}
                  max={7}
                  step={1}
                  defaultValue={draft.span ?? 1}
                />
              </label>
            ) : (
              <div class="week-form-pair">
                <div class="week-form-field">
                  <label for="week-start">Start (UTC)</label>
                  <TimeField
                    id="week-start"
                    name="start"
                    label="Start (UTC)"
                    hourCycle={24}
                    step={15}
                    required
                    value={start}
                    onValueChange={(next) => {
                      start = next
                      void handle.update()
                    }}
                  />
                </div>
                <label>
                  Duration (minutes)
                  <input
                    name="duration"
                    type="number"
                    required
                    min={15}
                    max={1440}
                    step={15}
                    defaultValue={draft.duration || 60}
                  />
                </label>
              </div>
            )}
            <div class="week-form-field">
              <label for="week-calendar">Calendar</label>
              <select id="week-calendar" name="calendar" defaultValue={draft.calendar}>
                {calendars.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </div>
            <div class="week-form-actions">
              <Button variant="secondary" mix={on('click', close)}>
                Cancel
              </Button>
              <Button type="submit">{draft.id ? 'Save changes' : 'Create event'}</Button>
            </div>
          </form>
        )}
      </Dialog>
    )
  }
}
