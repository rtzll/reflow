import { Badge, Button, Icon, Timeline, type TimelineItem } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'

/** The Timeline example: a pull request activity feed with an interactive approval event. */
export function TimelineExample(handle: Handle) {
  let approved = false

  return () => {
    const items: TimelineItem[] = [
      {
        id: 'opened',
        icon: <Icon name="file" size={12} />,
        title: (
          <>
            <strong>Maya</strong> opened pull request #142
          </>
        ),
        meta: <Badge size="compact">feat/diff-ssr</Badge>,
        timestamp: '42m ago',
        detail: 'Pre-render unified diffs into Declarative Shadow DOM so hydration never flashes.',
      },
      {
        id: 'comment',
        tone: 'accent',
        icon: <Icon name="message-circle" size={12} />,
        title: (
          <>
            <strong>Noah</strong> commented on <code>src/diffs.tsx</code>
          </>
        ),
        timestamp: '18m ago',
        detail: 'Strip leading a/ and b/ prefixes in prerenderDiff() so header paths match.',
      },
      {
        id: 'checks',
        tone: 'success',
        icon: <Icon name="check" size={12} />,
        title: 'CI checks passed (verify · check-package)',
        timestamp: '6m ago',
      },
      ...(approved
        ? [
            {
              id: 'approved',
              tone: 'success' as const,
              icon: <Icon name="check" size={12} />,
              title: (
                <>
                  <strong>You</strong> approved these changes
                </>
              ),
              timestamp: 'Just now',
            },
          ]
        : [
            {
              id: 'pending',
              tone: 'warning' as const,
              title: 'Awaiting final approval',
              action: (
                <Button
                  size="compact"
                  variant="secondary"
                  mix={on('click', () => {
                    approved = true
                    void handle.update()
                  })}
                >
                  Approve
                </Button>
              ),
            },
          ]),
    ]

    return (
      <div style={{ width: 'min(100%, 520px)' }}>
        <Timeline label="Pull request activity" items={items} />
      </div>
    )
  }
}
