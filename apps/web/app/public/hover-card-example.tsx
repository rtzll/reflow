import { HoverCard, type HoverCardTriggerProps, type PopoverPlacement } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

function Profile(handle: Handle<{ size?: 'default' | 'compact' }>) {
  return () => (
    <div class="doc-hover-profile" data-density={handle.props.size}>
      <span class="doc-hover-avatar" aria-hidden="true">
        R
      </span>
      <div class="doc-hover-profile-text">
        <strong>Reflow</strong>
        <span class="doc-hover-muted">@reflow</span>
        <p>Fluid components for Remix, with springs, shared hover, and keyboard care.</p>
        <span class="doc-hover-muted">
          <strong>35</strong> components · <strong>8</strong> systems
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
              <div class="doc-hover-link">
                <strong>Remix 3</strong>
                <p>
                  A full stack web framework built on web standards, with its own component model.
                </p>
                <span class="doc-hover-muted">remix.run</span>
              </div>
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
