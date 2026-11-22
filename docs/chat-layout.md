# ChatLayout scrolling

ChatLayout keeps a conversation's transcript at the newest message while a reply streams in, lets go when the reader scrolls back, and offers a button back to the newest message; sending a message of their own brings them back. This note adds two things: anchoring the reader's new message at the top while its reply grows, and keeping a streaming reply from being announced in pieces.

## Anchoring a new message

Followed to the end, a long reply pushes the question that started it off the top of the screen while the reader is still reading the first lines. Set `scroll="anchor"` and a message the reader sends glides to the top of the view instead, with 16 pixels of the previous message showing above it, and the reply grows below it without moving it. Once the reply fills the view, the transcript follows the end again as it does by default. `scroll="follow"` stays the default.

```tsx
<ChatLayout scroll="anchor" busy={streaming} composer={<InputMessage … />}>
  {messages}
</ChatLayout>
```

The reader's message is a ChatMessage with the user role added after the transcript first renders; messages present on load are history and do not anchor. A short reply does not leave enough content below the message to scroll it to the top, so ChatLayout adds empty space after the transcript. That space is exactly enough to make the anchored position the end of the transcript, so following the end holds the message in place, and it shrinks as the reply grows until nothing is left. The space never grows back on its own, so scrolling up and down stays stable.

Scrolling back by hand lets go, as it does now. The button back to the newest message returns to the end, which while the space remains is the anchored position. With reduced motion the message moves into place without the glide.

## Streaming announcements

The transcript is a log, which screen readers announce politely as messages arrive. A reply that streams in word by word would be announced in fragments. Pass `busy` while a reply streams; the transcript carries `aria-busy` and assistive technology reads the reply once it is complete.

## Verification

Browser tests cover the anchored position after a send, the reply growing without moving the message, the space shrinking to nothing and following taking over, history not anchoring, letting go on a manual scroll, and `aria-busy`. An end-to-end test checks the glide and the 16-pixel peek in the Chat workspace's layout with the stylesheet loaded.
