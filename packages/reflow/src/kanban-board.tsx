import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { Avatar } from './avatar.tsx'
import { Button } from './button.tsx'
import { Checkbox } from './checkbox.tsx'
import { EstimatePill } from './estimate-pill.tsx'
import { Icon } from './icon.tsx'
import { LabelChip, type LabelOption } from './label-picker.tsx'
import { PriorityIndicator, type IssuePriority } from './priority-indicator.tsx'
import { ScrollArea } from './scroll-area.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface KanbanColumn {
  id: string
  title: string
  icon?: RemixNode
  /** Optional work-in-progress cap; exceeding it highlights the column count. */
  wipLimit?: number
  /** Allows collapsing this column into a slim vertical rail. Default `true`. */
  collapsible?: boolean
}

export interface KanbanItem {
  id: string
  /** Column ID this card belongs to. */
  columnId: string
  /** Monospace issue key (e.g. `ENG-412`). */
  key?: string
  title: string
  priority?: IssuePriority
  assignee?: string
  assigneeSrc?: string
  labels?: readonly LabelOption[]
  estimate?: number
}

export interface KanbanBoardProps<T extends KanbanItem = KanbanItem> {
  /** Ordered board columns. */
  columns: readonly KanbanColumn[]
  /** Cards placed into columns by `item.columnId`. */
  items: readonly T[]
  /** Called when a card is clicked or activated via Enter. */
  onSelectItem?: (item: T) => void
  /** Called when a card is moved via drag-and-drop or `Alt+ArrowLeft`/`Alt+ArrowRight`. */
  onMoveItem?: (itemId: string, targetColumnId: string, beforeItemId: string | null) => void
  /** Optional column `+` quick-add callback. */
  onCreateInColumn?: (columnId: string) => void
  /** Controlled multi-selected item IDs. */
  selectedIds?: ReadonlySet<string> | readonly string[]
  /** Called when selection toggles via checkbox or `x`. */
  onToggleSelect?: (itemId: string, shiftKey: boolean) => void
  /** Optional custom card renderer. */
  renderCard?: (item: T) => RemixNode
  /** Accessible name for the board region. Default `'Kanban board'`. */
  label?: string
  /** Controls card padding and typography density. */
  size?: ControlSize
  class?: string
}

/**
 * Linear-style Kanban board with collapsible columns, WIP limit warnings,
 * point rollups, progressive drag-and-drop, and Alt+Arrow keyboard moves.
 */
