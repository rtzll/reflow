const skills = [
  {
    command: '/outline',
    description: 'Plan a story in three scenes',
    reply: (subject: string) =>
      `A three-scene outline for ${subject}

1. Opening scene — introduce one person through a detail you can see or hear.
2. Turning point — follow the moment that changes their plans.
3. Closing image — return to the opening detail and show what has changed.`,
  },
  {
    command: '/interview',
    description: 'Draft interview questions',
    reply: (subject: string) =>
      `Three questions about ${subject}

1. Can you take me back to the moment this began?
2. What changed, and how did you first notice it?
3. Which detail would someone looking in from outside miss?`,
  },
  {
    command: '/proof',
    description: 'Build a print proof checklist',
    reply: (subject: string) =>
      `Print proof checklist for ${subject}

- Fold a copy at final trim size and check the page sequence.
- Read names, dates and captions against the source notes.
- Check image crops and text near the fold.
- Mark corrections on one copy and initial the final proof.`,
  },
]

export const skillTriggers = [
  {
    character: '/',
    label: 'Chat skills',
    items: skills.map(({ command, description }) => ({
      label: command,
      value: command,
      description,
    })),
  },
]

export function skillReply(text: string, defaultSubject: string) {
  // The menu can insert a skill at any word boundary in a draft.
  for (const match of text.matchAll(/(?:^|\s)(\/[\w-]+)[.,!?;:)]*(?=\s|$)/g)) {
    const skill = skills.find(({ command }) => command === match[1].toLowerCase())
    if (skill) {
      const subject = (
        text.slice(0, match.index) + text.slice(match.index + match[0].length)
      ).trim()
      return { command: skill.command, text: skill.reply(subject || defaultSubject) }
    }
  }
}
