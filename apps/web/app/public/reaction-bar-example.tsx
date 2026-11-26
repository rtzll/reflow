import { ReactionBar, type ReactionItem } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const initialReactions: readonly ReactionItem[] = [
  { emoji: '👍', label: 'Thumbs up', count: 6, reacted: true, users: ['Alex', 'Maya', 'Noah'] },
  { emoji: '🚀', label: 'Rocket', count: 3, reacted: false, users: ['Sara', 'Liam'] },
  { emoji: '👀', label: 'Eyes', count: 2, reacted: false, users: ['Maya', 'Noah'] },
]

/** The ReactionBar example: interactive pill reactions with active toggle state and an anchored + picker. */
export function ReactionBarExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    allowAdd?: boolean
  }>,
) {
  let reactions: ReactionItem[] = initialReactions.map((r) => ({ ...r }))

  function toggle(emoji: string, nextReacted: boolean) {
    const existing = reactions.find((r) => r.emoji === emoji)
    if (existing) {
      const nextCount = Math.max(0, existing.count + (nextReacted ? 1 : -1))
      reactions = reactions
        .map((r) => (r.emoji === emoji ? { ...r, count: nextCount, reacted: nextReacted } : r))
        .filter((r) => r.count > 0)
    } else if (nextReacted) {
      reactions = [...reactions, { emoji, label: emoji, count: 1, reacted: true }]
    }
    void handle.update()
  }

  return () => (
    <ReactionBar
      label="Comment reactions"
      reactions={reactions}
      allowAdd={handle.props.allowAdd ?? true}
      size={handle.props.size ?? 'default'}
      onToggle={toggle}
    />
  )
}
