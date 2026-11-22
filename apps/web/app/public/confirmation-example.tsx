import { Button, Confirmation, Icon, type ConfirmationState } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'

export interface ConfirmationDemoProps {
  variant: string
  size?: 'default' | 'compact'
  status?: 'default' | 'warning'
  state?: ConfirmationState
}

/** The Confirmation docs examples and playground: every question is a real Confirmation. */
export function ConfirmationDemo(handle: Handle<ConfirmationDemoProps>) {
  let submitted = ''
  // Remount the examples to ask again.
  let round = 0

  return () => {
    const { variant, size } = handle.props
    const again = (
      <Button
        variant="tertiary"
        size="compact"
        mix={on('click', () => {
          round++
          submitted = ''
          void handle.update()
        })}
      >
        Ask again
      </Button>
    )
    switch (variant) {
      case 'warning':
        return (
          <div class="doc-confirmation" key={round}>
            <Confirmation
              status="warning"
              size={size}
              title="Delete 3 branches?"
              description="feature/drawer-snap, feature/table-all and fix/escape will be removed from origin."
              approveLabel="Delete"
              denyLabel="Keep"
              approvedLabel="Deleted"
              deniedLabel="Kept"
            />
            {again}
          </div>
        )
      case 'form':
        return (
          <form
            class="doc-confirmation"
            key={round}
            mix={on('submit', (event) => {
              event.preventDefault()
              submitted = String(new FormData(event.currentTarget).get('send') ?? 'unanswered')
              void handle.update()
            })}
          >
            <Confirmation
              size={size}
              name="send"
              title="Send the weekly summary to the team?"
              approveLabel="Send"
              denyLabel="Don’t send"
              approvedLabel="Will send"
              deniedLabel="Won’t send"
            />
            <div class="doc-confirmation-row">
              <Button type="submit" variant="secondary" size="compact">
                Submit
              </Button>
              {again}
              <output>{submitted && `send=${submitted}`}</output>
            </div>
          </form>
        )
      case 'playground':
        return (
          <div class="doc-confirmation" key={round}>
            <Confirmation
              size={size}
              status={handle.props.status}
              state={handle.props.state === 'requested' ? undefined : handle.props.state}
              icon={<Icon name="cpu" />}
              title="Run pnpm build?"
              description="Builds the library and the showcase into dist/."
            />
            {again}
          </div>
        )
      default:
        return (
          <div class="doc-confirmation" key={round}>
            <Confirmation
              size={size}
              icon={<Icon name="cpu" />}
              title="Run pnpm build?"
              description="Builds the library and the showcase into dist/."
            />
            {again}
          </div>
        )
    }
  }
}
