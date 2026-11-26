import type { Handle } from 'remix/component'
import { classList, type ControlSize } from './systems/styling.ts'

export interface DiffStatProps {
  /** Number of added lines. */
  added: number
  /** Number of removed lines. */
  removed: number
  /** Number of proportional squares rendered beside the counts. Default `5`. */
  blocks?: number
  /** Shows numeric `+N −M` counts beside the blocks. Default `true`. */
  showCounts?: boolean
  /** Accessible description; defaults to `"N additions, M deletions"`. */
  label?: string
  /** Controls spacing and typography scale. */
  size?: ControlSize
  class?: string
}

export function computeDiffStatBlocks(
  added: number,
  removed: number,
  blocks = 5,
): readonly ('added' | 'removed' | 'neutral')[] {
  const count = Math.max(0, Math.floor(blocks))
  if (count === 0) return []
  const a = Math.max(0, Number.isFinite(added) ? added : 0)
  const r = Math.max(0, Number.isFinite(removed) ? removed : 0)
  const total = a + r
  if (total === 0) return Array.from({ length: count }, () => 'neutral')
  if (count === 1) return [a >= r ? 'added' : 'removed']

  let addBlocks = Math.round((a / total) * count)
  let remBlocks = Math.round((r / total) * count)
  if (a > 0 && addBlocks === 0) addBlocks = 1
  if (r > 0 && remBlocks === 0) remBlocks = 1
  while (addBlocks + remBlocks > count) {
    if (addBlocks >= remBlocks && addBlocks > (a > 0 ? 1 : 0)) addBlocks--
    else if (remBlocks > (r > 0 ? 1 : 0)) remBlocks--
    else break
  }

  const out: ('added' | 'removed' | 'neutral')[] = []
  for (let i = 0; i < addBlocks; i++) out.push('added')
  for (let i = 0; i < remBlocks; i++) out.push('removed')
  while (out.length < count) out.push('neutral')
  return out
}

/**
 * Compact proportional `+N −M` diff stat bar with green/red change blocks for
 * pull requests, commits, and file change headers.
 */
export function DiffStat(handle: Handle<DiffStatProps>) {
  return () => {
    const props = handle.props
    const added = Math.max(0, Number.isFinite(props.added) ? Math.round(props.added) : 0)
    const removed = Math.max(0, Number.isFinite(props.removed) ? Math.round(props.removed) : 0)
    const blocks = computeDiffStatBlocks(added, removed, props.blocks ?? 5)
    const label =
      props.label ??
      `${added} ${added === 1 ? 'addition' : 'additions'}, ${removed} ${removed === 1 ? 'deletion' : 'deletions'}`

    return (
      <span
        class={classList('rf-diff-stat', props.class)}
        data-size={props.size}
        role="img"
        aria-label={label}
      >
        {(props.showCounts ?? true) && (
          <span class="rf-diff-stat-counts" aria-hidden="true">
            <span class="rf-diff-stat-add">+{added}</span>
            <span class="rf-diff-stat-rem">−{removed}</span>
          </span>
        )}
        {blocks.length > 0 && (
          <span class="rf-diff-stat-blocks" aria-hidden="true">
            {blocks.map((kind, idx) => (
              <span key={idx} class="rf-diff-stat-block" data-kind={kind} />
            ))}
          </span>
        )}
      </span>
    )
  }
}
