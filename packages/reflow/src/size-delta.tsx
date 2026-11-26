import type { Handle } from 'remix/component'
import { Badge } from './badge.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type SizeDeltaTone = 'success' | 'neutral' | 'warning' | 'danger'

export interface SizeDeltaItem {
  id: string
  /** Artifact or chunk filename (e.g. `dist/index.js`). */
  name: string
  /** Baseline size in bytes. */
  beforeBytes: number
  /** Current size in bytes. */
  afterBytes: number
  /** Optional hard size budget in bytes; exceeding it marks the row as danger. */
  budgetBytes?: number
  /** Optional label suffix such as `'gzip'` or `'brotli'`. */
  encoding?: string
}

export interface SizeDeltaProps {
  /** Build artifact size comparisons. */
  items: readonly SizeDeltaItem[]
  /** Percentage growth that escalates a row to `'warning'`. Default `5`. */
  warnThresholdPct?: number
  /** Percentage growth that escalates a row to `'danger'`. Default `15`. */
  dangerThresholdPct?: number
  /** Appends an aggregate Total row when more than one item is provided. Default `true`. */
  showTotal?: boolean
  /** Accessible name for the artifact delta region. Default `'Bundle size delta'`. */
  label?: string
  /** Controls spacing and typography scale. */
  size?: ControlSize
  class?: string
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '0 B'
  const sign = bytes < 0 ? '-' : ''
  const abs = Math.abs(bytes)
  if (abs < 1024) return `${sign}${Math.round(abs)} B`
  const units = ['kB', 'MB', 'GB']
  let value = abs / 1024
  let unitIdx = 0
  while (value >= 1024 && unitIdx < units.length - 1) {
    value /= 1024
    unitIdx++
  }
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2
  return `${sign}${Number(value.toFixed(decimals))} ${units[unitIdx]!}`
}

export function computeSizeDelta(
  beforeBytes: number,
  afterBytes: number,
  options: { budgetBytes?: number; warnThresholdPct?: number; dangerThresholdPct?: number } = {},
): {
  diffBytes: number
  diffPct: number
  overBudget: boolean
  tone: SizeDeltaTone
} {
  const before = Math.max(0, Number.isFinite(beforeBytes) ? beforeBytes : 0)
  const after = Math.max(0, Number.isFinite(afterBytes) ? afterBytes : 0)
  const diffBytes = after - before
  const diffPct = before > 0 ? (diffBytes / before) * 100 : after > 0 ? 100 : 0
  const overBudget = options.budgetBytes !== undefined && after > options.budgetBytes
  const warnPct = options.warnThresholdPct ?? 5
  const dangerPct = options.dangerThresholdPct ?? 15

  let tone: SizeDeltaTone = 'neutral'
  if (overBudget || diffPct >= dangerPct) tone = 'danger'
  else if (diffPct >= warnPct) tone = 'warning'
  else if (diffBytes < 0) tone = 'success'

  return { diffBytes, diffPct, overBudget, tone }
}

/**
 * Build artifact and bundle-size delta list with before/after bytes, signed
 * deltas, percentage change, and semantic budget threshold warnings.
 */
export function SizeDelta(handle: Handle<SizeDeltaProps>) {
  return () => {
    const props = handle.props
    const items = props.items
    const warnThresholdPct = props.warnThresholdPct ?? 5
    const dangerThresholdPct = props.dangerThresholdPct ?? 15
    const showTotal = (props.showTotal ?? true) && items.length > 1

    const totalBefore = items.reduce((sum, item) => sum + Math.max(0, item.beforeBytes), 0)
    const totalAfter = items.reduce((sum, item) => sum + Math.max(0, item.afterBytes), 0)
    const totalDelta = computeSizeDelta(totalBefore, totalAfter, {
      warnThresholdPct,
      dangerThresholdPct,
    })

    function formatSignedDelta(diffBytes: number, diffPct: number): string {
      if (diffBytes === 0) return '0 B (0%)'
      const sign = diffBytes > 0 ? '+' : ''
      const pct = `${diffPct > 0 ? '+' : ''}${Number(diffPct.toFixed(1))}%`
      return `${sign}${formatBytes(diffBytes)} (${pct})`
    }

    return (
      <section
        class={classList('rf-size-delta', props.class)}
        data-size={props.size}
        aria-label={props.label ?? 'Bundle size delta'}
      >
        <div class="rf-size-delta-rows" role="list">
          {items.map((item) => {
            const delta = computeSizeDelta(item.beforeBytes, item.afterBytes, {
              budgetBytes: item.budgetBytes,
              warnThresholdPct,
              dangerThresholdPct,
            })

            return (
              <div key={item.id} role="listitem" class="rf-size-delta-row" data-tone={delta.tone}>
                <div class="rf-size-delta-name-wrap">
                  <span class="rf-size-delta-name">{item.name}</span>
                  {item.encoding && <span class="rf-size-delta-encoding">{item.encoding}</span>}
                  {delta.overBudget && (
                    <Badge color="red" size="compact">
                      Over {formatBytes(item.budgetBytes!)} budget
                    </Badge>
                  )}
                </div>

                <div class="rf-size-delta-numbers">
                  <span class="rf-size-delta-range">
                    {formatBytes(item.beforeBytes)} →{' '}
                    <strong>{formatBytes(item.afterBytes)}</strong>
                  </span>
                  <span class="rf-size-delta-diff" data-tone={delta.tone}>
                    {formatSignedDelta(delta.diffBytes, delta.diffPct)}
                  </span>
                </div>
              </div>
            )
          })}

          {showTotal && (
            <div
              role="listitem"
              class="rf-size-delta-row rf-size-delta-total"
              data-tone={totalDelta.tone}
            >
              <div class="rf-size-delta-name-wrap">
                <span class="rf-size-delta-name">Total</span>
              </div>
              <div class="rf-size-delta-numbers">
                <span class="rf-size-delta-range">
                  {formatBytes(totalBefore)} → <strong>{formatBytes(totalAfter)}</strong>
                </span>
                <span class="rf-size-delta-diff" data-tone={totalDelta.tone}>
                  {formatSignedDelta(totalDelta.diffBytes, totalDelta.diffPct)}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }
}
