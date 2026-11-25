import { TimeField } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

function minutesOf(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function durationLabel(start: string, end: string) {
  const delta = Math.max(0, minutesOf(end) - minutesOf(start))
  const parts = [
    delta >= 60 ? `${Math.floor(delta / 60)}h` : '',
    delta % 60 ? `${delta % 60}min` : '',
  ].filter(Boolean)
  return parts.join(' ') || '0min'
}

/** The TimeField example: a linked start and end time pair with duration. */
export function TimeFieldExample(handle: Handle) {
  let start = '09:30'
  let end = '11:00'

  return () => (
    <div class="example-row">
      <TimeField
        label="Start time"
        value={start}
        onValueChange={(next) => {
          const span = Math.max(15, minutesOf(end) - minutesOf(start))
          start = next
          const shifted = Math.min(23 * 60 + 59, minutesOf(next) + span)
          end = `${String(Math.floor(shifted / 60)).padStart(2, '0')}:${String(shifted % 60).padStart(2, '0')}`
          handle.update()
        }}
      />
      <TimeField
        label="End time"
        value={end}
        after={start}
        duration={durationLabel(start, end)}
        end
        onValueChange={(next) => {
          end = next
          handle.update()
        }}
      />
    </div>
  )
}
