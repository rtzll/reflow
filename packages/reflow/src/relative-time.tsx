import { ref, type Handle } from 'remix/component'
import {
  formatRelativeTime,
  formatShortUtcDate,
  formatUtcTimestamp,
  toTimestampMs,
} from './behaviors/relative-time.ts'
import { classList } from './systems/styling.ts'
import { Tooltip, type TooltipTriggerProps } from './tooltip.tsx'

export interface RelativeTimeProps {
  /** Timestamp as ISO string, epoch milliseconds, or `Date`. */
  date: string | number | Date
  /** Optional deterministic reference timestamp (eliminates SSR/client drift). */
  now?: string | number | Date
  /** Refreshes the relative label every 30s on the client when `now` is not pinned. Default `true`. */
  live?: boolean
  /** Wraps `<time>` with a Reflow `Tooltip` showing the exact UTC timestamp. Default `true`. */
  tooltip?: boolean
  class?: string
}

/**
 * Hydration-safe `<time>` element that renders a deterministic date on the
 * server, upgrades cleanly to a live relative label (`4m ago`) on the client,
 * and shows the exact UTC timestamp in a `Tooltip`.
 */
export function RelativeTime(handle: Handle<RelativeTimeProps>) {
  let hydratedNow: number | null = null

  const mountLive = ref<HTMLTimeElement>((_node, signal) => {
    if (handle.props.now !== undefined) return
    hydratedNow = Date.now()
    void handle.update()
    if (handle.props.live === false) return
    const timer = setInterval(() => {
      hydratedNow = Date.now()
      void handle.update()
    }, 30_000)
    signal.addEventListener('abort', () => clearInterval(timer), { once: true })
  })

  return () => {
    const props = handle.props
    const targetMs = toTimestampMs(props.date)
    const valid = Number.isFinite(targetMs)
    const iso = valid ? new Date(targetMs).toISOString() : undefined
    const exact = valid ? formatUtcTimestamp(targetMs) : ''
    const referenceMs = props.now !== undefined ? toTimestampMs(props.now) : hydratedNow
    const label = !valid
      ? ''
      : referenceMs !== null && Number.isFinite(referenceMs)
        ? formatRelativeTime(targetMs, referenceMs)
        : formatShortUtcDate(targetMs)

    const timeEl = (triggerProps?: TooltipTriggerProps) => {
      const { mix: triggerMix, ...restTrigger } = triggerProps ?? {}
      const triggerMixes = triggerMix ? (Array.isArray(triggerMix) ? triggerMix : [triggerMix]) : []
      return (
        <time
          {...restTrigger}
          class={classList('rf-relative-time', props.class)}
          dateTime={iso}
          title={props.tooltip === false ? exact : undefined}
          tabIndex={props.tooltip === false ? undefined : 0}
          mix={[...triggerMixes, mountLive]}
        >
          {label}
        </time>
      )
    }

    if (props.tooltip === false || !exact) {
      return timeEl()
    }

    return <Tooltip content={exact} renderTrigger={(trigger) => timeEl(trigger)} />
  }
}
