import { Button, Drawer, SegmentedControl, Switch, type DrawerSide } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'

function Filters(handle: Handle<{ size?: 'default' | 'compact' }>) {
  return () => (
    <div class="doc-drawer-filters">
      <SegmentedControl
        label="Sort by"
        size={handle.props.size}
        fill
        options={[
          { value: 'newest', label: 'Newest' },
          { value: 'popular', label: 'Popular' },
          { value: 'price', label: 'Price' },
        ]}
      />
      <Switch size={handle.props.size} label="In stock only" defaultChecked />
      <Switch size={handle.props.size} label="Free shipping" />
    </div>
  )
}

const pages = ['Inbox', 'Drafts', 'Sent', 'Archive', 'Trash']

function Navigation() {
  return () => (
    <nav aria-label="Mail" class="doc-drawer-nav">
      {pages.map((page) => (
        <a
          key={page}
          href={`#${page.toLowerCase()}`}
          aria-current={page === 'Inbox' ? 'page' : undefined}
        >
          {page}
        </a>
      ))}
    </nav>
  )
}

const sideTitles: Record<DrawerSide, string> = {
  bottom: 'Filters',
  top: 'Announcement',
  right: 'Details',
  left: 'Mailboxes',
}

function sideContent(side: DrawerSide, size?: 'default' | 'compact') {
  switch (side) {
    case 'left':
      return <Navigation />
    case 'right':
      return (
        <dl class="doc-drawer-details">
          <dt>Owner</dt>
          <dd>Reflow team</dd>
          <dt>Updated</dt>
          <dd>November 9, 2026</dd>
          <dt>Status</dt>
          <dd>In review</dd>
        </dl>
      )
    case 'top':
      return (
        <p class="doc-drawer-text">Reflow 0.4.0 adds Popover, HoverCard and SegmentedControl.</p>
      )
    default:
      return <Filters size={size} />
  }
}

export interface DrawerDemoProps {
  variant: string
  size?: 'default' | 'compact'
  side?: DrawerSide
  handle?: boolean
  closeButton?: boolean
  dismissible?: boolean
}

/** The Drawer docs demos, gallery card and playground: every drawer is a real Reflow Drawer. */
export function DrawerDemo(handle: Handle<DrawerDemoProps>) {
  return () => {
    const { variant, size } = handle.props
    const applyFooter = (close: () => void) => [
      <Button key="reset" variant="tertiary" size={size} mix={on('click', close)}>
        Reset
      </Button>,
      <Button key="apply" size={size} mix={on('click', close)}>
        Apply
      </Button>,
    ]
    switch (variant) {
      case 'sides':
        return (
          <div class="example-row">
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <Drawer
                key={side}
                side={side}
                trigger={side[0]!.toUpperCase() + side.slice(1)}
                triggerVariant="secondary"
                triggerSize={size}
                title={sideTitles[side]}
              >
                {sideContent(side, size)}
              </Drawer>
            ))}
          </div>
        )
      case 'navigation':
        return (
          <Drawer
            side="left"
            trigger="Mailboxes"
            triggerVariant="secondary"
            triggerSize={size}
            title="Mailboxes"
          >
            <Navigation />
          </Drawer>
        )
      case 'scrolling':
        return (
          <Drawer
            trigger="Release notes"
            triggerVariant="secondary"
            triggerSize={size}
            title="Release notes"
            description="Scroll the notes; drag from the top once they are back at the start."
          >
            <ol class="doc-drawer-notes">
              {Array.from({ length: 24 }, (_, index) => (
                <li key={index}>Change {24 - index}: a small fix with its tests.</li>
              ))}
            </ol>
          </Drawer>
        )
      case 'required':
        return (
          <Drawer
            trigger="Accept terms"
            triggerVariant="secondary"
            triggerSize={size}
            title="Terms of service"
            description="Accept the terms to continue."
            dismissible={false}
            footer={(close) => (
              <Button size={size} mix={on('click', close)}>
                Accept
              </Button>
            )}
          >
            <p class="doc-drawer-text">These terms cover how you use the service.</p>
          </Drawer>
        )
      case 'gallery':
        return (
          <div class="example-row">
            <Drawer
              trigger="Filters"
              triggerVariant="secondary"
              title="Filters"
              description="Narrow the results."
              footer={applyFooter}
            >
              <Filters />
            </Drawer>
            <Drawer side="right" trigger="Details" triggerVariant="secondary" title="Details">
              {sideContent('right')}
            </Drawer>
          </div>
        )
      case 'playground': {
        const side = handle.props.side ?? 'bottom'
        return (
          <Drawer
            side={side}
            trigger="Open drawer"
            triggerVariant="secondary"
            triggerSize={size}
            title={sideTitles[side]}
            description={side === 'bottom' ? 'Narrow the results.' : undefined}
            handle={handle.props.handle}
            showCloseButton={handle.props.closeButton}
            dismissible={handle.props.dismissible}
            footer={side === 'bottom' ? applyFooter : undefined}
          >
            {sideContent(side, size)}
          </Drawer>
        )
      }
      default:
        return (
          <Drawer
            trigger="Filters"
            triggerVariant="secondary"
            triggerSize={size}
            title="Filters"
            description="Narrow the results."
            footer={applyFooter}
          >
            <Filters size={size} />
          </Drawer>
        )
    }
  }
}
