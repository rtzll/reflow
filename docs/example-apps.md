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

The calendar handles continuous pointer movement in fifteen-minute increments and offers keyboard and form controls for moving and resizing events.
