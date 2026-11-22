import { animateLayout, prefersReducedMotion } from '@remix-run/ui/animation'
import {
  Avatar,
  Button,
  ContextMenu,
  Dialog,
  Dropdown,
  Icon,
  SegmentedControl,
  Toolbar,
  createRangeSelection,
} from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { CycleOverview, type IssueFilter } from './cycle-overview.tsx'
import { statuses, type Issue, type Status } from './fixtures.ts'
import { issueAfterPointer, placeIssues } from './issue-placement.ts'

type Placement = { status: Status; beforeId: string | null }
interface LastMove {
  previous: Issue[]
  ids: Set<string>
  placed: boolean
  focus: string
  message: string
}

export const IssueTracker = clientEntry(
  import.meta.url,
  function IssueTracker(handle: Handle<{ initialIssues: Issue[] }>) {
    let issues = handle.props.initialIssues
    let active: string | undefined = issues[0]?.id
    let selected = new Set<string>()
    const range = createRangeSelection<string>()
    let pointerFrom: string | undefined
    let announcement = ''
    let lastMove: LastMove | undefined
    let filter: IssueFilter | undefined
    let layout = 'board'
    let detailId: string | undefined
    let reset: HTMLButtonElement | undefined
    let list: HTMLDivElement | undefined
    const mountList = ref<HTMLDivElement>((element) => {
      list = element
    })

    const dragging = new Map<string, number>()
    const groupHeights = new Map<string, number>()
    let placement: Placement | undefined

    function preview(next: Placement | undefined) {
      if (placement?.status === next?.status && placement?.beforeId === next?.beforeId) return
      placement = next
      void handle.update()
    }

    const mountDraggable = ref<HTMLDivElement>(async (element, signal) => {
      try {
        const { draggable, setCustomNativeDragPreview } = await import('./drag-adapter.ts')
        if (signal.aborted) return
        const cleanup = draggable({
          element,
          onGenerateDragPreview: ({ nativeSetDragImage }) => {
            const count = movingIds(element.dataset.issueId!).size
            if (count < 2) return
            setCustomNativeDragPreview({
              nativeSetDragImage,
              render: ({ container }) => {
                const badge = document.createElement('div')
                badge.className = 'issues-drag-count'
                badge.textContent = `${count} issues`
                container.append(badge)
              },
            })
          },
          onDragStart: () => {
            if (!list) return
            const ids = movingIds(element.dataset.issueId!)
            // Keep destinations reachable while the dragged items leave the flow. In List,
            // collapsing a source group would shift every group below it away from the pointer.
            if (layout === 'board') list.style.minHeight = `${list.offsetHeight}px`
            else {
              for (const group of list.querySelectorAll<HTMLElement>('.issues-group')) {
                groupHeights.set(group.dataset.status!, group.offsetHeight)
              }
            }
            for (const row of list.querySelectorAll<HTMLElement>('[data-issue-id]')) {
              if (ids.has(row.dataset.issueId!))
                dragging.set(row.dataset.issueId!, row.offsetHeight)
            }
            void handle.update()
          },
          onDrop: () => {
            dragging.clear()
            list?.style.removeProperty('min-height')
            groupHeights.clear()
            placement = undefined
            void handle.update()
          },
        })
        signal.addEventListener('abort', cleanup, { once: true })
      } catch {
        // Drag-and-drop is progressive; keyboard and toolbar moves still work.
      }
    })

    const mountDropTarget = ref<HTMLDivElement>(async (element, signal) => {
      try {
        const { dropTargetForElements } = await import('./drag-adapter.ts')
        if (signal.aborted) return
        const status = statuses.find((item) => item === element.dataset.status)!
        const cards = element.querySelector<HTMLElement>('.issues-cards')!
        const show = (data: Record<string | symbol, unknown>) =>
          preview({ status, beforeId: data.beforeId as string | null })
        const cleanup = dropTargetForElements({
          element,
          canDrop: ({ source }) =>
            !!source.element.dataset.issueId && !!list?.contains(source.element),
          getData: ({ input, source }) => ({
            beforeId: issueAfterPointer(cards, movingIds(source.element.dataset.issueId!), input),
          }),
          onDragStart: ({ self }) => show(self.data),
          onDragEnter: ({ self }) => show(self.data),
          onDrag: ({ self }) => show(self.data),
          onDragLeave: () => {
            if (placement?.status === status) preview(undefined)
          },
          onDrop: ({ source, self }) => {
            const id = source.element.dataset.issueId!
            void move(movingIds(id), status, id, self.data.beforeId as string | null)
          },
        })
        signal.addEventListener('abort', cleanup, { once: true })
      } catch {
        // Ignore chunk load failure; toolbar and context menu moves remain available.
      }
    })

    function movingIds(id: string) {
      return selected.has(id) ? selected : new Set([id])
    }

    // A status is offered only while at least one of the issues would change.
    function moveItems(ids: ReadonlySet<string>) {
      return statuses.map((status) => ({
        value: status,
        label: 'Move to ' + status,
        disabled: !issues.some((issue) => ids.has(issue.id) && issue.status !== status),
      }))
    }

    function orderedIssues() {
      const scope = filter
      const visible = scope ? issues.filter((issue) => issue[scope.field] === scope.value) : issues
      return statuses.flatMap((status) => visible.filter((issue) => issue.status === status))
    }

    function focusIssue(id: string | undefined, options?: FocusOptions) {
      if (!id) {
        reset?.focus(options)
        return
      }
      list?.querySelector<HTMLElement>(`[data-issue-id="${CSS.escape(id)}"]`)?.focus(options)
    }

    async function setFilter(next?: IssueFilter) {
      filter =
        next && filter?.field === next.field && filter.value === next.value ? undefined : next
      range.reset()
      selected.clear()
      announcement = ''
      active = orderedIssues()[0]?.id
      await handle.update()
      focusIssue(active)
    }

    function openDetails(id: string) {
      detailId = id
      void handle.update()
    }

    function toggle(id: string) {
      range.reset()
      if (selected.has(id)) selected.delete(id)
      else selected.add(id)
      announcement = ''
      void handle.update()
    }

    async function clear() {
      range.reset()
      selected.clear()
      announcement = 'Selection cleared.'
      await handle.update()
      focusIssue(active)
    }

    async function move(
      ids: Set<string>,
      status: Status,
      anchor: string | undefined,
      beforeId?: string | null,
    ) {
      const before = orderedIssues()
      const placed = beforeId !== undefined
      const moved = before.filter(
        (issue) => ids.has(issue.id) && (placed || issue.status !== status),
      )
      if (!moved.length) return
      const previous = issues
      issues = placed
        ? placeIssues(issues, moved, status, beforeId)
        : issues.map((issue) => (ids.has(issue.id) ? { ...issue, status } : issue))
      if (issues === previous) return
      range.reset()
      // Continue at the next stationary issue in the old reading order. At the end,
      // step back. If every row moved, follow the original issue to its new group.
      const index = before.findIndex((issue) => issue.id === anchor)
      const start = index === -1 ? 0 : index
      const stationary = (issue: Issue) => !moved.includes(issue)
      active =
        before.slice(start).find(stationary)?.id ??
        before.slice(0, start).reverse().find(stationary)?.id ??
        anchor
      if (!orderedIssues().some((issue) => issue.id === active)) active = orderedIssues()[0]?.id
      for (const id of ids) selected.delete(id)
      announcement = moved.every((issue) => issue.status === status)
        ? `Reordered ${moved.length} ${moved.length === 1 ? 'issue' : 'issues'} in ${status}.`
        : `Moved ${moved.length} ${moved.length === 1 ? 'issue' : 'issues'} to ${status}.`
      lastMove = {
        previous,
        ids: new Set(moved.map((issue) => issue.id)),
        placed,
        focus: moved.find((issue) => issue.id === anchor)?.id ?? moved[0]!.id,
        message: announcement,
      }
      await handle.update()
      focusIssue(active, { preventScroll: placed })
    }

    async function undoMove() {
      if (!lastMove) return
      const { previous, ids, placed, focus } = lastMove
      lastMove = undefined
      range.reset()
      issues = previous
      const visible = orderedIssues()
      const visibleIds = new Set(visible.map((issue) => issue.id))
      for (const id of selected) {
        if (!visibleIds.has(id)) selected.delete(id)
      }
      // A different filter may now hide the initiating ticket or every restored ticket.
      const target =
        visible.find((issue) => issue.id === focus) ??
        visible.find((issue) => ids.has(issue.id)) ??
        visible.find((issue) => issue.id === active) ??
        visible[0]
      active = target?.id
      announcement =
        ids.size === 1
          ? `Restored 1 issue to its previous ${placed ? 'position' : 'status'}.`
          : `Restored ${ids.size} issues to their previous ${placed ? 'positions' : 'statuses'}.`
      await handle.update()
      focusIssue(active)
    }

    function navigate(event: KeyboardEvent, id: string) {
      if (event.isComposing || event.altKey) return
      if (event.ctrlKey || event.metaKey) {
        if (event.key.toLowerCase() === 'a' && !event.shiftKey) {
          event.preventDefault()
          range.reset()
          selected = new Set(orderedIssues().map((issue) => issue.id))
          announcement = `${selected.size} selected.`
          void handle.update()
        }
        return
      }
      const arrow = event.key === 'ArrowDown' || event.key === 'ArrowUp'
      if (event.shiftKey && !arrow) return
      const rows = orderedIssues()
      const index = rows.findIndex((issue) => issue.id === id)
      switch (event.key) {
        case 'j':
        case 'k':
        case 'ArrowDown':
        case 'ArrowUp': {
          const step = event.key === 'j' || event.key === 'ArrowDown' ? 1 : -1
          const next = Math.max(0, Math.min(index + step, rows.length - 1))
          if (!event.shiftKey) range.reset()
          else if (next !== index) {
            selected = range.extend(
              rows.map((issue) => issue.id),
              selected,
              id,
              rows[next]!.id,
            )
            announcement = ''
            void handle.update()
          }
          focusIssue(rows[next]?.id)
          break
        }
        case 'ArrowLeft':
        case 'ArrowRight': {
          if (layout !== 'board') return
          const current = rows[index]!
          const step = event.key === 'ArrowRight' ? 1 : -1
          const groups = statuses
            .map((status) => rows.filter((issue) => issue.status === status))
            .filter((group) => group.length)
          const column = groups.findIndex((group) => group.includes(current))
          const next = groups[column + step]
          if (next)
            focusIssue(next[Math.min(groups[column]!.indexOf(current), next.length - 1)]?.id)
          range.reset()
          break
        }
        case 'Enter':
          openDetails(id)
          break
        case 'Home':
          range.reset()
          focusIssue(rows[0]?.id)
          break
        case 'End':
          range.reset()
          focusIssue(rows.at(-1)?.id)
          break
        case 'x':
        case ' ':
          if (!event.repeat) toggle(id)
          break
        case 'Escape':
          if (!selected.size) return
          void clear()
          break
        default:
          return
      }
      event.preventDefault()
    }

    return () => {
      const visible = orderedIssues()
      const animateCards = dragging.size > 0 && !prefersReducedMotion()
      const detail = issues.find((issue) => issue.id === detailId)
      return (
        <article class="issue-tracker">
          <header class="issues-heading">
            <h1>Issue tracker</h1>
            <span class="issues-cycle">
              <Icon name="rotate-ccw" size={14} />
              Cycle 12
            </span>
          </header>
          <CycleOverview issues={issues} filter={filter} onFilter={setFilter} />
          <section class="issues-work" aria-labelledby={handle.id + '-title'}>
            <div class="issues-board-heading">
              <div class="issues-board-title">
                <h2 id={handle.id + '-title'}>Cycle issues</h2>
                <span class="issues-count">{visible.length}</span>
              </div>
              <SegmentedControl
                label="Issue layout"
                size="compact"
                value={layout}
                options={[
                  { value: 'board', label: 'Board' },
                  { value: 'list', label: 'List' },
                ]}
                onValueChange={(value) => {
                  layout = value
                  void handle.update()
                }}
              />
            </div>
            {filter && (
              <div class="issues-filter">
                <button
                  type="button"
                  aria-label={'Clear filter ' + filter.value}
                  mix={[
                    ref<HTMLButtonElement>((element, signal) => {
                      reset = element
                      signal.addEventListener(
                        'abort',
                        () => {
                          if (reset === element) reset = undefined
                        },
                        { once: true },
                      )
                    }),
                    on('click', () => void setFilter()),
                  ]}
                >
                  {filter.value}
                  <Icon name="x" size={13} />
                </button>
              </div>
            )}
            <p id={handle.id + '-keys'} class="rf-basic-sr-only">
              Use the arrows to navigate. Click, press X, or press Space to toggle an issue.
              Shift-click or use Shift and the vertical arrows to select a range. Use Control or
              Command with A to select all visible issues. Drag any selected issue to move the
              selection, or Tab to the actions. Press Enter for details.
            </p>
            <ContextMenu
              label="Issue actions"
              target="[data-issue-id]"
              items={(row) => [
                { value: 'details', label: 'Open issue' },
                ...moveItems(movingIds(row.dataset.issueId ?? '')),
              ]}
              onSelect={(value, row) => {
                const id = row.dataset.issueId
                if (!id) return
                if (value === 'details') openDetails(id)
                const status = statuses.find((item) => item === value)
                if (status) void move(movingIds(id), status, id)
              }}
            >
              <div
                class="issues-collection"
                data-layout={layout}
                data-selecting={selected.size > 0 ? '' : undefined}
                data-single-status={filter?.field === 'status' || undefined}
                role="listbox"
                aria-multiselectable="true"
                aria-labelledby={handle.id + '-title'}
                aria-describedby={handle.id + '-keys'}
                mix={[
                  mountList,
                  on('focusout', (event) => {
                    if (
                      !(event.relatedTarget instanceof Node) ||
                      !event.currentTarget.contains(event.relatedTarget)
                    )
                      range.reset()
                  }),
                ]}
              >
                {statuses
                  .filter((status) => filter?.field !== 'status' || filter.value === status)
                  .map((status) => {
                    const group = visible.filter((issue) => issue.status === status)
                    const destination = placement?.status === status ? placement : undefined
                    const slot = destination?.beforeId
                      ? group.findIndex((issue) => issue.id === destination.beforeId)
                      : group.length
                    return (
                      <div
                        role="group"
                        key={status}
                        aria-label={status}
                        data-status={status}
                        class="issues-group"
                        style={{ minHeight: groupHeights.get(status) }}
                        mix={mountDropTarget}
                      >
                        <div class="issues-group-heading" aria-hidden="true">
                          <span class="issues-status-mark" data-status={status} />
                          <strong>{status}</strong>
                          <span class="issues-count">{group.length}</span>
                        </div>
                        <div
                          class="issues-cards"
                          role="none"
                          data-previewing={placement ? '' : undefined}
                        >
                          {group.map((issue, index) => (
                            <div
                              key={issue.id}
                              role="option"
                              data-issue-id={issue.id}
                              data-dragging={dragging.has(issue.id) ? '' : undefined}
                              class="issues-row"
                              style={destination ? { order: index < slot ? 0 : 2 } : undefined}
                              aria-selected={selected.has(issue.id)}
                              tabIndex={active === issue.id ? 0 : -1}
                              mix={[
                                mountDraggable,
                                animateLayout(
                                  animateCards && !dragging.has(issue.id)
                                    ? { duration: 150, easing: 'ease-out', size: false }
                                    : false,
                                ),
                                on('focus', () => {
                                  active = issue.id
                                  void handle.update()
                                }),
                                // Native pointer focus reaches the new row before its click fires.
                                on('pointerdown', () => {
                                  pointerFrom = active
                                }),
                                on('click', (event) => {
                                  const from = event.detail ? pointerFrom : active
                                  focusIssue(issue.id)
                                  if (event.shiftKey && from) {
                                    selected = range.extend(
                                      visible.map((item) => item.id),
                                      selected,
                                      from,
                                      issue.id,
                                    )
                                    announcement = ''
                                    void handle.update()
                                  } else {
                                    toggle(issue.id)
                                  }
                                }),
                                on('keydown', (event) => navigate(event, issue.id)),
                              ]}
                            >
                              <span class="issues-id">{issue.id}</span>
                              <span
                                class="issues-check"
                                aria-hidden="true"
                                title="Click to select an issue. Shift-click to select a range."
                              >
                                {selected.has(issue.id) && <Icon name="check" size={12} />}
                              </span>
                              <strong class="issues-title">{issue.title}</strong>
                              <span class="issues-area">{issue.area}</span>
                              <Avatar name={issue.owner} size={22} />
                            </div>
                          ))}
                          {destination &&
                            Array.from(dragging, ([id, height]) => (
                              <div
                                class="issues-drop-slot"
                                aria-hidden="true"
                                key={'slot-' + id}
                                style={{ height, order: 1 }}
                              />
                            ))}
                          {!group.length && !destination && (
                            <p class="issues-empty" role="none">
                              No issues in {status}.
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </ContextMenu>
            {(selected.size > 0 || lastMove) && (
              <div class="issues-actions">
                {selected.size > 0 && (
                  <Toolbar label="Selected issue actions">
                    <strong>{selected.size} selected</strong>
                    <Dropdown
                      label="Move to"
                      size="compact"
                      side="top"
                      items={moveItems(selected)}
                      onSelect={(value) => {
                        const status = statuses.find((item) => item === value)
                        if (status) void move(selected, status, active)
                      }}
                    />
                    {selected.size === 1 && (
                      <Button
                        size="compact"
                        variant="ghost"
                        mix={on('click', () => openDetails([...selected][0]!))}
                      >
                        Open issue
                      </Button>
                    )}
                    <Button
                      size="icon-compact"
                      variant="ghost"
                      aria-label="Clear selection"
                      mix={on('click', clear)}
                    >
                      <Icon name="x" size={15} />
                    </Button>
                  </Toolbar>
                )}
                {lastMove && (
                  <div class="issues-move-notice">
                    <span>{lastMove.message}</span>
                    <Button variant="secondary" size="compact" mix={on('click', undoMove)}>
                      Undo
                    </Button>
                  </div>
                )}
              </div>
            )}
            <p role="status" class="rf-basic-sr-only">
              {announcement}
            </p>
          </section>
          <Dialog
            title={detail?.title ?? 'Issue details'}
            description={detail?.description}
            open={!!detail}
            onOpenChange={(open) => {
              if (!open) {
                const closedId = detailId
                detailId = undefined
                void handle.update().then(() => {
                  if (!handle.signal.aborted) focusIssue(closedId ?? active)
                })
              }
            }}
          >
            {detail && (
              <dl class="issues-properties">
                <dt>Issue</dt>
                <dd class="issues-id">{detail.id}</dd>
                <dt>Status</dt>
                <dd>
                  <span class="issues-status-mark" data-status={detail.status} />
                  {detail.status}
                </dd>
                <dt>Assignee</dt>
                <dd>
                  <Avatar name={detail.owner} size={22} decorative />
                  {detail.owner}
                </dd>
                <dt>Area</dt>
                <dd>{detail.area}</dd>
              </dl>
            )}
          </Dialog>
        </article>
      )
    }
  },
)
