# Confirmation

An agent about to run a command, send a message or change a file should ask first. Confirmation is that question in a conversation: a title phrased so Approve and Deny answer it, an optional description of what approving does, and the two buttons. Once answered, the buttons give way to the answer in the same place, and the row keeps its height. It is built on Banner, so a question in a transcript reads like every other message the app raises.

```tsx
<Confirmation
  title="Run pnpm build?"
  description="Builds the library and the showcase into dist/."
  onApprove={() => run()}
  onDeny={() => skip()}
/>
```

Fluid Functionalism added a Confirmation of its own; this one follows its look and differs where noted below.

## API

- `title` and `description` take any content. The title is the question.
- `onApprove` and `onDeny` run when a button is pressed.
- `state` is `'requested'`, `'approved'` or `'denied'`, for an app that keeps the answer itself, such as one restoring a saved transcript. Without it, Confirmation keeps the answer: pressing a button calls the handler and then shows the answer. Upstream's version is controlled only, so an app that forgets to set the state there leaves the buttons on screen.
- `approveLabel`, `denyLabel`, `approvedLabel` and `deniedLabel` replace the default words: Approve, Deny, Approved and Denied.
- `icon` replaces Banner's status icon, to name the action, such as a terminal for a command. Banner's `status`, `contrast`, `size` and `class` pass through, so a risky action can ask with `status="warning"`.
- `name` adds a hidden input holding `approved` or `denied` once answered, so a Confirmation inside a form, as AskUserQuestions already does, submits its answer. Unanswered, the input is absent and a form that requires an answer can check for it.

## Behavior

- The banner is a group named by its title and described by its description, not a live region: a question waiting for an answer should not interrupt. The answer is the part that is announced, through a status region.
- Approve comes first in the tab order and is the primary button; Deny is a ghost button.
- When a button with focus disappears, focus moves to the answer, which can take focus but is not in the tab order, so keyboard users keep their place. Upstream drops focus to the page here.
- The answer fades and grows in from 96% on the fast spring; with reduced motion it only fades.
- Banner's dismiss button is not offered: a question is answered, not dismissed.

## Verification

Browser tests cover the group's name and description, the button order and variants, both answers in uncontrolled and controlled use, focus moving to the answer, the status announcement, the custom labels, and the form value. An end-to-end test checks that the row keeps its height when the answer lands.
