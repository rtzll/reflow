import { Button, Dialog } from '@rtzll/reflow'
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
    const [hour, minute] = String(data.get('start')).split(':').map(Number)
    const start = hour! * 60 + minute!
    const duration = Number(data.get('duration'))
    const day = Number(data.get('day'))
    const calendar = calendars.find((name) => name === data.get('calendar'))
    if (!title || start + duration > 1440) {
      const field = form.elements.namedItem(!title ? 'title' : 'duration') as HTMLInputElement
      field.setCustomValidity(
        !title ? 'Enter an event title.' : 'Choose a duration that ends by midnight.',
      )
      field.reportValidity()
      return
    }
    if (!calendar || !form.reportValidity()) return
    handle.props.save({ ...draft, title, start, duration, day, calendar })
  }

  return () => {
    const { draft, close } = handle.props
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
                const duration = e.currentTarget.elements.namedItem('duration') as HTMLInputElement
                duration.setCustomValidity('')
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
            <div class="week-form-pair">
              <label>
                Start (UTC)
                <input
                  name="start"
                  type="time"
                  required
                  step={900}
                  defaultValue={timeLabel(draft.start)}
                />
              </label>
              <label>
                Duration (minutes)
                <input
                  name="duration"
                  type="number"
                  required
                  min={15}
                  max={1440}
                  step={15}
                  defaultValue={draft.duration}
                />
              </label>
            </div>
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
