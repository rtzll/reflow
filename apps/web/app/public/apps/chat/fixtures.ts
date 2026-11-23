import type { ConfirmationState } from '@rtzll/reflow'

export interface ChatEntry {
  role: 'user' | 'assistant'
  text: string
  /** Files sent with a message. Previews last for the session; names and types are kept. */
  attachments?: { name: string; type?: string; previewUrl?: string }[]
  stopped?: boolean
  proofChecklist?: ConfirmationState
}

export interface Conversation {
  id: string
  title: string
  messages: ChatEntry[]
}

export const conversations: Conversation[] = [
  {
    id: 'fieldnotes-cover',
    title: 'Fieldnotes cover',
    messages: [
      {
        role: 'user',
        text: 'We have two covers for the autumn issue. One is a wide view of the coast, the other a close crop of a hand holding a shell. Which opens the story?',
      },
      {
        role: 'assistant',
        text: '**Use the hand and shell.** It gives the reader a person to follow before they know the place. Save the coastline for the first spread, where it has room to stretch across both pages.',
      },
      { role: 'user', text: 'Where would you put the masthead?' },
      {
        role: 'assistant',
        text: '**Above the wrist**, in the quiet part of the frame. Print a proof at the final trim size and check that the lettering still has breathing room.',
      },
    ],
  },
  {
    id: 'photo-sequence',
    title: 'Photo essay sequence',
    messages: [
      {
        role: 'user',
        text: 'The essay follows a ferry from the first crossing to the last. Which photograph should close it?',
      },
      {
        role: 'assistant',
        text: `### The last crossing

Close with the **empty waiting room**. After a day among the passengers, the rows of seats can carry the ending on their own.

| Frame | Place in the sequence |
| --- | --- |
| Ferry doors | Open the crossing |
| Last passenger | Turn the page |
| Waiting room | Hold the final spread |`,
      },
    ],
  },
  {
    id: 'interview-notes',
    title: 'Interview notes',
    messages: [
      {
        role: 'user',
        text: 'Mara has kept the lighthouse log for thirty years. I want to start with a specific memory.',
      },
      {
        role: 'assistant',
        text: 'Ask her to open the log to a page she remembers writing. Let her read the entry aloud, then ask what was happening just outside the window.',
      },
    ],
  },
  {
    id: 'opening-paragraph',
    title: 'Opening paragraph',
    messages: [
      {
        role: 'user',
        text: 'The first paragraph of our ferry story feels slow. It starts with the history of the route.',
      },
      {
        role: 'assistant',
        text: 'Open with the first passenger stepping onto the deck. You can bring in the history once the reader has crossed the threshold with them.',
      },
    ],
  },
  {
    id: 'caption-edit',
    title: 'A shorter caption',
    messages: [
      { role: 'user', text: 'What should I keep in a caption for the waiting room photograph?' },
      {
        role: 'assistant',
        text: `Keep the **place and departure time**. The photograph already shows the empty seats. Set this line in the caption style named \`Photo note\`.

\`\`\`text
North landing · Last departure, 18:40
\`\`\``,
      },
    ],
  },
  {
    id: 'print-proof',
    title: 'Print proof checklist',
    messages: [
      {
        role: 'user',
        text: 'What should we check on the last proof before sending the issue to print?',
      },
      {
        role: 'assistant',
        text: `**Fold the proof** and read it as a reader would.

- Check the sequence and page numbers.
- Look for image crops or lettering lost in the fold.
- Match each caption to the photograph above it.`,
      },
    ],
  },
]

export function replyTo(text: string, files: readonly { name: string }[] = []) {
  if (files.length && !text.trim())
    return files.length === 1
      ? `Thanks, I have **${files[0].name}**. What would you like to do with it?`
      : `Thanks, I have **${files.length} files**. What would you like to do with them?`
  if (/\b(cover|masthead|type|layout)\b/i.test(text))
    return '**Print the two versions** at the size your reader will hold. Set them side by side and step back. Which one makes the subject clear first? Keep that version, then adjust the spacing around the title in small increments.'
  if (/\b(photo|photograph|sequence|essay)\b/i.test(text))
    return `### Sequence the photographs

Choose your **opening and closing frames** first. Lay them out as small prints, then try these page turns.

| Spread | Try |
| --- | --- |
| Opening | Establish the place |
| Middle | Move closer to one detail |
| Closing | Give the final frame room |`
  if (/\b(interview|question|mara)\b/i.test(text))
    return `Start with **a moment** your subject can place in time.

- Ask what they could see or hear.
- Leave room for the details to emerge.
- Use one of those details to shape your next question.`
  return 'Start by choosing **one thing** you want the reader to remember. Write it in a sentence, then pick a detail that makes it concrete. Read the two together and see which words you can take away without losing the idea.'
}

/** A second answer to the same question, for trying again. */
export function alternateReply(text: string, files: readonly { name: string }[] = []) {
  if (files.length && !text.trim())
    return 'Tell me what the files are for, and I can start with the one that matters most.'
  return `Another way in: ${replyTo(text, files).replace(/^\*\*|\*\*/g, '')}`
}