export function KanbanBoard<T extends KanbanItem = KanbanItem>(
  handle: Handle<KanbanBoardProps<T>>,
) {
  const collapsed = new Set<string>()
  let draggedId: string | null = null
  let dropTargetColumn: string | null = null
  let boardEl: HTMLDivElement | null = null

  const boardRef = ref<HTMLDivElement>((node) => {
    boardEl = node
  })

  function toggleCollapse(columnId: string) {
    if (collapsed.has(columnId)) collapsed.delete(columnId)
    else collapsed.add(columnId)
    void handle.update()
  }

  function focusSiblingCard(columnId: string, index: number) {
    const cards = boardEl?.querySelectorAll<HTMLElement>(
      `[data-kanban-col="${CSS.escape(columnId)}"] .rf-kanban-card`,
    )
    if (!cards || cards.length === 0) return
    const clamped = Math.max(0, Math.min(cards.length - 1, index))
    cards[clamped]?.focus()
  }

  return () => {
    const props = handle.props
    const selectedSet =
      props.selectedIds instanceof Set ? props.selectedIds : new Set(props.selectedIds ?? [])

    const itemsByCol = new Map<string, T[]>()
    for (const col of props.columns) itemsByCol.set(col.id, [])
    for (const item of props.items) {
      const bucket = itemsByCol.get(item.columnId)
      if (bucket) bucket.push(item)
    }

    return (
      <section
        class={classList('rf-kanban-board', props.class)}
        data-size={props.size}
        aria-label={props.label ?? 'Kanban board'}
      >
        <ScrollArea orientation="horizontal">
          <div class="rf-kanban-columns" mix={boardRef}>
            {props.columns.map((col, colIndex) => {
              const colItems = itemsByCol.get(col.id) ?? []
              const isCollapsed = collapsed.has(col.id)
              const overWip = col.wipLimit !== undefined && colItems.length > col.wipLimit
              const totalEstimate = colItems.reduce((sum, item) => sum + (item.estimate ?? 0), 0)
              const isDropOver = dropTargetColumn === col.id

              if (isCollapsed) {
                return (
                  <div
                    key={col.id}
                    class="rf-kanban-column rf-kanban-column-collapsed"
                    data-kanban-col={col.id}
                    data-drop-over={isDropOver ? 'true' : undefined}
                  >
                    <button
                      type="button"
                      class="rf-kanban-collapse-rail"
                      aria-expanded="false"
                      aria-label={`Expand ${col.title} column (${colItems.length})`}
                      mix={on('click', () => toggleCollapse(col.id))}
                    >
                      {col.icon != null && <span aria-hidden="true">{col.icon}</span>}
                      <span class="rf-kanban-rail-title">{col.title}</span>
                      <span class="rf-kanban-count">{colItems.length}</span>
                    </button>
                  </div>
                )
              }

              return (
                <div
                  key={col.id}
                  class="rf-kanban-column"
                  data-kanban-col={col.id}
                  data-over-wip={overWip ? 'true' : undefined}
                  data-drop-over={isDropOver ? 'true' : undefined}
                  mix={[
                    on('dragover', (event) => {
                      if (!draggedId || !props.onMoveItem) return
                      event.preventDefault()
                      if (dropTargetColumn !== col.id) {
                        dropTargetColumn = col.id
                        void handle.update()
                      }
                    }),
                    on('dragleave', (event) => {
                      if (
                        dropTargetColumn === col.id &&
                        !(event.currentTarget as HTMLElement).contains(
                          event.relatedTarget as Node | null,
                        )
                      ) {
                        dropTargetColumn = null
                        void handle.update()
                      }
                    }),
                    on('drop', (event) => {
                      if (!draggedId || !props.onMoveItem) return
                      event.preventDefault()
                      const moving = draggedId
                      draggedId = null
                      dropTargetColumn = null
                      void handle.update()
                      props.onMoveItem(moving, col.id, null)
                    }),
                  ]}
                >
                  <header class="rf-kanban-col-header">
                    <div class="rf-kanban-col-title-wrap">
                      {col.icon != null && (
                        <span class="rf-kanban-col-icon" aria-hidden="true">
                          {col.icon}
                        </span>
                      )}
                      <h3 class="rf-kanban-col-title">{col.title}</h3>
                      <span class="rf-kanban-count" data-over-wip={overWip ? 'true' : undefined}>
                        {colItems.length}
                        {col.wipLimit !== undefined ? `/${col.wipLimit}` : ''}
                      </span>
                      {totalEstimate > 0 && (
                        <span class="rf-kanban-points">{totalEstimate} pts</span>
                      )}
                    </div>
                    <div class="rf-kanban-col-actions">
                      {props.onCreateInColumn && (
                        <Button
                          variant="ghost"
                          size="icon-compact"
                          aria-label={`Add item to ${col.title}`}
                          mix={on('click', () => props.onCreateInColumn?.(col.id))}
                        >
                          <Icon name="plus" size={13} />
                        </Button>
                      )}
                      {col.collapsible !== false && (
                        <Button
                          variant="ghost"
                          size="icon-compact"
                          aria-expanded="true"
                          aria-label={`Collapse ${col.title} column`}
                          mix={on('click', () => toggleCollapse(col.id))}
                        >
                          <Icon name="chevron-left" size={13} />
                        </Button>
                      )}
                    </div>
                  </header>

                  <div class="rf-kanban-cards" role="list" aria-label={col.title}>
                    {colItems.length === 0 ? (
                      <div class="rf-kanban-empty">No items</div>
                    ) : (
                      colItems.map((item, cardIndex) => {
                        const selected = selectedSet.has(item.id)
                        return (
                          <div
                            key={item.id}
                            role="listitem"
                            class="rf-kanban-card"
                            tabIndex={0}
                            draggable={Boolean(props.onMoveItem)}
                            data-selected={selected ? 'true' : undefined}
                            data-dragging={draggedId === item.id ? 'true' : undefined}
                            mix={[
                              on('dragstart', (event) => {
                                draggedId = item.id
                                event.dataTransfer?.setData('text/plain', item.id)
                                void handle.update()
                              }),
                              on('dragend', () => {
                                draggedId = null
                                dropTargetColumn = null
                                void handle.update()
                              }),
                              on('click', (event) => {
                                const target = event.target as HTMLElement | null
                                if (target?.closest('button, input, a, label')) return
                                props.onSelectItem?.(item)
                              }),
                              on('keydown', (event) => {
                                if (event.key === 'ArrowDown') {
                                  event.preventDefault()
                                  focusSiblingCard(col.id, cardIndex + 1)
                                } else if (event.key === 'ArrowUp') {
                                  event.preventDefault()
                                  focusSiblingCard(col.id, cardIndex - 1)
                                } else if (event.altKey && event.key === 'ArrowRight') {
                                  const nextCol = props.columns[colIndex + 1]
                                  if (nextCol && props.onMoveItem) {
                                    event.preventDefault()
                                    props.onMoveItem(item.id, nextCol.id, null)
                                  }
                                } else if (event.altKey && event.key === 'ArrowLeft') {
                                  const prevCol = props.columns[colIndex - 1]
                                  if (prevCol && props.onMoveItem) {
                                    event.preventDefault()
                                    props.onMoveItem(item.id, prevCol.id, null)
                                  }
                                } else if (event.key === 'Enter') {
                                  event.preventDefault()
                                  props.onSelectItem?.(item)
                                } else if (
                                  (event.key === 'x' || event.key === ' ') &&
                                  props.onToggleSelect
                                ) {
                                  event.preventDefault()
                                  props.onToggleSelect(item.id, event.shiftKey)
                                }
                              }),
                            ]}
                          >
                            {props.renderCard ? (
                              props.renderCard(item)
                            ) : (
                              <>
                                <div class="rf-kanban-card-top">
                                  {props.onToggleSelect && (
                                    <Checkbox
                                      aria-label={`Select ${item.key ?? item.title}`}
                                      size="compact"
                                      checked={selected}
                                      onCheckedChange={() => props.onToggleSelect?.(item.id, false)}
                                    />
                                  )}
                                  {item.key && <span class="rf-kanban-card-key">{item.key}</span>}
                                  {item.assignee && (
                                    <span class="rf-kanban-card-avatar">
                                      <Avatar
                                        name={item.assignee}
                                        src={item.assigneeSrc}
                                        size={20}
                                        decorative
                                      />
                                    </span>
                                  )}
                                </div>
                                <div class="rf-kanban-card-title">{item.title}</div>
                                <div class="rf-kanban-card-footer">
                                  {item.priority && (
                                    <PriorityIndicator priority={item.priority} size={13} />
                                  )}
                                  {item.estimate !== undefined && (
                                    <EstimatePill value={item.estimate} readonly size="compact" />
                                  )}
                                  {item.labels?.map((lbl) => (
                                    <LabelChip
                                      key={lbl.id}
                                      label={lbl.label}
                                      color={lbl.color}
                                      size="compact"
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </section>
    )
  }
}
