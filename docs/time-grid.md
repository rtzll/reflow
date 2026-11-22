# TimeGrid

TimeGrid lays out timed appointments in one or more day columns. The studio booking example uses a single four-hour window and half-hour reservations. The Calendar workspace uses the same grid for a seven-day UTC schedule and its event editor. [Booking example](../apps/web/app/public/studio-bookings.tsx) (`/docs/time-grid`) · [Calendar workspace](../apps/web/app/public/apps/calendar/index.tsx) (`/apps/calendar`)

Each event has a unique ID, a title, a zero-based day index, a start in minutes since midnight, and a duration in minutes. Supply day names for accessible labels. The owner chooses the dates and timezone, renders column headers, and can add fields such as a room or calendar name. Events that intersect share lanes. One event ending as another begins leaves the next lane free.

The grid previews a pointer gesture locally. Releasing an event or using its arrow keys requests the updated record through `onEventChange`. Apply it to the controlled collection to accept the change. A drag on empty space calls `onCreate` with the day, start, and duration; a click without a drag creates nothing, so a stray click never books time. A click on an event calls `onSelect`, or `onActivate` when no `onSelect` is given. With both, a click selects and Enter activates, so give pointer users their own way to open the selection, as the Calendar's Edit event button does. The owner can check availability, append an event, or open an editor. Escape and canceled pointer input discard the preview. Native scrolling remains available on empty space on touchscreens.

`stepMinutes` accepts a positive integer and defaults to 15. New intervals snap relative to the visible start, with a shorter final interval when needed. Move and resize increments preserve the original offset of existing appointments. Explicit bounds constrain edits to the displayed window. Automatic bounds expand to include a time reached with the keyboard.

Tab to the schedule and use arrows to position a new slot. Shift with Up or Down changes its duration. Enter requests creation. On an event, Space selects, arrows move, Shift with Up or Down resizes, and Enter activates. Pass `compactDay` to show one day at widths up to 800px and provide a day picker in the owner.

Set `--rf-time-grid-hour-size` and `--rf-time-grid-gutter` to align a custom header. An event class returned by `getEventClass` can set `--rf-time-grid-event-color` and `--rf-time-grid-event-fill` for its category.

## All-day events

A calendar also holds events with no time of day: a holiday, a deadline, a trip. Mark an event `allDay: true` and TimeGrid ignores its `start` and `duration` and shows it in a strip above the hours, in its day's column. `span` makes it cover several consecutive days, such as a three-day trip; it is cut off at the last column. Events that share a day stack in rows, and the strip grows to fit them. The strip is labelled "All day" in the time gutter and appears when it has an event or accepts new ones.

All-day events take the same callbacks as timed ones: a click or Space selects, Enter activates, and `getEventLabel` and `getEventClass` apply. With `onEventChange`, Left and Right Arrow move one by a day and a horizontal drag moves it by whole days; the request keeps `allDay`, `span` and every other field. The trailing handle and Shift with Left or Right Arrow adjust its span. The default label reads "Title, Monday, all day", or "Title, Monday to Wednesday, all day" for a span. With `compactDay`, the strip shows only the events that cover the chosen day.

### Creating and resizing all-day events

Pass `onCreateAllDay` to let a drag across empty space in the strip create one: it receives `{ day, span }` for the days covered, and a click alone creates nothing, as on the board. An empty strip provides one row to drag in. Once it contains events, a narrow space below the last row lets a drag start even when every day is occupied. A narrow single-day view creates nothing this way and keeps hiding an empty strip; keyboard users create all-day events through the app's own editor, as Calendar's New event does.

With `onEventChange`, an all-day event has a handle on its trailing edge: dragging it covers more or fewer days, and Shift with Right or Left Arrow does the same one day at a time. A span stays at least one day and stops at the last column. The request carries the new `span` and every other field.

## Overnight events

A timed event may run past midnight: `start + duration` greater than 1440, such as a night shift from 22:00 lasting 8 hours. It shows in its own day's column until 24:00 and continues in the next column from 00:00, with the continuation marked as such. Durations are limited to 24 hours, so an event touches at most two columns. On the last column the event is cut off at midnight.

In a week view the two segments share one keyboard stop. A pointer can select either segment. In a compact single-day view the event button follows the displayed day, so the continuation can be opened, moved or resized from the keyboard. The default label names both days: "Night shift, Monday, 22:00–Tuesday, 06:00". When the window fits itself to the events, a continuation counts too, so a grid with an overnight event shows the early hours.

Moving and resizing keep working across midnight wherever a next column exists: the end may move past 24:00, up to 24 hours after the start, and the request carries the new `start` and `duration` on the event's first day. Creating a new event from the board stays within one day.

## Verification

Browser tests cover the all-day strip's columns, spans and stacking, its keyboard and drag moves and labels, an overnight event's two parts and label, moving and resizing across midnight, the fitted window, and the cut-off on the last column. An end-to-end test checks the strip's layout and an overnight event in the TimeGrid docs' release week example. The Calendar workspace uses both: its seeded studio offsite is all-day, and its editor creates all-day events and timed ones up to 24 hours long. On a narrow screen the strip shows only when an all-day event covers the chosen day.
