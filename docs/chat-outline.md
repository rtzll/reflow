# ChatOutline

A long conversation is hard to find your way back through: the reader remembers what they asked, not how far up it was. ChatOutline lists the messages the reader sent and jumps to one, and it marks the one currently in view.

## API

```tsx
<ChatLayout
  header={<ChatOutline items={messages.filter((m) => m.role === 'user').map((m) => ({ id: m.id, label: m.text }))} />}
  composer={<InputMessage … />}
>
  {messages.map((m) => <ChatMessage id={m.id} role={m.role}>{m.text}</ChatMessage>)}
</ChatLayout>
```

- `items` lists the turns to show, oldest first, each with the `id` of its message element and a `label`. The app passes them because it already knows its messages, so the outline renders on the server and does not read the transcript's markup. Usually these are the reader's own messages; an app can add others, such as a long reply's headings.
- ChatMessage takes an `id`, which it puts on its element.
- `label` names the menu and its trigger. Default "Conversation outline".
- `size` and `align` pass to the Dropdown.

With no items, nothing renders.

## Behavior

The outline is a Dropdown behind an icon button, so it gets Dropdown's keyboard, typeahead, focus return and touch behavior. Each turn is a radio row, and the row whose message is in view is checked. A label longer than its row is cut and named in full on hover, as Dropdown already does. Past eight turns the menu gains Dropdown's search field.

Choosing a turn scrolls its message to the top of the transcript with 16 pixels of space above it, then moves focus to the message, so a keyboard or screen reader user continues reading from there. ChatLayout treats the jump like a manual scroll: it stops following the end and shows its button back to the newest message.

The turn in view is the last one whose top has passed a line a third of the way down the transcript. It updates as the transcript scrolls, and is the first turn when none has passed the line.

## Motion

The scroll is smooth, and instant with reduced motion. The menu keeps Dropdown's motion.

## Reused pieces

Dropdown for the menu, its radio rows and search; the `list` icon; ChatLayout's scroll container and its letting go on a manual scroll.

## Rail

`variant="rail"` draws the outline beside the transcript instead of behind a button: a short tick per turn in a labelled navigation list, with the turn in view longer and in the foreground colour. Hovering or focusing a tick shows a preview to its right, the turn's label and, when the item has one, a `preview` line such as the start of the reply. Each tick is a 24 by 12 pixel target. The tick in view carries `aria-current="location"`.

Choosing a tick scrolls as the menu does but keeps focus on the rail, so a reader can step through turns: Up and Down move between ticks, Home and End reach the ends. The rail suits wide layouts with room beside the transcript; the menu suits narrow ones, and an app can show one or the other by width.

## Verification

Browser tests cover the rail's ticks, its marked turn, jumping without moving focus and its arrow keys; and for the menu, rendering nothing without items, the rows and the checked turn, the checked turn following the scroll, choosing a turn scrolling its message into place and focusing it, and the search field past eight turns.
