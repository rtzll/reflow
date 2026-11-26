import { on, type Handle, type RemixNode } from 'remix/component'
import { Badge } from './badge.tsx'
import { Icon } from './icon.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type MergeReadinessStatus = 'ready' | 'blocked' | 'pending' | 'draft' | 'merged'
export type MergeGateStatus = 'passed' | 'failed' | 'pending' | 'neutral'

export interface MergeGateItem {
  id: string
  label: string
  status: MergeGateStatus
  detail?: string
  href?: string
  onClick?: () => void
}

export interface MergeGate {
  id: string
  label: string
  status: MergeGateStatus
  detail?: string
  required?: boolean
  /** Optional expandable sub-items (individual checks, reviewers, or rules). */
  items?: readonly MergeGateItem[]
}

export interface MergeReadinessProps {
  /** Overall mergeability state of the pull request. */
  status: MergeReadinessStatus
  /** Headline override; defaults to a clear status message. */
  title?: string
  /** Optional secondary rollup summary (e.g. `'2 approvals · 14/14 checks passed'`). */
  summary?: string
  /** Individual merge gates (approvals, required checks, conflicts, signed commits). */
  gates: readonly MergeGate[]
  /** Trailing action slot, typically a SplitButton or Button. */
  action?: RemixNode
  /** Expands expandable gates on initial render. Default `false`. */
  defaultExpanded?: boolean
  /** Controls card padding and row density. */
  size?: ControlSize
  class?: string
}

function defaultTitle(status: MergeReadinessStatus): string {
  switch (status) {
    case 'ready':
      return 'Ready to merge'
    case 'blocked':
      return 'Merging is blocked'
    case 'pending':
      return 'Checks in progress'
    case 'draft':
      return 'Draft pull request'
    case 'merged':
      return 'Pull request merged'
  }
}

function GateStatusGlyph(handle: Handle<{ status: MergeGateStatus }>) {
  return () => {
    const { status } = handle.props
    return (
      <span class="rf-merge-readiness-glyph" data-status={status} aria-hidden="true">
        {status === 'passed' && <Icon name="check" size={12} />}
        {status === 'failed' && <Icon name="x" size={12} />}
        {status === 'pending' && <Icon name="clock" size={12} />}
        {status === 'neutral' && <span class="rf-merge-readiness-neutral-dot" />}
      </span>
    )
  }
}

/**
 * Expandable pull request merge-gate card combining approval requirements,
 * required CI checks rollup, conflict status, and a trailing merge action slot.
 */
export function MergeReadiness(handle: Handle<MergeReadinessProps>) {
  const expanded = new Set<string>()
  let initialized = false

  function ensureInitialized(gates: readonly MergeGate[], defaultExpanded?: boolean) {
    if (initialized) return
    initialized = true
    if (defaultExpanded) {
      for (const gate of gates) {
        if (gate.items && gate.items.length > 0) expanded.add(gate.id)
      }
    }
  }

  function toggleGate(id: string) {
    if (expanded.has(id)) expanded.delete(id)
    else expanded.add(id)
    void handle.update()
  }

  return () => {
    const props = handle.props
    ensureInitialized(props.gates, props.defaultExpanded)
    const heading = props.title ?? defaultTitle(props.status)

    return (
      <section
        class={classList('rf-merge-readiness', props.class)}
        data-status={props.status}
        data-size={props.size}
        aria-label={heading}
      >
        <div class="rf-merge-readiness-header">
          <div class="rf-merge-readiness-lead">
            <span class="rf-merge-readiness-beacon" data-status={props.status} aria-hidden="true">
              {props.status === 'ready' || props.status === 'merged' ? (
                <Icon name="check" size={14} />
              ) : props.status === 'blocked' ? (
                <Icon name="x" size={14} />
              ) : (
                <Icon name="clock" size={14} />
              )}
            </span>
            <div class="rf-merge-readiness-heading">
              <div class="rf-merge-readiness-title">{heading}</div>
              {props.summary && <div class="rf-merge-readiness-summary">{props.summary}</div>}
            </div>
          </div>
          {props.action != null && <div class="rf-merge-readiness-action">{props.action}</div>}
        </div>

        <ul class="rf-merge-readiness-gates">
          {props.gates.map((gate) => {
            const hasItems = Boolean(gate.items && gate.items.length > 0)
            const isOpen = hasItems && expanded.has(gate.id)

            return (
              <li key={gate.id} class="rf-merge-readiness-gate" data-status={gate.status}>
                {hasItems ? (
                  <button
                    type="button"
                    class="rf-merge-readiness-gate-btn"
                    aria-expanded={isOpen ? 'true' : 'false'}
                    mix={on('click', () => toggleGate(gate.id))}
                  >
                    <GateStatusGlyph status={gate.status} />
                    <span class="rf-merge-readiness-gate-label">{gate.label}</span>
                    {gate.required && (
                      <Badge color="gray" size="compact">
                        Required
                      </Badge>
                    )}
                    {gate.detail && (
                      <span class="rf-merge-readiness-gate-detail">{gate.detail}</span>
                    )}
                    <span
                      class="rf-merge-readiness-chevron"
                      data-open={isOpen ? 'true' : 'false'}
                      aria-hidden="true"
                    >
                      <Icon name="chevron-right" size={14} />
                    </span>
                  </button>
                ) : (
                  <div class="rf-merge-readiness-gate-row">
                    <GateStatusGlyph status={gate.status} />
                    <span class="rf-merge-readiness-gate-label">{gate.label}</span>
                    {gate.required && (
                      <Badge color="gray" size="compact">
                        Required
                      </Badge>
                    )}
                    {gate.detail && (
                      <span class="rf-merge-readiness-gate-detail">{gate.detail}</span>
                    )}
                  </div>
                )}

                {isOpen && gate.items && (
                  <ul class="rf-merge-readiness-sublist">
                    {gate.items.map((item) => (
                      <li key={item.id} class="rf-merge-readiness-subitem">
                        <GateStatusGlyph status={item.status} />
                        {item.href ? (
                          <a class="rf-merge-readiness-sublink" href={item.href}>
                            {item.label}
                          </a>
                        ) : item.onClick ? (
                          <button
                            type="button"
                            class="rf-merge-readiness-sublink"
                            mix={on('click', () => item.onClick?.())}
                          >
                            {item.label}
                          </button>
                        ) : (
                          <span class="rf-merge-readiness-sublabel">{item.label}</span>
                        )}
                        {item.detail && (
                          <span class="rf-merge-readiness-subdetail">{item.detail}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    )
  }
}
