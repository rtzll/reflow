# TimeGrid

TimeGrid lays out timed appointments in one or more day columns. The studio booking example uses a single four-hour window and half-hour reservations. The Calendar workspace uses the same grid for a seven-day UTC schedule and its event editor. [Booking example](../apps/web/app/public/studio-bookings.tsx) (`/docs/time-grid`) · [Calendar workspace](../apps/web/app/public/apps/calendar/index.tsx) (`/apps/calendar`)

Each event has a unique ID, a title, a zero-based day index, a start in minutes since midnight, and a duration in minutes. Supply day names for accessible labels. The owner chooses the dates and timezone, renders column headers, and can add fields such as a room or calendar name. Events that intersect share lanes. One event ending as another begins leaves the next lane free.

The grid previews a pointer gesture locally. Releasing an event or using its arrow keys requests the updated record through `onEventChange`. Apply it to the controlled collection to accept the change. A drag on empty space calls `onCreate` with the day, start, and duration; a click without a drag creates nothing, so a stray click never books time. A click on an event calls `onSelect`, or `onActivate` when no `onSelect` is given. With both, a click selects and Enter activates, so give pointer users their own way to open the selection, as the Calendar's Edit event button does. The owner can check availability, append an event, or open an editor. Escape and canceled pointer input discard the preview. Native scrolling remains available on empty space on touchscreens.

`stepMinutes` accepts a positive integer and defaults to 15. New intervals snap relative to the visible start, with a shorter final interval when needed. Move and resize increments preserve the original offset of existing appointments. Explicit bounds constrain edits to the displayed window. Automatic bounds expand to include a time reached with the keyboard.

Tab to the schedule and use arrows to position a new slot. Shift with Up or Down changes its duration. Enter requests creation. On an event, Space selects, arrows move, Shift with Up or Down resizes, and Enter activates. Pass `compactDay` to show one day at widths up to 800px and provide a day picker in the owner.

Set `--rf-time-grid-hour-size` and `--rf-time-grid-gutter` to align a custom header. An event class returned by `getEventClass` can set `--rf-time-grid-event-color` and `--rf-time-grid-event-fill` for its category.
