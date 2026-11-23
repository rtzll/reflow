# TaskList

An assistant working through a plan should show where it is: what is done, what it is doing now and what is left. TaskList is that read-only progress list.

## API

```tsx
<TaskList
  label="Plan"
  tasks={[
    { id: 'outline', label: 'Outline the story', status: 'done' },
    { id: 'draft', label: 'Draft the opening', status: 'active' },
    { id: 'proof', label: 'Proof the captions' },
  ]}
/>
```

- `tasks` lists the steps in order, each with an `id`, a `label` and a `status` of `pending` (the default), `active` or `done`.
- `label` names the list. Default "Tasks".
- `progress` shows a count above the list, such as "1 of 3 done". Off by default.

## Behavior

Each step has a mark: an empty ring while pending, a Spinner while active, and a filled circle with a check once done. Done steps fade to the muted colour; the active step is in the foreground. Each step's status is also written for assistive technology, and a polite status region names the active step as it changes, so the list can follow work without being read again.

The list is an ordered list named by `label`. It has nothing interactive; an app that lets people act on a step puts the controls beside it.

## Motion

When a step finishes, its check draws on, as Dropdown's checked rows do, and the circle fills. With reduced motion the step changes at once.

## Reused pieces

Spinner for the active step; the check's draw from Dropdown's checked rows.

## Verification

Browser tests cover the marks and written status for each state, the default and custom label, the progress count, and the status region naming the active step.
