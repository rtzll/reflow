# Example apps

The Apps section demonstrates a complete task with seeded data. Each workspace has a URL under `/apps`, uses the rounded radius preset, and provides a link back to the app directory. Other appearance settings follow the visitor's showcase preferences.

| Workspace | First workflow |
| --- | --- |
| `/apps/issues` | Navigate issues by keyboard, select two in Todo, move both to In progress, and continue from a predictable focus target when Todo empties. |
| `/apps/chat` | Start a conversation, send a message, stop a simulated reply, then switch conversations and return to an unfinished draft. |
| `/apps/calendar` | Create a timed event in a week, move it to another day, and change its duration using pointer or keyboard. Show overlapping events in one timezone. |
| `/apps/analytics` | Find a spike in a daily activity chart, narrow the date range, inspect its events, and reopen the filtered view from its URL. |

Each app owns its entry, fixtures and stylesheet in `apps/web/app/public/apps/<slug>/`. Register the app in the directory with its name, description and workspace renderer. The server passes the request query string to `render(search)`. Use a Remix client entry for interactive content and pass serializable props across that boundary.

Cover each workflow in `apps/web/test/app-<slug>.test.e2e.ts`. Put app-specific controls beside their first use. Coordinate public Reflow API changes with the other apps and give each shared change one owner, a design note, and focused tests.
