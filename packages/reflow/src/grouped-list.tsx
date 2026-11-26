import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { Avatar } from './avatar.tsx'
import { createRangeSelection } from './behaviors/range-selection.ts'
import { Button } from './button.tsx'
import { Checkbox } from './checkbox.tsx'
import { EstimatePill } from './estimate-pill.tsx'
import { Icon } from './icon.tsx'
import { LabelChip, type LabelOption } from './label-picker.tsx'
import { PriorityIndicator, type IssuePriority } from './priority-indicator.tsx'
import { StatusIcon, type IssueStatusKind } from './status-icon.tsx'
import { fluidHover } from './systems/fluid-hover.ts'
import { classList, type ControlSize } from './systems/styling.ts'

export interface GroupedListGroup {
  id: string
  title: string
  icon?: RemixNode
}

export interface GroupedListItem {
  id: string
  groupId: string
  key?: string
  title: string
  status?: IssueStatusKind
  priority?: IssuePriority
  assignee?: string
  assigneeSrc?: string
  labels?: readonly LabelOption[]
  estimate?: number
  meta?: string
}

export interface GroupedListProps<T extends GroupedListItem = GroupedListItem> {
  /** Ordered section headers. */
  groups: readonly GroupedListGroup[]
  /** Items bucketed into `groups` by `item.groupId`. */
  items: readonly T[]
  /** Controlled multi-selected item IDs. */
  selectedIds?: ReadonlySet<string> | readonly string[]
  /** Called whenever multi-selection changes (supports Shift+Click / Shift+Arrow ranges). */
  onSelectedChange?: (next: ReadonlySet<string>) => void
  /** Called when a row is clicked or opened with Enter. */
  onSelectItem?: (item: T) => void
  /** Optional group `+` quick-add callback. */
  onCreateInGroup?: (groupId: string) => void
  /** Hides empty groups when `false`. Default `true`. */
  showEmptyGroups?: boolean
  /** Optional custom row content slot. */
  renderRow?: (item: T) => RemixNode
  /** Accessible name for the list region. Default `'Grouped issue list'`. */
  label?: string
  /** Controls row height and typography density. */
  size?: ControlSize
  class?: string
}

/**
 * Linear-style collapsible grouped issue list with sticky section headers,
 * fluidHover rows, j/k and Arrow roving focus, and Shift-range multi-select.
 */
