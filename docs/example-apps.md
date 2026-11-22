# Example apps

The Apps section demonstrates a complete task with seeded data. Each workspace has a URL under `/apps`, uses the rounded radius preset, and provides a link back to the app directory. Other appearance settings follow the visitor's showcase preferences.

| Workspace | First workflow |
| --- | --- |
| `/apps/issues` | Filter cycle issues by status or assignee, switch between board and list, and move a selection together. |
| `/apps/chat` | Start a conversation, choose a slash skill, stop a simulated reply, and return to the draft using Back or a saved conversation URL. |
| `/apps/calendar` | Create a timed event in a week, move it to another day, and change its duration using pointer or keyboard. Show overlapping events in one timezone. |
| `/apps/analytics` | Follow the busiest day to its chart, open the events behind the spike, inspect a payload, and reopen the filtered log from its URL. |

Each app owns its entry, fixtures and stylesheet in `apps/web/app/public/apps/<slug>/`. Register the app in the directory with its name, description and workspace renderer. The server passes the request query string to `render(search)`. Use a Remix client entry for interactive content and pass serializable props across that boundary.

Cover each workflow in `apps/web/test/app-<slug>.test.e2e.ts`. Put app-specific controls beside their first use. Coordinate public Reflow API changes with the other apps and give each shared change one owner, a design note, and focused tests.

In Chat, a new message anchors near the top of the transcript as its reply streams. The `/proof` skill offers to append its completed checklist to the current draft. Approving preserves existing draft text. Skipping keeps the draft as written. Both answers are saved with the conversation.

Analytics shows daily activity as a stacked chart of studio edits and media imports. The event log keeps the Event column visible on narrow screens. Its request URL controls server filtering, sorting and pagination, with six records per page.

## Moving issues between statuses

In board or list view, drag a ticket onto a visible status group. The whole group accepts a drop, including its empty state. Dragging a selected ticket moves the selection together. Dragging an unselected ticket moves that ticket and preserves any other selection. Releasing outside a valid target cancels the move.

The **Move to** menu uses the same operation. Tap a ticket to select it and open the menu, or press Space to select, Tab to reach the actions, and Enter to open the menu. Each move updates cycle progress and assignee workload, announces the destination, and continues keyboard navigation at the next stationary ticket.

Use **Undo** after a move to return each affected ticket to its previous status. This works for a selection spanning several groups and for moves made from the context menu. On narrow screens, **Cycle overview** opens the progress and workload filters above the tickets.

The Issue tracker registers Atlassian’s element adapter when its rows and groups mount and releases each registration on unmount. The adapter loads with the Issue tracker. Its production chunk measured 24.2 kB minified or 7.8 kB gzipped. The source-mode asset server bundles the same adapter into an ES module for the browser. [Pragmatic drag and drop](https://atlassian.design/components/pragmatic-drag-and-drop/core-package) · [Atlassian accessibility guidance](https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines)

Calendar uses TimeGrid with fifteen-minute increments. The app supplies the week, event data and editor. The grid handles overlap, pointer previews and keyboard changes. The editor's **All day** option replaces the times with a number of days, and a timed event may run up to 24 hours, continuing past midnight into the next day. [TimeGrid design note](time-grid.md)

## App polish and acceptance checks

| App | Change | How to judge it |
| --- | --- | --- |
| Chat | Each conversation has a `?thread=` URL. Drafts and local transcripts live in the browser profile where they were written. | Type in one conversation, open another, press Back, then refresh. The original conversation opens with the draft intact and the caret ready to type. |
| Issues | The cycle summary starts collapsed on phones. Undo reverses the latest move in board or list view. | Open the board on a phone and find a ticket without scrolling. Move two tickets from different statuses together. Undo restores each to its own status. |
| Calendar | Moving or resizing an event shows its proposed day and time range beside the pointer. Accepted changes are saved in this browser. Undo restores the previous slot. | Drag across a day boundary and read the destination time before releasing. Escape leaves the original event in place. Undo reverses a drop, and refreshing preserves an accepted edit. |
| Analytics | The chart counts events by source for the selected dates. Each leading source links to its rows, keeping the date range and sort in the URL. | Select October 14 and follow **media imports** in the chart’s explanation. The log contains 19 of the day’s 24 events. Inspect a payload and close it with focus back on the same row. |

Run each workflow with a keyboard and on a physical phone. Repeat with reduced motion enabled, and try Back, refresh, and cancellation halfway through the task.
