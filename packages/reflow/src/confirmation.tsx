import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { Banner, BannerAction, BannerActions, BannerDescription, BannerTitle } from './banner.tsx'
import type { BannerProps } from './banner.tsx'
import { Icon } from './icon.tsx'

export type ConfirmationState = 'requested' | 'approved' | 'denied'

export type ConfirmationProps = Omit<
  BannerProps,
  'title' | 'children' | 'role' | 'dismissible' | 'dismissLabel' | 'open' | 'onDismiss'
> & {
  /** The question, phrased so Approve and Deny answer it: "Run pnpm build?". */
  title: RemixNode
  /** What approving does, or why it is being asked. */
  description?: RemixNode
  /** The answer, when the app keeps it. Without it, Confirmation keeps the answer itself. */
  state?: ConfirmationState
  onApprove?: () => void
  onDeny?: () => void
  approveLabel?: string
  denyLabel?: string
  approvedLabel?: string
  deniedLabel?: string
  /** Submits `approved` or `denied` with a surrounding form once answered. */
  name?: string
}

/**
 * A yes or no question before something runs, such as an agent's tool call:
 * a Banner whose Approve and Deny give way to the answer in the same place.
 */
export function Confirmation(handle: Handle<ConfirmationProps>) {
  let answered: ConfirmationState = 'requested'
  // Set when the pressed button had focus, so focus follows it to the answer.
  let pressed: EventTarget | null = null
  let focusAnswer = false
  const titleId = `${handle.id}-title`
  const descriptionId = `${handle.id}-description`
  const answerRef = ref((node) => {
    if (!focusAnswer || !(node instanceof HTMLElement)) return
    focusAnswer = false
    node.focus({ preventScroll: true })
  })

  function answer(next: 'approved' | 'denied', event: Event) {
    pressed = event.currentTarget
    if (next === 'approved') handle.props.onApprove?.()
    else handle.props.onDeny?.()
    if (handle.props.state === undefined) {
      answered = next
      void handle.update()
    }
  }

  return () => {
    const {
      title,
      description,
      state: controlled,
      onApprove: _onApprove,
      onDeny: _onDeny,
      approveLabel = 'Approve',
      denyLabel = 'Deny',
      approvedLabel = 'Approved',
      deniedLabel = 'Denied',
      name,
      class: classProp,
      ...banner
    } = handle.props
    const state = controlled ?? answered
    if (state !== 'requested' && pressed) {
      focusAnswer = pressed === document.activeElement
      pressed = null
    }
    return (
      <Banner
        {...banner}
        class={classProp ? `rf-confirmation ${classProp}` : 'rf-confirmation'}
        // A question waiting for an answer should not interrupt; the answer is announced.
        role="group"
        aria-labelledby={titleId}
        aria-describedby={description != null ? descriptionId : undefined}
      >
        <BannerTitle id={titleId}>{title}</BannerTitle>
        {description != null && (
          <BannerDescription id={descriptionId}>{description}</BannerDescription>
        )}
        <BannerActions>
          {state === 'requested' ? (
            <>
              <BannerAction variant="primary" mix={on('click', (e) => answer('approved', e))}>
                {approveLabel}
              </BannerAction>
              <BannerAction variant="ghost" mix={on('click', (e) => answer('denied', e))}>
                {denyLabel}
              </BannerAction>
            </>
          ) : (
            <span role="status" class="rf-confirmation-status">
              <span
                key={state}
                class="rf-confirmation-answer"
                data-state={state}
                tabIndex={-1}
                mix={answerRef}
              >
                <Icon name={state === 'approved' ? 'check' : 'x'} size={14} />
                {state === 'approved' ? approvedLabel : deniedLabel}
              </span>
            </span>
          )}
          {name && state !== 'requested' && <input type="hidden" name={name} value={state} />}
        </BannerActions>
      </Banner>
    )
  }
}
