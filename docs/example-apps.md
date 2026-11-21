# Example apps

The Apps section demonstrates a complete task with seeded data. Each workspace has a URL under `/apps`, uses the rounded radius preset, and provides a link back to the app directory. Other appearance settings follow the visitor's showcase preferences.

| Workspace | First workflow |
| --- | --- |
| `/apps/issues` | Filter cycle issues by status or assignee, switch between board and list, and move a selection together. |
| `/apps/chat` | Start a conversation, choose a slash skill, stop a simulated reply, then switch conversations and return to an unfinished draft. |
| `/apps/calendar` | Create a timed event in a week, move it to another day, and change its duration using pointer or keyboard. Show overlapping events in one timezone. |
| `/apps/analytics` | Find a spike in the daily activity chart, inspect an event’s JSON payload, and reopen the filtered log from its URL. |

Each app owns its entry, fixtures and stylesheet in `apps/web/app/public/apps/<slug>/`. Register the app in the directory with its name, description and workspace renderer. The server passes the request query string to `render(search)`. Use a Remix client entry for interactive content and pass serializable props across that boundary.

Cover each workflow in `apps/web/test/app-<slug>.test.e2e.ts`. Put app-specific controls beside their first use. Coordinate public Reflow API changes with the other apps and give each shared change one owner, a design note, and focused tests.

## Moving issues between statuses

In board or list view, drag a ticket onto a visible status group. The whole group accepts a drop, including its empty state. Dragging a selected ticket moves the selection together. Dragging an unselected ticket moves that ticket and preserves any other selection. Releasing outside a valid target cancels the move.

The **Move to** menu uses the same operation. Tap a ticket to select it and open the menu, or press Space to select, Tab to reach the actions, and Enter to open the menu. Each move updates cycle progress and assignee workload, announces the destination, and continues keyboard navigation at the next stationary ticket.

The Issue tracker registers Atlassian’s element adapter when its rows and groups mount and releases each registration on unmount. The adapter loads with the Issue tracker. Its production chunk measured 24.2 kB minified or 7.8 kB gzipped. The source-mode asset server bundles the same adapter into an ES module for the browser. [Pragmatic drag and drop](https://atlassian.design/components/pragmatic-drag-and-drop/core-package) · [Atlassian accessibility guidance](https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines)

Calendar uses TimeGrid with fifteen-minute increments. The app supplies the week, event data and editor. The grid handles overlap, pointer previews and keyboard changes. [TimeGrid design note](time-grid.md)

## Next polish pass

Start with Chat. Its drafts already survive switching conversations, which makes losing a draft on refresh particularly surprising. Then address the first screen of Issues on a phone, followed by direct manipulation in Calendar and the path from a spike to an explanation in Analytics.

| App | Change | How to judge it |
| --- | --- | --- |
| Chat | Give each conversation a working URL and save unfinished drafts locally. | Type in one conversation, open another, press Back, then refresh. The original conversation opens with the draft intact, ready to send. |
| Issues | Collapse the cycle summary on narrow screens and offer Undo after a group move. At 390 × 844, the first ticket currently begins about 694 px down. | Open the board on a phone and find a ticket without scrolling past the dashboard. Move two tickets from different statuses together. Undo restores each to its own status. |
| Calendar | Show the proposed day and time beside the event while it moves or resizes. Save edits locally and offer Undo after dropping. | Drag across a day boundary and read the destination time before releasing. Escape leaves the original event in place. Undo reverses a drop, and refreshing preserves an accepted edit. |
| Analytics | Explain a spike using the event data and let the reader open the supporting rows in one action. Keep the chart range in the URL. | Select October 14. The chart explains that 19 of the 24 events were media imports. Open those 19 rows, inspect a payload, and close it with focus back on the same row. |

Run each workflow with a keyboard and on a physical phone. Repeat with reduced motion enabled, and try Back, refresh, and cancellation halfway through the task.
