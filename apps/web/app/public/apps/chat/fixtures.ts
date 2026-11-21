export interface ChatEntry {
  role: 'user' | 'assistant'
  text: string
  stopped?: boolean
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
        text: 'Use the hand and shell. It gives the reader a person to follow before they know the place. Save the coastline for the first spread, where it has room to stretch across both pages.',
      },
      { role: 'user', text: 'Where would you put the masthead?' },
      {
        role: 'assistant',
        text: 'Above the wrist, in the quiet part of the frame. Print a proof at the final trim size and check that the lettering still has breathing room.',
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
        text: 'Try the empty waiting room. The reader has seen the passengers all day, so the rows of unoccupied seats can carry the ending on their own.',
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
]
