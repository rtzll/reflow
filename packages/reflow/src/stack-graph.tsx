import { on, ref, type Handle } from 'remix/component'
import { DiffStat } from './diff-stat.tsx'
import { Icon } from './icon.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type StackNodeStatus = 'open' | 'draft' | 'merged' | 'closed'
export type StackCheckStatus = 'passed' | 'failed' | 'running' | 'pending'
export type StackReviewStatus = 'approved' | 'changes-requested' | 'review-required'

export interface StackNode {
  id: string
  title: string
  /** PR number or branch ref shown in monospace (e.g. `#412` or `feat/auth`). */
  ref?: string
  /** Parent node ID when the stack branches; defaults to the previous node. */
  parentId?: string
  /** Pull request lifecycle state. Default `'open'`. */
  status?: StackNodeStatus
  /** CI checks rollup status. */
  checks?: StackCheckStatus
  /** Review decision status. */
  review?: StackReviewStatus
  additions?: number
  deletions?: number
  author?: string
}

export interface StackGraphProps {
  /** Ordered nodes from base to tip of the PR stack. */
  nodes: readonly StackNode[]
  /** Active node ID (e.g. currently viewed PR in the stack). */
  currentId?: string
  /** Called when a stack node is clicked or activated via keyboard. */
  onSelect?: (node: StackNode) => void
  /** Accessible name for the stack list. Default `'Pull request stack'`. */
  label?: string
  /** Controls row height and density. */
  size?: ControlSize
  class?: string
}

function computeDepths(nodes: readonly StackNode[]): Map<string, number> {
  const byId = new Map<string, StackNode>()
  for (const node of nodes) byId.set(node.id, node)
  const depths = new Map<string, number>()

  function resolve(node: StackNode, seen: Set<string>): number {
    const cached = depths.get(node.id)
    if (cached !== undefined) return cached
    if (!node.parentId || !byId.has(node.parentId) || seen.has(node.parentId)) {
      depths.set(node.id, 0)
      return 0
    }
    seen.add(node.id)
    const parent = byId.get(node.parentId)!
    const parentChildren = nodes.filter((item) => item.parentId === parent.id)
    const branchOffset = parentChildren.length > 1 && parentChildren[0]?.id !== node.id ? 1 : 0
    const depth = Math.min(4, resolve(parent, seen) + branchOffset)
    depths.set(node.id, depth)
    return depth
  }

  for (const node of nodes) resolve(node, new Set())
  return depths
}

function reviewLabel(review: StackReviewStatus): string {
  switch (review) {
    case 'approved':
      return 'Approved'
    case 'changes-requested':
      return 'Changes requested'
    case 'review-required':
      return 'Review required'
  }
}

function checkLabel(checks: StackCheckStatus): string {
  switch (checks) {
    case 'passed':
      return 'Checks passed'
    case 'failed':
      return 'Checks failed'
    case 'running':
      return 'Checks running'
    case 'pending':
      return 'Checks pending'
  }
}

/**
 * Stacked PR and branch commit DAG visualizer with continuous vertical rails,
 * CI and review status indicators, diff stats, and keyboard list navigation.
 */
export function StackGraph(handle: Handle<StackGraphProps>) {
  let listEl: HTMLOListElement | null = null
  const listRef = ref((node) => {
    listEl = node instanceof HTMLOListElement ? node : null
  })

  function focusIndex(index: number) {
    const buttons = listEl?.querySelectorAll<HTMLButtonElement>('.rf-stack-graph-row')
    if (!buttons || buttons.length === 0) return
    const clamped = Math.max(0, Math.min(buttons.length - 1, index))
    buttons[clamped]?.focus()
  }

  function handleKeyDown(index: number, total: number, event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusIndex((index + 1) % total)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusIndex((index - 1 + total) % total)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusIndex(total - 1)
    }
  }

  return () => {
    const props = handle.props
    const nodes = props.nodes
    const depths = computeDepths(nodes)

    return (
      <div
        class={classList('rf-stack-graph', props.class)}
        data-size={props.size}
        role="region"
        aria-label={props.label ?? 'Pull request stack'}
      >
        <ol class="rf-stack-graph-list" mix={listRef}>
          {nodes.map((node, index) => {
            const status = node.status ?? 'open'
            const current = node.id === props.currentId
            const depth = depths.get(node.id) ?? 0
            const hasAbove = index > 0
            const hasBelow = index < nodes.length - 1

            return (
              <li
                key={node.id}
                class="rf-stack-graph-item"
                data-status={status}
                data-current={current ? 'true' : undefined}
                style={{ '--rf-stack-depth': String(depth) }}
              >
                <button
                  type="button"
                  class="rf-stack-graph-row"
                  aria-current={current ? 'true' : undefined}
                  mix={[
                    on('click', () => props.onSelect?.(node)),
                    on('keydown', (event) => handleKeyDown(index, nodes.length, event)),
                  ]}
                >
                  <span class="rf-stack-graph-rail" aria-hidden="true">
                    <span
                      class="rf-stack-graph-line"
                      data-pos="top"
                      data-visible={hasAbove ? 'true' : 'false'}
                    />
                    <span
                      class="rf-stack-graph-dot"
                      data-status={status}
                      data-current={current ? 'true' : undefined}
                    >
                      {status === 'merged' && <Icon name="check" size={10} />}
                    </span>
                    <span
                      class="rf-stack-graph-line"
                      data-pos="bottom"
                      data-visible={hasBelow ? 'true' : 'false'}
                    />
                  </span>

                  <span class="rf-stack-graph-body">
                    <span class="rf-stack-graph-head">
                      {node.ref && <span class="rf-stack-graph-ref">{node.ref}</span>}
                      <span class="rf-stack-graph-title">{node.title}</span>
                    </span>
                    {(node.author || node.review) && (
                      <span class="rf-stack-graph-sub">
                        {node.author && <span class="rf-stack-graph-author">{node.author}</span>}
                        {node.review && (
                          <span class="rf-stack-graph-review" data-review={node.review}>
                            {reviewLabel(node.review)}
                          </span>
                        )}
                      </span>
                    )}
                  </span>

                  <span class="rf-stack-graph-meta">
                    {(node.additions !== undefined || node.deletions !== undefined) && (
                      <DiffStat
                        added={node.additions ?? 0}
                        removed={node.deletions ?? 0}
                        blocks={0}
                      />
                    )}
                    {node.checks && (
                      <span
                        class="rf-stack-graph-check"
                        data-checks={node.checks}
                        title={checkLabel(node.checks)}
                        aria-label={checkLabel(node.checks)}
                      >
                        {node.checks === 'passed' && <Icon name="check" size={12} />}
                        {node.checks === 'failed' && <Icon name="x" size={12} />}
                        {(node.checks === 'running' || node.checks === 'pending') && (
                          <span class="rf-stack-graph-check-dot" aria-hidden="true" />
                        )}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }
}
