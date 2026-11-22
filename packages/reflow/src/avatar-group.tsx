import { type Handle } from 'remix/component'
import { Tooltip } from './tooltip.tsx'
import { type AvatarProps, Avatar } from './avatar.tsx'

export interface AvatarGroupProps {
  avatars: readonly Omit<AvatarProps, 'size' | 'shape' | 'decorative' | 'class'>[]
  /** How many avatars show, the count of the rest included. Default 4. */
  max?: number
  size?: number
  shape?: 'circle' | 'square'
  /** Names the group. Defaults to the number of people. */
  label?: string
}

/**
 * A row of overlapping avatars, such as the people on a document. Each
 * names itself in a tooltip; past `max`, a count stands in for the rest and
 * names them. Pointing at the row spreads it apart.
 */
const namedLimit = 10
const count = new Intl.NumberFormat('en').format
// The badge stays a few characters wide: 1,281 reads as +1.3K.
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
  .format

export function AvatarGroup(handle: Handle<AvatarGroupProps>) {
  return () => {
    const { avatars, size = 32, shape } = handle.props
    const max = Math.max(1, handle.props.max ?? 4)
    const overflow = avatars.length > max
    const shown = overflow ? avatars.slice(0, max - 1) : avatars
    const rest = overflow ? avatars.slice(max - 1) : []
    const label =
      handle.props.label ?? `${count(avatars.length)} ${avatars.length === 1 ? 'person' : 'people'}`
    // Name the first few of the rest; a list of hundreds helps no one.
    const named = rest.slice(0, namedLimit).map((avatar) => avatar.name)
    const unnamed = rest.length - named.length
    const names = named.join(', ') + (unnamed ? ` and ${count(unnamed)} others` : '')
    return (
      <ul class="rf-avatar-group" aria-label={label} style={{ '--rf-avatar-size': `${size}px` }}>
        {shown.map((avatar, index) => (
          // Earlier avatars sit on top, so each status dot stays in view.
          <li key={`${avatar.name}-${index}`} style={{ zIndex: shown.length - index + 1 }}>
            <Tooltip
              content={avatar.name}
              renderTrigger={(trigger) => (
                <span class="rf-avatar-slot" {...trigger}>
                  <Avatar {...avatar} size={size} shape={shape} />
                </span>
              )}
            />
          </li>
        ))}
        {overflow && (
          <li>
            <Tooltip
              content={names}
              renderTrigger={(trigger) => (
                <span class="rf-avatar-slot" {...trigger}>
                  <span
                    class="rf-avatar rf-avatar-more"
                    role="img"
                    aria-label={`${count(rest.length)} more: ${names}`}
                    data-shape={shape ?? 'circle'}
                    style={{ '--rf-avatar-size': `${size}px` }}
                  >
                    +{compact(rest.length)}
                  </span>
                </span>
              )}
            />
          </li>
        )}
      </ul>
    )
  }
}