export function GroupedList<T extends GroupedListItem = GroupedListItem>(
  handle: Handle<GroupedListProps<T>>,
) {
  const collapsed = new Set<string>()
  const hover = fluidHover({ highlightedSelector: '[data-selected="true"]' })
  const range = createRangeSelection<string>()
  let lastToggledId: string | undefined
  let rootEl: HTMLDivElement | null = null

  const rootRef = ref<HTMLDivElement>((node) => {
    rootEl = node
  })

  function toggleGroup(id: string) {
    if (collapsed.has(id)) collapsed.delete(id)
    else collapsed.add(id)
    void handle.update()
  }

  function focusRow(index: number) {
    const rows = rootEl?.querySelectorAll<HTMLElement>('.rf-grouped-list-row')
    if (!rows || rows.length === 0) return
    const clamped = Math.max(0, Math.min(rows.length - 1, index))
    rows[clamped]?.focus()
  }

  return () => {
    const props = handle.props
    const showEmpty = props.showEmptyGroups ?? true
    const selectedSet =
      props.selectedIds instanceof Set ? props.selectedIds : new Set(props.selectedIds ?? [])

    const buckets = new Map<string, T[]>()
    for (const g of props.groups) buckets.set(g.id, [])
    for (const item of props.items) {
      const list = buckets.get(item.groupId)
      if (list) list.push(item)
    }

    const visibleGroups = props.groups.filter(
      (g) => showEmpty || (buckets.get(g.id)?.length ?? 0) > 0,
    )
    const flatOrder = visibleGroups.flatMap((g) =>
      collapsed.has(g.id) ? [] : (buckets.get(g.id) ?? []).map((item) => item.id),
    )

    function toggleSelect(itemId: string, shiftKey: boolean) {
      if (!props.onSelectedChange) return
      if (shiftKey && lastToggledId && flatOrder.includes(lastToggledId)) {
        const next = range.extend(flatOrder, selectedSet, lastToggledId, itemId)
        lastToggledId = itemId
        props.onSelectedChange(next)
        return
      }
      range.reset()
      const next = new Set(selectedSet)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      lastToggledId = itemId
      props.onSelectedChange(next)
    }

    let runningIndex = 0

    return (
      <section
        class={classList('rf-grouped-list', props.class)}
        data-size={props.size}
        aria-label={props.label ?? 'Grouped issue list'}
      >
        <div class="rf-grouped-list-body" mix={[rootRef, hover]}>
          <span class="rf-grouped-list-hover" data-rf-hover-layer aria-hidden="true" />
          {visibleGroups.map((group) => {
            const groupItems = buckets.get(group.id) ?? []
            const isCollapsed = collapsed.has(group.id)
            const points = groupItems.reduce((sum, item) => sum + (item.estimate ?? 0), 0)

            return (
              <div key={group.id} class="rf-grouped-list-section">
                <div class="rf-grouped-list-header">
                  <button
                    type="button"
                    class="rf-grouped-list-toggle"
                    aria-expanded={isCollapsed ? 'false' : 'true'}
                    mix={on('click', () => toggleGroup(group.id))}
                  >
                    <span
                      class="rf-grouped-list-chevron"
                      data-open={isCollapsed ? 'false' : 'true'}
                      aria-hidden="true"
                    >
                      <Icon name="chevron-right" size={13} />
                    </span>
                    {group.icon != null && <span aria-hidden="true">{group.icon}</span>}
                    <span class="rf-grouped-list-group-title">{group.title}</span>
                    <span class="rf-grouped-list-group-count">{groupItems.length}</span>
                    {points > 0 && <span class="rf-grouped-list-group-points">{points} pts</span>}
                  </button>
                  {props.onCreateInGroup && (
                    <Button
                      variant="ghost"
                      size="icon-compact"
                      aria-label={`Add item to ${group.title}`}
                      mix={on('click', () => props.onCreateInGroup?.(group.id))}
                    >
                      <Icon name="plus" size={13} />
                    </Button>
                  )}
                </div>

                {!isCollapsed && (
                  <div class="rf-grouped-list-rows" role="list" aria-label={group.title}>
                    {groupItems.length === 0 ? (
                      <div class="rf-grouped-list-empty">No items</div>
                    ) : (
                      groupItems.map((item) => {
                        const rowIndex = runningIndex++
                        const selected = selectedSet.has(item.id)
                        return (
                          <div
                            key={item.id}
                            role="listitem"
                            class="rf-grouped-list-row"
                            data-rf-hover-item
                            data-selected={selected ? 'true' : undefined}
                            tabIndex={0}
                            mix={[
                              on('click', (event) => {
                                const target = event.target as HTMLElement | null
                                if (target?.closest('button, input, a, label')) return
                                if (event.shiftKey && props.onSelectedChange) {
                                  toggleSelect(item.id, true)
                                  return
                                }
                                props.onSelectItem?.(item)
                              }),
                              on('keydown', (event) => {
                                if (event.key === 'ArrowDown' || event.key === 'j') {
                                  event.preventDefault()
                                  focusRow(rowIndex + 1)
                                } else if (event.key === 'ArrowUp' || event.key === 'k') {
                                  event.preventDefault()
                                  focusRow(rowIndex - 1)
                                } else if (event.key === 'Home') {
                                  event.preventDefault()
                                  focusRow(0)
                                } else if (event.key === 'End') {
                                  event.preventDefault()
                                  focusRow(flatOrder.length - 1)
                                } else if (event.key === 'Enter') {
                                  event.preventDefault()
                                  props.onSelectItem?.(item)
                                } else if (
                                  (event.key === 'x' || event.key === ' ') &&
                                  props.onSelectedChange
                                ) {
                                  event.preventDefault()
                                  toggleSelect(item.id, event.shiftKey)
                                }
                              }),
                            ]}
                          >
                            {props.renderRow ? (
                              props.renderRow(item)
                            ) : (
                              <>
                                {props.onSelectedChange && (
                                  <Checkbox
                                    aria-label={`Select ${item.key ?? item.title}`}
                                    size="compact"
                                    checked={selected}
                                    onCheckedChange={() => toggleSelect(item.id, false)}
                                  />
                                )}
                                {item.priority && (
                                  <PriorityIndicator priority={item.priority} size={13} />
                                )}
                                {item.key && <span class="rf-grouped-list-key">{item.key}</span>}
                                {item.status && <StatusIcon status={item.status} size={13} />}
                                <span class="rf-grouped-list-title">{item.title}</span>
                                <span class="rf-grouped-list-meta">
                                  {item.labels?.map((lbl) => (
                                    <LabelChip
                                      key={lbl.id}
                                      label={lbl.label}
                                      color={lbl.color}
                                      size="compact"
                                    />
                                  ))}
                                  {item.estimate !== undefined && (
                                    <EstimatePill value={item.estimate} readonly size="compact" />
                                  )}
                                  {item.meta && (
                                    <span class="rf-grouped-list-date">{item.meta}</span>
                                  )}
                                  {item.assignee && (
                                    <Avatar
                                      name={item.assignee}
                                      src={item.assigneeSrc}
                                      size={20}
                                      decorative
                                    />
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    )
  }
}
