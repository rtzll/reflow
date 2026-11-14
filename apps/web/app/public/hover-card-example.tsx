import { Avatar, HoverCard, type HoverCardTriggerProps, type PopoverPlacement } from '@rtzll/reflow'
import type { Handle } from 'remix/component'
import { components, systems } from './catalog-entries.ts'

function Profile(handle: Handle<{ size?: 'default' | 'compact' }>) {
  return () => (
    <div class="doc-hover-profile" data-density={handle.props.size}>
      <Avatar
        name="Reflow"
        size={handle.props.size === 'compact' ? 32 : 40}
        color="accent"
        decorative
      />
      <div class="doc-hover-profile-text">
        <strong>Reflow</strong>
        <span class="doc-hover-muted">@reflow</span>
        <p>Fluid components for Remix, with springs, shared hover, and keyboard care.</p>
        <span class="doc-hover-muted">
          <strong>{components.length}</strong> components · <strong>{systems.length}</strong>{' '}
          systems
        </span>
      </div>
    </div>
  )
}

export interface HoverCardDemoProps {
  variant: string
  size?: 'default' | 'compact'
  placement?: PopoverPlacement
  openDelay?: number
}

/** The HoverCard docs demos and playground: every card is a real Reflow HoverCard. */
export function HoverCardDemo(handle: Handle<HoverCardDemoProps>) {
  return () => {
    const { variant, size } = handle.props
    const handleLink =
      (label = '@reflow') =>
      (trigger: HoverCardTriggerProps) => (
        <a class="doc-hover-trigger" href="#reflow" {...trigger}>
          {label}
        </a>
      )
    switch (variant) {
      case 'link':
        return (
          <p class="doc-hover-sentence">
            Reflow is built on{' '}
            <HoverCard
              size={size}
              renderTrigger={(trigger) => (
                <a class="doc-hover-trigger" href="https://remix.run" {...trigger}>
                  Remix 3
                </a>
              )}
            >
              <span class="doc-hover-link">
                <strong>Remix 3</strong>
                <span>
                  A full stack web framework built on web standards, with its own component model.
                </span>
                <span class="doc-hover-muted">remix.run</span>
              </span>
            </HoverCard>{' '}
            and the platform’s own popover and dialog elements.
          </p>
        )
      case 'placement':
        return (
          <HoverCard placement="top" size={size} renderTrigger={handleLink()}>
            <Profile size={size} />
          </HoverCard>
        )
      case 'instant':
        return (
          <HoverCard openDelay={0} closeDelay={100} size={size} renderTrigger={handleLink()}>
            <Profile size={size} />
          </HoverCard>
        )
      case 'compact':
        return (
          <HoverCard size="compact" renderTrigger={handleLink()}>
            <Profile size="compact" />
          </HoverCard>
        )
      case 'playground':
        return (
          <HoverCard
            size={size}
            placement={handle.props.placement}
            openDelay={handle.props.openDelay}
            renderTrigger={handleLink()}
          >
            <Profile size={size} />
          </HoverCard>
        )
      default:
        return (
          <HoverCard size={size} renderTrigger={handleLink()}>
            <Profile size={size} />
          </HoverCard>
        )
    }
  }
}
