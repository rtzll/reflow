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

## Proposed first drag-and-drop trial

Try Atlassian’s **Pragmatic drag and drop** in the Issue tracker. Start by moving one issue from Todo to In progress, including when the destination column is empty. Linear uses status columns and lets people work with the same issues in either board or list view. That gives the trial a concrete comparison. [Linear board layouts](https://linear.app/docs/board-layout)

Use the element adapter for draggable cards and drop targets. Register it when the board mounts and clean it up when the board leaves the page. A successful drop should call the same move operation as the **Move to** menu, announce the new status, update the dashboard counts, and return focus to a predictable card. Keep the menu available by tap and keyboard. This also gives people who cannot hold and drag the pointer a way to complete the task. [Core package](https://atlassian.design/components/pragmatic-drag-and-drop/core-package) · [Atlassian accessibility guidance](https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines) · [WCAG dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)

Writing the board gesture ourselves would give us control over touch activation, but would also make Reflow responsible for hit testing, cancellation and scrolling across columns. Keep the trial dependency in the example app. Check the added client bytes, navigation cleanup, scrolling on a phone, cancellation, empty columns and focus after moving the last card. A second consumer would justify an optional adapter under the library’s [dependency policy](scope.md#dependency-policy).

Calendar already measures movement in fifteen-minute intervals, resizes events and offers a keyboard and form equivalent. Its pointer implementation fits that continuous gesture. Leave calendar resizing in place while evaluating discrete card transfers.
