import { Avatar, AvatarGroup, type AvatarStatus } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

export const avatarPeople = [
  { name: 'Ada Lovelace' },
  { name: 'Grace Hopper' },
  { name: 'Alan Turing' },
  { name: 'Katherine Johnson' },
  { name: 'Edsger Dijkstra' },
  { name: 'Barbara Liskov' },
]

export interface AvatarDemoProps {
  variant: string
  /** The showcase's sample portrait. */
  image?: string
  size?: number
  shape?: 'circle' | 'square'
  status?: AvatarStatus | 'none'
  withImage?: boolean
  max?: number
}

/** The Avatar docs demos and playgrounds. */
export function AvatarDemo(handle: Handle<AvatarDemoProps>) {
  return () => {
    const { variant, image } = handle.props
    switch (variant) {
      case 'sizes':
        return (
          <div class="doc-demo-row doc-avatar-row">
            {[20, 24, 32, 40, 56].map((size) => (
              <Avatar key={size} name="Ada Lovelace" size={size} />
            ))}
          </div>
        )
      case 'shapes':
        return (
          <div class="doc-demo-row doc-avatar-row">
            <Avatar name="Ada Lovelace" size={40} src={image} />
            <Avatar name="Reflow" size={40} shape="square" color="accent" />
            <Avatar name="Build Agent" size={40} shape="square" color="indigo" />
          </div>
        )
      case 'status':
        return (
          <div class="doc-demo-row doc-avatar-row">
            {(['online', 'away', 'busy', 'offline'] as const).map((status) => (
              <Avatar key={status} name="Grace Hopper" size={40} status={status} />
            ))}
          </div>
        )
      case 'group':
        return <AvatarGroup avatars={avatarPeople} label="Editors" />
      case 'group-sizes':
        return (
          <div class="doc-demo-stack doc-avatar-stack">
            <AvatarGroup avatars={avatarPeople} max={3} size={24} />
            <AvatarGroup avatars={avatarPeople.slice(0, 4)} size={40} shape="square" />
          </div>
        )
      case 'gallery':
        return (
          <div class="example-avatar-groups">
            <AvatarGroup
              label="Editors"
              avatars={[
                { name: 'Alex Morgan', src: image, status: 'online' },
                { name: 'Ada Lovelace', status: 'online' },
                { name: 'Grace Hopper', status: 'away' },
                { name: 'Alan Turing' },
                { name: 'Katherine Johnson' },
                { name: 'Edsger Dijkstra' },
              ]}
              size={40}
            />
            <AvatarGroup
              label="Agents"
              shape="square"
              avatars={[
                { name: 'Research Agent', color: 'teal' },
                { name: 'Design Agent', color: 'violet' },
                { name: 'Build Agent', color: 'amber' },
              ]}
              size={32}
            />
          </div>
        )
      case 'playground':
        return (
          <Avatar
            name="Ada Lovelace"
            src={handle.props.withImage ? image : undefined}
            size={handle.props.size}
            shape={handle.props.shape}
            status={handle.props.status === 'none' ? undefined : handle.props.status}
          />
        )
      case 'group-playground':
        return (
          <AvatarGroup
            avatars={avatarPeople}
            max={handle.props.max}
            size={handle.props.size}
            shape={handle.props.shape}
          />
        )
      default:
        return (
          <div class="doc-demo-row doc-avatar-row">
            <Avatar name="Alex Morgan" src={image} size={40} />
            <Avatar name="Ada Lovelace" size={40} />
            <Avatar name="Grace Hopper" size={40} />
            <Avatar name="Broken Image" src="data:image/png;base64,broken" size={40} />
          </div>
        )
    }
  }
}
