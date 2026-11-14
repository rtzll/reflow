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
export function AvatarGroup(handle: Handle<AvatarGroupProps>) {
  return () => {
    const { avatars, size = 32, shape } = handle.props
    const max = Math.max(1, handle.props.max ?? 4)
    const overflow = avatars.length > max
    const shown = overflow ? avatars.slice(0, max - 1) : avatars
    const rest = overflow ? avatars.slice(max - 1) : []
    const label =
      handle.props.label ?? `${avatars.length} ${avatars.length === 1 ? 'person' : 'people'}`
    const names = rest.map((avatar) => avatar.name).join(', ')
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
                    aria-label={`${rest.length} more: ${names}`}
                    data-shape={shape ?? 'circle'}
                    style={{ '--rf-avatar-size': `${size}px` }}
                  >
                    +{rest.length}
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
